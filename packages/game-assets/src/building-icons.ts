import type { BuildingId } from '@pillage-first/types/models/building';
import type { TimeOfDay } from '@pillage-first/types/models/preferences';
import type { Resource } from '@pillage-first/types/models/resource';
import type { Tribe } from '@pillage-first/types/models/tribe';

export const BUILDINGS_BASE_PATH = '/graphic-packs' as const;

export const TRIBE_FOLDER_NAMES: Record<Tribe, string> = {
  romans: 'roman',
  teutons: 'teuton',
  gauls: 'gaul',
  egyptians: 'egyptian',
  huns: 'hun',
  spartans: 'spartan',
  vikings: 'viking',
  natars: 'natar',
  nature: 'nature',
} as const;

export const WALL_GID_MAP: Record<string, string> = {
  roman: '31',
  teuton: '32',
  gaul: '33',
  egyptian: '32',
  hun: '32',
  spartan: '47',
  viking: '50',
  natar: '32',
};

export function getWallBuildingIdForTribe(tribe: Tribe): string {
  return TRIBE_FOLDER_NAMES[tribe];
}

export type BuildingImageSize = 'small' | 'medium' | 'big';

export const RESOURCE_BUILDING_IDS = [
  'WOODCUTTER',
  'CLAY_PIT',
  'IRON_MINE',
  'WHEAT_FIELD',
] as const;

export type ResourceBuildingId = (typeof RESOURCE_BUILDING_IDS)[number];

export const RESOURCE_BUILDING_FIELD_NUMBERS: Record<
  ResourceBuildingId,
  number
> = {
  WOODCUTTER: 5,
  CLAY_PIT: 6,
  IRON_MINE: 7,
  WHEAT_FIELD: 8,
};

export const RESOURCE_BUILDING_TO_RESOURCE: Record<
  ResourceBuildingId,
  Resource
> = {
  WOODCUTTER: 'wood',
  CLAY_PIT: 'clay',
  IRON_MINE: 'iron',
  WHEAT_FIELD: 'wheat',
};

export const BUILDING_ICON_SIZES: Record<
  BuildingImageSize,
  { width: number; height: number }
> = {
  small: { width: 16, height: 16 },
  medium: { width: 26, height: 26 },
  big: { width: 200, height: 200 },
};

export function isResourceBuilding(
  buildingId: BuildingId,
): buildingId is ResourceBuildingId {
  return RESOURCE_BUILDING_IDS.includes(buildingId as ResourceBuildingId);
}

const BUILDING_ICON_TYPE_MAP: Record<string, number> = {
  SAWMILL: 5,
  BRICKYARD: 6,
  IRON_FOUNDRY: 7,
  GRAIN_MILL: 8,
  BAKERY: 9,
  WAREHOUSE: 10,
  GRANARY: 11,
  SMITHY: 13,
  TOURNAMENT_SQUARE: 14,
  MAIN_BUILDING: 15,
  RALLY_POINT: 16,
  MARKETPLACE: 17,
  EMBASSY: 18,
  BARRACKS: 19,
  STABLE: 20,
  WORKSHOP: 21,
  HOSPITAL: 46,
  ACADEMY: 22,
  CRANNY: 23,
  TOWN_HALL: 24,
  RESIDENCE: 25,
  TREASURY: 27,
  TRADE_OFFICE: 28,
  GREAT_BARRACKS: 29,
  GREAT_STABLE: 30,
  ROMAN_WALL: 31,
  TEUTONIC_WALL: 32,
  GAUL_WALL: 33,
  EGYPTIAN_WALL: 42,
  HUN_WALL: 43,
  SPARTAN_WALL: 47,
  VIKING_WALL: 50,
  NATURE_WALL: 32,
  NATAR_WALL: 31,
  GREAT_WAREHOUSE: 38,
  GREAT_GRANARY: 39,
  HEROS_MANSION: 37,
  HORSE_DRINKING_TROUGH: 41,
  TRAPPER: 36,
  BREWERY: 35,
  COMMAND_CENTER: 44,
  WATERWORKS: 45,
};

