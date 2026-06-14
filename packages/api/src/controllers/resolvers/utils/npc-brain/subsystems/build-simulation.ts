import type { BuildingId } from '@pillage-first/types/models/building';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  type BuildPriorityEntry,
  FACTION_BUILD_PRIORITIES,
  FACTION_SPENDING_RATE,
} from '../faction-build-priorities';
import { calculateMaxLootCapacityFromBuildings } from '../helpers';
import type {
  BatchFieldLevelRow,
  BatchVillageRow,
  FactionKey,
} from '../npc-brain-types';

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
 * Process build decisions for all NPC villages.
 * Evaluates conditional overrides, picks from faction priority script,
 * applies multiple builds per tick if budget allows.
 * After warehouse/granary upgrades, recalculates max_loot_capacity.
 */
export const processBuildDecisions = (
  db: DbFacade,
  allVillages: BatchVillageRow[],
  allFieldLevels: BatchFieldLevelRow[],
  chunkMs: number,
  speed: number,
): BuildResult => {
  const now = Date.now();

  // Fetch building key mapping
  const buildingIdRows = db.selectObjects({
    sql: 'SELECT id, building FROM building_ids',
    schema: { parse: (v: unknown) => v } as any,
  }) as unknown as { id: number; building: string }[];

  const buildingKeyToId = new Map<string, number>();
  const buildingIdToKey = new Map<number, string>();
  for (const row of buildingIdRows) {
    buildingKeyToId.set(row.building, row.id);
    buildingIdToKey.set(row.id, row.building);
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
    schema: { parse: (v: unknown) => v } as any,
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
    villageMap.set(bl.buildingKey, { level: bl.level, fieldId: bl.fieldId });
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
    newLevel: number;
  }[] = [];
  const lootCapacityUpdates: { villageId: number; newMaxLoot: number }[] = [];
  let totalBuilt = 0;

  for (const village of allVillages) {
    const factionKey = village.factionKey as FactionKey;
    const factionPriorities = FACTION_BUILD_PRIORITIES[factionKey];
    if (!factionPriorities) {
      continue;
    }

    const spendingRate = FACTION_SPENDING_RATE[factionKey] ?? 0.8;
    const villageBuildings = buildingIndex.get(village.villageId) ?? new Map();

    // Calculate economy budget
    const fieldSum = resourceFieldSumByVillage.get(village.villageId) ?? 0;
    const productionPerHour = fieldSum * 10;
    const tickFraction = chunkMs / 3_600_000;
    const budget = productionPerHour * tickFraction * spendingRate * speed;

    let remainingBudget = budget;
    let buildsThisTick = 0;
    const maxBuildsPerTick = 5;

    // Conditional overrides
    const overrides: BuildPriorityEntry[] = [];

    if (village.currentLoot >= 0.9) {
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
      if (buildsThisTick >= maxBuildsPerTick) {
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
      if (fieldId === undefined) {
        continue;
      }

      buildUpdates.push({
        villageId: village.villageId,
        fieldId,
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
  }

  // ─── Batch UPDATE building_fields ───
  if (buildUpdates.length > 0) {
    const caseClauses: string[] = [];
    const bind: Record<string, number> = {};

    buildUpdates.forEach((u, i) => {
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

    const villageIds = [...new Set(buildUpdates.map((u) => u.villageId))];
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
  }

  // ─── Batch UPDATE max_loot_capacity for storage upgrades ───
  if (lootCapacityUpdates.length > 0) {
    const caseClauses: string[] = [];
    const bind: Record<string, number> = {};

    lootCapacityUpdates.forEach((u, i) => {
      const vk = `$lv${i}`;
      const lk = `$ll${i}`;
      caseClauses.push(`WHEN village_id = ${vk} THEN ${lk}`);
      bind[vk] = u.villageId;
      bind[lk] = u.newMaxLoot;
    });

    const villageIds = [
      ...new Set(lootCapacityUpdates.map((u) => u.villageId)),
    ];
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

  return { villagesBuilt: totalBuilt };
};
