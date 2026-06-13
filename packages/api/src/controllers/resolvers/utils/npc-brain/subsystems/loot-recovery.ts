import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { FactionKey } from '../npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';

/**
 * Loot Recovery Subsystem (Section 4.3)
 *
 * After a raid, a village's loot availability drops. It recovers over time.
 * Larger, higher-level villages recover faster.
 *
 * Game design intent: This creates a natural "farming cooldown" — raiding the
 * same village repeatedly yields diminishing returns. The rest state bonus
 * rewards patient players who time their raids well.
 */

interface LootRecoveryResult {
  newLootAvailable: number;
  enteredRestState: boolean;
}

/**
 * Process loot recovery for an NPC village.
 * Recovery rate scales with village field level sum.
 */
export const processLootRecovery = (
  db: DbFacade,
  villageId: number,
  _factionKey: FactionKey,
  elapsedMs: number,
  speed: number,
): LootRecoveryResult => {
  const state = db.selectObject({
    sql: `
      SELECT
        current_loot_available AS lootAvailable,
        max_loot_capacity AS maxLoot,
        last_raided_ms AS lastRaidedMs,
        rest_state AS restState,
        rest_threshold_ms AS restThresholdMs,
        rest_stockpile_bonus AS restBonus
      FROM npc_village_state
      WHERE village_id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.object({
      lootAvailable: z.number(),
      maxLoot: z.number(),
      lastRaidedMs: z.number(),
      restState: z.number(),
      restThresholdMs: z.number(),
      restBonus: z.number(),
    }),
  });

  if (!state) {
    return { newLootAvailable: 1.0, enteredRestState: false };
  }

  // If already at full loot, check rest state
  if (state.lootAvailable >= 1.0) {
    const enteredRest = checkAndApplyRestState(
      db,
      villageId,
      state.lastRaidedMs,
      state.restThresholdMs,
    );
    return { newLootAvailable: 1.0, enteredRestState: enteredRest };
  }

  // Calculate recovery rate based on field level sum
  const fieldLevelSum = getVillageFieldLevelSum(db, villageId);
  const recoveryScale =
    fieldLevelSum / NPC_BRAIN_CONSTANTS.FULL_RECOVERY_FIELD_SUM;
  const baseRate = NPC_BRAIN_CONSTANTS.BASE_LOOT_RECOVERY_RATE;
  const recoveryRate = baseRate * Math.min(1.0, recoveryScale) * speed;

  const elapsedHours = elapsedMs / 3_600_000;
  const recoveryAmount = recoveryRate * elapsedHours;

  const newLootAvailable = Math.min(1.0, state.lootAvailable + recoveryAmount);

  // Check if we just reached full loot
  let enteredRestState = false;
  if (newLootAvailable >= 1.0) {
    enteredRestState = checkAndApplyRestState(
      db,
      villageId,
      state.lastRaidedMs,
      state.restThresholdMs,
    );
  }

  db.exec({
    sql: `
      UPDATE npc_village_state
      SET current_loot_available = $loot
      WHERE village_id = $villageId;
    `,
    bind: {
      $loot: newLootAvailable,
      $villageId: villageId,
    },
  });

  return { newLootAvailable, enteredRestState };
};

/**
 * Check if a village qualifies for rest state and apply it.
 * Rest state = loot at 100% AND enough time since last raid.
 */
const checkAndApplyRestState = (
  db: DbFacade,
  villageId: number,
  lastRaidedMs: number,
  restThresholdMs: number,
): boolean => {
  const now = Date.now();
  const timeSinceRaid = now - lastRaidedMs;

  if (timeSinceRaid > restThresholdMs) {
    db.exec({
      sql: `
        UPDATE npc_village_state
        SET rest_state = 1
        WHERE village_id = $villageId AND rest_state = 0;
      `,
      bind: { $villageId: villageId },
    });
    return true;
  }

  return false;
};

/**
 * Reset rest state when a village is raided.
 */
export const resetRestState = (db: DbFacade, villageId: number): void => {
  db.exec({
    sql: `
      UPDATE npc_village_state
      SET rest_state = 0
      WHERE village_id = $villageId;
    `,
    bind: { $villageId: villageId },
  });
};

/**
 * Get the rest stockpile bonus multiplier for a village.
 * Returns 0 if not in rest state.
 */
export const getRestBonus = (db: DbFacade, villageId: number): number => {
  const state = db.selectObject({
    sql: `
      SELECT rest_state AS restState, rest_stockpile_bonus AS bonus
      FROM npc_village_state
      WHERE village_id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.object({ restState: z.number(), bonus: z.number() }),
  });

  if (!state || state.restState === 0) {
    return 0;
  }

  return state.bonus;
};

/**
 * Get the total field level sum for a village.
 */
const getVillageFieldLevelSum = (db: DbFacade, villageId: number): number => {
  const result = db.selectValue({
    sql: `
      SELECT COALESCE(SUM(level), 0)
      FROM building_fields
      WHERE village_id = $villageId AND field_id <= 18;
    `,
    bind: { $villageId: villageId },
    schema: z.number(),
  });
  return result ?? 0;
};
