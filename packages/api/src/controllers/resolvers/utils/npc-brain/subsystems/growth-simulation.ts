import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getFactionProfile } from '../faction-profiles';
import {
  adjustForSpeed,
  calculateMaxLootCapacity,
  getVillageSize,
} from '../helpers';
import type {
  BatchFieldLevelRow,
  BatchVillageRow,
  FactionKey,
} from '../npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';

interface GrowthTickResult {
  villagesGrown: number;
  fieldsLeveled: number;
}

/**
 * Batched growth simulation for all NPC villages.
 * One query fetches all field levels. JavaScript computes level-ups.
 * One batch UPDATE writes all results.
 */
export const processGrowthBatch = (
  db: DbFacade,
  allVillages: BatchVillageRow[],
  allFieldLevels: BatchFieldLevelRow[],
  chunkMs: number,
  speed: number,
  mapSize: number,
): GrowthTickResult => {
  const fieldLevelsByVillage = new Map<number, BatchFieldLevelRow[]>();
  for (const fl of allFieldLevels) {
    let arr = fieldLevelsByVillage.get(fl.villageId);
    if (!arr) {
      arr = [];
      fieldLevelsByVillage.set(fl.villageId, arr);
    }
    arr.push(fl);
  }

  const now = Date.now();
  const fieldUpdates: {
    villageId: number;
    fieldId: number;
    newLevel: number;
  }[] = [];
  const stateUpdates: {
    villageId: number;
    accumulator: number;
    maxLoot: number;
    popRate: number;
  }[] = [];
  let totalFieldsLeveled = 0;

  for (const village of allVillages) {
    const profile = getFactionProfile(village.factionKey as FactionKey);
    const fields = fieldLevelsByVillage.get(village.villageId) ?? [];

    // ─── Field Level Growth ───
    const growthHours =
      NPC_BRAIN_CONSTANTS.BASE_GROWTH_HOURS / profile.growthRateMultiplier;
    const growthCycleMs = adjustForSpeed(growthHours * 3_600_000, speed);
    const growthIncrement = chunkMs / growthCycleMs;

    let newAccumulator = village.accumulator + growthIncrement;
    let _fieldsLeveled = 0;

    // Sort fields by level ascending, then fieldId ascending
    const sortedFields = [...fields]
      .filter((f) => f.fieldId <= 18)
      .sort((a, b) => a.level - b.level || a.fieldId - b.fieldId);

    while (newAccumulator >= 1.0) {
      newAccumulator -= 1.0;
      // Find the lowest-level field that isn't at max
      const fieldToLevel = sortedFields.find(
        (f) => f.level < NPC_BRAIN_CONSTANTS.NPC_MAX_FIELD_LEVEL,
      );
      if (fieldToLevel) {
        fieldToLevel.level += 1;
        fieldUpdates.push({
          villageId: village.villageId,
          fieldId: fieldToLevel.fieldId,
          newLevel: fieldToLevel.level,
        });
        _fieldsLeveled++;
        totalFieldsLeveled++;
      } else {
        newAccumulator = 0;
        break;
      }
    }

    // ─── Population Growth ───
    const elapsedHours = chunkMs / 3_600_000;
    const populationToAdd = Math.floor(elapsedHours * village.popRate * speed);

    if (populationToAdd > 0) {
      const fieldLevelSum = sortedFields.reduce((sum, f) => sum + f.level, 0);
      const _populationCap =
        fieldLevelSum * NPC_BRAIN_CONSTANTS.POPULATION_CAP_PER_FIELD_LEVEL;

      // Get current population from the village (already fetched in batch or we can batch this too)
      // For now, we'll do a single query for all village populations
      // This is handled in the caller
    }

    // ─── Compute new max loot capacity ───
    const newFieldLevelSum = sortedFields.reduce((sum, f) => sum + f.level, 0);
    const villageSize = getVillageSize(mapSize, village.x, village.y);
    const newMaxLootCapacity = calculateMaxLootCapacity(
      newFieldLevelSum,
      villageSize,
    );

    stateUpdates.push({
      villageId: village.villageId,
      accumulator: newAccumulator,
      maxLoot: newMaxLootCapacity,
      popRate: village.popRate,
    });
  }

  // ─── Batch UPDATE field levels ───
  if (fieldUpdates.length > 0) {
    const villageIds = [...new Set(fieldUpdates.map((u) => u.villageId))];
    let caseIdx = 0;
    const caseClauses: string[] = [];
    const bind: Record<string, number> = {};

    for (const vid of villageIds) {
      const updates = fieldUpdates.filter((u) => u.villageId === vid);
      for (const update of updates) {
        const vk = `$v${caseIdx}`;
        const fk = `$f${caseIdx}`;
        const lk = `$l${caseIdx}`;
        caseClauses.push(
          `WHEN village_id = ${vk} AND field_id = ${fk} THEN ${lk}`,
        );
        bind[vk] = vid;
        bind[fk] = update.fieldId;
        bind[lk] = update.newLevel;
        caseIdx++;
      }
    }

    const villageIdPlaceholders = villageIds
      .map((_, i) => `$vid${i}`)
      .join(',');
    const villageIdBinds: Record<string, number> = {};
    villageIds.forEach((vid, i) => {
      villageIdBinds[`$vid${i}`] = vid;
    });

    db.exec({
      sql: `
        UPDATE building_fields
        SET level = CASE
          ${caseClauses.join('\n')}
          ELSE level
        END
        WHERE village_id IN (${villageIdPlaceholders})
          AND field_id <= 18;
      `,
      bind: { ...bind, ...villageIdBinds },
    });
  }

  // ─── Batch UPDATE npc_village_state ───
  if (stateUpdates.length > 0) {
    const accumulatorCase: string[] = [];
    const maxLootCase: string[] = [];
    const bind: Record<string, number> = {};

    stateUpdates.forEach((u, i) => {
      const vk = `$v${i}`;
      const ak = `$a${i}`;
      const mk = `$m${i}`;
      accumulatorCase.push(`WHEN village_id = ${vk} THEN ${ak}`);
      maxLootCase.push(`WHEN village_id = ${vk} THEN ${mk}`);
      bind[vk] = u.villageId;
      bind[ak] = u.accumulator;
      bind[mk] = u.maxLoot;
    });

    const villageIdPlaceholders = stateUpdates
      .map((_, i) => `$vid${i}`)
      .join(',');
    const villageIdBinds: Record<string, number> = {};
    stateUpdates.forEach((u, i) => {
      villageIdBinds[`$vid${i}`] = u.villageId;
    });

    db.exec({
      sql: `
        UPDATE npc_village_state
        SET
          field_growth_accumulator = CASE
            ${accumulatorCase.join('\n')}
            ELSE field_growth_accumulator
          END,
          max_loot_capacity = CASE
            ${maxLootCase.join('\n')}
            ELSE max_loot_capacity
          END,
          last_growth_tick_ms = $now
        WHERE village_id IN (${villageIdPlaceholders});
      `,
      bind: { ...bind, ...villageIdBinds, $now: now },
    });
  }

  return {
    villagesGrown: totalFieldsLeveled,
    fieldsLeveled: totalFieldsLeveled,
  };
};
