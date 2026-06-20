import { z } from 'zod';
import {
  getBuildingDataForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import type { BuildingId } from '@pillage-first/types/models/building';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  updateBuildingEffectQuery,
  updatePopulationEffectQuery,
} from '../../../../../utils/queries/effect-queries';
import {
  type BuildPriorityEntry,
  FACTION_BUILD_PRIORITIES,
  FACTION_SPENDING_RATE,
} from '../faction-build-priorities';
import {
  calculateMaxLootCapacityFromBuildings,
  getMapSize,
  getPlayerVillageCoords,
  mapDistance,
} from '../helpers';
import type {
  BatchFieldLevelRow,
  BatchVillageRow,
  FactionKey,
} from '../npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';
import { calculateCurrentLoot } from './loot-recovery';

interface BuildResult {
  villagesBuilt: number;
}

/**
 * Map 'WALL' to tribe-specific wall building ID.
 */
const TRIBE_WALL_MAP: Record<string, BuildingId> = {
  romans: 'ROMAN_WALL',
  teutons: 'TEUTONIC_WALL',
  gauls: 'GAUL_WALL',
  egyptians: 'EGYPTIAN_WALL',
  huns: 'HUN_WALL',
  spartans: 'SPARTAN_WALL',
  natars: 'NATAR_WALL',
};

/**
 * Process build decisions for NPC villages.
 * Evaluates conditional overrides, picks from faction priority script,
 * applies multiple builds per tick if budget allows.
 * After warehouse/granary upgrades, recalculates max_loot_capacity.
 *
 * Uses a rotating priority queue: only villages whose next_build_check_ms <= now
 * are processed, up to batchSize villages. After processing, each village's
 * next_build_check_ms is updated based on what happened.
 *
 * @param batchSize - Max villages to process per call. Use 50 for live tick, Infinity for offline.
 */
