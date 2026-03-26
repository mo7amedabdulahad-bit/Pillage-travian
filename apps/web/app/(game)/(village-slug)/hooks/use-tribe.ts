import type { Tribe } from '@pillage-first/types/models/tribe';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';

export const useTribe = () => {
  const { currentVillage } = useCurrentVillage();

  return currentVillage.tribe as Tribe;
};
