import { prngMulberry32 } from 'ts-seedrandom';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitByTribeAndTier } from '@pillage-first/game-assets/utils/units';
import type { Resource } from '@pillage-first/types/models/resource';
import type { Server } from '@pillage-first/types/models/server';
import { type Tribe, tribeSchema } from '@pillage-first/types/models/tribe';
import type { NatureUnitId, UnitId } from '@pillage-first/types/models/unit';
import type { VillageSize } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { seededRandomIntFromInterval } from '@pillage-first/utils/random';
import { batchInsert } from '../utils/batch-insert';
import { getVillageSize } from '../utils/village-size';

/**
 * Faction troop totals at seeding by village size tier.
 */
const FACTION_TROOP_TOTALS: Record<string, Record<string, number>> = {
  npc1: {
    xxs: 30,
    xs: 30,
    sm: 120,
    md: 120,
    lg: 400,
    xl: 400,
    '2xl': 1200,
    '3xl': 1200,
    '4xl': 1200,
  },
  npc2: {
    xxs: 10,
    xs: 10,
    sm: 40,
    md: 40,
    lg: 120,
    xl: 120,
    '2xl': 350,
    '3xl': 350,
    '4xl': 350,
  },
  npc3: {
    xxs: 20,
    xs: 20,
    sm: 80,
    md: 80,
    lg: 220,
    xl: 220,
    '2xl': 600,
    '3xl': 600,
    '4xl': 600,
  },
  npc4: {
    xxs: 40,
    xs: 40,
    sm: 150,
    md: 150,
    lg: 500,
    xl: 500,
    '2xl': 1500,
    '3xl': 1500,
    '4xl': 1500,
  },
  npc5: {
    xxs: 25,
    xs: 25,
    sm: 100,
    md: 100,
    lg: 300,
    xl: 300,
    '2xl': 900,
    '3xl': 900,
    '4xl': 900,
  },
  npc6: {
    xxs: 35,
    xs: 35,
    sm: 130,
    md: 130,
    lg: 450,
    xl: 450,
    '2xl': 1300,
    '3xl': 1300,
    '4xl': 1300,
  },
  npc7: {
    xxs: 5,
    xs: 5,
    sm: 20,
    md: 20,
    lg: 60,
    xl: 60,
    '2xl': 180,
    '3xl': 180,
    '4xl': 180,
  },
  npc8: {
    xxs: 15,
    xs: 15,
    sm: 60,
    md: 60,
    lg: 200,
    xl: 200,
    '2xl': 550,
    '3xl': 550,
    '4xl': 550,
  },
  npc9: {
    xxs: 50,
    xs: 50,
    sm: 180,
    md: 180,
    lg: 600,
    xl: 600,
    '2xl': 1800,
    '3xl': 1800,
    '4xl': 1800,
  },
};

/**
 * Get faction troop total for a village size.
 */
const getFactionTroopTotal = (
  factionKey: string,
  size: VillageSize,
): number => {
  return FACTION_TROOP_TOTALS[factionKey]?.[size] ?? 0;
};

/**
 * Speed multiplier for starting troops: x10 = 3x, x20 = 6x.
 */
const getTroopSpeedMultiplier = (speed: number): number => {
  if (speed >= 20) {
    return 6;
  }
  if (speed >= 10) {
    return 3;
  }
  return 1;
};

/**
 * Get tribe's unit tiers (4 tiers).
 */
const TRIBE_UNIT_TIERS: Record<string, string[]> = {
  romans: ['LEGIONNAIRE', 'PRAETORIAN', 'IMPERIAN', 'EQUITES_IMPERATORIS'],
  gauls: ['PHALANX', 'SWORDSMAN', 'THEUTATES_THUNDER', 'DRUIDRIDER'],
  teutons: ['CLUBSWINGER', 'SPEARMAN', 'AXEMAN', 'PALADIN'],
  egyptians: ['SLAVE_MILITIA', 'ASH_WARDEN', 'KHOPESH_WARRIOR', 'ANHUR_GUARD'],
  huns: ['MERCENARY', 'BOWMAN', 'STEPPE_RIDER', 'MARKSMAN'],
  spartans: ['HOPLITE', 'SHIELDSMAN', 'TWINSTEEL_THERION', 'ELPIDA_RIDER'],
  natars: ['PIKEMAN', 'THORNED_WARRIOR', 'GUARDSMAN', 'AXERIDER'],
};

