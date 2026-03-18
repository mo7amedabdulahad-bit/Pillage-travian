import { clsx } from 'clsx';
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

const getTribeColors = (
  tribeValue: Tribe,
): { default: string; hover: string } => {
  const colorMap: Record<Tribe, { default: string; hover: string }> = {
    teutons: {
      default: 'rgba(44, 58, 11, 0.57)',
      hover: 'rgba(85, 96, 39, 0.57)',
    },
    romans: {
      default: 'rgba(60, 79, 86, 0.35)',
      hover: 'rgba(60, 79, 86, 0.23)',
    },
    gauls: {
      default: 'rgba(101, 115, 13, 0.57)',
      hover: 'rgba(206, 223, 100, 0.57)',
    },
    huns: {
      default: 'rgba(44, 58, 11, 0.57)',
      hover: 'rgba(85, 96, 39, 0.57)',
    }, // Defaulting to Teuton for now
    egyptians: {
      default: 'rgba(60, 79, 86, 0.35)',
      hover: 'rgba(60, 79, 86, 0.23)',
    }, // Defaulting to Roman for now
    spartans: {
      default: 'rgba(44, 58, 11, 0.57)',
      hover: 'rgba(85, 96, 39, 0.57)',
    },
    nature: {
      default: 'rgba(60, 79, 86, 0.35)',
      hover: 'rgba(60, 79, 86, 0.23)',
    },
    natars: {
      default: 'rgba(44, 58, 11, 0.57)',
      hover: 'rgba(85, 96, 39, 0.57)',
    },
  };
  return colorMap[tribeValue] || colorMap.teutons;
};

export const EmptyBuildingField = ({
  buildingFieldId,
}: EmptyBuildingFieldProps) => {
  const tribe = useTribe();
  const colors = getTribeColors(tribe);

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
      className={clsx(
        'building-slot g0 emptyBuildingSlot block w-full h-full cursor-pointer focus:outline-hidden group',
        `a${buildingFieldId}`,
        `aid${buildingFieldId}`,
        getTribeClass(tribe),
      )}
      style={
        {
          '--slot-default': colors.default,
          '--slot-hover': colors.hover,
        } as React.CSSProperties
      }
    >
      {/* Authentic Travian empty building slot SVG — small ellipse at bottom of 120x120 viewBox */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        className="buildingShape iso w-full h-full pointer-events-none"
      >
        <title>Empty Building Slot</title>
        <path
          d="M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z"
          className="pointer-events-auto transition-colors duration-150 fill-[var(--slot-default)] group-hover:fill-[var(--slot-hover)]"
        />
      </svg>
    </Link>
  );
};
