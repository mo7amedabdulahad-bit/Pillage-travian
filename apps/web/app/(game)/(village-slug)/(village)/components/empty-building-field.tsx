import { Link } from 'react-router';
import type { BuildingField as BuildingFieldType } from '@pillage-first/types/models/building-field';
import type { Tribe } from '@pillage-first/types/models/tribe';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';

type EmptyBuildingFieldProps = {
  buildingFieldId: BuildingFieldType['id'];
};

const getTribeClass = (tribeValue: Tribe): string => {
  const tribeMap: Record<Tribe, string> = {
    teutons: 'teuton',
    gauls: 'gaul',
    romans: 'roman',
    egyptians: 'egyptian',
    huns: 'hun',
    spartans: 'spartan',
    nature: 'nature',
    natars: 'natars',
  };
  return tribeMap[tribeValue] || 'teuton';
};

export const EmptyBuildingField = ({
  buildingFieldId,
}: EmptyBuildingFieldProps) => {
  const tribe = useTribe();

  return (
    <Link
      to={`${buildingFieldId}`}
      tabIndex={0}
      data-building-field-id={buildingFieldId}
      data-aid={buildingFieldId}
      data-gid="0"
      data-level="0"
      data-building-id={buildingFieldId}
      data-name=""
      className={`building-slot a${buildingFieldId} g0 aid${buildingFieldId} emptyBuildingSlot ${getTribeClass(tribe)} w-12 lg:w-20 h-8 lg:h-12 bg-green-900/50 hover:bg-green-800/70 transition-colors duration-150 focus:ring-2 focus:ring-black/80 dark:focus:ring-ring cursor-pointer`}
      style={{
        clipPath: 'ellipse(50% 50% at 50% 50%)',
      }}
    />
  );
};
