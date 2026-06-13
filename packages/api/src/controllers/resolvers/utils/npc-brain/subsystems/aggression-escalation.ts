import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getFactionProfile } from '../faction-profiles';
import {
  adjustForSpeed,
  getAllNPCVillages,
  getPlayerVillageCoords,
  mapDistance,
  scaleTroops,
} from '../helpers';
import type { FactionKey } from '../npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';
import { getRaidCount } from './memory-decay';
import { getHomeTroops } from './troop-regeneration';

/**
 * Aggression & Retaliation Subsystem (Section 4.5)
 *
 * The most complex subsystem. Determines whether and how an NPC village
 * fights back after being raided.
 *
 * Game design intent: Aggression escalates in tiers from passive to siege.
 * Aggressive factions (Iron Brotherhood, Bone Reavers) escalate immediately
 * on the first raid. Peaceful factions (Verdant Order) require many raids
 * before responding. Each tier sends a larger force, creating a risk/reward
 * decision for the player: keep raiding for more loot, or stop before
 * triggering a siege.
 */

/**
 * Calculate aggression response after a raid.
 * Called immediately when a raid event is recorded.
 */
export const calculateAggressionResponse = (
  db: DbFacade,
  villageId: number,
  factionKey: FactionKey,
): number => {
  const profile = getFactionProfile(factionKey);
  const raidCount = getRaidCount(db, villageId);

  // Check if this faction retaliates at this raid count
  if (raidCount < profile.retaliationThreshold) {
    return 0; // no retaliation yet
  }

  // Calculate new aggression tier
  const newTier = Math.min(
    5,
    Math.floor(raidCount / profile.retaliationThreshold),
  );

  // Get current aggression level
  const currentState = db.selectObject({
    sql: `
      SELECT aggression_level AS level
      FROM npc_village_state
      WHERE village_id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.object({ level: z.number() }),
  });

  const currentLevel = currentState?.level ?? 0;
  const effectiveTier = Math.max(currentLevel, newTier);

  // Update aggression level
  db.exec({
    sql: `
      UPDATE npc_village_state
      SET aggression_level = $tier
      WHERE village_id = $villageId;
    `,
    bind: { $tier: effectiveTier, $villageId: villageId },
  });

  // Schedule retaliation
  scheduleRetaliation(db, villageId, factionKey, effectiveTier);

  // If tier >= 4, call regional reinforcements
  if (effectiveTier >= 4) {
    callRegionalReinforcements(db, villageId, factionKey, effectiveTier);
  }

  return effectiveTier;
};

/**
 * Schedule a retaliation attack from an NPC village.
 * Adds to npc_retaliation_queue with travel time + variance.
 */
const scheduleRetaliation = (
  db: DbFacade,
  villageId: number,
  factionKey: FactionKey,
  tier: number,
): void => {
  const troopPercentage =
    NPC_BRAIN_CONSTANTS.AGGRESSION_TROOP_PERCENTAGES[tier];

  if (troopPercentage <= 0) {
    return;
  }

  // Get village tile for travel time calculation
  const villageInfo = db.selectObject({
    sql: `
      SELECT v.tile_id, t.x, t.y
      FROM villages v
      JOIN tiles t ON t.id = v.tile_id
      WHERE v.id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.object({ tileId: z.number(), x: z.number(), y: z.number() }),
  });

  if (!villageInfo) {
    return;
  }

  const playerCoords = getPlayerVillageCoords(db);
  if (!playerCoords) {
    return;
  }

  const distance = mapDistance(
    { x: villageInfo.x, y: villageInfo.y },
    playerCoords,
  );

  // Travel time: distance / speed * base_time
  // Using slowest troop speed approximation: 3 fields/hour at 1x
  const slowestSpeed = 3;
  const speed = getGameSpeedFromDb(db);
  const travelTimeMs = Math.ceil(
    (distance / (slowestSpeed * speed)) * 3_600_000,
  );

  // Add variance: ±15%
  const variance =
    (Math.random() * 2 * NPC_BRAIN_CONSTANTS.RETALIATION_VARIANCE -
      NPC_BRAIN_CONSTANTS.RETALIATION_VARIANCE) *
    travelTimeMs;
  const executeAtMs = Date.now() + travelTimeMs + variance;

  // Get current home troops and scale by tier percentage
  const homeTroops = getHomeTroops(db, villageInfo.tileId);
  const totalUnits = homeTroops.reduce((sum, t) => sum + t.amount, 0);

  if (totalUnits < NPC_BRAIN_CONSTANTS.MIN_TROOPS_FOR_RETALIATION) {
    return; // Not enough troops
  }

  const troopMap: Record<string, number> = {};
  for (const troop of homeTroops) {
    troopMap[troop.unitId] = troop.amount;
  }

  const retaliationTroops = scaleTroops(troopMap, troopPercentage);

  if (Object.keys(retaliationTroops).length === 0) {
    return;
  }

  db.exec({
    sql: `
      INSERT INTO npc_retaliation_queue
        (village_id, scheduled_at_ms, execute_at_ms, aggression_tier, faction_key, troops_json)
      VALUES
        ($villageId, $scheduledAt, $executeAt, $tier, $factionKey, $troopsJson);
    `,
    bind: {
      $villageId: villageId,
      $scheduledAt: Date.now(),
      $executeAt: Math.floor(executeAtMs),
      $tier: tier,
      $factionKey: factionKey,
      $troopsJson: JSON.stringify(retaliationTroops),
    },
  });
};

