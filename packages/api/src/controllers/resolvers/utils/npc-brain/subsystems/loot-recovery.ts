import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';

/**
 * Pure calculation: compute current loot for a village based on time elapsed
 * since the last raid.
 *
 * Replaces the tick-based processLootRecoveryBatch. Loot is now a lazy field:
 * - loot_at_last_raid: stored in npc_village_state, written after each raid
 * - last_raided_ms: stored in npc_village_state, written after each raid
 * - The actual current loot is computed on the fly using these two values +
 *   the recovery rate formula.
 *
 * @param lootAtLastRaid - The loot fraction (0..1) immediately after the last raid
 * @param lastRaidedMs - Timestamp of the last raid
 * @param maxLoot - Maximum loot capacity for the village
 * @param fieldLevelSum - Sum of resource field levels (affects recovery rate)
 * @param speed - Current game speed multiplier
 * @returns Current loot fraction (0..1), clamped to max
 */
export const calculateCurrentLoot = (
  lootAtLastRaid: number,
  lastRaidedMs: number,
  _maxLoot: number,
  fieldLevelSum: number,
  speed: number,
): number => {
  if (lootAtLastRaid >= 1.0) {
    return 1.0;
  }

  if (lastRaidedMs <= 0) {
    return lootAtLastRaid;
  }

  const now = Date.now();
  const elapsedHours = (now - lastRaidedMs) / 3_600_000;

  const recoveryScale =
    fieldLevelSum / NPC_BRAIN_CONSTANTS.FULL_RECOVERY_FIELD_SUM;
  const baseRate = NPC_BRAIN_CONSTANTS.BASE_LOOT_RECOVERY_RATE;
  const recoveryRate = baseRate * Math.min(1.0, recoveryScale) * speed;
  const recoveryAmount = recoveryRate * elapsedHours;

  return Math.min(1.0, lootAtLastRaid + recoveryAmount);
};
