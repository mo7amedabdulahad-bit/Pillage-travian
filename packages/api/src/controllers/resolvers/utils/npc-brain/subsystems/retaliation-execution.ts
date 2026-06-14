import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createEvents } from '../../../../utils/create-event.ts';
import type { FactionKey, RetaliationResolution } from '../npc-brain-types';
import { getNpcTroopMultiplier } from '../world-threat-level';

/**
 * Retaliation Execution Subsystem (Section 4.6)
 *
 * Processes pending retaliation events whose executeAtMs has passed.
 * Creates troopMovementAttack events in the existing event system.
 *
 * Game design intent: Retaliations use the same combat system as the player,
 * ensuring fair and consistent resolution. The world threat multiplier
 * scales NPC strength dynamically — as the player grows stronger, NPCs
 * become proportionally more dangerous.
 */

/**
 * Process all due retaliations across all NPC villages.
 * Returns an array of resolution results for the offline summary.
 */
export const processRetaliations = (
  db: DbFacade,
  currentTimeMs: number,
  worldThreatLevel: number,
): RetaliationResolution[] => {
  const resolutions: RetaliationResolution[] = [];

  const dueRetaliations = db.selectObjects({
    sql: `
      SELECT
        rq.id,
        rq.village_id AS villageId,
        rq.execute_at_ms AS executeAtMs,
        rq.aggression_tier AS tier,
        rq.faction_key AS factionKey,
        rq.troops_json AS troopsJson,
        v.name AS villageName,
        v.tile_id AS tileId
      FROM npc_retaliation_queue rq
      JOIN villages v ON v.id = rq.village_id
      WHERE rq.execute_at_ms <= $currentTime
      ORDER BY rq.execute_at_ms ASC;
    `,
    bind: { $currentTime: currentTimeMs },
    schema: z.object({
      id: z.number(),
      villageId: z.number(),
      executeAtMs: z.number(),
      tier: z.number(),
      factionKey: z.string(),
      troopsJson: z.string(),
      villageName: z.string(),
      tileId: z.number(),
    }),
  });

  const npcTroopMultiplier = getNpcTroopMultiplier(worldThreatLevel);

  for (const retaliation of dueRetaliations) {
    const resolution = executeRetaliation(db, retaliation, npcTroopMultiplier);

    if (resolution) {
      resolutions.push(resolution);
    }

    // Remove from queue
    db.exec({
      sql: 'DELETE FROM npc_retaliation_queue WHERE id = $id;',
      bind: { $id: retaliation.id },
    });
  }

  return resolutions;
};

/**
 * Execute a single retaliation: schedule an attack event against the player.
 */
const executeRetaliation = (
  db: DbFacade,
  retaliation: {
    id: number;
    villageId: number;
    executeAtMs: number;
    tier: number;
    factionKey: string;
    troopsJson: string;
    villageName: string;
    tileId: number;
  },
  npcTroopMultiplier: number,
): RetaliationResolution | null => {
  const troops = JSON.parse(retaliation.troopsJson) as Record<string, number>;

  if (Object.keys(troops).length === 0) {
    return null;
  }

  // Apply world threat multiplier
  const scaledTroops: {
    unitId: UnitId;
    amount: number;
    tileId: number;
    source: number;
  }[] = [];
  for (const [unitId, amount] of Object.entries(troops)) {
    const scaledAmount = Math.max(1, Math.floor(amount * npcTroopMultiplier));
    scaledTroops.push({
      unitId: unitId as UnitId,
      amount: scaledAmount,
      tileId: retaliation.tileId,
      source: retaliation.tileId,
    });
  }

  if (scaledTroops.length === 0) {
    return null;
  }

  // Get player village ID
  const playerVillageId = db.selectValue({
    sql: `
      SELECT v.id
      FROM villages v
      JOIN players p ON p.id = v.player_id
      WHERE p.id = $playerId
      LIMIT 1;
    `,
    bind: { $playerId: PLAYER_ID },
    schema: z.number(),
  });

  if (!playerVillageId) {
    return null;
  }

  // Schedule the attack event
  try {
    createEvents<'troopMovementAttack'>(db, {
      type: 'troopMovementAttack',
      villageId: retaliation.villageId,
      targetId: playerVillageId,
      troops: scaledTroops as any,
      startsAt: retaliation.executeAtMs,
    });
  } catch (_e) {
    // If event creation fails (e.g., player village gone), skip silently
    return null;
  }

  return {
    villageId: retaliation.villageId,
    villageName: retaliation.villageName,
    factionKey: retaliation.factionKey as FactionKey,
    tier: retaliation.tier,
    attackerWins: false, // Will be determined when event resolves
    attackerTroopsLost: 0, // Will be determined when event resolves
    defenderTroopsLost: 0,
    timestamp: retaliation.executeAtMs,
  };
};

/**
 * Get all pending retaliations for display/reporting.
 */
export const getPendingRetaliations = (
  db: DbFacade,
): {
  villageId: number;
  executeAtMs: number;
  tier: number;
  factionKey: string;
}[] => {
  return db.selectObjects({
    sql: `
      SELECT
        village_id AS villageId,
        execute_at_ms AS executeAtMs,
        aggression_tier AS tier,
        faction_key AS factionKey
      FROM npc_retaliation_queue
      ORDER BY execute_at_ms ASC;
    `,
    schema: z.object({
      villageId: z.number(),
      executeAtMs: z.number(),
      tier: z.number(),
      factionKey: z.string(),
    }),
  });
};

/**
 * Get the next scheduled retaliation (for "next threatened by" display).
 */
export const getNextRetaliation = (
  db: DbFacade,
  currentTimeMs: number,
): { villageName: string; executeAtMs: number; factionKey: string } | null => {
  const result = db.selectObject({
    sql: `
      SELECT
        v.name AS villageName,
        rq.execute_at_ms AS executeAtMs,
        rq.faction_key AS factionKey
      FROM npc_retaliation_queue rq
      JOIN villages v ON v.id = rq.village_id
      WHERE rq.execute_at_ms > $currentTime
      ORDER BY rq.execute_at_ms ASC
      LIMIT 1;
    `,
    bind: { $currentTime: currentTimeMs },
    schema: z.object({
      villageName: z.string(),
      executeAtMs: z.number(),
      factionKey: z.string(),
    }),
  });
  return result ?? null;
};
