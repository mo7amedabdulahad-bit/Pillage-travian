import type { Building } from '@pillage-first/types/models/building';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { VillageSize } from '@pillage-first/types/models/village';

export const npcVillageNameAdjectives: string[] = [
  'Sleepy',
  'Chonky',
  'Moist',
  'Sneaky',
  'Cursed',
  'Crusty',
  'Wiggly',
  'Spicy',
  'Zesty',
  'Grumpy',
  'Donut',
  'Floppy',
  'Tofu',
  'Boopy',
  'Snaccy',
  'Cheesy',
  'Feral',
  'Overcooked',
  'Funky',
  'Battle',
  'Unicorn',
  'NomNom',
  'Snoring',
  'Whiffled',
  'Goopy',
  'Thirsty',
  'Rumbly',
  'Twinkling',
  'Mossy',
  'Sizzling',
  'Greasy',
  'Plump',
  'Bashful',
  'Lumpy',
  'Meaty',
  'Fizzy',
  'Nervous',
  'Crumbly',
  'Oozy',
  'Dank',
  'Wheezy',
  'Jiggly',
  'Mild',
  'Chilly',
  'Pungent',
  'Tragic',
  'Frilly',
  'Melty',
  'Loafy',
  'Honkable',
  'Farty',
];

export const npcVillageNameNouns: string[] = [
  'Hill',
  'Ford',
  'Cliff',
  'Knoll',
  'Creek',
  'Marsh',
  'Ridge',
  'Moor',
  'Glen',
  'Plains',
  'Woods',
  'Field',
  'Knob',
  'Wastes',
  'Hollow',
  'Pit',
  'Haven',
  'Borough',
  'Valley',
  'Town',
  'Bridge',
  'Fort',
  'Crossing',
  'Falls',
  'Fjord',
  'Crag',
  'Shire',
  'Bluff',
  'Cairn',
  'Pass',
  'Ditch',
  'Bay',
  'Lagoon',
  'Spire',
  'Summit',
  'Thicket',
  'Mire',
  'Arch',
  'Chasm',
  'Corridor',
  'Steps',
  'Gorge',
  'Sprawl',
  'Meadow',
  'Furnace',
  'Yard',
  'Roost',
  'Nest',
  'Burrow',
  'Oasis',
  'Terrace',
  'Vault',
  'Landing',
  'Nook',
];

export type BuildingField = {
  field_id: number;
  building_id: Building['id'];
  level: number;
};

type ResourceFieldMap = Map<number, Building['id']>;

// Wheat that never changes
const staticWheatFields = new Map<number, Building['id']>([
  [2, 'WHEAT_FIELD'],
  [8, 'WHEAT_FIELD'],
  [9, 'WHEAT_FIELD'],
  [12, 'WHEAT_FIELD'],
  [13, 'WHEAT_FIELD'],
  [15, 'WHEAT_FIELD'],
]);

// Fixed non-wheat positions on all RFCs except "00018"
const staticResourcesLayout = new Map<number, Building['id']>([
  [3, 'WOODCUTTER'],
  [4, 'IRON_MINE'],
  [6, 'CLAY_PIT'],
  [7, 'IRON_MINE'],
  [11, 'IRON_MINE'],
  [14, 'WOODCUTTER'],
  [16, 'CLAY_PIT'],
  [17, 'WOODCUTTER'],
  [18, 'CLAY_PIT'],
]);

// Build a new map from static layouts + overrides
const base = (overrides: [number, Building['id']][]): ResourceFieldMap => {
  return new Map<number, Building['id']>([
    ...staticWheatFields,
    ...staticResourcesLayout,
    ...overrides,
  ]);
};

const at = (
  a: Building['id'],
  b: Building['id'],
  c: Building['id'],
): ResourceFieldMap =>
  base([
    [1, a],
    [5, b],
    [10, c],
  ]);

const resourceFieldsLayouts: Record<
  ResourceFieldComposition,
  ResourceFieldMap
