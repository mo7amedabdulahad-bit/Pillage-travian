import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { Server } from '@pillage-first/types/models/server';
import type { VillageSize } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';
import { getVillageSize } from '../utils/village-size';

type FactionKey = string;

const speedBonus = (speed: number): number => {
  if (speed >= 20) {
    return 4;
  }
  if (speed >= 10) {
    return 2;
  }
  return 0;
};

const capLevel = (level: number, max = 20): number => Math.min(level, max);

const TRIBE_WALL_MAP: Record<string, string> = {
  romans: 'ROMAN_WALL',
  teutons: 'TEUTONIC_WALL',
  gauls: 'GAUL_WALL',
  egyptians: 'EGYPTIAN_WALL',
  huns: 'HUN_WALL',
  spartans: 'SPARTAN_WALL',
  natars: 'NATAR_WALL',
};

// Universal buildings: all NPC factions get these (UPPERCASE keys).
// WALL is resolved to tribe-specific wall at runtime.
const UNIVERSAL_BUILDINGS: Record<string, Record<string, number>> = {
  WAREHOUSE: { 'xxs/xs': 3, 'sm/md': 4, 'lg/xl': 5, '2xl+': 6 },
  GRANARY: { 'xxs/xs': 3, 'sm/md': 4, 'lg/xl': 5, '2xl+': 6 },
  RALLY_POINT: { 'xxs/xs': 1, 'sm/md': 1, 'lg/xl': 1, '2xl+': 1 },
  WALL: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 3, '2xl+': 5 },
  BARRACKS: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 3, '2xl+': 4 },
};

const FACTION_BUILDINGS: Record<
  FactionKey,
  Record<string, Record<string, number>>