const getTribeUnitTiers = (tribe: string): string[] | undefined => {
  return TRIBE_UNIT_TIERS[tribe];
};

/**
 * Faction preferred troop tier weights.
 */
const FACTION_TROOP_WEIGHTS: Record<string, number[]> = {
  npc1: [0.3, 0.3, 0.25, 0.15],
  npc2: [0.5, 0.25, 0.15, 0.1],
  npc3: [0.2, 0.3, 0.3, 0.2],
  npc4: [0.4, 0.3, 0.2, 0.1],
  npc5: [0.2, 0.2, 0.3, 0.3],
  npc6: [0.25, 0.25, 0.25, 0.25],
  npc7: [0.6, 0.2, 0.1, 0.1],
  npc8: [0.3, 0.3, 0.25, 0.15],
  npc9: [0.3, 0.25, 0.25, 0.2],
};

const getFactionTroopWeights = (factionKey: string): number[] => {
  return FACTION_TROOP_WEIGHTS[factionKey] ?? [0.25, 0.25, 0.25, 0.25];
};

const NATAR_GARRISON_WEIGHTS: [UnitId, number][] = [
  ['PIKEMAN', 0.24],
  ['THORNED_WARRIOR', 0.2],
  ['GUARDSMAN', 0.18],
  ['AXERIDER', 0.14],
  ['NATARIAN_KNIGHT', 0.1],
  ['NATARIAN_SCOUT', 0.06],
  ['NATARIAN_RAM', 0.03],
  ['NATARIAN_CATAPULT', 0.03],
  ['NATARIAN_CHIEF', 0.02],
];

const getNatarGarrisonTotal = (mapSize: number, speed: number): number => {
  const baseTotal =
    mapSize <= 25
      ? 4_000
      : mapSize <= 50
        ? 12_000
        : mapSize <= 75
          ? 25_000
          : 40_000;
  return Math.floor(baseTotal * getTroopSpeedMultiplier(speed));
};

const oasisTroopCombinations = new Map<
  Resource,
  [NatureUnitId, number, number][]
>([
  [
    'wood',
    [
      ['WILD_BOAR', 2, 11],
      ['WOLF', 2, 7],
      ['BEAR', 2, 5],
    ],
  ],
  [
    'clay',
    [
      ['RAT', 3, 12],
      ['SPIDER', 2, 10],
      ['WILD_BOAR', 2, 7],
    ],
  ],
  [
    'iron',
    [
      ['RAT', 2, 16],
      ['SPIDER', 2, 12],
      ['BAT', 2, 10],
    ],
  ],
  [
    'wheat',
    [
      ['RAT', 2, 20],
      ['SERPENT', 2, 18],
      ['TIGER', 2, 11],
      ['CROCODILE', 2, 9],
    ],
  ],
]);

// Each number array determines [min, max] of units.
// - Villages of size sm or larger should have scouts present.
// - Villages of size lg should have rams and catapults present
// - Villages of size xs should have between 20-120 troops present composed of only first and second unit
// - Villages of size sm should have between 150-450 troops present composed of only first and second unit + scouts
// - Villages of size md should have between 600-1200 troops present composed of any unit except rams and catapults
// - Villages of size lg should have between 1500-2500 troops present composed of any unit
// TODO: Units must be added and numbers must be tweaked!
// TODO: New village sizes were added, add missing stuff!
// TODO: These should be generated by some function
const _npcUnitCompositionByTribeAndSize = new Map<
  Tribe,
  Map<VillageSize, [UnitId, number, number][]>
