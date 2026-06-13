import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getFactionProfile } from '../faction-profiles';
import {
  adjustForSpeed,
  calculateMaxLootCapacity,
  getMapSize,
  getVillageSize,
} from '../helpers';
import type { FactionKey } from '../npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';

/**
 * Growth Simulation Subsystem (Section 4.2)
 *
 * NPC villages grow passively over time. This creates the "world feels alive"
 * sensation and ensures raided villages eventually become worth raiding again.
 *
 * Game design intent: Growth rate is faction-dependent. Verdant Order (pacifists)
 * grow 2x faster — they invest in economy. Iron Brotherhood grows at 0.75x —
 * they spend resources on troops. This means raiding pacifists is more lucrative
 * long-term, but they're harder to provoke into retaliation.
 */

interface GrowthTickResult {
  fieldsLeveled: number;
  populationAdded: number;
  newMaxLootCapacity: number;
}

/**
 * Process field level growth and population growth for an NPC village.
 * Returns the number of field levels gained during this tick.
 */
export const processGrowth = (
  db: DbFacade,
  villageId: number,
  tileId: number,
  factionKey: FactionKey,
  elapsedMs: number,
  speed: number,
): GrowthTickResult => {
  const profile = getFactionProfile(factionKey);
  const mapSize = getMapSize(db);

  const coords = db.selectObject({
    sql: 'SELECT x, y FROM tiles WHERE id = $tileId;',
    bind: { $tileId: tileId },
    schema: z.object({ x: z.number(), y: z.number() }),
  });

  if (!coords) {
    return { fieldsLeveled: 0, populationAdded: 0, newMaxLootCapacity: 0 };
  }

  const villageSize = getVillageSize(coords.x, coords.y, mapSize);

  // Get current growth state
  const state = db.selectObject({
    sql: `
      SELECT
        field_growth_accumulator AS accumulator,
        population_growth_rate AS popRate
      FROM npc_village_state
      WHERE village_id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.object({
      accumulator: z.number(),
      popRate: z.number(),
    }),
  });

  if (!state) {
    return { fieldsLeveled: 0, populationAdded: 0, newMaxLootCapacity: 0 };
  }

  // ─── Field Level Growth ───
  // Base: one level-up every BASE_GROWTH_HOURS at 1x speed
  // Adjusted by faction growth rate multiplier
  const growthHours =
    NPC_BRAIN_CONSTANTS.BASE_GROWTH_HOURS / profile.growthRateMultiplier;
  const growthCycleMs = adjustForSpeed(growthHours * 3_600_000, speed);
  const growthIncrement = elapsedMs / growthCycleMs;

  let newAccumulator = state.accumulator + growthIncrement;
  let fieldsLeveled = 0;

  // Level up fields while accumulator >= 1.0
  while (newAccumulator >= 1.0) {
    newAccumulator -= 1.0;
    const leveled = levelUpLowestField(db, villageId, tileId);
    if (leveled) {
      fieldsLeveled++;
    } else {
      // All fields at max level, stop accumulating
      newAccumulator = 0;
      break;
    }
  }

  // ─── Population Growth ───
  const elapsedHours = elapsedMs / 3_600_000;
  const populationToAdd = Math.floor(elapsedHours * state.popRate * speed);

  let populationAdded = 0;
  if (populationToAdd > 0) {
    // Get current population and cap
    const fieldLevelSum = getFieldLevelSumForTile(db, tileId);
    const populationCap =
      fieldLevelSum * NPC_BRAIN_CONSTANTS.POPULATION_CAP_PER_FIELD_LEVEL;

    const currentPop =
      db.selectValue({
        sql: 'SELECT population FROM villages WHERE id = $villageId;',
        bind: { $villageId: villageId },
        schema: z.number(),
      }) ?? 0;

    const actualToAdd = Math.min(
      populationToAdd,
      Math.max(0, populationCap - currentPop),
    );

    if (actualToAdd > 0) {
      db.exec({
        sql: `
          UPDATE villages
          SET population = population + $amount
          WHERE id = $villageId;
        `,
        bind: { $villageId: villageId, $amount: actualToAdd },
      });
      populationAdded = actualToAdd;
    }
  }

  // ─── Update Loot Capacity ───
  const newFieldLevelSum = getFieldLevelSumForTile(db, tileId);
  const newMaxLootCapacity = calculateMaxLootCapacity(
    newFieldLevelSum,
    villageSize,
  );

  db.exec({
    sql: `
      UPDATE npc_village_state
      SET
        field_growth_accumulator = $accumulator,
        last_growth_tick_ms = $now,
        max_loot_capacity = $maxLoot
      WHERE village_id = $villageId;
    `,
    bind: {
      $accumulator: newAccumulator,
      $now: Date.now(),
      $maxLoot: newMaxLootCapacity,
      $villageId: villageId,
    },
  });

  return { fieldsLeveled, populationAdded, newMaxLootCapacity };
};

/**
 * Level up the lowest-level resource field for a village's tile.
 * Returns true if a field was leveled, false if all are at max.
 * NPC villages have a max level of 15 (player can reach 20).
 */
const levelUpLowestField = (
  db: DbFacade,
  _villageId: number,
  tileId: number,
): boolean => {
  const field = db.selectObject({
    sql: `
      SELECT id, level
      FROM resource_fields
      WHERE tile_id = $tileId
      ORDER BY level ASC, id ASC
      LIMIT 1;
    `,
    bind: { $tileId: tileId },
    schema: z.object({ id: z.number(), level: z.number() }),
  });

  if (!field || field.level >= NPC_BRAIN_CONSTANTS.NPC_MAX_FIELD_LEVEL) {
    return false;
  }

  db.exec({
    sql: `
      UPDATE resource_fields
      SET level = level + 1
      WHERE id = $fieldId;
    `,
    bind: { $fieldId: field.id },
  });

  return true;
};

/**
 * Get the total level of all resource fields for a tile.
 */
const getFieldLevelSumForTile = (db: DbFacade, tileId: number): number => {
  const result = db.selectValue({
    sql: `
      SELECT COALESCE(SUM(level), 0)
      FROM resource_fields
      WHERE tile_id = $tileId;
    `,
    bind: { $tileId: tileId },
    schema: z.number(),
  });
  return result ?? 0;
};
