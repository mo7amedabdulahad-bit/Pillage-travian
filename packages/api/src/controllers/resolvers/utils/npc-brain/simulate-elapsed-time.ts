import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createEvents } from '../../../utils/create-event.ts';
import {
  getGameSpeed,
  getMapSize,
  getPlayerVillageCoords,
  mapDistance,
  scaleTroops,
} from './helpers';
import type {
  AggressionChange,
  BatchFieldLevelRow,
  BatchTroopRow,
  BatchVillageRow,
  FactionKey,
  RetaliationResolution,
  SimulationResult,
} from './npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from './npc-brain-types';
import { buildOfflineSummary } from './offline-summary';
import { processAggressionDecayBatch } from './subsystems/aggression-escalation';
import { processBuildDecisions } from './subsystems/build-simulation';
import { processGrowthBatch } from './subsystems/growth-simulation';
import { processLootRecoveryBatch } from './subsystems/loot-recovery';
import { processMemoryDecayBatch } from './subsystems/memory-decay';
import { processRetaliations } from './subsystems/retaliation-execution';
import { processTroopRegenBatch } from './subsystems/troop-regeneration';
import { calculateWorldThreatLevel } from './world-threat-level';

/**
 * Master NPC Brain Simulation (Section 6)
 *
 * Called ONCE at app open with total elapsed milliseconds since last save.
 * Fast-forwards ALL NPC state as if time had passed in real time.
 *
 * All subsystems use set-based queries: one JOIN fetch, JS computation,
 * one batch UPDATE. Target: 6+N+1 queries per tick instead of 6+18N.
 */
