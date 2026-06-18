import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getFactionProfile } from '../faction-profiles';
import {
  getMaxTroopsPerType,
  getPreferredTroopComposition,
  getVillageSize,
} from '../helpers';
import type { FactionKey } from '../npc-brain-types';
import {
  NPC_BRAIN_CONSTANTS,
  VILLAGE_SIZE_REGEN_RATE,
} from '../npc-brain-types';
import { calculateCurrentLoot } from './loot-recovery';

/**
 * On-demand troop materialization for a single NPC village.
 *
 * Replaces both processTroopRegenBatch (tick-based) and
 * regenerateNpcTroopsForVillage (pre-combat). Calculates actual troop
 * counts from elapsed time since last regen timestamp and writes them
 * directly to the database.
 *
 * Call sites:
 * - combat-resolver.ts: before resolving combat against an NPC village
 * - retaliation-execution.ts: before reading home troops for revenge intents
 */
export const materializeNpcTroops = (
  db: DbFacade,
  villageId: number,
  tileId: number,
  factionKey: FactionKey,
  tribe: string,
  mapSize: number,
  x: number,
  y: number,
  speed: number,
): void => {
  const now = Date.now();

  // 1. Read last_troop_regen_ms
  const lastRegenMs = db.selectValue({
    sql: 'SELECT last_troop_regen_ms FROM npc_village_state WHERE village_id = $villageId;',
    bind: { $villageId: villageId },
    schema: z.any(),
  }) as number;

  if (!lastRegenMs || lastRegenMs === 0) {
    // First time — initialize timestamp and bail
    db.exec({
      sql: 'UPDATE npc_village_state SET last_troop_regen_ms = $now WHERE village_id = $villageId;',
      bind: { $now: now, $villageId: villageId },
    });
    return;
  }

  const elapsedMs = now - lastRegenMs;
  if (elapsedMs <= 0) {
    return;
  }

  const elapsedGameHours = (elapsedMs / 3_600_000) * speed;

  // 2. Faction personality delay: peaceful factions wait 2 real hours after last raid
  const profile = getFactionProfile(factionKey);
  if (profile.troopRegenRateMultiplier < 0.6) {
    // Peaceful faction (Merchant Guilds, Verdant Order) — delay regen after raids
    const lastRaidedMs = db.selectValue({
      sql: 'SELECT last_raided_ms FROM npc_village_state WHERE village_id = $villageId;',
      bind: { $villageId: villageId },
      schema: z.any(),
    }) as number;

    if (lastRaidedMs > 0) {
      const timeSinceRaid = now - lastRaidedMs;
      if (timeSinceRaid < 2 * 3_600_000) {
        // Less than 2 real hours since last raid — peaceful factions don't regen yet
        // Still update timestamp so we don't accumulate a huge burst later
        db.exec({
          sql: 'UPDATE npc_village_state SET last_troop_regen_ms = $now WHERE village_id = $villageId;',
          bind: { $now: now, $villageId: villageId },
        });
        return;
      }
    }
  }

  // 3. Calculate regen
  const villageSize = getVillageSize(mapSize, x, y);
  const baseRate = VILLAGE_SIZE_REGEN_RATE[villageSize] ?? 20;
  const regenRate = baseRate * profile.troopRegenRateMultiplier;
  const totalRegen = Math.floor(elapsedGameHours * regenRate);

  const composition = getPreferredTroopComposition(tribe, factionKey);
  if (composition.length === 0) {
    db.exec({
      sql: 'UPDATE npc_village_state SET last_troop_regen_ms = $now WHERE village_id = $villageId;',
      bind: { $now: now, $villageId: villageId },
    });
    return;
  }

  const maxTroopsPerType = getMaxTroopsPerType(
    (db.selectValue({
      sql: 'SELECT max_loot_capacity FROM npc_village_state WHERE village_id = $villageId;',
      bind: { $villageId: villageId },
      schema: z.any(),
    }) as number) ?? 500,
  );

  // 4. Read current troops for this village
  const currentTroopRows = db.selectObjects({
    sql: `
      SELECT u.unit AS unitId, t.amount
      FROM troops t
      JOIN unit_ids u ON u.id = t.unit_id
      WHERE t.tile_id = $tileId
        AND t.source_tile_id = $tileId
        AND t.amount > 0;
    `,
    bind: { $tileId: tileId },
    schema: z.any(),
  }) as { unitId: string; amount: number }[];

  const currentTroops = new Map<string, number>();
  const existingUnitIds = new Set<string>();
  for (const row of currentTroopRows) {
    currentTroops.set(
      row.unitId,
      (currentTroops.get(row.unitId) ?? 0) + row.amount,
    );
    existingUnitIds.add(row.unitId);
  }

  // 5. Calculate passive regen additions
  const troopAdds = new Map<string, number>();

  if (totalRegen > 0) {
    for (const { unitId, weight } of composition) {
      const toAdd = Math.floor(totalRegen * weight);
      if (toAdd <= 0) {
        continue;
      }

      const currentAmount = currentTroops.get(unitId) ?? 0;
      const actualToAdd = Math.min(
        toAdd,
        Math.max(0, maxTroopsPerType - currentAmount),
      );
      if (actualToAdd > 0) {
        troopAdds.set(unitId, (troopAdds.get(unitId) ?? 0) + actualToAdd);
        currentTroops.set(unitId, currentAmount + actualToAdd);
      }
    }
  }

  // 6. Defence floor top-up: capped at regenRate * 0.5 per real hour
  const defenceFloor =
    NPC_BRAIN_CONSTANTS.DEFENCE_FLOOR_BY_SIZE[villageSize] ?? 50;
  const currentTotalTroops = [...currentTroops.values()].reduce(
    (sum, amount) => sum + amount,
    0,
  );

  if (currentTotalTroops < defenceFloor) {
    // Cap top-up at regenRate * 0.5 troops per real hour (NOT game-hour)
    const elapsedRealHours = elapsedMs / 3_600_000;
    const maxTopUp = Math.floor(regenRate * 0.5 * elapsedRealHours);
    const deficit = defenceFloor - currentTotalTroops;
    const topUpAmount = Math.min(maxTopUp, deficit);

    if (topUpAmount > 0) {
      for (const { unitId, weight } of composition) {
        const toAdd = Math.floor(topUpAmount * weight);
        if (toAdd <= 0) {
          continue;
        }

        const currentAmount = currentTroops.get(unitId) ?? 0;
        const actualToAdd = Math.min(
          toAdd,
          Math.max(0, maxTroopsPerType - currentAmount),
        );
        if (actualToAdd > 0) {
          troopAdds.set(unitId, (troopAdds.get(unitId) ?? 0) + actualToAdd);
          currentTroops.set(unitId, currentAmount + actualToAdd);
        }
      }
    }
  }

  // 7. Write troop updates to database
  if (troopAdds.size > 0) {
    const inserts: { unitId: string; amount: number }[] = [];
    const updates: { unitId: string; amount: number; maxTroops: number }[] = [];

    for (const [unitId, amount] of troopAdds) {
      if (existingUnitIds.has(unitId)) {
        // Troop already existed before this regen — UPDATE
        updates.push({ unitId, amount, maxTroops: maxTroopsPerType });
      } else {
        // New troop type — INSERT
        inserts.push({ unitId, amount });
      }
    }

    // Batch INSERT new troop rows
    if (inserts.length > 0) {
      const valuesClauses: string[] = [];
      const bind: Record<string, number | string> = {};

      inserts.forEach(({ unitId, amount }, i) => {
        const uk = `$u${i}`;
        const ak = `$a${i}`;
        valuesClauses.push(
          `((SELECT id FROM unit_ids WHERE unit = ${uk}), ${ak}, $tileId, $tileId)`,
        );
        bind[uk] = unitId;
        bind[ak] = amount;
      });
      bind.$tileId = tileId;

      db.exec({
        sql: `
          INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
          VALUES ${valuesClauses.join(',')}
          ON CONFLICT (unit_id, tile_id, source_tile_id) DO UPDATE SET amount = amount + excluded.amount;
        `,
        bind,
      });
    }

    // Batch UPDATE existing troop rows
    if (updates.length > 0) {
      const caseClauses: string[] = [];
      const bind: Record<string, number | string> = {};

      updates.forEach(({ unitId, amount, maxTroops }, i) => {
        const uk = `$u${i}`;
        const ak = `$a${i}`;
        const mk = `$m${i}`;
        caseClauses.push(
          `WHEN unit_id = (SELECT id FROM unit_ids WHERE unit = ${uk}) THEN CASE WHEN amount + ${ak} > ${mk} THEN ${mk} ELSE amount + ${ak} END`,
        );
        bind[uk] = unitId;
        bind[ak] = amount;
        bind[mk] = maxTroops;
      });
      bind.$tileId = tileId;

      db.exec({
        sql: `
          UPDATE troops
          SET amount = CASE
            ${caseClauses.join('\n')}
            ELSE amount
          END
          WHERE tile_id = $tileId
            AND source_tile_id = $tileId;
        `,
        bind,
      });
    }
  }

  // 8. Update last_troop_regen_ms
  db.exec({
    sql: 'UPDATE npc_village_state SET last_troop_regen_ms = $now WHERE village_id = $villageId;',
    bind: { $now: now, $villageId: villageId },
  });

  // 9. Check rest_state: reset to 1 if village is fully recovered
  const restRow = db.selectObject({
    sql: `
      SELECT loot_at_last_raid, last_raided_ms, rest_state, rest_threshold_ms, max_loot_capacity
      FROM npc_village_state WHERE village_id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.any(),
  }) as
    | {
        loot_at_last_raid: number;
        last_raided_ms: number;
        rest_state: number;
        rest_threshold_ms: number;
        max_loot_capacity: number;
      }
    | undefined;

  if (restRow && restRow.rest_state === 0 && restRow.last_raided_ms > 0) {
    const computedLoot = calculateCurrentLoot(
      restRow.loot_at_last_raid,
      restRow.last_raided_ms,
      restRow.max_loot_capacity,
      0,
      speed,
    );
    if (
      computedLoot >= 1.0 &&
      now - restRow.last_raided_ms >= restRow.rest_threshold_ms
    ) {
      db.exec({
        sql: 'UPDATE npc_village_state SET rest_state = 1 WHERE village_id = $villageId;',
        bind: { $villageId: villageId },
      });
    }
  }
};

/**
 * Get total troop count for a village.
 */
export const getTotalTroopCount = (db: DbFacade, tileId: number): number => {
  const result = db.selectValue({
    sql: `
      SELECT COALESCE(SUM(amount), 0)
      FROM troops
      WHERE tile_id = $tileId
        AND source_tile_id = $tileId;
    `,
    bind: { $tileId: tileId },
    schema: z.any(),
  });
  return (result as number) ?? 0;
};