> = {
  npc1: {
    BARRACKS: { 'xxs/xs': 3, 'sm/md': 4, 'lg/xl': 5, '2xl+': 7 },
    STABLE: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 3, '2xl+': 4 },
    WALL: { 'xxs/xs': 3, 'sm/md': 4, 'lg/xl': 5, '2xl+': 7 },
    SMITHY: { 'xxs/xs': 0, 'sm/md': 1, 'lg/xl': 2, '2xl+': 3 },
  },
  npc2: {
    WAREHOUSE: { 'xxs/xs': 5, 'sm/md': 6, 'lg/xl': 7, '2xl+': 8 },
    GRANARY: { 'xxs/xs': 5, 'sm/md': 6, 'lg/xl': 7, '2xl+': 8 },
    MARKETPLACE: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 3, '2xl+': 4 },
    BARRACKS: { 'xxs/xs': 1, 'sm/md': 1, 'lg/xl': 2, '2xl+': 2 },
    WALL: { 'xxs/xs': 1, 'sm/md': 1, 'lg/xl': 2, '2xl+': 3 },
  },
  npc3: {
    STABLE: { 'xxs/xs': 2, 'sm/md': 3, 'lg/xl': 4, '2xl+': 5 },
    BARRACKS: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 2, '2xl+': 3 },
    WALL: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 3, '2xl+': 4 },
  },
  npc4: {
    WALL: { 'xxs/xs': 5, 'sm/md': 7, 'lg/xl': 10, '2xl+': 15 },
    BARRACKS: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 3, '2xl+': 4 },
    STABLE: { 'xxs/xs': 0, 'sm/md': 1, 'lg/xl': 2, '2xl+': 3 },
    ACADEMY: { 'xxs/xs': 0, 'sm/md': 1, 'lg/xl': 2, '2xl+': 3 },
  },
  npc5: {
    STABLE: { 'xxs/xs': 3, 'sm/md': 5, 'lg/xl': 7, '2xl+': 9 },
    BARRACKS: { 'xxs/xs': 1, 'sm/md': 1, 'lg/xl': 2, '2xl+': 3 },
    TOURNAMENT_SQUARE: { 'xxs/xs': 0, 'sm/md': 1, 'lg/xl': 2, '2xl+': 3 },
    WALL: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 3, '2xl+': 4 },
  },
  npc6: {
    BARRACKS: { 'xxs/xs': 3, 'sm/md': 4, 'lg/xl': 5, '2xl+': 6 },
    STABLE: { 'xxs/xs': 2, 'sm/md': 3, 'lg/xl': 4, '2xl+': 5 },
    WORKSHOP: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 3, '2xl+': 4 },
    WALL: { 'xxs/xs': 2, 'sm/md': 3, 'lg/xl': 4, '2xl+': 5 },
    ACADEMY: { 'xxs/xs': 0, 'sm/md': 1, 'lg/xl': 2, '2xl+': 3 },
  },
  npc7: {
    WAREHOUSE: { 'xxs/xs': 6, 'sm/md': 7, 'lg/xl': 8, '2xl+': 9 },
    GRANARY: { 'xxs/xs': 6, 'sm/md': 7, 'lg/xl': 8, '2xl+': 9 },
    BARRACKS: { 'xxs/xs': 1, 'sm/md': 1, 'lg/xl': 2, '2xl+': 2 },
    WALL: { 'xxs/xs': 1, 'sm/md': 1, 'lg/xl': 2, '2xl+': 2 },
  },
  npc8: {
    ACADEMY: { 'xxs/xs': 2, 'sm/md': 3, 'lg/xl': 5, '2xl+': 7 },
    SMITHY: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 4, '2xl+': 6 },
    BARRACKS: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 3, '2xl+': 4 },
    WALL: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 3, '2xl+': 4 },
  },
  npc9: {
    BARRACKS: { 'xxs/xs': 4, 'sm/md': 5, 'lg/xl': 7, '2xl+': 9 },
    STABLE: { 'xxs/xs': 2, 'sm/md': 3, 'lg/xl': 4, '2xl+': 5 },
    WALL: { 'xxs/xs': 2, 'sm/md': 3, 'lg/xl': 5, '2xl+': 7 },
  },
  natars: {
    WAREHOUSE: { 'xxs/xs': 10, 'sm/md': 10, 'lg/xl': 10, '2xl+': 10 },
    GRANARY: { 'xxs/xs': 10, 'sm/md': 10, 'lg/xl': 10, '2xl+': 10 },
    RALLY_POINT: { 'xxs/xs': 10, 'sm/md': 10, 'lg/xl': 10, '2xl+': 10 },
    WALL: { 'xxs/xs': 20, 'sm/md': 20, 'lg/xl': 20, '2xl+': 20 },
    BARRACKS: { 'xxs/xs': 10, 'sm/md': 10, 'lg/xl': 10, '2xl+': 10 },
    STABLE: { 'xxs/xs': 10, 'sm/md': 10, 'lg/xl': 10, '2xl+': 10 },
    WORKSHOP: { 'xxs/xs': 10, 'sm/md': 10, 'lg/xl': 10, '2xl+': 10 },
  },
};

const getSizeGroup = (size: VillageSize): string => {
  if (size === 'xxs' || size === 'xs') {
    return 'xxs/xs';
  }
  if (size === 'sm' || size === 'md') {
    return 'sm/md';
  }
  if (size === 'lg' || size === 'xl') {
    return 'lg/xl';
  }
  return '2xl+';
};

/**
 * Batched NPC starting buildings seeder.
 * Runs AFTER buildingFieldsSeeder which creates the initial rows.
 *
 * 1. Fetches all NPC villages with faction + tribe + size
 * 2. Fetches all existing building_fields rows for NPC villages (one query)
 * 3. Computes which buildings need slot assignment and what levels to set (in JS)
 * 4. Batch-assigns building_id to empty slots (one UPDATE per village)
 * 5. Batch-sets all levels (one CASE UPDATE)
 */
