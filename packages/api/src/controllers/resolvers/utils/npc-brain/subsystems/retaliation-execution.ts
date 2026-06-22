import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createEvents } from '../../../../utils/create-event.ts';
import {
  getMapSize,
  getPlayerVillageCoords,
  mapDistance,
  scaleTroops,
} from '../helpers';
import type { FactionKey, RetaliationResolution } from '../npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';
import { getNpcTroopMultiplier } from '../world-threat-level';
import { materializeNpcTroops } from './troop-regeneration';

/**
 * Unified Retaliation Execution
 *
 * Single pipeline for ALL retaliation processing:
 * 1. Queue-based retaliations (from npc_retaliation_queue)
 * 2. Revenge intents (from npc_village_state.revenge_intent_* columns)
 *
 * Both offline reconciliation and live tick call this same function.
 * No split between immediate vs queued paths.
 */

/**
 * Process all due retaliations: queue items + revenge intents.
 * Called by reconcileNpcBrain for both offline and live modes.
 */
export const processDueRetaliations = (
  db: DbFacade,
  currentTimeMs: number,
  speed: number,
  worldThreatLevel: number,
): RetaliationResolution[] => {
  const resolutions: RetaliationResolution[] = [];
  const npcTroopMultiplier = getNpcTroopMultiplier(worldThreatLevel);

  // ─── Part 1: Process queue-based retaliations ───
  const dueQueueItems = db.selectObjects({
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
    schema: z.any(),
  }) as unknown as {
    id: number;
    villageId: number;
    executeAtMs: number;
    tier: number;
    factionKey: string;
    troopsJson: string;
    villageName: string;
    tileId: number;
  }[];

  const processedQueueIds: number[] = [];

  for (const item of dueQueueItems) {
    try {
      const resolution = executeRetaliationAttack(
        db,
        {
          villageId: item.villageId,
          villageName: item.villageName,
          factionKey: item.factionKey,
          tier: item.tier,
          tileId: item.tileId,
          troopsJson: item.troopsJson,
          executeAtMs: item.executeAtMs,
        },
        npcTroopMultiplier,
        speed,
      );
      if (resolution) {
        resolutions.push(resolution);
      }
      // Only mark as processed if execution succeeded
      processedQueueIds.push(item.id);
    } catch (_e) {
      // Malformed data — skip (queue item preserved for retry)
    }
  }

  // Batch delete processed queue items
  if (processedQueueIds.length > 0) {
    const placeholders = processedQueueIds.map((_, i) => `$d${i}`).join(',');
    const bind: Record<string, number> = {};
    processedQueueIds.forEach((id, i) => {
      bind[`$d${i}`] = id;
    });
    db.exec({
      sql: `DELETE FROM npc_retaliation_queue WHERE id IN (${placeholders});`,
      bind,
    });
  }

  // ─── Part 2: Process revenge intents ───
  const armedIntents = db.selectObjects({
    sql: `
      SELECT
        nvs.village_id AS villageId,
        nvs.revenge_intent_target_village_id AS targetVillageId,
        nvs.faction_key AS factionKey,
        nvs.aggression_level AS aggressionLevel,
        v.tile_id AS tileId,
        v.name AS villageName,
        t.x,
        t.y,
        COALESCE(vt.tribe, pt.tribe) AS tribe
      FROM npc_village_state nvs
      JOIN villages v ON v.id = nvs.village_id
      JOIN tiles t ON t.id = v.tile_id
      LEFT JOIN tribe_ids vt ON vt.id = v.tribe_id
      LEFT JOIN players p ON p.id = v.player_id
      LEFT JOIN tribe_ids pt ON pt.id = p.tribe_id
      WHERE nvs.revenge_intent_target_village_id IS NOT NULL
        AND nvs.revenge_intent_armed_at_ms <= $now;
    `,
    bind: { $now: currentTimeMs },
    schema: z.any(),
  }) as unknown as {
    villageId: number;
    targetVillageId: number;
    factionKey: string;
    aggressionLevel: number;
    tileId: number;
    villageName: string;
    x: number;
    y: number;
    tribe: string;
  }[];

  const clearedVillageIds: number[] = [];
  const mapSize = getMapSize(db);

  for (const intent of armedIntents) {
    // Materialize troops on-demand for this village
    materializeNpcTroops(
      db,
      intent.villageId,
      intent.tileId,
      intent.factionKey as FactionKey,
      intent.tribe,
      mapSize,
      intent.x,
      intent.y,
      speed,
    );

    // Query troops directly from DB
    const homeTroops = db.selectObjects({
      sql: `
        SELECT u.unit AS unitId, t.amount
        FROM troops t
        JOIN unit_ids u ON u.id = t.unit_id
        WHERE t.tile_id = $tileId
          AND t.source_tile_id = $tileId
          AND t.amount > 0;
      `,
      bind: { $tileId: intent.tileId },
      schema: z.any(),
    }) as { unitId: string; amount: number }[];

    const totalUnits = homeTroops.reduce((sum, t) => sum + t.amount, 0);

    if (totalUnits >= NPC_BRAIN_CONSTANTS.MIN_TROOPS_FOR_RETALIATION) {
      const troopMap: Record<string, number> = {};
      for (const troop of homeTroops) {
        troopMap[troop.unitId] = troop.amount;
      }

      const tier = intent.aggressionLevel ?? 1;
      const troopPercentage =
        NPC_BRAIN_CONSTANTS.AGGRESSION_TROOP_PERCENTAGES[Math.min(5, tier)];
      const retaliationTroops = scaleTroops(troopMap, troopPercentage);

      if (Object.keys(retaliationTroops).length > 0) {
        const playerCoords = getPlayerVillageCoords(db);
        if (playerCoords) {
          const distance = mapDistance(
            { x: intent.x, y: intent.y },
            playerCoords,
          );
          const slowestSpeed = 3;
          const travelTimeMs = Math.ceil(
            (distance / (slowestSpeed * speed)) * 3_600_000,
          );
          const variance =
            (Math.random() * 2 * NPC_BRAIN_CONSTANTS.RETALIATION_VARIANCE -
              NPC_BRAIN_CONSTANTS.RETALIATION_VARIANCE) *
            travelTimeMs;

          // Apply world-threat multiplier to intent troops
          const scaledTroops: {
            unitId: UnitId;
            amount: number;
            tileId: number;
            source: number;
          }[] = [];
          for (const [unitId, amount] of Object.entries(retaliationTroops)) {
            const scaledAmount = Math.max(
              1,
              Math.floor(amount * npcTroopMultiplier),
            );
            // Cap at actual available amount — createEvents validates availability
            const cappedAmount = Math.min(scaledAmount, troopMap[unitId] ?? 0);
            if (cappedAmount <= 0) {
              continue;
            }
            scaledTroops.push({
              unitId: unitId as UnitId,
              amount: cappedAmount,
              tileId: intent.tileId,
              source: intent.tileId,
            });
          }

          try {
            createEvents<'troopMovementAttack'>(db, {
              type: 'troopMovementAttack',
              villageId: intent.villageId,
              targetId: intent.targetVillageId,
              troops: scaledTroops as any,
              startsAt: Math.floor(currentTimeMs + variance),
            });

            resolutions.push({
              villageId: intent.villageId,
              villageName: intent.villageName,
              factionKey: intent.factionKey as FactionKey,
              tier,
              attackerWins: false,
              attackerTroopsLost: 0,
              defenderTroopsLost: 0,
              timestamp: Math.floor(currentTimeMs + variance),
            });

            // Only clear intent on successful event creation
            clearedVillageIds.push(intent.villageId);
          } catch (_e) {
            // Event creation failed — leave intent armed for retry
          }
        }
      }
    }
    // If not enough troops, leave intent armed for next pass
  }

  // Batch clear resolved intents
  if (clearedVillageIds.length > 0) {
    const placeholders = clearedVillageIds.map((_, i) => `$c${i}`).join(',');
    const bind: Record<string, number> = {};
    clearedVillageIds.forEach((vid, i) => {
      bind[`$c${i}`] = vid;
    });
    db.exec({
      sql: `
        UPDATE npc_village_state
        SET revenge_intent_target_village_id = NULL,
            revenge_intent_armed_at_ms = NULL
        WHERE village_id IN (${placeholders});
      `,
      bind,
    });
  }

  return resolutions;
};