export const simulateElapsedTime = async (
  db: DbFacade,
  elapsedMs: number,
  onProgress?: (fraction: number) => void,
): Promise<SimulationResult> => {
  const now = Date.now();

  // ─── Offline cap: 12 real hours maximum ───
  const MAX_OFFLINE_MS = 12 * 3_600_000;
  const cappedElapsedMs = Math.min(elapsedMs, MAX_OFFLINE_MS);

  db.exec({
    sql: 'UPDATE npc_village_state SET last_growth_tick_ms = $now WHERE last_growth_tick_ms = 0;',
    bind: { $now: now },
  });
  db.exec({
    sql: 'UPDATE npc_village_state SET last_troop_regen_ms = $now WHERE last_troop_regen_ms = 0;',
    bind: { $now: now },
  });
  db.exec({
    sql: 'UPDATE npc_village_state SET last_aggression_decay_ms = $now WHERE last_aggression_decay_ms = 0;',
    bind: { $now: now },
  });

  const speed = getGameSpeed(db);

  // ─── Coarser chunk granularity at higher speeds ───
  let chunkMs: number;
  if (speed >= 20) {
    chunkMs = 900_000; // 15-minute chunks at x20
  } else if (speed >= 10) {
    chunkMs = 1_800_000; // 30-minute chunks at x10
  } else {
    chunkMs = NPC_BRAIN_CONSTANTS.SIMULATION_CHUNK_MS; // 1-hour chunks at x1
  }

  const totalChunks = Math.floor(cappedElapsedMs / chunkMs);
  const remainder = cappedElapsedMs % chunkMs;

  const allRetaliations: RetaliationResolution[] = [];
  const allAggressionChanges: AggressionChange[] = [];
  let totalVillagesGrown = 0;
  let totalTroopsRegenerated = 0;

  for (let i = 0; i < totalChunks; i++) {
    const result = processNPCTick(db, chunkMs, speed);
    allRetaliations.push(...result.retaliationsResolved);
    allAggressionChanges.push(...result.aggressionChanges);
    totalVillagesGrown += result.villagesGrown;
    totalTroopsRegenerated += result.troopsRegenerated;

    if (i % NPC_BRAIN_CONSTANTS.YIELD_EVERY_N_CHUNKS === 0) {
      onProgress?.(i / totalChunks);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  if (remainder > 0) {
    const result = processNPCTick(db, remainder, speed);
    allRetaliations.push(...result.retaliationsResolved);
    allAggressionChanges.push(...result.aggressionChanges);
    totalVillagesGrown += result.villagesGrown;
    totalTroopsRegenerated += result.troopsRegenerated;
  }

  onProgress?.(1);

  const offlineSummary = buildOfflineSummary(
    db,
    {
      retaliationsResolved: allRetaliations,
      villagesGrown: totalVillagesGrown,
      troopsRegenerated: totalTroopsRegenerated,
      aggressionChanges: allAggressionChanges,
    } satisfies Pick<
      SimulationResult,
      | 'retaliationsResolved'
      | 'villagesGrown'
      | 'troopsRegenerated'
      | 'aggressionChanges'
    >,
    elapsedMs,
  );

  return {
    retaliationsResolved: allRetaliations,
    villagesGrown: totalVillagesGrown,
    troopsRegenerated: totalTroopsRegenerated,
    aggressionChanges: allAggressionChanges,
    offlineSummary,
  };
};

/**
 * Process a single simulation tick for all NPC villages.
 * Uses set-based queries: one JOIN fetch per subsystem, JS computation, one batch UPDATE.
 * Exported for use by the live heartbeat in api-worker.
 */
export const processNPCTick = (
  db: DbFacade,
  chunkMs: number,
  speed: number,
): Pick<
  SimulationResult,
  | 'retaliationsResolved'
  | 'villagesGrown'
  | 'troopsRegenerated'
  | 'aggressionChanges'
> => {
  const currentTimeMs = Date.now();

  // ─── Cache shared values (eliminates ~1000 redundant SQL queries per tick) ───
  const mapSize = getMapSize(db);
  const worldThreatLevel = calculateWorldThreatLevel(db);

  // ─── Single JOIN query: fetch all NPC village states + coordinates + tribe ───
  const allVillagesRaw = db.selectObjects({
    sql: `
      SELECT
        nvs.village_id AS villageId,
        nvs.faction_key AS factionKey,
        v.tile_id AS tileId,
        t.x,
        t.y,
        ti.tribe,
        nvs.field_growth_accumulator AS accumulator,
        nvs.population_growth_rate AS popRate,
        nvs.last_raided_ms AS lastRaidedMs,
        nvs.rest_state AS restState,
        nvs.rest_threshold_ms AS restThresholdMs,
        nvs.rest_stockpile_bonus AS restBonus,
        nvs.current_loot_available AS currentLoot,
        nvs.max_loot_capacity AS maxLoot,
        nvs.aggression_level AS aggressionLevel,
        nvs.last_aggression_decay_ms AS lastDecayMs,
        nvs.last_growth_tick_ms AS lastGrowthTickMs,
        nvs.last_troop_regen_ms AS lastTroopRegenMs,
        nvs.needs_tick AS needsTick,
        nvs.building_budget AS buildingBudget,
        nvs.simulation_tier AS simulationTier,
        nvs.next_simulation_due AS nextSimulationDue,
        nvs.revenge_intent_target_village_id AS revengeIntentTarget
      FROM npc_village_state nvs
      JOIN villages v ON v.id = nvs.village_id
      JOIN tiles t ON t.id = v.tile_id
      JOIN players p ON p.id = v.player_id
      JOIN tribe_ids ti ON ti.id = p.tribe_id
      WHERE nvs.needs_tick = 1;
    `,
    schema: z.any(),
  }) as unknown as (BatchVillageRow & {
    simulationTier: number;
    nextSimulationDue: number;
    revengeIntentTarget: number | null;
  })[];

  // ─── Tier assignment and gating ───
  const TIER_INTERVALS: Record<number, number> = {
    1: 60_000, // every tick
    2: 300_000, // every 5 ticks
    3: 3_600_000, // once per real hour
  };

  // Assign tier FIRST, before filtering
  // Scale distance thresholds by mapSize (normalized: thresholds as fraction of map radius)
  const mapRadius = mapSize / 2;
  for (const v of allVillagesRaw) {
    let tier = 2; // default mid-ring

    // Direct distance from (0,0)
    const distFromCenter = Math.sqrt(v.x * v.x + v.y * v.y);
    if (distFromCenter <= mapRadius * 0.25) {
      tier = 1; // within 25% of center = Tier 1
    }

    if (currentTimeMs - v.lastRaidedMs < 3_600_000) {
      tier = 1;
    }
    if (v.revengeIntentTarget !== null) {
      tier = 1;
    }
    if (v.aggressionLevel >= 3) {
      tier = 1;
    }

    // Tier 3: outer edge with no interaction (beyond 70% of map)
    if (v.lastRaidedMs === 0 && v.aggressionLevel === 0) {
      if (distFromCenter > mapRadius * 0.7) {
        tier = 3;
      }
    }

    (v as any).calculatedTier = tier;
  }

  // Filter by next_simulation_due (skip if not yet due)
  const allVillages = allVillagesRaw.filter((v) => {
    if (v.nextSimulationDue > currentTimeMs) {
      return false;
    }
    return true;
  });

  if (allVillages.length === 0) {
    return {
      retaliationsResolved: [],
      villagesGrown: 0,
      troopsRegenerated: 0,
      aggressionChanges: [],
    };
  }

  const villageIds = allVillages.map((v) => v.villageId);

  // ─── Single query: fetch all field levels for NPC villages ───
  const villageIdPlaceholders = villageIds.map((_, i) => `$v${i}`).join(',');
  const villageIdBinds: Record<string, number> = {};
  villageIds.forEach((vid, i) => {
    villageIdBinds[`$v${i}`] = vid;
  });

  const allFieldLevels = db.selectObjects({
    sql: `
      SELECT
        village_id AS villageId,
        field_id AS fieldId,
        level
      FROM building_fields
      WHERE village_id IN (${villageIdPlaceholders});
    `,
    bind: villageIdBinds,
    schema: z.any(),
  }) as unknown as BatchFieldLevelRow[];

  // Pre-compute field level sums per village (used by loot recovery)
  const fieldLevelSums = new Map<number, number>();
  for (const fl of allFieldLevels) {
    fieldLevelSums.set(
      fl.villageId,
      (fieldLevelSums.get(fl.villageId) ?? 0) + fl.level,
    );
  }

  // ─── Single query: fetch all troop data for NPC villages ───
  const allTroops = db.selectObjects({
    sql: `
      SELECT
        v.id AS villageId,
        u.unit AS unitId,
        t.amount,
        t.tile_id AS tileId
      FROM troops t
      JOIN unit_ids u ON u.id = t.unit_id
      JOIN villages v ON v.tile_id = t.source_tile_id
      WHERE v.id IN (${villageIdPlaceholders})
        AND t.amount > 0
        AND t.tile_id = t.source_tile_id;
    `,
    bind: villageIdBinds,
    schema: z.any(),
  }) as unknown as BatchTroopRow[];

  // ─── 4.1 Memory Decay (batched: one DELETE) ───
  processMemoryDecayBatch(db, currentTimeMs, speed);

  // ─── 4.2 Growth Simulation (batched) ───
  const growth = processGrowthBatch(
    db,
    allVillages,
    allFieldLevels,
    chunkMs,
    speed,
    mapSize,
  );

  // ─── 4.2b Build Decisions (batched, after growth) ───
  processBuildDecisions(db, allVillages, allFieldLevels, chunkMs, speed);

  // ─── 4.3 Loot Recovery (batched) ───
  processLootRecoveryBatch(db, allVillages, fieldLevelSums, chunkMs, speed);

  // ─── 4.4 Troop Regeneration (batched) ───
  const regen = processTroopRegenBatch(
    db,
    allVillages,
    allTroops,
    chunkMs,
    speed,
    mapSize,
  );

  // ─── 4.5 Aggression Decay (batched) ───
  const decayResult = processAggressionDecayBatch(
    db,
    allVillages,
    currentTimeMs,
    speed,
  );

  // ─── 4.6 Revenge Intent Resolution (replaces processRetaliations) ───
  const resolvedRetaliations = processRevengeIntentBatch(
    db,
    currentTimeMs,
    speed,
    allTroops,
    allVillages,
  );

  // ─── 4.7 Process queued retaliations from npc_retaliation_queue ───
  const queuedRetaliations = processRetaliations(
    db,
    currentTimeMs,
    worldThreatLevel,
  );
  resolvedRetaliations.push(...queuedRetaliations);

  // ─── Update simulation_tier and next_simulation_due ───
  const tierCaseClauses: string[] = [];
  const dueCaseClauses: string[] = [];
  const tierBind: Record<string, number> = {};

  for (const village of allVillages) {
    const tier = (village as any).calculatedTier ?? 2;
    const due = currentTimeMs + (TIER_INTERVALS[tier] ?? 300_000);
    const vk = `$tv${village.villageId}`;
    const dk = `$td${village.villageId}`;
    tierCaseClauses.push(`WHEN village_id = ${vk} THEN ${tier}`);
    dueCaseClauses.push(`WHEN village_id = ${vk} THEN ${dk}`);
    tierBind[vk] = village.villageId;
    tierBind[dk] = due;
  }

  if (allVillages.length > 0) {
    const villageIdPlaceholders = allVillages
      .map((v) => `$tvid${v.villageId}`)
      .join(',');
    const villageIdBinds: Record<string, number> = {};
    allVillages.forEach((v) => {
      villageIdBinds[`$tvid${v.villageId}`] = v.villageId;
    });

    db.exec({
      sql: `
        UPDATE npc_village_state
        SET
          simulation_tier = CASE
            ${tierCaseClauses.join('\n')}
            ELSE simulation_tier
          END,
          next_simulation_due = CASE
            ${dueCaseClauses.join('\n')}
            ELSE next_simulation_due
          END
        WHERE village_id IN (${villageIdPlaceholders});
      `,
      bind: { ...tierBind, ...villageIdBinds },
    });
  }

  return {
    retaliationsResolved: resolvedRetaliations,
    villagesGrown: growth.fieldsLeveled,
    troopsRegenerated: regen.totalTroopsAdded,
    aggressionChanges: decayResult.changedVillages.map((v) => ({
      villageId: v.villageId,
      factionKey: v.factionKey,
      oldLevel: v.oldLevel,
      newLevel: v.newLevel,
      reason: 'decay',
    })),
  };
};

/**
 * Process revenge intent: resolve armed intents where villages now have enough troops.
 * One query fetches all armed intents. JS checks troop counts. Events created per-village.
 */
const processRevengeIntentBatch = (
  db: DbFacade,
  currentTimeMs: number,
  speed: number,
  allTroops: BatchTroopRow[],
  allVillages: BatchVillageRow[],
): RetaliationResolution[] => {
  const resolutions: RetaliationResolution[] = [];

  // Query all villages with armed revenge intents
  const armedIntents = db.selectObjects({
    sql: `
      SELECT
        nvs.village_id AS villageId,
        nvs.revenge_intent_target_village_id AS targetVillageId,
        nvs.faction_key AS factionKey,
        v.tile_id AS tileId,
        v.name AS villageName,
        t.x,
        t.y
      FROM npc_village_state nvs
      JOIN villages v ON v.id = nvs.village_id
      JOIN tiles t ON t.id = v.tile_id
      WHERE nvs.revenge_intent_target_village_id IS NOT NULL
        AND nvs.revenge_intent_armed_at_ms <= $now;
    `,
    bind: { $now: currentTimeMs },
    schema: z.any(),
  }) as unknown as {
    villageId: number;
    targetVillageId: number;
    factionKey: string;
    tileId: number;
    villageName: string;
    x: number;
    y: number;
  }[];

  if (armedIntents.length === 0) {
    return resolutions;
  }

  const clearedVillageIds: number[] = [];

  for (const intent of armedIntents) {
    // Use pre-fetched troop data instead of re-querying
    const homeTroops = allTroops.filter((t) => t.tileId === intent.tileId);
    const totalUnits = homeTroops.reduce((sum, t) => sum + t.amount, 0);

    if (totalUnits >= NPC_BRAIN_CONSTANTS.MIN_TROOPS_FOR_RETALIATION) {
      const troopMap: Record<string, number> = {};
      for (const troop of homeTroops) {
        troopMap[troop.unitId] = troop.amount;
      }

      // Use pre-fetched village state for aggression level
      const villageState = allVillages.find(
        (v) => v.villageId === intent.villageId,
      );
      const tier = villageState?.aggressionLevel ?? 1;
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
          const executeAtMs = currentTimeMs + travelTimeMs + variance;

          try {
            createEvents<'troopMovementAttack'>(db, {
              type: 'troopMovementAttack',
              villageId: intent.villageId,
              targetId: intent.targetVillageId,
              troops: retaliationTroops as any,
              startsAt: Math.floor(executeAtMs),
            });

            resolutions.push({
              villageId: intent.villageId,
              villageName: intent.villageName,
              factionKey: intent.factionKey as FactionKey,
              tier,
              attackerWins: false,
              attackerTroopsLost: 0,
              defenderTroopsLost: 0,
              timestamp: Math.floor(executeAtMs),
            });
          } catch (_e) {
            // Event creation failed — clear intent to avoid infinite retry
          }
        }
      }

      clearedVillageIds.push(intent.villageId);
    }
    // If not enough troops, leave the intent armed for next tick
  }

  // Batch clear resolved intents
  if (clearedVillageIds.length > 0) {
    const placeholders = clearedVillageIds.map((_, i) => `$v${i}`).join(',');
    const bind: Record<string, number> = {};
    clearedVillageIds.forEach((vid, i) => {
      bind[`$v${i}`] = vid;
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
 * Get the last simulation timestamp from the npc_village_state table.
 */
export const getLastSimulationTimestamp = (db: DbFacade): number => {
  const result = db.selectValue({
    sql: `
      SELECT COALESCE(MAX(last_growth_tick_ms), 0)
      FROM npc_village_state;
    `,
    schema: z.any(),
  });
  return (result as number) ?? 0;
};

/**
 * Update the last simulation timestamp for all NPC villages.
 */
export const setLastSimulationTimestamp = (
  db: DbFacade,
  timestamp: number,
): void => {
  db.exec({
    sql: `
      UPDATE npc_village_state
      SET last_growth_tick_ms = $timestamp,
          last_troop_regen_ms = $timestamp,
          last_aggression_decay_ms = $timestamp;
    `,
    bind: { $timestamp: timestamp },
  });
};
