export const ICONS_BASE_PATH = '/graphic-packs/day/icons' as const;

export const RESOURCE_SPRITESHEET_PATHS = {
  small: `${ICONS_BASE_PATH}/resources/resources_small.png`,
  medium: `${ICONS_BASE_PATH}/resources/resources_medium.png`,
  large: `${ICONS_BASE_PATH}/resources/resources_large.png`,
} as const;

export type ResourceIconSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge';

export type Resource = 'wood' | 'clay' | 'iron' | 'wheat';

export const RESOURCE_ICON_PATHS: Record<
  Resource,
  Record<ResourceIconSize, string>
> = {
  wood: {
    tiny: `${ICONS_BASE_PATH}/resources/lumber_tiny.png`,
    small: `${ICONS_BASE_PATH}/resources/lumber_small.png`,
    medium: `${ICONS_BASE_PATH}/resources/lumber_medium.png`,
    large: `${ICONS_BASE_PATH}/resources/lumber_medium.png`,
    huge: `${ICONS_BASE_PATH}/resources/lumber_huge.png`,
  },
  clay: {
    tiny: `${ICONS_BASE_PATH}/resources/clay_tiny.png`,
    small: `${ICONS_BASE_PATH}/resources/clay_small.png`,
    medium: `${ICONS_BASE_PATH}/resources/clay_medium.png`,
    large: `${ICONS_BASE_PATH}/resources/clay_medium.png`,
    huge: `${ICONS_BASE_PATH}/resources/clay_huge.png`,
  },
  iron: {
    tiny: `${ICONS_BASE_PATH}/resources/iron_tiny.png`,
    small: `${ICONS_BASE_PATH}/resources/iron_small.png`,
    medium: `${ICONS_BASE_PATH}/resources/iron_medium.png`,
    large: `${ICONS_BASE_PATH}/resources/iron_medium.png`,
    huge: `${ICONS_BASE_PATH}/resources/iron_huge.png`,
  },
  wheat: {
    tiny: `${ICONS_BASE_PATH}/resources/crop_tiny.png`,
    small: `${ICONS_BASE_PATH}/resources/crop_small.png`,
    medium: `${ICONS_BASE_PATH}/resources/crop_medium.png`,
    large: `${ICONS_BASE_PATH}/resources/crop_medium.png`,
    huge: `${ICONS_BASE_PATH}/resources/crop_huge.png`,
  },
} as const;

export const RESOURCE_SPRITE_POSITIONS: Record<
  Resource,
  { x: string; y: string }
> = {
  wood: { x: '0%', y: '0%' },
  clay: { x: '33.333%', y: '0%' },
  iron: { x: '66.666%', y: '0%' },
  wheat: { x: '100%', y: '0%' },
} as const;

export const RESOURCE_SPRITE_DIMENSIONS: Record<
  'small' | 'medium' | 'large',
  { width: number; height: number; iconWidth: number }
> = {
  small: { width: 19, height: 16, iconWidth: 4.75 },
  medium: { width: 28, height: 24, iconWidth: 7 },
  large: { width: 47, height: 41, iconWidth: 11.75 },
} as const;

export function getResourceIconPath(
  resource: Resource,
  size: ResourceIconSize = 'medium',
): string {
  return RESOURCE_ICON_PATHS[resource][size];
}

export function getResourceSpritesheetPath(
  size: 'small' | 'medium' | 'large',
): string {
  return RESOURCE_SPRITESHEET_PATHS[size];
}
