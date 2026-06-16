import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { FACTION_PROFILES, getFactionProfile } from '../faction-profiles';
import {
  adjustForSpeed,
  getAllNPCVillages,
  getGameSpeed,
  getPlayerVillageCoords,
  mapDistance,
  scaleTroops,
} from '../helpers';
import type { BatchVillageRow, FactionKey } from '../npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';
import { getRaidCount } from './memory-decay';
import { getHomeTroops } from './troop-regeneration';

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

  if (raidCount < profile.retaliationThreshold) {
    return 0;
  }

  const newTier = Math.min(
    5,
    Math.floor(raidCount / profile.retaliationThreshold),
  );

  const currentState = db.selectObject({
    sql: `
      SELECT aggression_level AS level
      FROM npc_village_state
      WHERE village_id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.any(),
  }) as { level: number } | undefined;

  const currentLevel = currentState?.level ?? 0;
  const effectiveTier = Math.max(currentLevel, newTier);

  try {
    db.exec({
      sql: `
        UPDATE npc_village_state
        SET aggression_level = $tier
        WHERE village_id = $villageId;
      `,
      bind: { $tier: effectiveTier, $villageId: villageId },
    });
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: NPC brain error logging is intentional
    console.warn(
      `[NPC Brain] Failed to update aggression for village ${villageId}:`,
      e,
    );
  }

  const gameSpeed = getGameSpeed(db);
  scheduleRetaliation(db, villageId, factionKey, effectiveTier, gameSpeed);

  if (effectiveTier >= 4) {
    callRegionalReinforcements(db, villageId, factionKey, effectiveTier);
  }

  return effectiveTier;
};

/**
 * Schedule a retaliation attack from an NPC village.
 */
const scheduleRetaliation = (
  db: DbFacade,
  villageId: number,
  factionKey: FactionKey,
  tier: number,
  speed?: number,
): void => {
  const troopPercentage =
    NPC_BRAIN_CONSTANTS.AGGRESSION_TROOP_PERCENTAGES[tier];

  if (troopPercentage <= 0) {
    return;
  }

  const villageInfo = db.selectObject({
    sql: `
      SELECT v.tile_id, t.x, t.y
      FROM villages v
      JOIN tiles t ON t.id = v.tile_id
      WHERE v.id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.any(),
  }) as { tileId: number; x: number; y: number } | undefined;

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

  const slowestSpeed = 3;
  const gameSpeed = speed ?? getGameSpeed(db);
  const travelTimeMs = Math.ceil(
    (distance / (slowestSpeed * gameSpeed)) * 3_600_000,
  );

  const variance =
    (Math.random() * 2 * NPC_BRAIN_CONSTANTS.RETALIATION_VARIANCE -
      NPC_BRAIN_CONSTANTS.RETALIATION_VARIANCE) *
    travelTimeMs;
  const executeAtMs = Date.now() + travelTimeMs + variance;

  const homeTroops = getHomeTroops(db, villageInfo.tileId);
  const totalUnits = homeTroops.reduce((sum, t) => sum + t.amount, 0);

  if (totalUnits < NPC_BRAIN_CONSTANTS.MIN_TROOPS_FOR_RETALIATION) {
    return;
  }

  const troopMap: Record<string, number> = {};
  for (const troop of homeTroops) {
    troopMap[troop.unitId] = troop.amount;
  }

  const retaliationTroops = scaleTroops(troopMap, troopPercentage);

  if (Object.keys(retaliationTroops).length === 0) {
    return;
  }

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
        $troopsJson: JSON.stringify(retaliationTroops),
      },
    });
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: NPC brain error logging is intentional
    console.warn(
      `[NPC Brain] Failed to queue retaliation for village ${villageId}:`,
      e,
    );
  }
};

/**
 * Call regional reinforcements from nearby same-faction villages.
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
    });

  if (neighbors.length === 0) {
    return;
  }

  const gameSpeed = getGameSpeed(db);

  // Batch query aggression levels for all neighbors
  const neighborIds = neighbors.map((v) => v.villageId);
  const neighborPlaceholders = neighborIds.map((_, i) => `$nv${i}`).join(',');
  const neighborBinds: Record<string, number> = {};
  neighborIds.forEach((nid, i) => {
    neighborBinds[`$nv${i}`] = nid;
  });

  const aggressionLevels = db.selectObjects({
    sql: `
      SELECT village_id AS villageId, aggression_level AS level
      FROM npc_village_state
      WHERE village_id IN (${neighborPlaceholders});
    `,
    bind: neighborBinds,
    schema: z.any(),
  }) as { villageId: number; level: number }[];

  const aggressionMap = new Map(
    aggressionLevels.map((r) => [r.villageId, r.level]),
  );

  const lowAggressionNeighbors = neighbors.filter((v) => {
    return (aggressionMap.get(v.villageId) ?? 0) < 3;
  });

  for (const neighbor of lowAggressionNeighbors) {
    db.exec({
      sql: `
        UPDATE npc_village_state
        SET aggression_level = MAX(aggression_level, 2),
            regional_alert_active = 1
        WHERE village_id = $villageId;
      `,
      bind: { $villageId: neighbor.villageId },
    });

    scheduleRetaliation(db, neighbor.villageId, factionKey, 2, gameSpeed);
  }
};

/**
 * Batched aggression decay for all NPC villages.
 * One UPDATE with CASE expression handles all villages at once.
 */
