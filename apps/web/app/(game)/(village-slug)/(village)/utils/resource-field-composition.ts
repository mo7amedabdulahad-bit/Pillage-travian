import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';

export const resourceFieldCompositionToFieldNumber: Record<
  ResourceFieldComposition,
  1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
> = {
  '3339': 1,
  '3456': 2,
  '4446': 3,
  '4536': 4,
  '5346': 5,
  '11115': 6,
  '4437': 7,
  '3447': 8,
  '4347': 9,
  '3546': 10,
  '4356': 11,
  '5436': 12,
  '00018': 13,
};

export const getResourceFieldImageNumber = (
  composition: ResourceFieldComposition,
): number => {
  return resourceFieldCompositionToFieldNumber[composition];
};
