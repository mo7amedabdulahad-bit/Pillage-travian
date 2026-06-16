import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
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
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';

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
  chunkMs: number,
  _speed: number,
  mapSize: number,
): TroopRegenResult => {
  const elapsedHours = chunkMs / 3_600_000;
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
    const bind: Record<string, number> = {};

    troopInserts.forEach(([unitId, amount, tileId, sourceTileId], i) => {
      const uk = `$u${i}`;
      const ak = `$a${i}`;
      const tk = `$t${i}`;
      const sk = `$s${i}`;
      valuesClauses.push(
        `((SELECT id FROM unit_ids WHERE unit = ${uk}), ${ak}, ${tk}, ${sk})`,
      );
      bind[uk] = unitId as unknown as number;
      bind[ak] = amount;
      bind[tk] = tileId;
      bind[sk] = sourceTileId;
    });

    db.exec({
      sql: `
        INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
        VALUES ${valuesClauses.join(',')}
        ON CONFLICT (unit_id, tile_id, source_tile_id) DO NOTHING;
      `,
      bind,
    });
  }

  // ─── Batch UPDATE existing troop rows ───
  if (troopUpdates.length > 0) {
    const caseClauses: string[] = [];
    const bind: Record<string, number> = {};

    troopUpdates.forEach((u, i) => {
      const tk = `$t${i}`;
      const uk = `$u${i}`;
      const ak = `$a${i}`;
      const mk = `$m${i}`;
      caseClauses.push(
        `WHEN tile_id = ${tk} AND unit_id = (SELECT id FROM unit_ids WHERE unit = ${uk}) THEN CASE WHEN amount + ${ak} > ${mk} THEN ${mk} ELSE amount + ${ak} END`,
      );
      bind[tk] = u.tileId;
      bind[uk] = u.unitId as unknown as number;
      bind[ak] = u.amount;
      bind[mk] = u.maxTroops;
    });

    const tileIdPlaceholders = troopUpdates.map((_, i) => `$tid${i}`).join(',');
    const tileIdBinds: Record<string, number> = {};
    troopUpdates.forEach((u, i) => {
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
 * Get current home troops for a village (troops stationed at their home tile).
 */
export const getHomeTroops = (
  db: DbFacade,
  tileId: number,
): { unitId: string; amount: number }[] => {
  return db.selectObjects({
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