const BUILDING_GID_MAP: Record<string, string> = {
  SAWMILL: '5',
  BRICKYARD: '6',
  IRON_FOUNDRY: '7',
  GRAIN_MILL: '8',
  BAKERY: '9',
  WAREHOUSE: '10',
  GRANARY: '11',
  SMITHY: '13',
  TOURNAMENT_SQUARE: '14',
  MAIN_BUILDING: '15',
  RALLY_POINT: '16',
  MARKETPLACE: '17',
  EMBASSY: '18',
  BARRACKS: '19',
  STABLE: '20',
  WORKSHOP: '21',
  HOSPITAL: '46',
  ACADEMY: '22',
  CRANNY: '23',
  TOWN_HALL: '24',
  RESIDENCE: '25',
  TREASURY: '27',
  TRADE_OFFICE: '28',
  GREAT_BARRACKS: '29',
  GREAT_STABLE: '30',
  ROMAN_WALL: '31',
  TEUTONIC_WALL: '32',
  GAUL_WALL: '33',
  EGYPTIAN_WALL: '42',
  HUN_WALL: '43',
  SPARTAN_WALL: '47',
  VIKING_WALL: '50',
  NATURE_WALL: '32',
  NATAR_WALL: '31',
  GREAT_WAREHOUSE: '38',
  GREAT_GRANARY: '39',
  HEROS_MANSION: '37',
  HORSE_DRINKING_TROUGH: '41',
  TRAPPER: '36',
  BREWERY: '35',
  COMMAND_CENTER: '44',
  WATERWORKS: '45',
};

const DEFAULT_BUILDING_GID = '0';

const BUILDING_ICON_SUFFIX_MAP: Record<string, string> = {
  BREWERY: 'brewery',
};

const TRIBE_OVERRIDES_FOR_BUILDING_ICON: Partial<Record<BuildingId, Tribe>> =
  {};

export function getBuildingIconPath(
  tribe: Tribe,
  buildingId: BuildingId,
  size: BuildingImageSize = 'small',
  theme: TimeOfDay = 'day',
): string {
  const tribeFolder = TRIBE_FOLDER_NAMES[tribe];

  if (isResourceBuilding(buildingId)) {
    const fieldNumber = RESOURCE_BUILDING_FIELD_NUMBERS[buildingId];
    return `${BUILDINGS_BASE_PATH}/${theme}/buildings/${tribeFolder}/icon/type${fieldNumber}_${size}.png`;
  }

  const typeNumber = BUILDING_ICON_TYPE_MAP[buildingId];
  if (typeNumber !== undefined) {
    const iconTribe = TRIBE_OVERRIDES_FOR_BUILDING_ICON[buildingId] ?? tribe;
    const iconFolder = TRIBE_FOLDER_NAMES[iconTribe];
    const suffix = BUILDING_ICON_SUFFIX_MAP[buildingId];
    const suffixPart = suffix ? `_${suffix}` : '';
    return `${BUILDINGS_BASE_PATH}/${theme}/buildings/${iconFolder}/icon/type${typeNumber}${suffixPart}_${size}.png`;
  }

  return `${BUILDINGS_BASE_PATH}/${theme}/buildings/default/icon/generic_${size}.png`;
}

export function getBuildingBigImagePath(
  tribe: Tribe,
  buildingId: BuildingId,
  theme: TimeOfDay = 'day',
): string {
  const tribeFolder = TRIBE_FOLDER_NAMES[tribe];

  if (isResourceBuilding(buildingId)) {
    const fieldNumber = RESOURCE_BUILDING_FIELD_NUMBERS[buildingId];
    return `${BUILDINGS_BASE_PATH}/${theme}/buildings/${tribeFolder}/big/g${fieldNumber}.png`;
  }

  const gid = BUILDING_GID_MAP[buildingId] ?? DEFAULT_BUILDING_GID;
  const iconTribe = TRIBE_OVERRIDES_FOR_BUILDING_ICON[buildingId] ?? tribe;
  const imageFolder = TRIBE_FOLDER_NAMES[iconTribe];
  return `${BUILDINGS_BASE_PATH}/${theme}/buildings/${imageFolder}/big/g${gid}.png`;
}

export function getBuildingVillageImagePath(
  tribe: Tribe,
  buildingId: BuildingId,
  theme: TimeOfDay = 'day',
): string {
  const tribeFolder = TRIBE_FOLDER_NAMES[tribe];
  const gid = BUILDING_GID_MAP[buildingId] ?? DEFAULT_BUILDING_GID;
  return `${BUILDINGS_BASE_PATH}/${theme}/buildings/${tribeFolder}/g${gid}.png`;
}
