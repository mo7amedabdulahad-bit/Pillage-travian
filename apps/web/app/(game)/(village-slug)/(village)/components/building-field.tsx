import { clsx } from 'clsx';
import { getBuildingFieldByBuildingFieldId } from '@pillage-first/game-assets/utils/buildings';
import type { BuildingField as BuildingFieldType } from '@pillage-first/types/models/building-field';
import { EmptyBuildingField } from 'app/(game)/(village-slug)/(village)/components/empty-building-field';
import { OccupiedBuildingField } from 'app/(game)/(village-slug)/(village)/components/occupied-building-field';
import { useHoverContext } from 'app/(game)/(village-slug)/(village)/components/resource-field-canvas';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import buildingFieldStyles from './building-field.module.scss';

type BuildingFieldProps = {
  buildingFieldId: BuildingFieldType['id'];
};

export const BuildingField = ({ buildingFieldId }: BuildingFieldProps) => {
  const { currentVillage } = useCurrentVillage();
  const { setHoveredSlot } = useHoverContext();

  const buildingField = getBuildingFieldByBuildingFieldId(
    currentVillage,
    buildingFieldId,
  );

  const positioningStyles =
    buildingFieldStyles[`building-field--${buildingFieldId}`];

  const handleMouseEnter = () => {
    if (buildingFieldId <= 18) {
      setHoveredSlot(buildingFieldId);
    }
  };

  const handleMouseLeave = () => {
    if (buildingFieldId <= 18) {
      setHoveredSlot(null);
    }
  };

  return (
    <div
      className={clsx(
        positioningStyles,
        'absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2',
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {buildingField === null ? (
        <EmptyBuildingField buildingFieldId={buildingFieldId} />
      ) : (
        <OccupiedBuildingField buildingField={buildingField} />
      )}
    </div>
  );
};