>([
  [
    'gauls',
    new Map([
      [
        'xs',
        [
          ['PHALANX', 10, 50],
          ['SWORDSMAN', 5, 40],
        ],
      ],
      [
        'sm',
        [
          ['PHALANX', 100, 200],
          ['SWORDSMAN', 60, 150],
          ['GAUL_SCOUT', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['PHALANX', 300, 600],
          ['SWORDSMAN', 250, 400],
          ['GAUL_SCOUT', 20, 80],
          ['THEUTATES_THUNDER', 5, 40],
          ['DRUIDRIDER', 5, 40],
          ['HAEDUAN', 5, 40],
        ],
      ],
      [
        'lg',
        [
          ['PHALANX', 700, 1200],
          ['SWORDSMAN', 5, 40],
          ['GAUL_SCOUT', 5, 40],
          ['THEUTATES_THUNDER', 5, 40],
          ['DRUIDRIDER', 5, 40],
          ['HAEDUAN', 5, 40],
          ['GAUL_RAM', 20, 100],
          ['GAUL_CATAPULT', 20, 50],
        ],
      ],
    ]),
  ],
  [
    'romans',
    new Map([
      [
        'xs',
        [
          ['LEGIONNAIRE', 10, 35],
          ['PRAETORIAN', 5, 25],
        ],
      ],
      [
        'sm',
        [
          ['LEGIONNAIRE', 10, 35],
          ['PRAETORIAN', 5, 25],
          ['ROMAN_SCOUT', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['LEGIONNAIRE', 10, 35],
          ['PRAETORIAN', 5, 25],
          ['ROMAN_SCOUT', 5, 10],
        ],
      ],
      [
        'lg',
        [
          ['LEGIONNAIRE', 10, 35],
          ['PRAETORIAN', 5, 25],
          ['ROMAN_SCOUT', 5, 10],
          ['ROMAN_RAM', 20, 100],
          ['ROMAN_CATAPULT', 20, 50],
        ],
      ],
    ]),
  ],
  [
    'teutons',
    new Map([
      [
        'xs',
        [
          ['CLUBSWINGER', 30, 100],
          ['SPEARMAN', 5, 30],
        ],
      ],
      [
        'sm',
        [
          ['CLUBSWINGER', 30, 100],
          ['SPEARMAN', 5, 30],
          ['TEUTONIC_SCOUT', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['CLUBSWINGER', 30, 100],
          ['SPEARMAN', 5, 30],
          ['TEUTONIC_SCOUT', 5, 10],
        ],
      ],
      [
        'lg',
        [
          ['CLUBSWINGER', 30, 100],
          ['SPEARMAN', 5, 30],
          ['TEUTONIC_SCOUT', 5, 10],
          ['TEUTONIC_RAM', 20, 100],
          ['TEUTONIC_CATAPULT', 20, 50],
        ],
      ],
    ]),
  ],
  [
    'huns',
    new Map([
      [
        'xs',
        [
          ['MERCENARY', 15, 45],
          ['BOWMAN', 5, 25],
        ],
      ],
      [
        'sm',
        [
          ['MERCENARY', 15, 45],
          ['BOWMAN', 5, 25],
          ['HUN_SCOUT', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['MERCENARY', 15, 45],
          ['BOWMAN', 5, 25],
          ['HUN_SCOUT', 5, 10],
        ],
      ],
      [
        'lg',
        [
          ['MERCENARY', 15, 45],
          ['BOWMAN', 5, 25],
          ['HUN_SCOUT', 5, 10],
          ['HUN_RAM', 20, 100],
          ['HUN_CATAPULT', 20, 50],
        ],
      ],
    ]),
  ],
  [
    'egyptians',
    new Map([
      [
        'xs',
        [
          ['SLAVE_MILITIA', 30, 70],
          ['ASH_WARDEN', 5, 20],
        ],
      ],
      [
        'sm',
        [
          ['SLAVE_MILITIA', 30, 70],
          ['ASH_WARDEN', 5, 20],
          ['EGYPTIAN_SCOUT', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['SLAVE_MILITIA', 30, 70],
          ['ASH_WARDEN', 5, 20],
          ['EGYPTIAN_SCOUT', 5, 10],
        ],
      ],
      [
        'lg',
        [
          ['SLAVE_MILITIA', 30, 70],
          ['ASH_WARDEN', 5, 20],
          ['EGYPTIAN_SCOUT', 5, 10],
          ['EGYPTIAN_RAM', 20, 100],
          ['EGYPTIAN_CATAPULT', 20, 50],
        ],
      ],
    ]),
  ],
]);

export const troopSeeder = (database: DbFacade, server: Server): void => {
  const prng = prngMulberry32(server.seed);

  const results: [number, number, number, number][] = [];

  const unitIdRows = database.selectObjects({
    sql: 'SELECT id, unit FROM unit_ids',
    schema: z.strictObject({ id: z.number(), unit: z.string() }),
  });
  const unitIdMap = new Map<string, number>(
    unitIdRows.map((u) => [u.unit, u.id]),
  );

  const villages = database.selectObjects({
    sql: `
      SELECT
        players.id AS player_id,
        ti.tribe,
        tiles.id AS tile_id,
        tiles.x,
        tiles.y,
        COALESCE(fi.faction, 'player') AS faction_key
      FROM
        villages
          INNER JOIN players ON villages.player_id = players.id
          JOIN tribe_ids ti ON players.tribe_id = ti.id
          LEFT JOIN faction_ids fi ON fi.id = players.faction_id
          INNER JOIN tiles ON villages.tile_id = tiles.id;
    `,
    schema: z.strictObject({
      player_id: z.number(),
      tribe: tribeSchema,
      tile_id: z.number(),
      x: z.number(),
      y: z.number(),
      faction_key: z.string(),
    }),
  });

  for (const { tribe, tile_id, player_id, x, y, faction_key } of villages) {
    if (player_id === PLAYER_ID) {
      const tier1UnitIt = getUnitByTribeAndTier(tribe, 'tier-1');

      // Player starts with 3 tier-1 units and a hero
      results.push(
        [unitIdMap.get(tier1UnitIt.id)!, 3, tile_id, tile_id],
        [unitIdMap.get('HERO')!, 1, tile_id, tile_id],
      );
      continue;
    }

    // ─── NPC village: faction-specific starting troops ───
    if (faction_key === 'natars') {
      const totalTroops = getNatarGarrisonTotal(
        server.configuration.mapSize,
        server.configuration.speed,
      );
      let remaining = totalTroops;

      for (let i = 0; i < NATAR_GARRISON_WEIGHTS.length; i += 1) {
        const [unitId, weight] = NATAR_GARRISON_WEIGHTS[i];
        const amount =
          i === NATAR_GARRISON_WEIGHTS.length - 1
            ? remaining
            : Math.max(1, Math.floor(totalTroops * weight));
        const numericId = unitIdMap.get(unitId);

        if (numericId !== undefined && amount > 0) {
          results.push([numericId, amount, tile_id, tile_id]);
        }
        remaining -= amount;
      }

      continue;
    }

    const villageSize = getVillageSize(server.configuration.mapSize, x, y);
    const factionTroopTotal = getFactionTroopTotal(faction_key, villageSize);
    const speedMultiplier = getTroopSpeedMultiplier(server.configuration.speed);
    const totalTroops = Math.floor(factionTroopTotal * speedMultiplier);

    if (totalTroops <= 0) {
      continue;
    }

    // Get tribe's unit tiers and faction's preferred weights
    const unitTiers = getTribeUnitTiers(tribe);
    const weights = getFactionTroopWeights(faction_key);

    if (!unitTiers || unitTiers.length === 0) {
      continue;
    }

    // Distribute total troops across tiers using weights
    let remaining = totalTroops;
    for (let i = 0; i < unitTiers.length; i++) {
      const unitId = unitTiers[i];
      const weight = weights[i] ?? 0;
      const amount =
        i === unitTiers.length - 1
          ? remaining // last tier gets remainder
          : Math.floor(totalTroops * weight);

      if (amount <= 0) {
        continue;
      }

      const numericId = unitIdMap.get(unitId);
      if (numericId === undefined) {
        continue;
      }

      results.push([numericId, amount, tile_id, tile_id]);
      remaining -= amount;
    }
  }

  const oasis = database.selectObjects({
    sql: `
      SELECT
        o.tile_id AS tile_id,
        GROUP_CONCAT(o.resource) AS resources
      FROM
        oasis o
      GROUP BY
        o.tile_id
      HAVING
        MAX(o.village_id) IS NULL;
    `,
    schema: z.strictObject({
      tile_id: z.number(),
      resources: z.string(),
    }),
  });

  for (const { tile_id, resources } of oasis) {
    const [r1, r2] = resources.split(',') as Resource[];
    const primaryResource = r2 ? (r1 === 'wheat' ? r2 : r1) : r1;

    const troopIdsWithAmount = oasisTroopCombinations.get(primaryResource)!;

    for (const [unitId, min, max] of troopIdsWithAmount) {
      const amount = seededRandomIntFromInterval(prng, min, max);
      results.push([
        unitIdMap.get(unitId as string)!,
        amount,
        tile_id,
        tile_id,
      ]);
    }
  }

  batchInsert(
    database,
    'troops',
    ['unit_id', 'amount', 'tile_id', 'source_tile_id'],
    results,
  );
};
