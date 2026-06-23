import type {
  Building,
  BuildingEffect,
} from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { Effect } from '@pillage-first/types/models/effect';
import type { Village } from '@pillage-first/types/models/village';
import { buildingMap } from '../buildings';

export const getBuildingDefinition = (buildingId: Building['id']): Building => {
  return buildingMap.get(buildingId)!;
};

type GetBuildingDataForLevelReturn = {
  building: Building;
  isMaxLevel: boolean;
  population: number;
  culturePoints: number;
  nextLevelPopulation: number;
  nextLevelCulturePoints: number;
  nextLevelResourceCost: number[];
  nextLevelBuildingDuration: number;
};

export const getBuildingDataForLevel = (
  buildingId: Building['id'],
  level: number,
): GetBuildingDataForLevelReturn => {
  const building = getBuildingDefinition(buildingId);

  const population = calculateTotalPopulationForLevel(buildingId, level);
  const culturePoints = calculateTotalCulturePointsForLevel(buildingId, level);

  const nextLevelPopulation = calculateTotalPopulationForLevel(
    buildingId,
    level + 1,
  );
  const nextLevelCulturePoints = calculateTotalCulturePointsForLevel(
    buildingId,
    level + 1,
  );

  const isMaxLevel = building.maxLevel === level;

  const nextLevelResourceCost = calculateBuildingCostForLevel(
    buildingId,
    level + 1,
  );
  const nextLevelBuildingDuration = calculateBuildingDurationForLevel(
    buildingId,
    level + 1,
  );

  return {
    building,
    isMaxLevel,
    population,
    culturePoints,
    nextLevelPopulation,
    nextLevelCulturePoints,
    nextLevelResourceCost,
    nextLevelBuildingDuration,
  };
};

export const calculatePopulationDifference = (
  buildingId: Building['id'],
  currentLevel: number,
  nextLevel: number,
): number => {
  const { population: currentPopulation } = getBuildingDataForLevel(
    buildingId,
    currentLevel,
  );
  const { population: nextPopulation } = getBuildingDataForLevel(
    buildingId,
    nextLevel,
  );

  return nextPopulation - currentPopulation;
};

export const getBuildingFieldByBuildingFieldId = (
  currentVillage: Village,
  buildingFieldId: BuildingField['id'],
): BuildingField | null => {
  return (
    currentVillage.buildingFields.find(
      ({ id: fieldId }) => buildingFieldId === fieldId,
    ) ?? null
  );
};

export type CalculatedCumulativeEffect = {
  effectId: Effect['id'];
  currentLevelValue: number;
  nextLevelValue: number;
  areEffectValuesRising: boolean;
  type: BuildingEffect['type'];
};

export const calculateBuildingEffectValues = (
  building: Building,
  level: number,
): CalculatedCumulativeEffect[] => {
  const result: CalculatedCumulativeEffect[] = [];

  for (const effect of building.effects) {
    const { effectId, valuesPerLevel } = effect;

    const currentLevelValue = valuesPerLevel[level];

    const areEffectValuesRising =
      valuesPerLevel.at(1)! < valuesPerLevel.at(-1)!;

    const nextLevelValue =
      level + 1 < valuesPerLevel.length ? valuesPerLevel[level + 1] : 0;

    result.push({
      effectId,
      currentLevelValue,
      nextLevelValue,
      areEffectValuesRising,
      type: effect.type,
    });
  }

  return result;
};

export const calculateBuildingCostForLevel = (
  buildingId: Building['id'],
  level: number,
): number[] => {
  const { buildingCostCoefficient, baseBuildingCost } =
    getBuildingDefinition(buildingId);

  return baseBuildingCost.map(
    (resource) =>
      Math.ceil((resource * buildingCostCoefficient ** (level - 1)) / 5) * 5,
  );
};

