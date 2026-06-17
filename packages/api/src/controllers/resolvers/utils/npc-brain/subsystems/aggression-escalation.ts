import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { FACTION_PROFILES } from '../faction-profiles';
import { adjustForSpeed } from '../helpers';
import type { BatchVillageRow, FactionKey } from '../npc-brain-types';

/**
 * Aggression Decay Subsystem
 *
 * Handles batched aggression decay for all NPC villages.
 * The escalation logic (calculateAggressionResponse, scheduleRetaliation,
 * callRegionalReinforcements) has moved to reputation-impact.ts and
 * retaliation-execution.ts as part of the unified retaliation pipeline.
 */

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
