import { Activity, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ITooltip as ReactTooltipProps } from 'react-tooltip';
import { BuildingField } from 'app/(game)/(village-slug)/(village)/components/building-field';
import { ResourceFieldCanvas } from 'app/(game)/(village-slug)/(village)/components/resource-field-canvas';
import { VillageViewCanvas } from 'app/(game)/(village-slug)/(village)/components/village-view-canvas';
import { BuildingFieldTooltip } from 'app/(game)/(village-slug)/components/building-field-tooltip';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import layoutStyles from 'app/(game)/(village-slug)/layout.module.scss';
import { Tooltip } from 'app/components/tooltip';

const resourceViewBuildingFieldIds = Array.from(
  { length: 18 },
  (_, i) => i + 1,
);
const villageViewBuildingFieldIds = Array.from(
  { length: 22 },
  (_, i) => i + 19,
);

const VillagePage = (props: Route.ComponentProps) => {
  const { params, matches } = props;

  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const { currentVillage } = useCurrentVillage();

  const wallBuildingField = currentVillage.buildingFields.find(
    (bf) => bf.id === 40,
  );
  const wallLevel = wallBuildingField?.level ?? 0;
  const isWallBuilt = wallLevel > 0;

  const isResourcesPageOpen = matches.some(
    (match) => match?.id === 'resources-page',
  );
  const isVillagePageOpen = matches.some(
    (match) => match?.id === 'village-page',
  );

  const renderTooltip = useCallback(
    ({
      activeAnchor,
    }: Parameters<NonNullable<ReactTooltipProps['render']>>[0]) => {
      const id = activeAnchor?.getAttribute('data-building-field-id');
      if (!id) {
        return null;
      }

      return <BuildingFieldTooltip buildingFieldId={Number(id)} />;
    },
    [],
  );

  useEffect(() => {
    const resourcesClassName = layoutStyles['background-image--resources'];
    const villageClassName = layoutStyles['background-image--village'];

    document.body.classList.toggle(resourcesClassName, isResourcesPageOpen);
    document.body.classList.toggle(villageClassName, isVillagePageOpen);

    return () => {
      document.body.classList.remove(resourcesClassName, villageClassName);
    };
  }, [isResourcesPageOpen, isVillagePageOpen]);

  const title = `${isResourcesPageOpen ? t('Resources') : t('Village')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Tooltip
        anchorSelect="[data-building-field-id]"
        closeEvents={{
          mouseleave: true,
        }}
        hidden={!isWiderThanLg}
        render={renderTooltip}
      />
      <main className="flex flex-col items-center justify-center mx-auto lg:mt-20 lg:mb-0 max-h-[calc(100dvh-12rem)] standalone:max-h-[calc(100dvh-15rem)] h-screen lg:h-auto lg:max-h-none overflow-x-hidden">
        <div className="relative aspect-[16/9] scrollbar-hidden min-w-[460px] max-w-5xl w-full">
          {isResourcesPageOpen && (
            <ResourceFieldCanvas
              composition={currentVillage.resourceFieldComposition}
            >
              {/* biome-ignore lint/complexity/noUselessFragments: Fragment needed to satisfy ReactElement type */}
              <>
                {resourceViewBuildingFieldIds.map((buildingFieldId) => (
                  <BuildingField
                    key={buildingFieldId}
                    buildingFieldId={buildingFieldId}
                  />
                ))}
              </>
            </ResourceFieldCanvas>
          )}
        {isVillagePageOpen && (
          <VillageViewCanvas>
            {villageViewBuildingFieldIds.map((buildingFieldId) => (
              <Activity
                mode={isVillagePageOpen ? 'visible' : 'hidden'}
                key={buildingFieldId}
              >
                <BuildingField buildingFieldId={buildingFieldId} />
              </Activity>
            ))}
          </VillageViewCanvas>
        )}
        </div>
      </main>
    </>
  );
};

export default VillagePage;
