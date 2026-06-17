import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { addTroops } from '../../troops';
import { getFactionProfile } from '../faction-profiles';
import {
  getMaxTroopsPerType,
  getPreferredTroopComposition,
  getTroopRegenRate,
  getVillageSize,
} from '../helpers';
import type {
  BatchTroopRow,
  BatchVillageRow,
  FactionKey,
} from '../npc-brain-types';
import {
  NPC_BRAIN_CONSTANTS,
  VILLAGE_SIZE_REGEN_RATE,
} from '../npc-brain-types';

interface TroopRegenResult {
  totalTroopsAdded: number;
}

/**
 * Batched troop regeneration for all NPC villages.
 * One query fetches all troop states. JavaScript computes regen.
 * One batch INSERT/UPDATE writes all results.
 */
export const processTroopRegenBatch = (
  db: DbFacade,
  allVillages: BatchVillageRow[],
  allTroops: BatchTroopRow[],
  elapsedMs: number,
  speed: number,
  mapSize: number,
): TroopRegenResult => {
  const elapsedHours = (elapsedMs / 3_600_000) * speed;
  if (elapsedHours <= 0) {
    return { totalTroopsAdded: 0 };
  }

  // Group troops by village (via tileId)
  const troopsByVillage = new Map<number, Map<string, number>>();
  for (const troop of allTroops) {
    let villageTroops = troopsByVillage.get(troop.villageId);
    if (!villageTroops) {
      villageTroops = new Map();
      troopsByVillage.set(troop.villageId, villageTroops);
    }
    villageTroops.set(
      troop.unitId,
      (villageTroops.get(troop.unitId) ?? 0) + troop.amount,
    );
  }

  const now = Date.now();
  const villageUpdates: { villageId: number }[] = [];
  const troopInserts: [string, number, number, number][] = []; // [unitId, amount, tileId, sourceTileId]
  const troopUpdates: {
    tileId: number;
    unitId: string;
    amount: number;
    maxTroops: number;
  }[] = [];
  let totalAdded = 0;

  for (const village of allVillages) {
    const villageSize = getVillageSize(mapSize, village.x, village.y);
    const regenRate = getTroopRegenRate(
      villageSize,
      village.factionKey as FactionKey,
    );

    const composition = getPreferredTroopComposition(
      village.tribe,
      village.factionKey as FactionKey,
    );
    if (composition.length === 0) {
      continue;
    }

    const maxTroopsPerType = getMaxTroopsPerType(village.maxLoot);
    const totalRegen = Math.floor(elapsedHours * regenRate);
    if (totalRegen <= 0) {
      continue;
    }

    const currentTroops = troopsByVillage.get(village.villageId);
    let villageHasUpdates = false;

    // Passive regen
    for (const { unitId, weight } of composition) {
      const toAdd = Math.floor(totalRegen * weight);
      if (toAdd <= 0) {
        continue;
      }

      const currentAmount = currentTroops?.get(unitId) ?? 0;
      const actualToAdd = Math.min(
        toAdd,
        Math.max(0, maxTroopsPerType - currentAmount),
      );

      if (actualToAdd > 0) {
        if (currentAmount > 0) {
          troopUpdates.push({
            tileId: village.tileId,
            unitId,
            amount: actualToAdd,
            maxTroops: maxTroopsPerType,
          });
        } else {
          troopInserts.push([
            unitId,
            actualToAdd,
            village.tileId,
            village.tileId,
          ]);
        }
        totalAdded += actualToAdd;
        villageHasUpdates = true;

        // Update current troop tracking for defence floor check
        if (currentTroops) {
          currentTroops.set(unitId, currentAmount + actualToAdd);
        }
      }
    }

    // ─── Defence Floor Top-Up (3× passive rate until floor is reached) ───
    const defenceFloor =
      NPC_BRAIN_CONSTANTS.DEFENCE_FLOOR_BY_SIZE[villageSize] ?? 50;

    const currentTotalTroops = currentTroops
      ? [...currentTroops.values()].reduce((sum, amount) => sum + amount, 0)
      : 0;

    if (currentTotalTroops < defenceFloor) {
      const acceleratedRate = regenRate * 3;
      const topUpTotal = Math.floor(elapsedHours * acceleratedRate);
      const deficit = defenceFloor - currentTotalTroops;
      const topUpAmount = Math.min(topUpTotal, deficit);

      if (topUpAmount > 0) {
        for (const { unitId, weight } of composition) {
          const toAdd = Math.floor(topUpAmount * weight);
          if (toAdd <= 0) {
            continue;
          }

          const currentAmount = currentTroops?.get(unitId) ?? 0;
          const actualToAdd = Math.min(
            toAdd,
            Math.max(0, maxTroopsPerType - currentAmount),
          );

          if (actualToAdd > 0) {
            if (currentAmount > 0) {
              troopUpdates.push({
                tileId: village.tileId,
                unitId,
                amount: actualToAdd,
                maxTroops: maxTroopsPerType,
              });
            } else {
              troopInserts.push([
                unitId,
                actualToAdd,
                village.tileId,
                village.tileId,
              ]);
            }
            totalAdded += actualToAdd;
            villageHasUpdates = true;
          }
        }
      }
    }

    if (villageHasUpdates) {
      villageUpdates.push({ villageId: village.villageId });
    }
  }

  // ─── Batch INSERT new troop rows ───
  if (troopInserts.length > 0) {
    // Build a single INSERT with subqueries for unit_id
    const valuesClauses: string[] = [];
    const bind: Record<string, number | string> = {};

    troopInserts.forEach(([unitId, amount, tileId, sourceTileId], i) => {
      const uk = `$u${i}`;
      const ak = `$a${i}`;
      const tk = `$t${i}`;
      const sk = `$s${i}`;
      valuesClauses.push(
        `((SELECT id FROM unit_ids WHERE unit = ${uk}), ${ak}, ${tk}, ${sk})`,
      );
      bind[uk] = unitId;
      bind[ak] = amount;
      bind[tk] = tileId;
      bind[sk] = sourceTileId;
    });

    db.exec({
      sql: `
        INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
        VALUES ${valuesClauses.join(',')}
        ON CONFLICT (unit_id, tile_id, source_tile_id) DO UPDATE SET amount = amount + excluded.amount;
      `,
      bind,
    });
  }

  // ─── Batch UPDATE existing troop rows ───
  if (troopUpdates.length > 0) {
    // Deduplicate: merge amounts for same (tileId, unitId) to avoid CASE collision
    const deduped = new Map<string, (typeof troopUpdates)[0]>();
    for (const u of troopUpdates) {
      const key = `${u.tileId}:${u.unitId}`;
      const existing = deduped.get(key);
      if (existing) {
        existing.amount += u.amount;
      } else {
        deduped.set(key, { ...u });
      }
    }
    const uniqueTroopUpdates = [...deduped.values()];

    const caseClauses: string[] = [];
    const bind: Record<string, number | string> = {};

    uniqueTroopUpdates.forEach((u, i) => {
      const tk = `$t${i}`;
      const uk = `$u${i}`;
      const ak = `$a${i}`;
      const mk = `$m${i}`;
      caseClauses.push(
        `WHEN tile_id = ${tk} AND unit_id = (SELECT id FROM unit_ids WHERE unit = ${uk}) THEN CASE WHEN amount + ${ak} > ${mk} THEN ${mk} ELSE amount + ${ak} END`,
      );
      bind[tk] = u.tileId;
      bind[uk] = u.unitId;
      bind[ak] = u.amount;
      bind[mk] = u.maxTroops;
    });

    const tileIdPlaceholders = uniqueTroopUpdates
      .map((_, i) => `$tid${i}`)
      .join(',');
    const tileIdBinds: Record<string, number> = {};
    uniqueTroopUpdates.forEach((u, i) => {
      tileIdBinds[`$tid${i}`] = u.tileId;
    });

    db.exec({
      sql: `
        UPDATE troops
        SET amount = CASE
          ${caseClauses.join('\n')}
          ELSE amount
        END
        WHERE tile_id IN (${tileIdPlaceholders})
          AND source_tile_id = tile_id;
      `,
      bind: { ...bind, ...tileIdBinds },
    });
  }

  // ─── Batch UPDATE last_troop_regen_ms ───
  if (villageUpdates.length > 0) {
    const villageIdPlaceholders = villageUpdates
      .map((_, i) => `$vid${i}`)
      .join(',');
    const villageIdBinds: Record<string, number> = {};
    villageUpdates.forEach((u, i) => {
      villageIdBinds[`$vid${i}`] = u.villageId;
    });

    db.exec({
      sql: `
        UPDATE npc_village_state
        SET last_troop_regen_ms = $now
        WHERE village_id IN (${villageIdPlaceholders});
      `,
      bind: { ...villageIdBinds, $now: now },
    });
  }

  return { totalTroopsAdded: totalAdded };
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

/**
 * Pre-combat troop regeneration for a single NPC village.
 *
 * Called by combat-resolver.ts before resolving combat against an NPC village.
 * Regenerates troops based on elapsed time since last interaction, using
 * faction-specific rates and compositions.
 *
 * This replaces the old regenerateNpcTroops() from npc.ts.
 */
export const regenerateNpcTroopsForVillage = (
  db: DbFacade,
  villageId: number,
  timestamp: number,
): void => {
  const state = db.selectObject({
    sql: `
      SELECT
        nvs.village_id,
        nvs.last_interacted_at,
        nvs.faction_key,
        v.tile_id,
        ti.tribe
      FROM npc_village_state nvs
      JOIN villages v ON nvs.village_id = v.id
      JOIN players p ON v.player_id = p.id
      JOIN tribe_ids ti ON p.tribe_id = ti.id
      WHERE nvs.village_id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.any(),
  }) as
    | {
        village_id: number;
        last_interacted_at: number;
        faction_key: string;
        tile_id: number;
        tribe: string;
      }
    | undefined;

  if (!state) {
    return;
  }

  // Update interaction timestamp
  db.exec({
    sql: 'UPDATE npc_village_state SET last_interacted_at = $timestamp WHERE village_id = $villageId',
    bind: { $timestamp: timestamp, $villageId: villageId },
  });

  const lastInteractedAt = state.last_interacted_at;
  if (lastInteractedAt === 0) {
    return;
  }

  const elapsedMilliseconds = timestamp - lastInteractedAt;
  const elapsedHours = elapsedMilliseconds / (1000 * 3600);
  if (elapsedHours <= 0) {
    return;
  }

  const factionKey = state.faction_key as FactionKey;
  const profile = getFactionProfile(factionKey);
  const composition = getPreferredTroopComposition(state.tribe, factionKey);
  if (composition.length === 0) {
    return;
  }

  // Get village size for base regen rate
  const { x, y } = db.selectObject({
    sql: 'SELECT x, y FROM tiles WHERE id = $tile_id',
    bind: { $tile_id: state.tile_id },
    schema: z.object({ x: z.number(), y: z.number() }),
  })!;

  const { mapSize } = db.selectObject({
    sql: 'SELECT map_size as mapSize FROM servers LIMIT 1',
    schema: z.object({ mapSize: z.number() }),
  })!;

  const villageSize = getVillageSize(mapSize, x, y);
  const baseRegenRate = VILLAGE_SIZE_REGEN_RATE[villageSize] ?? 20;
  const regenRate = baseRegenRate * profile.troopRegenRateMultiplier;
  const totalRegen = Math.floor(elapsedHours * regenRate);

  if (totalRegen <= 0) {
    return;
  }

  const troopsToAdd = composition
    .map(({ unitId, weight }) => ({
      unitId: unitId as any,
      amount: Math.floor(totalRegen * weight),
      tileId: state.tile_id,
      source: state.tile_id,
    }))
    .filter((t) => t.amount > 0);

  if (troopsToAdd.length > 0) {
    addTroops(db, troopsToAdd as any);
  }
};