/**
 * Call regional reinforcements from nearby same-faction villages.
 * At tier 4: calls nearest same-faction neighbor.
 * At tier 5: calls ALL same-faction villages within 5 tiles.
 */
const callRegionalReinforcements = (
  db: DbFacade,
  villageId: number,
  factionKey: FactionKey,
  _tier: number,
): void => {
  const allNpcVillages = getAllNPCVillages(db);
  const sourceVillage = allNpcVillages.find((v) => v.villageId === villageId);
  if (!sourceVillage) {
    return;
  }

  const range = NPC_BRAIN_CONSTANTS.REINFORCEMENT_RANGE;

  const neighbors = allNpcVillages
    .filter((v) => v.villageId !== villageId)
    .filter((v) => v.factionKey === factionKey)
    .filter((v) => {
      const dist = mapDistance(
        { x: sourceVillage.x, y: sourceVillage.y },
        { x: v.x, y: v.y },
      );
      return dist <= range;
    })
    .filter((v) => {
      // Don't call already-engaged villages
      const state = db.selectObject({
        sql: `
          SELECT aggression_level AS level
          FROM npc_village_state
          WHERE village_id = $villageId;
        `,
        bind: { $villageId: v.villageId },
        schema: z.object({ level: z.number() }),
      });
      return (state?.level ?? 0) < 3;
    });

  for (const neighbor of neighbors) {
    // Set neighbor to at least tier 2
    db.exec({
      sql: `
        UPDATE npc_village_state
        SET aggression_level = MAX(aggression_level, 2),
            regional_alert_active = 1
        WHERE village_id = $villageId;
      `,
      bind: { $villageId: neighbor.villageId },
    });

    scheduleRetaliation(db, neighbor.villageId, factionKey, 2);
  }
};

/**
 * Process aggression decay for all NPC villages.
 * Called each tick. Non-PERMANENT factions lose 1 aggression tier
 * after enough time without being raided.
 */
export const processAggressionDecay = (
  db: DbFacade,
  villageId: number,
  factionKey: FactionKey,
  currentTimeMs: number,
  speed: number,
): boolean => {
  const profile = getFactionProfile(factionKey);

  if (profile.isAggressionPermanent) {
    return false;
  }

  const state = db.selectObject({
    sql: `
      SELECT
        aggression_level AS level,
        last_raided_ms AS lastRaidedMs,
        last_aggression_decay_ms AS lastDecayMs
      FROM npc_village_state
      WHERE village_id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.object({
      level: z.number(),
      lastRaidedMs: z.number(),
      lastDecayMs: z.number(),
    }),
  });

  if (!state || state.level <= 0) {
    return false;
  }

  const decayThresholdMs = adjustForSpeed(
    profile.aggressionDecayDays! * 86_400_000,
    speed,
  );

  const timeSinceLastRaid = currentTimeMs - state.lastRaidedMs;

  if (timeSinceLastRaid > decayThresholdMs) {
    const newLevel = Math.max(0, state.level - 1);

    db.exec({
      sql: `
        UPDATE npc_village_state
        SET
          aggression_level = $newLevel,
          last_aggression_decay_ms = $now
        WHERE village_id = $villageId;
      `,
      bind: {
        $newLevel: newLevel,
        $now: currentTimeMs,
        $villageId: villageId,
      },
    });

    // If aggression dropped to 0, clear retaliation queue and regional alert
    if (newLevel === 0) {
      db.exec({
        sql: `
          DELETE FROM npc_retaliation_queue WHERE village_id = $villageId;
          UPDATE npc_village_state SET regional_alert_active = 0 WHERE village_id = $villageId;
        `,
        bind: { $villageId: villageId },
      });
    }

    return true;
  }

  return false;
};

/**
 * Get the current aggression level for a village.
 */
export const getAggressionLevel = (db: DbFacade, villageId: number): number => {
  const result = db.selectValue({
    sql: `
      SELECT aggression_level FROM npc_village_state WHERE village_id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.number(),
  });
  return result ?? 0;
};

/**
 * Helper to get game speed from DB.
 */
const getGameSpeedFromDb = (db: DbFacade): number => {
  const result = db.selectObject({
    sql: 'SELECT speed FROM servers LIMIT 1;',
    schema: z.object({ speed: z.number() }),
  });
  return result?.speed ?? 1;
};