/**
 * Execute a single retaliation attack event.
 */
const executeRetaliationAttack = (
  db: DbFacade,
  retaliation: {
    villageId: number;
    villageName: string;
    factionKey: string;
    tier: number;
    tileId: number;
    troopsJson: string;
    executeAtMs: number;
  },
  npcTroopMultiplier: number,
  _speed: number,
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

  // Fetch available troops to cap scaled amounts
  const availableTroops = db.selectObjects({
    sql: `
      SELECT u.unit AS unitId, t.amount
      FROM troops t
      JOIN unit_ids u ON u.id = t.unit_id
      WHERE t.tile_id = $tileId
        AND t.source_tile_id = $tileId
        AND t.amount > 0;
    `,
    bind: { $tileId: retaliation.tileId },
    schema: z.any(),
  }) as { unitId: string; amount: number }[];
  const availableMap = new Map<string, number>();
  for (const t of availableTroops) {
    availableMap.set(t.unitId, t.amount);
  }

  for (const [unitId, amount] of Object.entries(troops)) {
    const scaledAmount = Math.max(1, Math.floor(amount * npcTroopMultiplier));
    // Cap at actual available amount — createEvents validates availability
    const cappedAmount = Math.min(scaledAmount, availableMap.get(unitId) ?? 0);
    if (cappedAmount <= 0) {
      continue;
    }
    scaledTroops.push({
      unitId: unitId as UnitId,
      amount: cappedAmount,
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
      SELECT v.id FROM villages v
      JOIN players p ON p.id = v.player_id
      WHERE p.id = $playerId LIMIT 1;
    `,
    bind: { $playerId: PLAYER_ID },
    schema: z.number(),
  });

  if (!playerVillageId) {
    return null;
  }

  try {
    createEvents<'troopMovementAttack'>(db, {
      type: 'troopMovementAttack',
      villageId: retaliation.villageId,
      targetId: playerVillageId,
      troops: scaledTroops as any,
      startsAt: Date.now(),
    });
  } catch (_e) {
    return null;
  }

  return {
    villageId: retaliation.villageId,
    villageName: retaliation.villageName,
    factionKey: retaliation.factionKey as FactionKey,
    tier: retaliation.tier,
    attackerWins: false,
    attackerTroopsLost: 0,
    defenderTroopsLost: 0,
    timestamp: Date.now(),
  };
};

/**
 * Queue a retaliation for future execution.
 * Called by reputation-impact.ts when a raid triggers retaliation.
 */
export const queueRetaliation = (
  db: DbFacade,
  villageId: number,
  factionKey: FactionKey,
  tier: number,
  troopsJson: string,
  executeAtMs: number,
): void => {
  try {
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
        $troopsJson: troopsJson,
      },
    });
  } catch (_e) {
    // Queue insert failed — non-critical
  }
};

/**
 * Arm a revenge intent for deferred retaliation when troops are insufficient.
 * Stored in npc_village_state columns for fast lookup during reconciliation.
 */
export const armRevengeIntent = (
  db: DbFacade,
  villageId: number,
  targetVillageId: number,
  speed: number,
): void => {
  const armedAtMs = Date.now() + Math.ceil(3_600_000 / speed);
  db.exec({
    sql: `
      UPDATE npc_village_state
      SET revenge_intent_target_village_id = $targetId,
          revenge_intent_armed_at_ms = $armedAtMs
      WHERE village_id = $villageId;
    `,
    bind: {
      $targetId: targetVillageId,
      $armedAtMs: armedAtMs,
      $villageId: villageId,
    },
  });
};

/**
 * Get the next scheduled retaliation (for offline summary display).
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