export const calculateBuildingCancellationRefundForLevel = (
  buildingId: Building['id'],
  level: number,
): number[] => {
  const buildingCost = calculateBuildingCostForLevel(buildingId, level);

  return buildingCost.map((cost) => Math.trunc(cost * 0.8));
};

export const calculateTotalCulturePointsForLevel = (
  buildingId: Building['id'],
  level: number,
): number => {
  const { culturePointsCoefficient } = getBuildingDefinition(buildingId);

  if (level === 0) {
    return 0;
  }

  return Math.round(culturePointsCoefficient * 1.2 ** level);
};

export const calculateTotalPopulationForLevel = (
  buildingId: Building['id'],
  level: number,
): number => {
  const { populationCoefficient } = getBuildingDefinition(buildingId);

  if (level <= 0) {
    return 0;
  }

  if (level === 1) {
    return populationCoefficient;
  }

  const C = 5 * populationCoefficient + 4;
  const q = Math.trunc(C / 10);
  const r = C - q * 10;

  const n1 = r + level;
  const K1 = Math.trunc(n1 / 10);
  const rem1 = n1 - K1 * 10;
  const F1 = 5 * K1 * K1 - 4 * K1 + K1 * rem1;

  const n0 = r + 1;
  const K0 = Math.trunc(n0 / 10);
  const rem0 = n0 - K0 * 10;
  const F0 = 5 * K0 * K0 - 4 * K0 + K0 * rem0;

  const S = F1 - F0;

  return populationCoefficient + (level - 1) * q + S;
};

// export const calculatePopulationDifferenceForLevel = (
//   buildingId: Building['id'],
//   level: number
// ): number => {
//   const { populationCoefficient } = getBuildingData(buildingId);
//
//   if (level === 1) {
//     return populationCoefficient;
//   }
//
//   return Math.round((5 * populationCoefficient + level - 1) / 10);
// };

export const calculateBuildingDurationForLevel = (
  buildingId: Building['id'],
  level: number,
): number => {
  const {
    buildingDurationBase,
    buildingDurationModifier,
    buildingDurationReduction,
  } = getBuildingDefinition(buildingId);

  return (
    Math.ceil(
      (buildingDurationModifier * buildingDurationBase ** (level - 1) -
        buildingDurationReduction) /
        5,
    ) *
    5 *
    1000
  );
};

// ─── World Wonder helpers ───
// The World Wonder uses a custom cost/time formula: baseCost * level^2.5
// and build time = 3600s * level / serverSpeed.
// These are separate from the generic building formula because the WW is
// intentionally a massive resource sink with linear time scaling.

/**
 * Calculate the resource cost for a World Wonder at a given level.
 * Formula: baseCost * level^2.5, where baseCost = 50000 per resource.
 *
 * Level 1  → ~50,000 each
 * Level 10 → ~1,581,000 each
 * Level 20 → ~8,944,000 each
 */
export const calculateWorldWonderCostForLevel = (level: number): number[] => {
  const factor = level ** 2.5;
  const base = 50_000;
  return [
    Math.ceil((base * factor) / 5) * 5,
    Math.ceil((base * factor) / 5) * 5,
    Math.ceil((base * factor) / 5) * 5,
    Math.ceil((base * factor) / 5) * 5,
  ];
};

/**
 * Calculate the build duration (in seconds, real-time) for a WW level upgrade.
 * Formula: 3600 * level / serverSpeed seconds.
 *
 * At 1x speed: L1 = 3600s (1h),  L20 = 72000s (20h)
 * At 10x speed: L1 = 360s (6min), L20 = 7200s (2h)
 * At 200x speed (Blitz): L1 = 18s,  L20 = 360s (6min)
 *
 * Returns milliseconds (consistent with calculateBuildingDurationForLevel).
 */
export const calculateWorldWonderDurationForLevel = (
  level: number,
  serverSpeed: number,
): number => {
  return Math.floor((3600 * level) / serverSpeed) * 1000;
};
