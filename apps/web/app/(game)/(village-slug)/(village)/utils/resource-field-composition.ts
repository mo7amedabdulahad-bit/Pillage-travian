import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';

export const resourceFieldCompositionToFieldNumber: Record<
  ResourceFieldComposition,
  1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
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

export const getResourceFieldImageNumber = (
  composition: ResourceFieldComposition,
): number => {
  return resourceFieldCompositionToFieldNumber[composition];
};