export const processAggressionDecayBatch = (
  db: DbFacade,
  allVillages: BatchVillageRow[],
  currentTimeMs: number,
  speed: number,
): {
  changedVillages: {
    villageId: number;
    factionKey: FactionKey;
    oldLevel: number;
    newLevel: number;
  }[];
} => {
  const changedVillages: {
    villageId: number;
    factionKey: FactionKey;
    oldLevel: number;
    newLevel: number;
  }[] = [];

  // Only process non-permanent factions
  const nonPermanentFactions = Object.values(FACTION_PROFILES)
    .filter((p) => !p.isAggressionPermanent)
    .map((p) => p.key);

  if (nonPermanentFactions.length === 0) {
    return { changedVillages };
  }

  // Filter to villages that need decay
  const decayCandidates: BatchVillageRow[] = [];
  for (const village of allVillages) {
    if (
      village.aggressionLevel > 0 &&
      nonPermanentFactions.includes(village.factionKey as FactionKey)
    ) {
      const profile = FACTION_PROFILES[village.factionKey as FactionKey];
      if (profile.aggressionDecayDays !== null) {
        const decayThresholdMs = adjustForSpeed(
          profile.aggressionDecayDays * 86_400_000,
          speed,
        );
        const timeSinceLastRaid = currentTimeMs - village.lastRaidedMs;
        if (timeSinceLastRaid > decayThresholdMs) {
          decayCandidates.push(village);
        }
      }
    }
  }

  if (decayCandidates.length === 0) {
    return { changedVillages };
  }

  // Build batch UPDATE
  const caseClauses: string[] = [];
  const bind: Record<string, number> = {};

  for (const village of decayCandidates) {
    const newLevel = Math.max(0, village.aggressionLevel - 1);
    const idx = decayCandidates.indexOf(village);
    const vk = `$dc${idx}`;
    const nk = `$dn${idx}`;
    caseClauses.push(`WHEN village_id = ${vk} THEN ${nk}`);
    bind[vk] = village.villageId;
    bind[nk] = newLevel;

    changedVillages.push({
      villageId: village.villageId,
      factionKey: village.factionKey as FactionKey,
      oldLevel: village.aggressionLevel,
      newLevel,
    });
  }

  const villageIdPlaceholders = decayCandidates
    .map((_, i) => `$v${i}`)
    .join(',');
  const villageIdBinds: Record<string, number> = {};
  decayCandidates.forEach((v, i) => {
    villageIdBinds[`$v${i}`] = v.villageId;
  });

  db.exec({
    sql: `
      UPDATE npc_village_state
      SET
        aggression_level = CASE
          ${caseClauses.join('\n')}
          ELSE aggression_level
        END,
        last_aggression_decay_ms = $now
      WHERE village_id IN (${villageIdPlaceholders});
    `,
    bind: { ...bind, ...villageIdBinds, $now: currentTimeMs },
  });

  // Clear retaliation queue and regional alert for villages that dropped to 0
  const zeroVillages = changedVillages.filter((v) => v.newLevel === 0);
  if (zeroVillages.length > 0) {
    const zeroPlaceholders = zeroVillages.map((_, i) => `$zv${i}`).join(',');
    const zeroBinds: Record<string, number> = {};
    zeroVillages.forEach((v, i) => {
      zeroBinds[`$zv${i}`] = v.villageId;
    });

    db.exec({
      sql: `
        DELETE FROM npc_retaliation_queue
        WHERE village_id IN (${zeroPlaceholders});
      `,
      bind: zeroBinds,
    });

    db.exec({
      sql: `
        UPDATE npc_village_state
        SET regional_alert_active = 0
        WHERE village_id IN (${zeroPlaceholders});
      `,
      bind: zeroBinds,
    });
  }

  return { changedVillages };
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
    schema: z.any(),
  });
  return (result as number) ?? 0;
};
