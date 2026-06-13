import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { NPC_BRAIN_CONSTANTS } from './npc-brain-types';

/**
 * World Threat Level System (Section 5)
 *
 * A single global value (0–100) that scales NPC strength across the map.
 * Higher threat = stronger NPCs. This creates a dynamic difficulty curve
 * where the world grows more dangerous as the player progresses.
 *
 * Game design intent: The threat level ensures NPCs remain relevant
 * throughout the game. Early game NPCs are weak (20% base strength).
 * Late game NPCs are formidable (200% base strength). This prevents
 * the player from outgrowing the world entirely.
 */

/**
 * Calculate the current world threat level (0–100).
 * Inputs: player building levels, troop count, hero level, oases captured.
 */
export const calculateWorldThreatLevel = (db: DbFacade): number => {
  let threatScore = 0;

  // Building levels contribution
  const totalBuildingLevels =
    db.selectValue({
      sql: `
      SELECT COALESCE(SUM(level), 0)
      FROM building_fields bf
      JOIN villages v ON v.id = bf.village_id
      WHERE v.player_id = $playerId;
    `,
      bind: { $playerId: PLAYER_ID },
      schema: z.number(),
    }) ?? 0;

  threatScore +=
    totalBuildingLevels * NPC_BRAIN_CONSTANTS.THREAT_BUILDING_WEIGHT;

  // Troop count contribution
  const totalTroopCount =
    db.selectValue({
      sql: `
      SELECT COALESCE(SUM(t.amount), 0)
      FROM troops t
      JOIN tiles ti ON ti.id = t.tile_id
      JOIN villages v ON v.tile_id = ti.id
      WHERE v.player_id = $playerId;
    `,
      bind: { $playerId: PLAYER_ID },
      schema: z.number(),
    }) ?? 0;

  threatScore += totalTroopCount * NPC_BRAIN_CONSTANTS.THREAT_TROOP_WEIGHT;

  // Hero level contribution
  const heroLevel =
    db.selectValue({
      sql: `
      SELECT COALESCE(
        CASE
          WHEN experience < 100 THEN 0
          WHEN experience < 500 THEN 1
          WHEN experience < 1500 THEN 2
          WHEN experience < 3500 THEN 3
          WHEN experience < 7000 THEN 4
          WHEN experience < 12000 THEN 5
          WHEN experience < 20000 THEN 6
          WHEN experience < 32000 THEN 7
          WHEN experience < 50000 THEN 8
          WHEN experience < 75000 THEN 9
          WHEN experience < 110000 THEN 10
          ELSE MIN(100, 10 + (experience - 110000) / 10000)
        END, 0)
      FROM heroes
      WHERE player_id = $playerId;
    `,
      bind: { $playerId: PLAYER_ID },
      schema: z.number(),
    }) ?? 0;

  threatScore += heroLevel * NPC_BRAIN_CONSTANTS.THREAT_HERO_WEIGHT;

  // Oases captured contribution
  const oasesCaptured =
    db.selectValue({
      sql: `
      SELECT COUNT(*)
      FROM oasis o
      WHERE o.village_id IN (
        SELECT id FROM villages WHERE player_id = $playerId
      );
    `,
      bind: { $playerId: PLAYER_ID },
      schema: z.number(),
    }) ?? 0;

  threatScore += oasesCaptured * NPC_BRAIN_CONSTANTS.THREAT_OASIS_WEIGHT;

  return Math.min(NPC_BRAIN_CONSTANTS.THREAT_MAX, Math.floor(threatScore));
};

/**
 * Get the NPC troop multiplier based on world threat level.
 * At threat 0: NPCs have 20% of base troops.
 * At threat 50: NPCs have 110% of base troops.
 * At threat 100: NPCs have 200% of base troops.
 */
export const getNpcTroopMultiplier = (worldThreatLevel: number): number => {
  const { NPC_TROOP_MULTIPLIER_MIN, NPC_TROOP_MULTIPLIER_MAX, THREAT_MAX } =
    NPC_BRAIN_CONSTANTS;

  const clampedThreat = Math.max(0, Math.min(THREAT_MAX, worldThreatLevel));

  return (
    NPC_TROOP_MULTIPLIER_MIN +
    (clampedThreat / THREAT_MAX) *
      (NPC_TROOP_MULTIPLIER_MAX - NPC_TROOP_MULTIPLIER_MIN)
  );
};