> = {
  '3456': at('IRON_MINE', 'CLAY_PIT', 'IRON_MINE'),
  '3546': at('CLAY_PIT', 'CLAY_PIT', 'IRON_MINE'),
  '4356': at('WOODCUTTER', 'IRON_MINE', 'IRON_MINE'),
  '4536': at('WOODCUTTER', 'CLAY_PIT', 'CLAY_PIT'),
  '5346': at('WOODCUTTER', 'WOODCUTTER', 'IRON_MINE'),
  '5436': at('WOODCUTTER', 'CLAY_PIT', 'WOODCUTTER'),
  '4446': at('WOODCUTTER', 'CLAY_PIT', 'IRON_MINE'),
  '4437': at('WOODCUTTER', 'CLAY_PIT', 'WHEAT_FIELD'),
  '4347': at('WOODCUTTER', 'WHEAT_FIELD', 'IRON_MINE'),
  '3447': at('WHEAT_FIELD', 'CLAY_PIT', 'IRON_MINE'),
  '3339': at('WHEAT_FIELD', 'WHEAT_FIELD', 'WHEAT_FIELD'),

  // “mostly wheat” exceptions, build them directly
  '11115': new Map<number, Building['id']>([
    [1, 'WHEAT_FIELD'],
    [2, 'WHEAT_FIELD'],
    [3, 'WOODCUTTER'],
    [4, 'IRON_MINE'],
    [5, 'WHEAT_FIELD'],
    [6, 'WHEAT_FIELD'],
    [7, 'WHEAT_FIELD'],
    [8, 'WHEAT_FIELD'],
    [9, 'WHEAT_FIELD'],
    [10, 'WHEAT_FIELD'],
    [11, 'WHEAT_FIELD'],
    [12, 'WHEAT_FIELD'],
    [13, 'WHEAT_FIELD'],
    [14, 'WHEAT_FIELD'],
    [15, 'WHEAT_FIELD'],
    [16, 'CLAY_PIT'],
    [17, 'WHEAT_FIELD'],
    [18, 'WHEAT_FIELD'],
  ]),

  '00018': new Map<number, Building['id']>([
    [1, 'WHEAT_FIELD'],
    [2, 'WHEAT_FIELD'],
    [3, 'WHEAT_FIELD'],
    [4, 'WHEAT_FIELD'],
    [5, 'WHEAT_FIELD'],
    [6, 'WHEAT_FIELD'],
    [7, 'WHEAT_FIELD'],
    [8, 'WHEAT_FIELD'],
    [9, 'WHEAT_FIELD'],
    [10, 'WHEAT_FIELD'],
    [11, 'WHEAT_FIELD'],
    [12, 'WHEAT_FIELD'],
    [13, 'WHEAT_FIELD'],
    [14, 'WHEAT_FIELD'],
    [15, 'WHEAT_FIELD'],
    [16, 'WHEAT_FIELD'],
    [17, 'WHEAT_FIELD'],
    [18, 'WHEAT_FIELD'],
  ]),
};

const getResourceFieldComposition = (
  resourceFieldComposition: ResourceFieldComposition,
): ResourceFieldMap => {
  return resourceFieldsLayouts[resourceFieldComposition];
};

const tribeToWallBuildingIdMap = new Map<Tribe, Building['id']>([
  ['romans', 'ROMAN_WALL'],
  ['gauls', 'GAUL_WALL'],
  ['teutons', 'TEUTONIC_WALL'],
  ['huns', 'HUN_WALL'],
  ['egyptians', 'EGYPTIAN_WALL'],
  ['spartans', 'SPARTAN_WALL'],
  ['vikings', 'VIKING_WALL'],
  ['nature', 'NATURE_WALL'],
  ['natars', 'NATAR_WALL'],
]);

const getWallBuildingId = (tribe: Tribe): Building['id'] => {
  return tribeToWallBuildingIdMap.get(tribe)!;
};

const villageSizeToWallLevelMap = new Map<VillageSize | 'player', number>([
  ['player', 0],
  ['xxs', 5],
  ['xs', 5],
  ['sm', 10],
  ['md', 15],
  ['lg', 20],
  ['xl', 20],
  ['2xl', 20],
  ['3xl', 20],
  ['4xl', 20],
]);

const getWallBuildingLevel = (villageSize: VillageSize | 'player'): number => {
  return villageSizeToWallLevelMap.get(villageSize)!;
};

const villageSizeToResourceFieldsLevelMap = new Map<
  VillageSize | 'player',
  number
>([
  ['player', 0],
  ['xxs', 3],
  ['xs', 4],
  ['sm', 6],
  ['md', 8],
  ['lg', 10],
  ['xl', 12],
  ['2xl', 14],
  ['3xl', 16],
  ['4xl', 18],
]);

const getResourceBuildingsLevel = (
  villageSize: VillageSize | 'player',
): number => {
  return villageSizeToResourceFieldsLevelMap.get(villageSize)!;
};

const villageSizeToVillageBuildingFieldsMap = new Map<
  VillageSize | 'player',
  BuildingField[]
