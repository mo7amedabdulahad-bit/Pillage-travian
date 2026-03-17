import type { TimeOfDay } from '@pillage-first/types/models/preferences';
import type { Tribe } from '@pillage-first/types/models/tribe';
import {
  BUILDINGS_BASE_PATH,
  getWallBuildingIdForTribe,
  TRIBE_FOLDER_NAMES,
  WALL_GID_MAP,
} from './building-icons';

export const VILLAGE_BG_BASE_PATH = '/graphic-packs' as const;

export type VillageVariant =
  | 'default'
  | 'city'
  | 'shore'
  | 'city_watchTowers'
  | 'shore_city'
  | 'shore_city_watchTowers';

export function getVillageBackgroundPath(
  theme: TimeOfDay = 'day',
  variant: VillageVariant = 'default',
): string {
  const variantSuffix = variant === 'default' ? '' : `_${variant}`;
  return `${VILLAGE_BG_BASE_PATH}/${theme}/backgrounds/bgBuildings${variantSuffix}.jpg`;
}

export function getWallTopPath(
  tribe: Tribe,
  variant: VillageVariant = 'default',
  theme: TimeOfDay = 'day',
): string {
  const gid = WALL_GID_MAP[getWallBuildingIdForTribe(tribe)];
  const tribeFolder = TRIBE_FOLDER_NAMES[tribe];
  const variantSuffix = variant === 'default' ? '' : `_${variant}`;
  return `${BUILDINGS_BASE_PATH}/${theme}/buildings/${tribeFolder}/g${gid}Top${variantSuffix}.png`;
}

export function getWallBottomPath(
  tribe: Tribe,
  variant: VillageVariant = 'default',
  theme: TimeOfDay = 'day',
): string {
  const gid = WALL_GID_MAP[getWallBuildingIdForTribe(tribe)];
  const tribeFolder = TRIBE_FOLDER_NAMES[tribe];
  const variantSuffix = variant === 'default' ? '' : `_${variant}`;
  return `${BUILDINGS_BASE_PATH}/${theme}/buildings/${tribeFolder}/g${gid}Bottom${variantSuffix}.png`;
}

export function getVillageAssets(
  tribe: Tribe,
  theme: TimeOfDay = 'day',
  variant: VillageVariant = 'default',
) {
  return {
    background: getVillageBackgroundPath(theme, variant),
    wallTop: getWallTopPath(tribe, variant, theme),
    wallBottom: getWallBottomPath(tribe, variant, theme),
  };
}
