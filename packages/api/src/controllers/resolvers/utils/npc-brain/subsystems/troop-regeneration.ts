import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  getMapSize,
  getMaxTroopsPerType,
  getPreferredTroopComposition,
  getTroopRegenRate,
  getVillageSize,
} from '../helpers';
import type { FactionKey } from '../npc-brain-types';

/**
 * Troop Regeneration Subsystem (Section 4.4)
 *
 * NPC troops regenerate over time after being reduced by the player.
 * Regen rate is faction-dependent and scales with village size.
 *
 * Game design intent: Aggressive factions (Iron Brotherhood) regenerate troops
 * fast — they breed warriors. Peaceful factions (Merchant Guilds) regenerate
 * slowly — they don't prioritize military. This means aggressive factions
 * become dangerous again quickly, while peaceful ones stay weak longer.
 */

interface TroopRegenResult {
  totalTroopsAdded: number;
  troopsByType: Record<string, number>;
}

/**
 * Process troop regeneration for an NPC village.
 * Uses the existing troops table and addTroops utility.
 */
export const processTroopRegen = (
  db: DbFacade,
  villageId: number,
  tileId: number,
  factionKey: FactionKey,
  tribe: string,
  elapsedMs: number,
  _speed: number,
): TroopRegenResult => {
  const elapsedHours = elapsedMs / 3_600_000;

  if (elapsedHours <= 0) {
    return { totalTroopsAdded: 0, troopsByType: {} };
  }

  const mapSize = getMapSize(db);
  const coords = db.selectObject({
    sql: 'SELECT x, y FROM tiles WHERE id = $tileId;',
    bind: { $tileId: tileId },
    schema: z.object({ x: z.number(), y: z.number() }),
  });

  if (!coords) {
    return { totalTroopsAdded: 0, troopsByType: {} };
  }

  const villageSize = getVillageSize(coords.x, coords.y, mapSize);
  const regenRate = getTroopRegenRate(villageSize, factionKey);
  const composition = getPreferredTroopComposition(tribe, factionKey);

  if (composition.length === 0) {
    return { totalTroopsAdded: 0, troopsByType: {} };
  }

  // Get max troops per type based on village capacity
  const maxLoot =
    db.selectValue({
      sql: 'SELECT max_loot_capacity FROM npc_village_state WHERE village_id = $villageId;',
      bind: { $villageId: villageId },
      schema: z.number(),
    }) ?? 500;

  const maxTroopsPerType = getMaxTroopsPerType(maxLoot);

  // Calculate total regen for elapsed time
  const totalRegen = Math.floor(elapsedHours * regenRate);

  if (totalRegen <= 0) {
    return { totalTroopsAdded: 0, troopsByType: {} };
  }

  const troopsByType: Record<string, number> = {};
  let totalAdded = 0;

  for (const { unitId, weight } of composition) {
    const toAdd = Math.floor(totalRegen * weight);
    if (toAdd <= 0) {
      continue;
    }

    // Check current troop count at this tile
    const currentAmount =
      db.selectValue({
        sql: `
        SELECT COALESCE(amount, 0)
        FROM troops
        WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)
          AND tile_id = $tileId
          AND source_tile_id = $tileId;
      `,
        bind: { $unitId: unitId, $tileId: tileId },
        schema: z.number(),
      }) ?? 0;

    // Don't exceed max
    const actualToAdd = Math.min(
      toAdd,
      Math.max(0, maxTroopsPerType - currentAmount),
    );

    if (actualToAdd > 0) {
      db.exec({
        sql: `
          INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
          VALUES (
            (SELECT id FROM unit_ids WHERE unit = $unitId),
            $amount,
            $tileId,
            $sourceTileId
          )
          ON CONFLICT (unit_id, tile_id, source_tile_id)
          DO UPDATE SET amount = MIN(amount + $amount, $maxTroops);
        `,
        bind: {
          $unitId: unitId,
          $amount: actualToAdd,
          $tileId: tileId,
          $sourceTileId: tileId,
          $maxTroops: maxTroopsPerType,
        },
      });

      troopsByType[unitId] = actualToAdd;
      totalAdded += actualToAdd;
    }
  }

  // Update last regen timestamp
  db.exec({
    sql: `
      UPDATE npc_village_state
      SET last_troop_regen_ms = $now
      WHERE village_id = $villageId;
    `,
    bind: { $now: Date.now(), $villageId: villageId },
  });

  return { totalTroopsAdded: totalAdded, troopsByType };
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
    schema: z.strictObject({ unitId: z.string(), amount: z.number() }),
  });
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
    schema: z.number(),
  });
  return result ?? 0;
};
