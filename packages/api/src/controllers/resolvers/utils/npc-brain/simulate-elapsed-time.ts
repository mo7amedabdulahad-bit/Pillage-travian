import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getAllNPCVillages, getGameSpeed } from './helpers';
import type {
  AggressionChange,
  FactionKey,
  RetaliationResolution,
  SimulationResult,
} from './npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from './npc-brain-types';
import { buildOfflineSummary } from './offline-summary';
import { processAggressionDecay } from './subsystems/aggression-escalation';
import { processGrowth } from './subsystems/growth-simulation';
import { processLootRecovery } from './subsystems/loot-recovery';
import { processMemoryDecay } from './subsystems/memory-decay';
import { processRetaliations } from './subsystems/retaliation-execution';
import { processTroopRegen } from './subsystems/troop-regeneration';
import { calculateWorldThreatLevel } from './world-threat-level';

/**
 * Master NPC Brain Simulation (Section 6)
 *
 * Called ONCE at app open with total elapsed milliseconds since last save.
 * Fast-forwards ALL NPC state as if time had passed in real time.
 *
 * Game design intent: Processing in chunks of 1 simulated hour prevents
 * floating-point drift and ensures consistent behavior regardless of
 * offline duration. Yielding to the event loop every 10 chunks prevents
 * freezing the UI during long offline periods.
 */
export const simulateElapsedTime = async (
  db: DbFacade,
  elapsedMs: number,
): Promise<SimulationResult> => {
  const speed = getGameSpeed(db);
  const chunkMs = NPC_BRAIN_CONSTANTS.SIMULATION_CHUNK_MS / speed;
  const totalChunks = Math.floor(elapsedMs / chunkMs);
  const remainder = elapsedMs % chunkMs;

  const allRetaliations: RetaliationResolution[] = [];
  const allAggressionChanges: AggressionChange[] = [];
  let totalVillagesGrown = 0;
  let totalTroopsRegenerated = 0;

  // Process in chunks
  for (let i = 0; i < totalChunks; i++) {
    const result = processNPCTick(db, chunkMs, speed);
    allRetaliations.push(...result.retaliationsResolved);
    allAggressionChanges.push(...result.aggressionChanges);
    totalVillagesGrown += result.villagesGrown;
    totalTroopsRegenerated += result.troopsRegenerated;

    // Yield to event loop every N chunks
    if (i % NPC_BRAIN_CONSTANTS.YIELD_EVERY_N_CHUNKS === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // Process remainder
  if (remainder > 0) {
    const result = processNPCTick(db, remainder, speed);
    allRetaliations.push(...result.retaliationsResolved);
    allAggressionChanges.push(...result.aggressionChanges);
    totalVillagesGrown += result.villagesGrown;
    totalTroopsRegenerated += result.troopsRegenerated;
  }

  // Build offline summary
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
  const npcVillages = getAllNPCVillages(db);
  const worldThreatLevel = calculateWorldThreatLevel(db);

  const retaliations: RetaliationResolution[] = [];
  const aggressionChanges: AggressionChange[] = [];
  let villagesGrown = 0;
  let troopsRegenerated = 0;

  for (const village of npcVillages) {
    const factionKey = village.factionKey as FactionKey;

    // 4.1 — Memory Decay
    processMemoryDecay(db, village.villageId, factionKey, currentTimeMs, speed);

    // 4.2 — Growth Simulation
    const growth = processGrowth(
      db,
      village.villageId,
      village.tileId,
      factionKey,
      chunkMs,
      speed,
    );
    if (growth.fieldsLeveled > 0) {
      villagesGrown += growth.fieldsLeveled;
    }

    // 4.3 — Loot Recovery
    processLootRecovery(db, village.villageId, factionKey, chunkMs, speed);

    // 4.4 — Troop Regeneration
    const tribe = getVillageTribe(db, village.villageId);
    if (tribe) {
      const regen = processTroopRegen(
        db,
        village.villageId,
        village.tileId,
        factionKey,
        tribe,
        chunkMs,
        speed,
      );
      troopsRegenerated += regen.totalTroopsAdded;
    }

    // 4.5 — Aggression Decay
    const decayed = processAggressionDecay(
      db,
      village.villageId,
      factionKey,
      currentTimeMs,
      speed,
    );
    if (decayed) {
      const newLevel =
        db.selectValue({
          sql: 'SELECT aggression_level FROM npc_village_state WHERE village_id = $villageId;',
          bind: { $villageId: village.villageId },
          schema: z.number(),
        }) ?? 0;
      aggressionChanges.push({
        villageId: village.villageId,
        factionKey,
        oldLevel: newLevel + 1,
        newLevel,
        reason: 'decay',
      });
    }
  }

  // 4.6 — Retaliation Execution
  const resolvedRetaliations = processRetaliations(
    db,
    currentTimeMs,
    worldThreatLevel,
  );
  retaliations.push(...resolvedRetaliations);

  return {
    retaliationsResolved: retaliations,
    villagesGrown,
    troopsRegenerated,
    aggressionChanges,
  };
};

/**
 * Get the tribe of a village.
 */
const getVillageTribe = (db: DbFacade, villageId: number): string | null => {
  const result = db.selectObject({
    sql: `
      SELECT ti.tribe
      FROM villages v
      JOIN players p ON p.id = v.player_id
      JOIN tribe_ids ti ON ti.id = p.tribe_id
      WHERE v.id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.object({ tribe: z.string() }),
  });
  return result?.tribe ?? null;
};

/**
 * Get the last simulation timestamp from the npc_village_state table.
 * Uses the maximum last_growth_tick_ms across all villages.
 */
export const getLastSimulationTimestamp = (db: DbFacade): number => {
  const result = db.selectValue({
    sql: `
      SELECT COALESCE(MAX(last_growth_tick_ms), 0)
      FROM npc_village_state;
    `,
    schema: z.number(),
  });
  return result ?? 0;
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
          last_aggression_decay_ms = $timestamp
      WHERE last_growth_tick_ms = 0;
    `,
    bind: { $timestamp: timestamp },
  });
};