>([
  [
    'player',
    [
      { field_id: 39, building_id: 'RALLY_POINT', level: 1 },
      { field_id: 26, building_id: 'MAIN_BUILDING', level: 1 },
    ],
  ],
  [
    'xxs',
    [
      { field_id: 39, building_id: 'RALLY_POINT', level: 1 },
      { field_id: 26, building_id: 'MAIN_BUILDING', level: 1 },
    ],
  ],
  [
    'xs',
    [
      { field_id: 39, building_id: 'RALLY_POINT', level: 1 },
      { field_id: 26, building_id: 'MAIN_BUILDING', level: 1 },
    ],
  ],
  [
    'sm',
    [
      { field_id: 39, building_id: 'RALLY_POINT', level: 1 },
      { field_id: 26, building_id: 'MAIN_BUILDING', level: 1 },
    ],
  ],
  [
    'md',
    [
      { field_id: 39, building_id: 'RALLY_POINT', level: 1 },
      { field_id: 26, building_id: 'MAIN_BUILDING', level: 1 },
    ],
  ],
  [
    'lg',
    [
      { field_id: 39, building_id: 'RALLY_POINT', level: 1 },
      { field_id: 26, building_id: 'MAIN_BUILDING', level: 1 },
    ],
  ],
  [
    'xl',
    [
      { field_id: 39, building_id: 'RALLY_POINT', level: 1 },
      { field_id: 26, building_id: 'MAIN_BUILDING', level: 1 },
    ],
  ],
  [
    '2xl',
    [
      { field_id: 39, building_id: 'RALLY_POINT', level: 1 },
      { field_id: 26, building_id: 'MAIN_BUILDING', level: 1 },
    ],
  ],
  [
    '3xl',
    [
      { field_id: 39, building_id: 'RALLY_POINT', level: 1 },
      { field_id: 26, building_id: 'MAIN_BUILDING', level: 1 },
    ],
  ],
  [
    '4xl',
    [
      { field_id: 39, building_id: 'RALLY_POINT', level: 1 },
      { field_id: 26, building_id: 'MAIN_BUILDING', level: 1 },
    ],
  ],
]);

const getVillageBuildingFields = (
  villageSize: VillageSize | 'player',
): BuildingField[] => {
  return villageSizeToVillageBuildingFieldsMap.get(villageSize)!;
};

export const buildingFieldsFactory = (
  villageSize: VillageSize | 'player',
  tribe: Tribe,
  resourceFieldComposition: ResourceFieldComposition,
): BuildingField[] => {
  const wallBuildingLevel = getWallBuildingLevel(villageSize);
  const wallBuildingId = getWallBuildingId(tribe);
  const resourceBuildingsLevel = getResourceBuildingsLevel(villageSize);
  const rfc = getResourceFieldComposition(resourceFieldComposition);
  const villageBuildingFields = getVillageBuildingFields(villageSize);

  return [
    // Resource fields
    ...Array.from(
      rfc,
      ([buildingFieldId, buildingId]) =>
        ({
          building_id: buildingId,
          level: resourceBuildingsLevel,
          field_id: buildingFieldId,
        }) satisfies BuildingField,
    ),
    // Village fields
    ...villageBuildingFields,
    // Wall
    { building_id: wallBuildingId, field_id: 40, level: wallBuildingLevel },
  ];
};

/**
 * Creates building fields for a World Wonder village.
 * WW villages have 14 fields total:
 * - Fields 1-6: Resource fields (wood, clay, iron, crop)
 * - Fields 7-13: Buildings (warehouse, granary, rally point, etc.)
 * - Field 35: WonderOfTheWorld (WORLD_WONDER) at level 0
 * - NO wall (field 40)
 */
export const wwVillageFieldsFactory = (): BuildingField[] => {
  return [
    // Resource fields (6 total)
    { field_id: 1, building_id: 'WOODCUTTER', level: 10 },
    { field_id: 2, building_id: 'CLAY_PIT', level: 10 },
    { field_id: 3, building_id: 'IRON_MINE', level: 10 },
    { field_id: 4, building_id: 'WHEAT_FIELD', level: 10 },
    { field_id: 5, building_id: 'WOODCUTTER', level: 10 },
    { field_id: 6, building_id: 'CLAY_PIT', level: 10 },
    // Village buildings (7 total)
    { field_id: 7, building_id: 'WAREHOUSE', level: 5 },
    { field_id: 8, building_id: 'GRANARY', level: 5 },
    { field_id: 9, building_id: 'RALLY_POINT', level: 1 },
    { field_id: 10, building_id: 'MAIN_BUILDING', level: 1 },
    { field_id: 11, building_id: 'MARKETPLACE', level: 1 },
    { field_id: 12, building_id: 'SMITHY', level: 1 },
    { field_id: 13, building_id: 'ACADEMY', level: 1 },
    // World Wonder building on slot 35 (level 0 — Natars build it up)
    { field_id: 35, building_id: 'WORLD_WONDER', level: 0 },
  ];
};
