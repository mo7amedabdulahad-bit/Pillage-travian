import type { BuildingId } from '@pillage-first/types/models/building';
import type { Tribe } from '@pillage-first/types/models/tribe';

export const BUILDINGS_BASE_PATH = '/graphic-packs/day/buildings' as const;

export const TRIBE_FOLDER_NAMES: Record<Tribe, string> = {
  romans: 'roman',
  teutons: 'teuton',
  gauls: 'gaul',
  egyptians: 'egyptian',
  huns: 'hun',
  spartans: 'spartan',
  natars: 'natar',
  nature: 'nature',
} as const;

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

export function getBuildingIconPath(
  tribe: Tribe,
  buildingId: BuildingId,
  size: BuildingImageSize = 'small',
): string {
  const tribeFolder = TRIBE_FOLDER_NAMES[tribe];

  if (!isResourceBuilding(buildingId)) {
    return `${BUILDINGS_BASE_PATH}/default/icon/type0_${size}.png`;
  }

  const fieldNumber = RESOURCE_BUILDING_FIELD_NUMBERS[buildingId];
  return `${BUILDINGS_BASE_PATH}/${tribeFolder}/icon/type${fieldNumber}_${size}.png`;
}

export function getBuildingBigImagePath(
  tribe: Tribe,
  buildingId: BuildingId,
): string {
  const tribeFolder = TRIBE_FOLDER_NAMES[tribe];

  if (!isResourceBuilding(buildingId)) {
    return `${BUILDINGS_BASE_PATH}/default/big/g0.png`;
  }

  const fieldNumber = RESOURCE_BUILDING_FIELD_NUMBERS[buildingId];
  return `${BUILDINGS_BASE_PATH}/${tribeFolder}/big/g${fieldNumber}.png`;
}