export const npcStartingBuildingsSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  const { speed, mapSize } = server.configuration;
  const bonus = speedBonus(speed);

  // Get building_id mapping (UPPERCASE keys)
  const buildingIdRows = database.selectObjects({
    sql: 'SELECT id, building FROM building_ids',
    schema: z.strictObject({ id: z.number(), building: z.string() }),
  });
  const buildingIdMap = new Map<string, number>(
    buildingIdRows.map((b) => [b.building.toUpperCase(), b.id]),
  );

  // Get all NPC villages
  const villages = database.selectObjects({
    sql: `
      SELECT
        v.id AS village_id,
        t.x,
        t.y,
        COALESCE(fi.faction, 'npc1') AS faction_key,
        ti.tribe
      FROM villages v
      JOIN tiles t ON v.tile_id = t.id
      JOIN players p ON v.player_id = p.id
      LEFT JOIN faction_ids fi ON fi.id = p.faction_id
      JOIN tribe_ids ti ON ti.id = p.tribe_id
      WHERE v.player_id != $player_id;
    `,
    bind: { $player_id: PLAYER_ID },
    schema: z.strictObject({
      village_id: z.number(),
      x: z.number(),
      y: z.number(),
      faction_key: z.string(),
      tribe: z.string(),
    }),
  });

  if (villages.length === 0) {
    return;
  }

  // ONE query: fetch ALL existing building_fields for all NPC villages
  const villageIds = villages.map((v) => v.village_id);
  const villageIdPlaceholders = villageIds.map((_, i) => `$v${i}`).join(',');
  const villageIdBinds: Record<string, number> = {};
  villageIds.forEach((vid, i) => {
    villageIdBinds[`$v${i}`] = vid;
  });

  const allExistingFields = database.selectObjects({
    sql: `
      SELECT
        village_id AS villageId,
        field_id AS fieldId,
        building_id AS buildingId,
        level
      FROM building_fields
      WHERE village_id IN (${villageIdPlaceholders});
    `,
    bind: villageIdBinds,
    schema: z.strictObject({
      villageId: z.number(),
      fieldId: z.number(),
      buildingId: z.number().nullable(),
      level: z.number(),
    }),
  });

  // Index: villageId -> fieldId -> { buildingId, level }
  const fieldsByVillage = new Map<
    number,
    Map<number, { buildingId: number | null; level: number }>
  >();
  for (const f of allExistingFields) {
    let vMap = fieldsByVillage.get(f.villageId);
    if (!vMap) {
      vMap = new Map();
      fieldsByVillage.set(f.villageId, vMap);
    }
    vMap.set(f.fieldId, { buildingId: f.buildingId, level: f.level });
  }

  // Compute all slot assignments and level updates
  // slotAssignments: villageId -> { fieldId, buildingId } (for empty slots)
  const slotAssignments: {
    villageId: number;
    fieldId: number;
    buildingId: number;
  }[] = [];
  // levelUpdates: villageId -> { fieldId, level } (for all buildings)
  const levelUpdates: { villageId: number; fieldId: number; level: number }[] =
    [];

  for (const village of villages) {
    const size = getVillageSize(mapSize, village.x, village.y);
    const sizeGroup = getSizeGroup(size);
    const factionKey = village.faction_key;
    const tribeWallKey = TRIBE_WALL_MAP[village.tribe] ?? 'ROMAN_WALL';

    const vFields = fieldsByVillage.get(village.village_id) ?? new Map();

    // Build target buildings: universal + faction overrides (max of both)
    const targetBuildings = new Map<string, number>();
    for (const [key, sizeMap] of Object.entries(UNIVERSAL_BUILDINGS)) {
      targetBuildings.set(key, sizeMap[sizeGroup] ?? 0);
    }
    const factionBuildings = FACTION_BUILDINGS[factionKey];
    if (factionBuildings) {
      for (const [key, sizeMap] of Object.entries(factionBuildings)) {
        const existing = targetBuildings.get(key) ?? 0;
        targetBuildings.set(key, Math.max(existing, sizeMap[sizeGroup] ?? 0));
      }
    }

    // Track which field_ids are occupied for this village
    const occupiedFieldIds = new Set<number>();
    for (const [fid, data] of vFields) {
      if (data.buildingId !== null && data.buildingId !== 0) {
        occupiedFieldIds.add(fid);
      }
    }

    // Track which building_ids already have a slot
    const buildingIdToFieldId = new Map<number, number>();
    for (const [fid, data] of vFields) {
      if (data.buildingId !== null && data.buildingId !== 0) {
        buildingIdToFieldId.set(data.buildingId, fid);
      }
    }

    // Process each target building
    for (const [buildingKey, baseLevel] of targetBuildings) {
      const finalLevel = capLevel(baseLevel + bonus);
      if (finalLevel <= 0) {
        continue;
      }

      // Resolve WALL to tribe-specific wall
      const resolvedKey = buildingKey === 'WALL' ? tribeWallKey : buildingKey;
      const numericBuildingId = buildingIdMap.get(resolvedKey);
      if (numericBuildingId === undefined) {
        continue;
      }

      // Check if this building already has a slot
      let fieldId = buildingIdToFieldId.get(numericBuildingId);

      if (fieldId === undefined) {
        // Need to assign a slot — find first empty slot (field_id > 18)
        for (let fid = 19; fid <= 40; fid++) {
          if (!occupiedFieldIds.has(fid)) {
            fieldId = fid;
            occupiedFieldIds.add(fid);
            buildingIdToFieldId.set(numericBuildingId, fid);
            slotAssignments.push({
              villageId: village.village_id,
              fieldId: fid,
              buildingId: numericBuildingId,
            });
            break;
          }
        }
        if (fieldId === undefined) {
          continue; // no empty slots
        }
      }

      // Record level update (will be applied via batch CASE UPDATE)
      levelUpdates.push({
        villageId: village.village_id,
        fieldId,
        level: finalLevel,
      });
    }
  }

  // ─── Batch 1: INSERT new building slots ───
  // The factory only creates rows for fields it assigns (1-18, 26, 39, 40).
  // Slots 19-25, 27-38 don't exist in the table at all.
  // We must INSERT new rows, not UPDATE non-existent ones.
  if (slotAssignments.length > 0) {
    // Merge slot assignments with their levels
    const insertRows: [number, number, number, number][] = [];
    for (const s of slotAssignments) {
      const levelEntry = levelUpdates.find(
        (l) => l.villageId === s.villageId && l.fieldId === s.fieldId,
      );
      const level = levelEntry?.level ?? 1;
      insertRows.push([s.villageId, s.fieldId, s.buildingId, level]);
    }

    batchInsert(
      database,
      'building_fields',
      ['village_id', 'field_id', 'building_id', 'level'],
      insertRows,
    );
  }

  // ─── Batch 2: Update levels for existing buildings (factory-placed) ───
  // Only update buildings that already existed (MAIN_BUILDING, RALLY_POINT, wall).
  // Newly INSERTed buildings already have their levels from Batch 1.
  const insertedKeys = new Set(
    slotAssignments.map((s) => `${s.villageId}:${s.fieldId}`),
  );
  const existingLevelUpdates = levelUpdates.filter(
    (u) => !insertedKeys.has(`${u.villageId}:${u.fieldId}`),
  );

  if (existingLevelUpdates.length > 0) {
    const levelCaseClauses: string[] = [];
    const levelBind: Record<string, number> = {};
    let li = 0;
    for (const u of existingLevelUpdates) {
      const vk = `$lv${li}`;
      const fk = `$lf${li}`;
      const lk = `$ll${li}`;
      levelCaseClauses.push(
        `WHEN village_id = ${vk} AND field_id = ${fk} THEN ${lk}`,
      );
      levelBind[vk] = u.villageId;
      levelBind[fk] = u.fieldId;
      levelBind[lk] = u.level;
      li++;
    }

    const allLevelVillageIds = [
      ...new Set(existingLevelUpdates.map((u) => u.villageId)),
    ];
    const levelVidPlaceholders = allLevelVillageIds
      .map((_, i) => `$lvid${i}`)
      .join(',');
    const levelVidBinds: Record<string, number> = {};
    allLevelVillageIds.forEach((vid, i) => {
      levelVidBinds[`$lvid${i}`] = vid;
    });

    database.exec({
      sql: `
        UPDATE building_fields
        SET level = CASE
          ${levelCaseClauses.join('\n')}
          ELSE level
        END
        WHERE village_id IN (${levelVidPlaceholders});
      `,
      bind: { ...levelBind, ...levelVidBinds },
    });
  }
};
