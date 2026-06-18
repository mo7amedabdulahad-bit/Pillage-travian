import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getGameSpeed, getMapSize } from './helpers';
import type {
  BatchFieldLevelRow,
  BatchVillageRow,
  ReconciliationResult,
  SimulationResult,
} from './npc-brain-types';
import { buildOfflineSummary } from './offline-summary';
import { processAggressionDecayBatch } from './subsystems/aggression-escalation';
import { processBuildDecisions } from './subsystems/build-simulation';
import { processGrowthBatch } from './subsystems/growth-simulation';
import { processMemoryDecayBatch } from './subsystems/memory-decay';
import { processDueRetaliations } from './subsystems/retaliation-execution';
import { calculateWorldThreatLevel } from './world-threat-level';

// Flat real-time cap: 3 real days of offline catch-up (regardless of game speed)
const MAX_OFFLINE_REAL_MS = 72 * 3_600_000;

/**
 * Single-pass NPC Brain reconciliation.
 *
 * Replaces the old chunk-loop architecture. Runs each subsystem ONCE with the
 * full elapsed time instead of N times with small chunks. Subsystems use
 * formula-driven math internally (accumulators, while-loops for multi-build)
 * so the result is identical but dramatically faster.
 *
 * Performance: ~15 queries total regardless of elapsed time, vs old
 * ~15 queries × N chunks (50–720 chunks).
 *
 * @param maxBuilds - Max build actions per village per pass.
 *   Use 20 for offline reconciliation, 3 for live tick.
 */
export const reconcileNpcBrain = (
  db: DbFacade,
  elapsedMs: number,
  speed: number,
  maxBuilds = 20,
): ReconciliationResult => {
  const now = Date.now();

  // ─── Initialize first-ever timestamps ───
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

  // ─── Cache shared values ───
  const mapSize = getMapSize(db);
  const worldThreatLevel = calculateWorldThreatLevel(db);

  // ─── Bulk fetch: all NPC village states + coordinates + tribe ───
  const allVillages = db.selectObjects({
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
        nvs.loot_at_last_raid AS lootAtLastRaid,
        nvs.max_loot_capacity AS maxLoot,
        nvs.aggression_level AS aggressionLevel,
        nvs.last_aggression_decay_ms AS lastDecayMs,
        nvs.last_growth_tick_ms AS lastGrowthTickMs,
        nvs.last_troop_regen_ms AS lastTroopRegenMs,
        nvs.building_budget AS buildingBudget,
        nvs.next_build_check_ms AS nextBuildCheckMs
      FROM npc_village_state nvs
      JOIN villages v ON v.id = nvs.village_id
      JOIN tiles t ON t.id = v.tile_id
      JOIN players p ON p.id = v.player_id
      LEFT JOIN tribe_ids ti ON ti.id = p.tribe_id;
    `,
    schema: z.any(),
  }) as unknown as BatchVillageRow[];

  if (allVillages.length === 0) {
    return {
      retaliationsResolved: [],
      villagesGrown: 0,
      troopsRegenerated: 0,
      aggressionChanges: [],
    };
  }

  const villageIds = allVillages.map((v) => v.villageId);
  const villageIdPlaceholders = villageIds.map((_, i) => `$v${i}`).join(',');
  const villageIdBinds: Record<string, number> = {};
  villageIds.forEach((vid, i) => {
    villageIdBinds[`$v${i}`] = vid;
  });

  // ─── Bulk fetch: all field levels ───
  const allFieldLevels = db.selectObjects({
    sql: `
      SELECT village_id AS villageId, field_id AS fieldId, level
      FROM building_fields
      WHERE village_id IN (${villageIdPlaceholders});
    `,
    bind: villageIdBinds,
    schema: z.any(),
  }) as unknown as BatchFieldLevelRow[];

  // ─── 1. Memory Decay (one DELETE) ───
  processMemoryDecayBatch(db, now, speed);

  // ─── 2. Growth Simulation (one SELECT + one UPDATE) ───
  const growth = processGrowthBatch(
    db,
    allVillages,
    allFieldLevels,
    elapsedMs,
    speed,
    mapSize,
  );

  // ─── 3. Build Decisions (supports multiple upgrades per village) ───
  // Offline: process all villages. Live: process up to 50 due villages.
  const buildBatchSize = maxBuilds >= 20 ? Number.POSITIVE_INFINITY : 50;
  processBuildDecisions(
    db,
    allVillages,
    allFieldLevels,
    elapsedMs,
    speed,
    maxBuilds,
    buildBatchSize,
  );

  // ─── 4. Aggression Decay ───
  const decayResult = processAggressionDecayBatch(db, allVillages, now, speed);

  // ─── 5. Process all due retaliations (unified queue + revenge intents) ───
  const resolvedRetaliations = processDueRetaliations(
    db,
    now,
    speed,
    worldThreatLevel,
  );

  return {
    retaliationsResolved: resolvedRetaliations,
    villagesGrown: growth.fieldsLeveled,
    troopsRegenerated: 0,
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
 * Full offline simulation: reconcile + build summary.
 *
 * Called ONCE at app open with total elapsed milliseconds since last save.
 * Fast-forwards ALL NPC state in a single pass.
 */
export const simulateElapsedTime = async (
  db: DbFacade,
  elapsedMs: number,
  onProgress?: (fraction: number) => void,
): Promise<SimulationResult> => {
  const speed = getGameSpeed(db);
  // Cap at 3 real days regardless of game speed
  const cappedElapsedMs = Math.min(elapsedMs, MAX_OFFLINE_REAL_MS);

  const result = reconcileNpcBrain(db, cappedElapsedMs, speed, 20);

  onProgress?.(1);

  const offlineSummary = buildOfflineSummary(
    db,
    {
      retaliationsResolved: result.retaliationsResolved,
      villagesGrown: result.villagesGrown,
      troopsRegenerated: result.troopsRegenerated,
      aggressionChanges: result.aggressionChanges,
    },
    cappedElapsedMs,
  );

  return {
    ...result,
    offlineSummary,
  };
};

/**
 * Live tick: lightweight single-pass reconciliation for a short interval.
 *
 * Advances NPC state by a small elapsed window (typically 60s) with a
 * reduced build cap suitable for live play. Processes due retaliations inline.
 *
 * @param elapsedMs - Real milliseconds since last live tick.
 * @param maxBuilds - Max build actions per village per tick (default 3).
 */
export const processNPCTick = (
  db: DbFacade,
  elapsedMs: number,
  speed: number,
  maxBuilds = 3,
): ReconciliationResult => {
  return reconcileNpcBrain(db, elapsedMs, speed, maxBuilds);
};

/**
 * Get the last simulation timestamp from the npc_village_state table.
 */
export const getLastSimulationTimestamp = (db: DbFacade): number => {
  const result = db.selectValue({
    sql: 'SELECT COALESCE(MAX(last_growth_tick_ms), 0) FROM npc_village_state;',
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