export const processBuildDecisions = (
  db: DbFacade,
  allVillages: BatchVillageRow[],
  allFieldLevels: BatchFieldLevelRow[],
  elapsedMs: number,
  speed: number,
  maxBuildsPerVillage = 20,
  batchSize = Number.POSITIVE_INFINITY,
): BuildResult => {
  const now = Date.now();

  // Schedule delay helper: divide by speed so villages cycle faster at higher speeds
  const scheduleDelay = (baseMs: number) =>
    Math.max(10_000, Math.round(baseMs / speed));

  // Proximity helper: nearby villages get re-checked sooner
  const proximityMultiplier = (dist: number, maxDist: number): number => {
    const ratio = dist / maxDist;
    if (ratio <= 0.2) {
      return 0.25;
    }
    if (ratio <= 0.5) {
      return 0.5;
    }
    return 1.0;
  };

  // Player coords for proximity sorting (live tick only)
  const isLiveTick = batchSize !== Number.POSITIVE_INFINITY;
  const playerCoords = isLiveTick
    ? (getPlayerVillageCoords(db) ?? { x: 0, y: 0 })
    : { x: 0, y: 0 };
  const mapSize = isLiveTick ? getMapSize(db) : 400;
  const MAX_DIST = mapSize / 2;

  // Filter to villages due for a build check, sorted by composite score (overdue + proximity)
  const dueVillages = (
    batchSize === Number.POSITIVE_INFINITY
      ? allVillages
      : allVillages
          .filter((v) => v.nextBuildCheckMs <= now)
          .sort((a, b) => {
            const overdueA = now - a.nextBuildCheckMs;
            const overdueB = now - b.nextBuildCheckMs;
            const distA = mapDistance({ x: a.x, y: a.y }, playerCoords);
            const distB = mapDistance({ x: b.x, y: b.y }, playerCoords);
            const overdueScoreA = Math.min(1, overdueA / (30 * 60_000));
            const overdueScoreB = Math.min(1, overdueB / (30 * 60_000));
            const proxScoreA = 1 - Math.min(1, distA / MAX_DIST);
            const proxScoreB = 1 - Math.min(1, distB / MAX_DIST);
            const compositeA = overdueScoreA * 0.5 + proxScoreA * 0.5;
            const compositeB = overdueScoreB * 0.5 + proxScoreB * 0.5;
            return compositeB - compositeA;
          })
  ).slice(0, batchSize === Number.POSITIVE_INFINITY ? undefined : batchSize);

  // Fetch building key mapping
  const buildingIdRows = db.selectObjects({
    sql: 'SELECT id, building FROM building_ids',
    schema: z.any(),
  }) as unknown as { id: number; building: string }[];

  const buildingKeyToId = new Map<string, number>();
  const buildingIdToKey = new Map<number, string>();
  for (const row of buildingIdRows) {
    buildingKeyToId.set(row.building.toUpperCase(), row.id);
    buildingIdToKey.set(row.id, row.building.toUpperCase());
  }

  // Fetch actual building levels for all NPC villages (non-resource-field buildings)
  const allBuildingLevels = db.selectObjects({
    sql: `
      SELECT
        bf.village_id AS villageId,
        bf.field_id AS fieldId,
        bi.building AS buildingKey,
        bf.level
      FROM building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
      JOIN villages v ON v.id = bf.village_id
      WHERE v.player_id != 1
        AND bf.field_id > 18;
    `,
    schema: z.any(),
  }) as unknown as {
    villageId: number;
    fieldId: number;
    buildingKey: string;
    level: number;
  }[];

  // Index: villageId -> buildingKey -> { level, fieldId }
  const buildingIndex = new Map<
    number,
    Map<string, { level: number; fieldId: number }>
  >();
  for (const bl of allBuildingLevels) {
    let villageMap = buildingIndex.get(bl.villageId);
    if (!villageMap) {
      villageMap = new Map();
      buildingIndex.set(bl.villageId, villageMap);
    }
    villageMap.set(bl.buildingKey.toUpperCase(), {
      level: bl.level,
      fieldId: bl.fieldId,
    });
  }

  // Index resource field sums
  const resourceFieldSumByVillage = new Map<number, number>();
  for (const fl of allFieldLevels) {
    if (fl.fieldId <= 18) {
      resourceFieldSumByVillage.set(
        fl.villageId,
        (resourceFieldSumByVillage.get(fl.villageId) ?? 0) + fl.level,
      );
    }
  }

  const buildUpdates: {
    villageId: number;
    fieldId: number;
    buildingId: number;
    buildingKey: string;
    previousLevel: number;
    newLevel: number;
  }[] = [];
  const lootCapacityUpdates: { villageId: number; newMaxLoot: number }[] = [];
  const budgetUpdates: { villageId: number; remaining: number }[] = [];
  const scheduleUpdates: { villageId: number; nextCheckMs: number }[] = [];
  let totalBuilt = 0;

  for (const village of dueVillages) {
    // Proximity distance for this village (used for schedule multiplier)
    const villageDist = isLiveTick
      ? mapDistance({ x: village.x, y: village.y }, playerCoords)
      : 0;
    const pMult = isLiveTick ? proximityMultiplier(villageDist, MAX_DIST) : 1;

    // ─── Alert state check: villages recently raided skip building ───
    // Alert duration scales with server speed — at x10, 2 game-hours = 12 real minutes
    if (
      village.lastRaidedMs > 0 &&
      now - village.lastRaidedMs < NPC_BRAIN_CONSTANTS.ALERT_DURATION_MS / speed
    ) {
      // In alert state — skip building, re-check soon (shorter for nearby villages)
      scheduleUpdates.push({
        villageId: village.villageId,
        nextCheckMs: now + Math.round(scheduleDelay(5 * 60_000) * pMult),
      });
      continue;
    }

    const factionKey = village.factionKey as FactionKey;
    const factionPriorities = FACTION_BUILD_PRIORITIES[factionKey];
    if (!factionPriorities) {
      continue;
    }

    const spendingRate = FACTION_SPENDING_RATE[factionKey] ?? 0.8;
    const villageBuildings = buildingIndex.get(village.villageId) ?? new Map();

    // Calculate economy budget — accumulate across ticks
    const fieldSum = resourceFieldSumByVillage.get(village.villageId) ?? 0;
    const productionPerHour = fieldSum * 10;
    const tickFraction = elapsedMs / 3_600_000;
    const tickProduction =
      productionPerHour * tickFraction * spendingRate * speed;
    let remainingBudget = village.buildingBudget + tickProduction;
    let buildsThisTick = 0;

    // Conditional overrides
    const overrides: BuildPriorityEntry[] = [];

    // Use computed current loot (not stale post-raid value) for storage urgency
    const resourceFieldSum =
      resourceFieldSumByVillage.get(village.villageId) ?? 0;
    const computedLoot = calculateCurrentLoot(
      village.lootAtLastRaid,
      village.lastRaidedMs,
      village.maxLoot,
      resourceFieldSum,
      speed,
    );

    if (computedLoot >= 0.9) {
      overrides.push(
        { buildingId: 'WAREHOUSE', maxLevel: 20, priority: 'mandatory' },
        { buildingId: 'GRANARY', maxLevel: 20, priority: 'mandatory' },
      );
    }

    const twoHoursMs = 2 * 3_600_000;
    if (now - village.lastRaidedMs < twoHoursMs) {
      overrides.push(
        { buildingId: 'WALL', maxLevel: 20, priority: 'high' },
        { buildingId: 'BARRACKS', maxLevel: 15, priority: 'high' },
      );
    }

    const buildQueue = [...overrides, ...factionPriorities];

    for (const entry of buildQueue) {
      if (buildsThisTick >= maxBuildsPerVillage) {
        break;
      }
      if (remainingBudget <= 0) {
        break;
      }

      const buildingKey =
        entry.buildingId === 'WALL'
          ? (TRIBE_WALL_MAP[village.tribe] ?? 'ROMAN_WALL')
          : entry.buildingId;

      const buildingData = villageBuildings.get(buildingKey);
      const currentLevel = buildingData?.level ?? 0;
      if (currentLevel >= entry.maxLevel) {
        continue;
      }

      const estimatedCost = (currentLevel + 1) * 100;
      if (remainingBudget < estimatedCost) {
        continue;
      }

      const newLevel = currentLevel + 1;
      const fieldId = buildingData?.fieldId;

      const numericBuildingId = buildingKeyToId.get(buildingKey);
      if (numericBuildingId === undefined) {
        continue;
      }

      if (fieldId === undefined) {
        // Building doesn't exist yet — find first unused field_id > 18
        const usedFieldIds = new Set(
          [...villageBuildings.values()].map((b) => b.fieldId),
        );
        let emptyFieldId: number | undefined;
        for (let fid = 19; fid <= 45; fid++) {
          if (!usedFieldIds.has(fid)) {
            emptyFieldId = fid;
            break;
          }
        }

        if (emptyFieldId === undefined) {
          continue; // no empty slot available
        }

        // INSERT new building slot at target level directly
        db.exec({
          sql: `
            INSERT INTO building_fields (village_id, field_id, building_id, level)
            VALUES ($villageId, $fieldId, $buildingId, $level);
          `,
          bind: {
            $villageId: village.villageId,
            $fieldId: emptyFieldId,
            $buildingId: numericBuildingId,
            $level: newLevel,
          },
        });

        // Register in-memory and push the level upgrade
        villageBuildings.set(buildingKey, {
          level: newLevel,
          fieldId: emptyFieldId,
        });
        buildUpdates.push({
          villageId: village.villageId,
          fieldId: emptyFieldId,
          buildingId: numericBuildingId,
          buildingKey,
          previousLevel: 0,
          newLevel,
        });

        if (buildingKey === 'WAREHOUSE' || buildingKey === 'GRANARY') {
          const whLevel = villageBuildings.get('WAREHOUSE')?.level ?? 0;
          const grLevel = villageBuildings.get('GRANARY')?.level ?? 0;
          lootCapacityUpdates.push({
            villageId: village.villageId,
            newMaxLoot: calculateMaxLootCapacityFromBuildings(whLevel, grLevel),
          });
        }

        remainingBudget -= estimatedCost;
        buildsThisTick++;
        totalBuilt++;
        continue;
      }

      buildUpdates.push({
        villageId: village.villageId,
        fieldId,
        buildingId: numericBuildingId,
        buildingKey,
        previousLevel: currentLevel,
        newLevel,
      });

      // Update the in-memory index for subsequent builds this tick
      villageBuildings.set(buildingKey, { level: newLevel, fieldId });

      // Track warehouse/granary upgrades for loot capacity recalculation
      if (buildingKey === 'WAREHOUSE' || buildingKey === 'GRANARY') {
        const whLevel = villageBuildings.get('WAREHOUSE')?.level ?? 0;
        const grLevel = villageBuildings.get('GRANARY')?.level ?? 0;
        lootCapacityUpdates.push({
          villageId: village.villageId,
          newMaxLoot: calculateMaxLootCapacityFromBuildings(whLevel, grLevel),
        });
      }

      remainingBudget -= estimatedCost;
      buildsThisTick++;
      totalBuilt++;
    }

    budgetUpdates.push({
      villageId: village.villageId,
      remaining: remainingBudget,
    });

    // Schedule next build check based on what happened
    const buildsDone = buildsThisTick;
    if (buildsDone > 0) {
      // Build occurred — check again sooner at higher speeds, even sooner for nearby villages
      scheduleUpdates.push({
        villageId: village.villageId,
        nextCheckMs: now + Math.round(scheduleDelay(10 * 60_000) * pMult),
      });
    } else {
      // No build possible — check again later (budget needs time to accumulate)
      // Nearby villages still re-checked sooner
      scheduleUpdates.push({
        villageId: village.villageId,
        nextCheckMs: now + Math.round(scheduleDelay(30 * 60_000) * pMult),
      });
    }
  }

  // ─── Batch UPDATE building_fields ───
  if (buildUpdates.length > 0) {
    // Deduplicate: keep only the LAST entry per (villageId, fieldId) to avoid CASE collision
    const deduped = new Map<string, (typeof buildUpdates)[0]>();
    for (const u of buildUpdates) {
      deduped.set(`${u.villageId}:${u.fieldId}`, u);
    }
    const uniqueUpdates = [...deduped.values()];

    const caseClauses: string[] = [];
    const bind: Record<string, number> = {};

    uniqueUpdates.forEach((u, i) => {
      const vk = `$v${i}`;
      const fk = `$f${i}`;
      const lk = `$l${i}`;
      caseClauses.push(
        `WHEN village_id = ${vk} AND field_id = ${fk} THEN ${lk}`,
      );
      bind[vk] = u.villageId;
      bind[fk] = u.fieldId;
      bind[lk] = u.newLevel;
    });

    const villageIds = [...new Set(uniqueUpdates.map((u) => u.villageId))];
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
          AND field_id > 18;
      `,
      bind: { ...bind, ...villageIdBinds },
    });

    // ─── Record NPC builds in building_level_change_history ───
    const historyRows: [number, number, number, number, number, number][] = [];
    const timestampSeconds = Math.floor(now / 1000);
    for (const u of uniqueUpdates) {
      historyRows.push([
        u.villageId,
        u.fieldId,
        u.buildingId,
        u.previousLevel,
        u.newLevel,
        timestampSeconds,
      ]);
    }

    const historyPlaceholders = historyRows
      .map(
        (_, i) => `($vid${i}, $fid${i}, $bid${i}, $plv${i}, $nlv${i}, $ts${i})`,
      )
      .join(',');
    const historyBind: Record<string, number> = {};
    historyRows.forEach((row, i) => {
      historyBind[`$vid${i}`] = row[0];
      historyBind[`$fid${i}`] = row[1];
      historyBind[`$bid${i}`] = row[2];
      historyBind[`$plv${i}`] = row[3];
      historyBind[`$nlv${i}`] = row[4];
      historyBind[`$ts${i}`] = row[5];
    });

    db.exec({
      sql: `
        INSERT INTO building_level_change_history
          (village_id, field_id, building_id, previous_level, new_level, timestamp)
        VALUES ${historyPlaceholders};
      `,
      bind: historyBind,
    });

    // ─── Update effects table for NPC builds (population + building effects) ───
    for (const u of uniqueUpdates) {
      try {
        const buildingDef = getBuildingDefinition(u.buildingKey as BuildingId);
        if (!buildingDef) {
          continue;
        }

        // Update population effect (wheat production)
        const prevData = getBuildingDataForLevel(
          u.buildingKey as BuildingId,
          u.previousLevel,
        );
        const newData = getBuildingDataForLevel(
          u.buildingKey as BuildingId,
          u.newLevel,
        );
        const populationDifference = newData.population - prevData.population;

        if (populationDifference !== 0) {
          db.exec({
            sql: updatePopulationEffectQuery,
            bind: {
              $village_id: u.villageId,
              $value: populationDifference,
            },
          });
        }

        // Update building-specific effects
        const isNewBuilding = u.previousLevel === 0;
        for (const { effectId, valuesPerLevel, type } of buildingDef.effects) {
          const effectValue = valuesPerLevel[u.newLevel] ?? 0;
          if (isNewBuilding) {
            // INSERT effect rows for new buildings
            db.exec({
              sql: `
                INSERT INTO effects (effect_id, value, type, scope, source, village_id, source_specifier)
                VALUES ((SELECT id FROM effect_ids WHERE effect = $effect_id), $value, $type, 'village', 'building',
                        $village_id, $source_specifier);
              `,
              bind: {
                $effect_id: effectId,
                $value: effectValue,
                $type: type,
                $village_id: u.villageId,
                $source_specifier: u.fieldId,
              },
            });
          } else {
            // UPDATE effect rows for existing buildings
            db.exec({
              sql: updateBuildingEffectQuery,
              bind: {
                $effect_id: effectId,
                $value: effectValue,
                $type: type,
                $village_id: u.villageId,
                $source_specifier: u.fieldId,
              },
            });
          }
        }
      } catch (e) {
        // biome-ignore lint/suspicious/noConsole: NPC brain error logging is intentional
        console.warn(
          `[NPC Brain] Effect update failed for village ${u.villageId}, building ${u.buildingKey}:`,
          e,
        );
      }
    }
  }

  // ─── Batch UPDATE max_loot_capacity for storage upgrades ───
  if (lootCapacityUpdates.length > 0) {
    // Deduplicate: keep only the LAST entry per villageId to avoid CASE collision
    const deduped = new Map<number, (typeof lootCapacityUpdates)[0]>();
    for (const u of lootCapacityUpdates) {
      deduped.set(u.villageId, u);
    }
    const uniqueLootUpdates = [...deduped.values()];

    const caseClauses: string[] = [];
    const bind: Record<string, number> = {};

    uniqueLootUpdates.forEach((u, i) => {
      const vk = `$lv${i}`;
      const lk = `$ll${i}`;
      caseClauses.push(`WHEN village_id = ${vk} THEN ${lk}`);
      bind[vk] = u.villageId;
      bind[lk] = u.newMaxLoot;
    });

    const villageIds = [...new Set(uniqueLootUpdates.map((u) => u.villageId))];
    const villageIdPlaceholders = villageIds
      .map((_, i) => `$lvid${i}`)
      .join(',');
    const villageIdBinds: Record<string, number> = {};
    villageIds.forEach((vid, i) => {
      villageIdBinds[`$lvid${i}`] = vid;
    });

    db.exec({
      sql: `
        UPDATE npc_village_state
        SET max_loot_capacity = CASE
          ${caseClauses.join('\n')}
          ELSE max_loot_capacity
        END
        WHERE village_id IN (${villageIdPlaceholders});
      `,
      bind: { ...bind, ...villageIdBinds },
    });
  }

  // ─── Batch UPDATE building_budget (persist unspent resources) ───
  if (budgetUpdates.length > 0) {
    const caseClauses: string[] = [];
    const bind: Record<string, number | string> = {};

    budgetUpdates.forEach((u, i) => {
      const vk = `$bv${i}`;
      const bk = `$bb${i}`;
      caseClauses.push(`WHEN village_id = ${vk} THEN ${bk}`);
      bind[vk] = u.villageId;
      bind[bk] = Math.max(0, Math.round(u.remaining * 100) / 100);
    });

    const villageIds = [...new Set(budgetUpdates.map((u) => u.villageId))];
    const villageIdPlaceholders = villageIds
      .map((_, i) => `$bvid${i}`)
      .join(',');
    const villageIdBinds: Record<string, number> = {};
    villageIds.forEach((vid, i) => {
      villageIdBinds[`$bvid${i}`] = vid;
    });

    db.exec({
      sql: `
        UPDATE npc_village_state
        SET building_budget = CASE
          ${caseClauses.join('\n')}
          ELSE building_budget
        END
        WHERE village_id IN (${villageIdPlaceholders});
      `,
      bind: { ...bind, ...villageIdBinds },
    });
  }

  // ─── Batch UPDATE next_build_check_ms (rotating queue scheduling) ───
  if (scheduleUpdates.length > 0) {
    const caseClauses: string[] = [];
    const bind: Record<string, number> = {};

    scheduleUpdates.forEach((u, i) => {
      const vk = `$sv${i}`;
      const sk = `$ss${i}`;
      caseClauses.push(`WHEN village_id = ${vk} THEN ${sk}`);
      bind[vk] = u.villageId;
      bind[sk] = u.nextCheckMs;
    });

    const villageIds = [...new Set(scheduleUpdates.map((u) => u.villageId))];
    const villageIdPlaceholders = villageIds
      .map((_, i) => `$svid${i}`)
      .join(',');
    const villageIdBinds: Record<string, number> = {};
    villageIds.forEach((vid, i) => {
      villageIdBinds[`$svid${i}`] = vid;
    });

    db.exec({
      sql: `
        UPDATE npc_village_state
        SET next_build_check_ms = CASE
          ${caseClauses.join('\n')}
          ELSE next_build_check_ms
        END
        WHERE village_id IN (${villageIdPlaceholders});
      `,
      bind: { ...bind, ...villageIdBinds },
    });
  }

  return { villagesBuilt: totalBuilt };
};

// ───────────────────────────────────────────────────────────────
// Formula-Based Building (for background worker and offline catch-up)
// ───────────────────────────────────────────────────────────────

/** Data for a single village needed by the formula builder */
export interface FormulaVillageData {
  villageId: number;
  factionKey: string;
  tribe: string;
  x: number;
  y: number;
  buildingBudget: number;
  lastRaidedMs: number;
  lootAtLastRaid: number;
  maxLoot: number;
}

/** Data for a resource field level */
export interface FormulaFieldLevelData {
  villageId: number;
  fieldId: number;
  level: number;
}

/** Building update computed by the formula */
export interface FormulaBuildUpdate {
  villageId: number;
  fieldId: number;
  buildingId: number;
  buildingKey: string;
  previousLevel: number;
  newLevel: number;
}

/** Result of formula-based building computation */
export interface FormulaBuildResult {
  buildUpdates: FormulaBuildUpdate[];
  lootCapacityUpdates: { villageId: number; newMaxLoot: number }[];
  budgetUpdates: { villageId: number; remaining: number }[];
  villagesBuilt: number;
}

/**
 * Sum of costs to upgrade from currentLevel+1 to targetLevel.
 * Each level costs level * 100.
 */
const sumBuildCost = (currentLevel: number, targetLevel: number): number => {
  if (targetLevel <= currentLevel) {
    return 0;
  }
  return (
    50 * (targetLevel * (targetLevel + 1) - currentLevel * (currentLevel + 1))
  );
};

/**
 * Max affordable target level given current level and available budget.
 * Closed-form solution — no iteration.
 */
const maxAffordableLevel = (currentLevel: number, budget: number): number => {
  if (budget <= 0) {
    return currentLevel;
  }
  const discriminant =
    1 + 4 * (currentLevel * (currentLevel + 1) + (budget / 50) * 2);
  return Math.floor((-1 + Math.sqrt(discriminant)) / 2);
};

/**
 * Formula-based building computation.
 *
 * Computes building upgrades for all villages using a closed-form formula
 * instead of per-building iteration. Used by:
 * - Background worker (online ticks)
 * - Main worker (offline catch-up)
 *
 * This function is a pure computation — it returns the updates but does NOT
 * write to the database. The caller applies the writes.
 */
export const processFormulaBuild = (
  db: DbFacade,
  villages: FormulaVillageData[],
  fieldLevels: FormulaFieldLevelData[],
  elapsedMs: number,
  speed: number,
): FormulaBuildResult => {
  // Fetch building key mapping
  const buildingIdRows = db.selectObjects({
    sql: 'SELECT id, building FROM building_ids',
    schema: z.any(),
  }) as unknown as { id: number; building: string }[];

  const buildingKeyToId = new Map<string, number>();
  for (const row of buildingIdRows) {
    buildingKeyToId.set(row.building.toUpperCase(), row.id);
  }

  // Fetch all NPC building levels
  const allBuildingLevels = db.selectObjects({
    sql: `
      SELECT
        bf.village_id AS villageId,
        bf.field_id AS fieldId,
        bi.building AS buildingKey,
        bf.level
      FROM building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
      JOIN villages v ON v.id = bf.village_id
      WHERE v.player_id != 1
        AND bf.field_id > 18;
    `,
    schema: z.any(),
  }) as unknown as {
    villageId: number;
    fieldId: number;
    buildingKey: string;
    level: number;
  }[];

  // Index: villageId -> buildingKey -> { level, fieldId }
  const buildingIndex = new Map<
    number,
    Map<string, { level: number; fieldId: number }>
  >();
  for (const bl of allBuildingLevels) {
    let villageMap = buildingIndex.get(bl.villageId);
    if (!villageMap) {
      villageMap = new Map();
      buildingIndex.set(bl.villageId, villageMap);
    }
    villageMap.set(bl.buildingKey.toUpperCase(), {
      level: bl.level,
      fieldId: bl.fieldId,
    });
  }

  // Index resource field sums
  const resourceFieldSumByVillage = new Map<number, number>();
  for (const fl of fieldLevels) {
    if (fl.fieldId <= 18) {
      resourceFieldSumByVillage.set(
        fl.villageId,
        (resourceFieldSumByVillage.get(fl.villageId) ?? 0) + fl.level,
      );
    }
  }

  const buildUpdates: FormulaBuildUpdate[] = [];
  const lootCapacityUpdates: { villageId: number; newMaxLoot: number }[] = [];
  const budgetUpdates: { villageId: number; remaining: number }[] = [];
  let totalBuilt = 0;

  for (const village of villages) {
    const factionKey = village.factionKey as FactionKey;
    const factionPriorities = FACTION_BUILD_PRIORITIES[factionKey];
    if (!factionPriorities) {
      budgetUpdates.push({
        villageId: village.villageId,
        remaining: village.buildingBudget,
      });
      continue;
    }

    // Alert state: skip building if recently raided
    if (
      village.lastRaidedMs > 0 &&
      Date.now() - village.lastRaidedMs <
        NPC_BRAIN_CONSTANTS.ALERT_DURATION_MS / speed
    ) {
      budgetUpdates.push({
        villageId: village.villageId,
        remaining: village.buildingBudget,
      });
      continue;
    }

    const spendingRate = FACTION_SPENDING_RATE[factionKey] ?? 0.8;
    const villageBuildings = buildingIndex.get(village.villageId) ?? new Map();

    // Compute total budget for this elapsed window
    const fieldSum = resourceFieldSumByVillage.get(village.villageId) ?? 0;
    const productionPerHour = fieldSum * 10;
    const tickFraction = elapsedMs / 3_600_000;
    const tickProduction =
      productionPerHour * tickFraction * spendingRate * speed;
    let remainingBudget = village.buildingBudget + tickProduction;

    // Conditional overrides
    const overrides: BuildPriorityEntry[] = [];

    const resourceFieldSum =
      resourceFieldSumByVillage.get(village.villageId) ?? 0;
    const computedLoot = calculateCurrentLoot(
      village.lootAtLastRaid,
      village.lastRaidedMs,
      village.maxLoot,
      resourceFieldSum,
      speed,
    );

    if (computedLoot >= 0.9) {
      overrides.push(
        { buildingId: 'WAREHOUSE', maxLevel: 20, priority: 'mandatory' },
        { buildingId: 'GRANARY', maxLevel: 20, priority: 'mandatory' },
      );
    }

    const twoHoursMs = 2 * 3_600_000;
    if (
      village.lastRaidedMs > 0 &&
      Date.now() - village.lastRaidedMs < twoHoursMs
    ) {
      overrides.push(
        { buildingId: 'WALL', maxLevel: 20, priority: 'high' },
        { buildingId: 'BARRACKS', maxLevel: 15, priority: 'high' },
      );
    }

    const buildQueue = [...overrides, ...factionPriorities];

    for (const entry of buildQueue) {
      if (remainingBudget <= 0) {
        break;
      }

      const buildingKey =
        entry.buildingId === 'WALL'
          ? (TRIBE_WALL_MAP[village.tribe] ?? 'ROMAN_WALL')
          : entry.buildingId;

      const buildingData = villageBuildings.get(buildingKey);
      const currentLevel = buildingData?.level ?? 0;
      if (currentLevel >= entry.maxLevel) {
        continue;
      }

      // Compute max affordable level using closed-form formula
      const maxAfford = maxAffordableLevel(currentLevel, remainingBudget);
      const targetLevel = Math.min(maxAfford, entry.maxLevel);
      if (targetLevel <= currentLevel) {
        continue;
      }

      const totalCost = sumBuildCost(currentLevel, targetLevel);
      const numericBuildingId = buildingKeyToId.get(buildingKey);
      if (numericBuildingId === undefined) {
        continue;
      }

      if (buildingData?.fieldId === undefined) {
        // Building doesn't exist — find first unused field_id > 18
        const usedFieldIds = new Set(
          [...villageBuildings.values()].map((b) => b.fieldId),
        );
        let emptyFieldId: number | undefined;
        for (let fid = 19; fid <= 45; fid++) {
          if (!usedFieldIds.has(fid)) {
            emptyFieldId = fid;
            break;
          }
        }
        if (emptyFieldId === undefined) {
          continue;
        }

        buildUpdates.push({
          villageId: village.villageId,
          fieldId: emptyFieldId,
          buildingId: numericBuildingId,
          buildingKey,
          previousLevel: 0,
          newLevel: targetLevel,
        });

        villageBuildings.set(buildingKey, {
          level: targetLevel,
          fieldId: emptyFieldId,
        });
      } else {
        buildUpdates.push({
          villageId: village.villageId,
          fieldId: buildingData.fieldId,
          buildingId: numericBuildingId,
          buildingKey,
          previousLevel: currentLevel,
          newLevel: targetLevel,
        });

        villageBuildings.set(buildingKey, {
          level: targetLevel,
          fieldId: buildingData.fieldId,
        });
      }

      if (buildingKey === 'WAREHOUSE' || buildingKey === 'GRANARY') {
        const whLevel = villageBuildings.get('WAREHOUSE')?.level ?? 0;
        const grLevel = villageBuildings.get('GRANARY')?.level ?? 0;
        lootCapacityUpdates.push({
          villageId: village.villageId,
          newMaxLoot: calculateMaxLootCapacityFromBuildings(whLevel, grLevel),
        });
      }

      remainingBudget -= totalCost;
      totalBuilt++;
    }

    budgetUpdates.push({
      villageId: village.villageId,
      remaining: remainingBudget,
    });
  }

  return {
    buildUpdates,
    lootCapacityUpdates,
    budgetUpdates,
    villagesBuilt: totalBuilt,
  };
};

/**
 * Apply formula build result to the database.
 *
 * Used by:
 * - Background worker (online ticks)
 * - Main worker (offline catch-up)
 *
 * Writes: building_fields, effects, building_level_change_history,
 * npc_village_state (budget + max_loot_capacity).
 */
export const applyFormulaBuildResult = (
  db: DbFacade,
  result: FormulaBuildResult,
): void => {
  const { buildUpdates, lootCapacityUpdates, budgetUpdates } = result;
  const now = Date.now();

  // ─── Batch UPDATE building_fields ───
  if (buildUpdates.length > 0) {
    const deduped = new Map<string, FormulaBuildUpdate>();
    for (const u of buildUpdates) {
      deduped.set(`${u.villageId}:${u.fieldId}`, u);
    }
    const uniqueUpdates = [...deduped.values()];

    const caseClauses: string[] = [];
    const bind: Record<string, number> = {};

    uniqueUpdates.forEach((u, i) => {
      const vk = `$v${i}`;
      const fk = `$f${i}`;
      const lk = `$l${i}`;
      caseClauses.push(
        `WHEN village_id = ${vk} AND field_id = ${fk} THEN ${lk}`,
      );
      bind[vk] = u.villageId;
      bind[fk] = u.fieldId;
      bind[lk] = u.newLevel;
    });

    const villageIds = [...new Set(uniqueUpdates.map((u) => u.villageId))];
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
          AND field_id > 18;
      `,
      bind: { ...bind, ...villageIdBinds },
    });

    // Record in history
    const historyRows: [number, number, number, number, number, number][] = [];
    const timestampSeconds = Math.floor(now / 1000);
    for (const u of uniqueUpdates) {
      historyRows.push([
        u.villageId,
        u.fieldId,
        u.buildingId,
        u.previousLevel,
        u.newLevel,
        timestampSeconds,
      ]);
    }

    const historyPlaceholders = historyRows
      .map(
        (_, i) => `($vid${i}, $fid${i}, $bid${i}, $plv${i}, $nlv${i}, $ts${i})`,
      )
      .join(',');
    const historyBind: Record<string, number> = {};
    historyRows.forEach((row, i) => {
      historyBind[`$vid${i}`] = row[0];
      historyBind[`$fid${i}`] = row[1];
      historyBind[`$bid${i}`] = row[2];
      historyBind[`$plv${i}`] = row[3];
      historyBind[`$nlv${i}`] = row[4];
      historyBind[`$ts${i}`] = row[5];
    });

    db.exec({
      sql: `
        INSERT INTO building_level_change_history
          (village_id, field_id, building_id, previous_level, new_level, timestamp)
        VALUES ${historyPlaceholders};
      `,
      bind: historyBind,
    });

    // Update effects
    for (const u of uniqueUpdates) {
      try {
        const buildingDef = getBuildingDefinition(u.buildingKey as BuildingId);
        if (!buildingDef) {
          continue;
        }

        const prevData = getBuildingDataForLevel(
          u.buildingKey as BuildingId,
          u.previousLevel,
        );
        const newData = getBuildingDataForLevel(
          u.buildingKey as BuildingId,
          u.newLevel,
        );
        const populationDifference = newData.population - prevData.population;

        if (populationDifference !== 0) {
          db.exec({
            sql: updatePopulationEffectQuery,
            bind: {
              $village_id: u.villageId,
              $value: populationDifference,
            },
          });
        }

        const isNewBuilding = u.previousLevel === 0;
        for (const { effectId, valuesPerLevel, type } of buildingDef.effects) {
          const effectValue = valuesPerLevel[u.newLevel] ?? 0;
          if (isNewBuilding) {
            db.exec({
              sql: `
                INSERT INTO effects (effect_id, value, type, scope, source, village_id, source_specifier)
                VALUES ((SELECT id FROM effect_ids WHERE effect = $effect_id), $value, $type, 'village', 'building',
                        $village_id, $source_specifier);
              `,
              bind: {
                $effect_id: effectId,
                $value: effectValue,
                $type: type,
                $village_id: u.villageId,
                $source_specifier: u.fieldId,
              },
            });
          } else {
            db.exec({
              sql: updateBuildingEffectQuery,
              bind: {
                $effect_id: effectId,
                $value: effectValue,
                $type: type,
                $village_id: u.villageId,
                $source_specifier: u.fieldId,
              },
            });
          }
        }
      } catch (e) {
        // biome-ignore lint/suspicious/noConsole: NPC brain error logging is intentional
        console.warn(
          `[NPC Brain] Effect update failed for village ${u.villageId}, building ${u.buildingKey}:`,
          e,
        );
      }
    }
  }

  // ─── Batch UPDATE max_loot_capacity ───
  if (lootCapacityUpdates.length > 0) {
    const deduped = new Map<number, (typeof lootCapacityUpdates)[0]>();
    for (const u of lootCapacityUpdates) {
      deduped.set(u.villageId, u);
    }
    const uniqueLootUpdates = [...deduped.values()];

    const caseClauses: string[] = [];
    const bind: Record<string, number> = {};

    uniqueLootUpdates.forEach((u, i) => {
      const vk = `$lv${i}`;
      const lk = `$ll${i}`;
      caseClauses.push(`WHEN village_id = ${vk} THEN ${lk}`);
      bind[vk] = u.villageId;
      bind[lk] = u.newMaxLoot;
    });

    const villageIds = [...new Set(uniqueLootUpdates.map((u) => u.villageId))];
    const villageIdPlaceholders = villageIds
      .map((_, i) => `$lvid${i}`)
      .join(',');
    const villageIdBinds: Record<string, number> = {};
    villageIds.forEach((vid, i) => {
      villageIdBinds[`$lvid${i}`] = vid;
    });

    db.exec({
      sql: `
        UPDATE npc_village_state
        SET max_loot_capacity = CASE
          ${caseClauses.join('\n')}
          ELSE max_loot_capacity
        END
        WHERE village_id IN (${villageIdPlaceholders});
      `,
      bind: { ...bind, ...villageIdBinds },
    });
  }

  // ─── Batch UPDATE building_budget ───
  if (budgetUpdates.length > 0) {
    const caseClauses: string[] = [];
    const bind: Record<string, number | string> = {};

    budgetUpdates.forEach((u, i) => {
      const vk = `$bv${i}`;
      const bk = `$bb${i}`;
      caseClauses.push(`WHEN village_id = ${vk} THEN ${bk}`);
      bind[vk] = u.villageId;
      bind[bk] = Math.max(0, Math.round(u.remaining * 100) / 100);
    });

    const villageIds = [...new Set(budgetUpdates.map((u) => u.villageId))];
    const villageIdPlaceholders = villageIds
      .map((_, i) => `$bvid${i}`)
      .join(',');
    const villageIdBinds: Record<string, number> = {};
    villageIds.forEach((vid, i) => {
      villageIdBinds[`$bvid${i}`] = vid;
    });

    db.exec({
      sql: `
        UPDATE npc_village_state
        SET building_budget = CASE
          ${caseClauses.join('\n')}
          ELSE building_budget
        END
        WHERE village_id IN (${villageIdPlaceholders});
      `,
      bind: { ...bind, ...villageIdBinds },
    });
  }
};
