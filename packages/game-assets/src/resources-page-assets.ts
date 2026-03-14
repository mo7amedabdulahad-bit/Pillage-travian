import type { TimeOfDay } from '@pillage-first/types/models/preferences';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import type { Tribe } from '@pillage-first/types/models/tribe';

export const RESOURCE_FIELD_BG_BASE_PATH = '/graphic-packs' as const;

export const TRIBE_TO_VID_COMMENT = `
Village Center ID (vid) mapping:
- vid1 = Romans
- vid2 = Teutons
- vid3 = Gauls
- vid6 = Egyptians
- vid7 = Huns
- vid8 = Natars (NPC tribe)
- vid9 = Spartans
`;

export const resourceFieldCompositionToImageNumber: Record<
  ResourceFieldComposition,
  number
> = {
  '5436': 1,
  '5346': 2,
  '4446': 3,
  '4536': 4,
  '3546': 5,
  '4356': 6,
  '3456': 7,
  '4437': 8,
  '4347': 9,
  '3447': 10,
  '3339': 11,
  '11115': 12,
  '00018': 13,
};

export const tribeToVillageCenterId: Record<Tribe, number> = {
  romans: 1,
  teutons: 2,
  gauls: 3,
  egyptians: 6,
  huns: 7,
  spartans: 9,
  nature: 1,
  natars: 8,
};

export const villageCenterIds = [1, 2, 3, 6, 7, 8, 9] as const;

export function getResourceFieldImagePath(
  resourceFieldComposition: ResourceFieldComposition,
  theme: TimeOfDay = 'day',
): string {
  const fieldNumber =
    resourceFieldCompositionToImageNumber[resourceFieldComposition];
  return `${RESOURCE_FIELD_BG_BASE_PATH}/${theme}/resource-fields/resourceField${fieldNumber}.png`;
}

export function getVillageCenterImagePath(
  tribe: Tribe,
  theme: TimeOfDay = 'day',
): string {
  const villageCenterId = tribeToVillageCenterId[tribe];
  return `${RESOURCE_FIELD_BG_BASE_PATH}/${theme}/resource-fields/tribe-center/villageCenter_vid${villageCenterId}.png`;
}

export const RESOURCE_FIELDS_IMAGE_PATHS: Record<
  TimeOfDay,
  Record<number, string>
> = {
  day: {
    1: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/resourceField1.png`,
    2: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/resourceField2.png`,
    3: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/resourceField3.png`,
    4: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/resourceField4.png`,
    5: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/resourceField5.png`,
    6: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/resourceField6.png`,
    7: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/resourceField7.png`,
    8: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/resourceField8.png`,
    9: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/resourceField9.png`,
    10: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/resourceField10.png`,
    11: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/resourceField11.png`,
    12: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/resourceField12.png`,
    13: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/resourceField13.png`,
  },
  night: {
    1: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/resourceField1.png`,
    2: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/resourceField2.png`,
    3: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/resourceField3.png`,
    4: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/resourceField4.png`,
    5: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/resourceField5.png`,
    6: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/resourceField6.png`,
    7: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/resourceField7.png`,
    8: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/resourceField8.png`,
    9: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/resourceField9.png`,
    10: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/resourceField10.png`,
    11: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/resourceField11.png`,
    12: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/resourceField12.png`,
    13: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/resourceField13.png`,
  },
};

export const VILLAGE_CENTER_IMAGE_PATHS: Record<
  TimeOfDay,
  Record<number, string>
> = {
  day: {
    1: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/tribe-center/villageCenter_vid1.png`,
    2: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/tribe-center/villageCenter_vid2.png`,
    3: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/tribe-center/villageCenter_vid3.png`,
    6: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/tribe-center/villageCenter_vid6.png`,
    7: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/tribe-center/villageCenter_vid7.png`,
    8: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/tribe-center/villageCenter_vid8.png`,
    9: `${RESOURCE_FIELD_BG_BASE_PATH}/day/resource-fields/tribe-center/villageCenter_vid9.png`,
  },
  night: {
    1: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/tribe-center/villageCenter_vid1.png`,
    2: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/tribe-center/villageCenter_vid2.png`,
    3: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/tribe-center/villageCenter_vid3.png`,
    6: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/tribe-center/villageCenter_vid6.png`,
    7: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/tribe-center/villageCenter_vid7.png`,
    8: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/tribe-center/villageCenter_vid8.png`,
    9: `${RESOURCE_FIELD_BG_BASE_PATH}/night/resource-fields/tribe-center/villageCenter_vid9.png`,
  },
};

export type ResourcePageAssets = {
  resourceFieldBackground: string;
  villageCenter: string;
  theme: TimeOfDay;
};

export function getResourcePageAssets(
  resourceFieldComposition: ResourceFieldComposition,
  tribe: Tribe,
  theme: TimeOfDay = 'day',
): ResourcePageAssets {
  return {
    resourceFieldBackground: getResourceFieldImagePath(
      resourceFieldComposition,
      theme,
    ),
    villageCenter: getVillageCenterImagePath(tribe, theme),
    theme,
  };
}
