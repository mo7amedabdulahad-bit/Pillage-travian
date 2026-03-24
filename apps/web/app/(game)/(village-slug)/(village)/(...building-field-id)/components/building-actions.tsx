import { startTransition, use, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  getBuildingDataForLevel,
  getBuildingFieldByBuildingFieldId,
} from '@pillage-first/game-assets/utils/buildings';
import type { Building } from '@pillage-first/types/models/building';
import { BuildingCardContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-card';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';
import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { assessBuildingConstructionReadiness } from 'app/(game)/(village-slug)/(village)/utils/building-requirements';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag.tsx';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  useBuildingConstructionStatus,
  useBuildingUpgradeStatus,
} from 'app/(game)/(village-slug)/hooks/use-building-level-change-status';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';

type BuildingCardActionsSectionProps = {
  buildingId: Building['id'];
  onBuildingConstruction: () => void;
};

const BuildingCardActionsConstruction = ({
  buildingId,
  onBuildingConstruction,
}: BuildingCardActionsSectionProps) => {
  const { t } = useTranslation();
  const { buildingFieldId } = use(BuildingFieldContext);
  const { errors } = useBuildingConstructionStatus(buildingId, buildingFieldId);

  return (
    <>
      <ErrorBag errorBag={errors} />
      <Button
        data-testid="building-actions-construct-building-button"
        variant="default"
        size="fit"
        onClick={onBuildingConstruction}
        disabled={errors.length > 0}
      >
        {t('Construct')}
      </Button>
    </>
  );
};

type BuildingCardActionsUpgradeProps = {
  onBuildingUpgrade: () => void;
  buildingLevel: number;
};

const BuildingCardActionsUpgrade = ({
  onBuildingUpgrade,
  buildingLevel,
}: BuildingCardActionsUpgradeProps) => {
  const { t } = useTranslation();
  const { buildingFieldId } = use(BuildingFieldContext);
  const { currentVillage } = useCurrentVillage();

  const buildingField = getBuildingFieldByBuildingFieldId(
    currentVillage,
    buildingFieldId,
  );

  const { errors } = useBuildingUpgradeStatus(buildingField!);

  return (
    <>
      <ErrorBag errorBag={errors} />
      <Button
        data-testid="building-actions-upgrade-building-button"
        variant="default"
        size="fit"
        onClick={onBuildingUpgrade}
        disabled={errors.length > 0}
      >
        {t('Upgrade to level {{level}}', { level: buildingLevel + 1 })}
      </Button>
    </>
  );
};

export const BuildingActions = () => {
  const { t } = useTranslation();
  const { buildingId, buildingConstructionReadinessAssessment } =
    use(BuildingCardContext);
  const navigate = useNavigate();
  const tribe = useTribe();
  const { buildingFieldId } = use(BuildingFieldContext);
  const { preferences } = usePreferences();
  const { developerSettings } = useDeveloperSettings();
  const { maxLevelByBuildingId, buildingIdsInQueue } =
    use(BuildingFieldContext);
  const { constructBuilding, upgradeBuilding } = useBuildingActions(
    buildingId,
    buildingFieldId,
  );
  const { createEvent: createLevelChangeEvent } = useCreateEvent(
    'buildingLevelChange',
  );
  const { virtualLevel, doesBuildingExist } = useBuildingVirtualLevel(
    buildingId,
    buildingFieldId,
  );

  const { building, isMaxLevel } = getBuildingDataForLevel(
    buildingId,
    virtualLevel,
  );

  const upgradeToMaxLevel = useCallback(() => {
    if (preferences.isAutomaticNavigationAfterBuildingLevelChangeEnabled) {
      navigate('..', { relative: 'path' });
    }

    startTransition(() => {
      createLevelChangeEvent({
        buildingFieldId,
        buildingId,
        level: building.maxLevel,
        previousLevel: virtualLevel,
        cachesToClearImmediately: [playerVillagesCacheKey],
      });
    });
  }, [
    building.maxLevel,
    buildingFieldId,
    buildingId,
    virtualLevel,
    createLevelChangeEvent,
    navigate,
    preferences.isAutomaticNavigationAfterBuildingLevelChangeEnabled,
  ]);

  const navigateBack = async () => {
    await navigate('..', { relative: 'path' });
  };

  const { canBuild } =
    buildingConstructionReadinessAssessment ??
    assessBuildingConstructionReadiness({
      buildingId,
      tribe,
      maxLevelByBuildingId,
      buildingIdsInQueue,
    });

  const onBuildingConstruction = async () => {
    await navigateBack();
    startTransition(() => {
      constructBuilding();
    });
  };

  const onBuildingUpgrade = async () => {
    if (preferences.isAutomaticNavigationAfterBuildingLevelChangeEnabled) {
      await navigateBack();
    }

    startTransition(() => {
      upgradeBuilding();
    });
  };

  if (!doesBuildingExist) {
    if (!canBuild) {
      return null;
    }

    return (
      <section
        data-testid="building-actions-section"
        className="flex flex-col gap-2 pt-2 border-t border-border"
      >
        <Text as="h3">{t('Available actions')}</Text>
        <BuildingCardActionsConstruction
          buildingId={buildingId}
          onBuildingConstruction={onBuildingConstruction}
        />
      </section>
    );
  }

  if (isMaxLevel) {
    return null;
  }

  return (
    <section
      data-testid="building-actions-section"
      className="flex flex-col gap-2 pt-2 border-t border-border"
    >
      <Text as="h3">{t('Available actions')}</Text>
      <BuildingCardActionsUpgrade
        buildingLevel={virtualLevel}
        onBuildingUpgrade={onBuildingUpgrade}
      />
      {developerSettings.isMaxLevelUpgradeEnabled && (
        <Button
          data-testid="building-actions-max-level-button"
          variant="outline"
          size="fit"
          onClick={upgradeToMaxLevel}
        >
          {t('Upgrade to max level ({{level}})', {
            level: building.maxLevel,
          })}
        </Button>
      )}
    </section>
  );
};
