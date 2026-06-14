import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { Server } from '@pillage-first/types/models/server';
import type { VillageSize } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
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

/**
 * Map tribe to its wall building ID (UPPERCASE as stored in building_ids).
 */
const TRIBE_WALL_MAP: Record<string, string> = {
  romans: 'ROMAN_WALL',
  teutons: 'TEUTONIC_WALL',
  gauls: 'GAUL_WALL',
  egyptians: 'EGYPTIAN_WALL',
  huns: 'HUN_WALL',
  spartans: 'SPARTAN_WALL',
  natars: 'NATAR_WALL',
};

/**
 * Universal starting buildings for ALL NPC factions.
 * Keys are UPPERCASE to match building_ids table.
 */
const UNIVERSAL_BUILDINGS: Record<string, Record<string, number>> = {
  WAREHOUSE: { 'xxs/xs': 3, 'sm/md': 4, 'lg/xl': 5, '2xl+': 6 },
  GRANARY: { 'xxs/xs': 3, 'sm/md': 4, 'lg/xl': 5, '2xl+': 6 },
  RALLY_POINT: { 'xxs/xs': 1, 'sm/md': 1, 'lg/xl': 1, '2xl+': 1 },
  WALL: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 3, '2xl+': 5 },
  BARRACKS: { 'xxs/xs': 1, 'sm/md': 2, 'lg/xl': 3, '2xl+': 4 },
};

/**
 * Faction-specific starting buildings (on top of universal).
 * Keys are UPPERCASE. 'WALL' is resolved to tribe-specific wall at runtime.
 */
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
 * Seeder that sets NPC starting building levels based on faction, village size, and server speed.
 * Runs AFTER buildingFieldsSeeder (updates existing rows, does not insert new ones).
 */
export const npcStartingBuildingsSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  const { speed, mapSize } = server.configuration;
  const bonus = speedBonus(speed);

  const buildingIdRows = database.selectObjects({
    sql: 'SELECT id, building FROM building_ids',
    schema: z.strictObject({ id: z.number(), building: z.string() }),
  });
  const buildingIdMap = new Map<string, number>(
    buildingIdRows.map((b) => [b.building, b.id]),
  );

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

  const updates: {
    villageId: number;
    buildingId: number;
    level: number;
  }[] = [];

  for (const village of villages) {
    const size = getVillageSize(mapSize, village.x, village.y);
    const sizeGroup = getSizeGroup(size);
    const factionKey = village.faction_key;
    const tribeWall = TRIBE_WALL_MAP[village.tribe] ?? 'ROMAN_WALL';

    // Start with universal buildings
    const buildingLevels = new Map<string, number>();
    for (const [buildingKey, sizeMap] of Object.entries(UNIVERSAL_BUILDINGS)) {
      const baseLevel = sizeMap[sizeGroup] ?? 0;
      buildingLevels.set(buildingKey, baseLevel);
    }

    // Override/add faction-specific buildings
    const factionBuildings = FACTION_BUILDINGS[factionKey];
    if (factionBuildings) {
      for (const [buildingKey, sizeMap] of Object.entries(factionBuildings)) {
        const factionLevel = sizeMap[sizeGroup] ?? 0;
        const currentLevel = buildingLevels.get(buildingKey) ?? 0;
        buildingLevels.set(buildingKey, Math.max(currentLevel, factionLevel));
      }
    }

    // Apply speed bonus, resolve WALL to tribe wall, and cap
    for (const [buildingKey, baseLevel] of buildingLevels) {
      const finalLevel = capLevel(baseLevel + bonus);
      if (finalLevel <= 0) {
        continue;
      }

      // Resolve 'WALL' to tribe-specific wall building ID
      const resolvedKey = buildingKey === 'WALL' ? tribeWall : buildingKey;
      const buildingNumericId = buildingIdMap.get(resolvedKey);
      if (buildingNumericId === undefined) {
        continue;
      }

      updates.push({
        villageId: village.village_id,
        buildingId: buildingNumericId,
        level: finalLevel,
      });
    }
  }

  if (updates.length === 0) {
    return;
  }

  // Group by village for efficient CASE construction
  const updatesByVillage = new Map<
    number,
    { buildingId: number; level: number }[]
  >();
  for (const u of updates) {
    let arr = updatesByVillage.get(u.villageId);
    if (!arr) {
      arr = [];
      updatesByVillage.set(u.villageId, arr);
    }
    arr.push({ buildingId: u.buildingId, level: u.level });
  }

  const caseClauses: string[] = [];
  const bind: Record<string, number> = {};
  let idx = 0;

  for (const [villageId, buildingUpdates] of updatesByVillage) {
    for (const { buildingId, level } of buildingUpdates) {
      const vk = `$v${idx}`;
      const bk = `$b${idx}`;
      const lk = `$l${idx}`;
      caseClauses.push(
        `WHEN village_id = ${vk} AND building_id = ${bk} THEN ${lk}`,
      );
      bind[vk] = villageId;
      bind[bk] = buildingId;
      bind[lk] = level;
      idx++;
    }
  }

  const villageIds = [...updatesByVillage.keys()];
  const villageIdPlaceholders = villageIds.map((_, i) => `$vid${i}`).join(',');
  const villageIdBinds: Record<string, number> = {};
  villageIds.forEach((vid, i) => {
    villageIdBinds[`$vid${i}`] = vid;
  });

  database.exec({
    sql: `
      UPDATE building_fields
      SET level = CASE
        ${caseClauses.join('\n')}
        ELSE level
      END
      WHERE village_id IN (${villageIdPlaceholders});
    `,
    bind: { ...bind, ...villageIdBinds },
  });
};
