import { clsx } from 'clsx';
import { type AnchorHTMLAttributes, use, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getBuildingDefinition } from '@pillage-first/game-assets/utils/buildings';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField as BuildingFieldType } from '@pillage-first/types/models/building-field';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import type { Tribe } from '@pillage-first/types/models/tribe';
import buildingFieldStyles from 'app/(game)/(village-slug)/(village)/components/occupied-building-field.module.scss';
import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import { BuildingUpgradeIndicator } from 'app/(game)/(village-slug)/components/building-upgrade-indicator';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useBookmarks } from 'app/(game)/(village-slug)/hooks/use-bookmarks';
import { useBuildingUpgradeStatus } from 'app/(game)/(village-slug)/hooks/use-building-level-change-status';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import {
  BuildingUpgradeStatusContext,
  BuildingUpgradeStatusContextProvider,
} from 'app/(game)/(village-slug)/providers/building-upgrade-status-provider';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import { useLongPress } from 'app/hooks/use-long-press';

const TRIBE_FOLDER_NAMES: Record<Tribe, string> = {
  teutons: 'teuton',
  gauls: 'gaul',
  romans: 'roman',
  egyptians: 'egyptian',
  huns: 'hun',
  spartans: 'spartan',
  natars: 'natar',
  nature: 'nature',
};

const AVAILABLE_BUILDING_GIDS = [
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '32',
  '32Top',
  '32Bottom',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '40_0',
  '40_1',
  '40_2',
  '40_3',
  '40_4',
  '40_5',
  '46',
  '49',
];

const GID_MAP: Record<string, string> = {
  SAWMILL: '5',
  BRICKYARD: '6',
  IRON_FOUNDRY: '7',
  GRAIN_MILL: '8',
  BAKERY: '9',
  WAREHOUSE: '10',
  GRANARY: '11',
  BLACKSMITH: '12',
  ARMOURY: '13',
  STABLE: '14',
  WORKSHOP: '21',
  TOURNAMENT_SQUARE: '16',
  MAIN_BUILDING: '15',
  EMBASSY: '18',
  MARKETPLACE: '17',
  BARRACKS: '19',
  ACADEMY: '22',
  CRANNY: '23',
  TOWN_HALL: '24',
  RESIDENCE: '25',
  PALACE: '26',
  TREASURY: '27',
  TRADE_OFFICE: '28',
  GREAT_BARRACKS: '29',
  GREAT_STABLE: '30',
  CITY_WALL: '32',
  EARTH_WALL: '32',
  STONE_WALL: '32',
  PALISADE: '32',
  ST_MASONS_LODGE: '34',
  HORSE_DRINKING_TROUGH: '35',
  GREAT_WAREHOUSE: '36',
  GREAT_GRANARY: '37',
  WORLD_WONDER: '40',
  RALLY_POINT: '16',
  HOSPITAL: '21',
  WATERWORKS: '38',
  TRAPPER: '39',
  BREWERY: '41',
  COMMAND_CENTER: '42',
  SMITHY: '13',
  ROMAN_WALL: '32',
  SPARTAN_WALL: '32',
  TEUTONIC_WALL: '32',
  HEROS_MANSION: '37',
  HUN_WALL: '32',
  GAUL_WALL: '32',
  EGYPTIAN_WALL: '32',
  NATURE_WALL: '0',
  NATAR_WALL: '32',
  CLAY_PIT: '2',
  WHEAT_FIELD: '4',
  WOODCUTTER: '1',
  IRON_MINE: '3',
};

const WALL_BUILDING_IDS = [
  'CITY_WALL',
  'EARTH_WALL',
  'STONE_WALL',
  'PALISADE',
  'ROMAN_WALL',
  'SPARTAN_WALL',
  'TEUTONIC_WALL',
  'HUN_WALL',
  'GAUL_WALL',
  'EGYPTIAN_WALL',
  'NATAR_WALL',
];

const getGidFromBuildingId = (bid: string): string => {
  return GID_MAP[bid] || '0';
};

const isWallBuilding = (bid: string): boolean => {
  return WALL_BUILDING_IDS.includes(bid);
};

const getVillageBuildingImagePath = (tribe: Tribe, gid: string): string => {
  const tribeFolder = TRIBE_FOLDER_NAMES[tribe] || 'teuton';

  if (AVAILABLE_BUILDING_GIDS.includes(gid)) {
    if (gid === '32') {
      return `/graphic-packs/day/buildings/${tribeFolder}/g32Top.png`;
    }
    return `/graphic-packs/day/buildings/${tribeFolder}/g${gid}.png`;
  }

  const fallbackGids = ['15', '16', '17', '18', '19', '22', '23', '26', '34'];
  const fallbackGid =
    fallbackGids.find((fg) => AVAILABLE_BUILDING_GIDS.includes(fg)) || '26';

  return `/graphic-packs/day/buildings/${tribeFolder}/g${fallbackGid}.png`;
};

const transformBuildingIdIntoCssClass = (
  buildingId: Building['id'],
): string => {
  return buildingId.toLowerCase().replaceAll('_', '-');
};

type DynamicCellClassesArgs = {
  buildingField: BuildingFieldType;
  resourceFieldComposition: ResourceFieldComposition;
};

const dynamicCellClasses = ({
  buildingField,
  resourceFieldComposition,
}: DynamicCellClassesArgs): string => {
  const { buildingId, id } = buildingField;
  const isResourceField = id <= 18;

  if (isResourceField) {
    return clsx(
      buildingFieldStyles.building,
      `rfc-${resourceFieldComposition}`,
      buildingFieldStyles['building-resource'],
      buildingFieldStyles[`building-resource-${id}`],
    );
  }

  const buildingIdToCssClass = transformBuildingIdIntoCssClass(buildingId);

  return clsx(
    buildingFieldStyles.building,
    buildingFieldStyles[`building-village-${buildingIdToCssClass}`],
  );
};

type OccupiedBuildingFieldProps = {
  buildingField: BuildingFieldType;
};

export const OccupiedBuildingField = ({
  buildingField,
}: OccupiedBuildingFieldProps) => {
  const { t } = useTranslation();
  const { currentVillageBuildingEvents } = use(
    CurrentVillageBuildingQueueContext,
  );
  const { bookmarks } = useBookmarks();

  const { id: buildingFieldId, buildingId, level } = buildingField;

  const buildingDefinition = getBuildingDefinition(buildingId);
  const isMaxLevel = buildingDefinition.maxLevel === level;

  const tab = bookmarks[buildingId] ?? 'default';

  const currentBuildingFieldBuildingEvent = useMemo(() => {
    return currentVillageBuildingEvents.find(
      ({ buildingFieldId: buildingEventBuildingFieldId }) =>
        buildingEventBuildingFieldId === buildingFieldId,
    );
  }, [currentVillageBuildingEvents, buildingFieldId]);

  const content = (
    <OccupiedBuildingFieldContent
      buildingField={buildingField}
      currentBuildingFieldBuildingEvent={currentBuildingFieldBuildingEvent}
      tab={tab}
      canUpgrade={!isMaxLevel}
    />
  );

  if (isMaxLevel) {
    const status = {
      variant: 'blue' as const,
      errors: [t("Building can't be upgraded any further")],
    };

    return (
      <BuildingUpgradeStatusContext value={status}>
        {content}
      </BuildingUpgradeStatusContext>
    );
  }

  return (
    <OccupiedBuildingFieldActive
      buildingField={buildingField}
      currentBuildingFieldBuildingEvent={currentBuildingFieldBuildingEvent}
      tab={tab}
    />
  );
};

type OccupiedBuildingFieldActiveProps = {
  buildingField: BuildingFieldType;
  currentBuildingFieldBuildingEvent: BuildingEvent | undefined;
  tab: string;
};

const OccupiedBuildingFieldActive = ({
  buildingField,
  currentBuildingFieldBuildingEvent,
  tab,
}: OccupiedBuildingFieldActiveProps) => {
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  const { id: buildingFieldId, buildingId } = buildingField;

  const { errors } = useBuildingUpgradeStatus(buildingField);
  const { upgradeBuilding } = useBuildingActions(buildingId, buildingFieldId);

  const onLongPress = () => {
    if (errors.length === 0) {
      upgradeBuilding();
    }
  };

  const longPress = useLongPress(onLongPress, 1000);

  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <BuildingUpgradeStatusContextProvider buildingField={buildingField}>
      <OccupiedBuildingFieldContent
        buildingField={buildingField}
        currentBuildingFieldBuildingEvent={currentBuildingFieldBuildingEvent}
        tab={tab}
        canUpgrade={errors.length === 0}
        {...(isWiderThanLg
          ? {
              onMouseEnter: () => setIsHovered(true),
              onMouseLeave: () => setIsHovered(false),
              onFocus: () => setIsHovered(true),
              onBlur: (e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsHovered(false);
                }
              },
            }
          : longPress)}
        isHovered={isHovered}
      />
    </BuildingUpgradeStatusContextProvider>
  );
};

type OccupiedBuildingFieldContentProps = {
  buildingField: BuildingFieldType;
  currentBuildingFieldBuildingEvent: BuildingEvent | undefined;
  tab: string;
  isHovered?: boolean;
  canUpgrade?: boolean;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

const OccupiedBuildingFieldContent = ({
  buildingField,
  currentBuildingFieldBuildingEvent,
  tab,
  isHovered = false,
  canUpgrade = true,
  ...props
}: OccupiedBuildingFieldContentProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { preferences } = usePreferences();
  const tribe = useTribe();

  const { id: buildingFieldId, buildingId, level } = buildingField;
  const { shouldShowBuildingNames } = preferences;
  const hasEvent = !!currentBuildingFieldBuildingEvent;
  const isVillageBuilding = buildingFieldId >= 19;

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

  const dorf2Classes = isVillageBuilding
    ? clsx(
        'level',
        'colorLayer',
        canUpgrade ? 'good' : 'notNow',
        `aid${buildingFieldId}`,
        `g${getGidFromBuildingId(buildingId)}`,
        getTribeClass(tribe),
      )
    : '';

  return (
    <Link
      to={{
        pathname: `${buildingFieldId}`,
        search: `tab=${tab}`,
      }}
      aria-label={t(`BUILDINGS.${buildingId}.NAME`)}
      data-building-field-id={buildingFieldId}
      data-aid={buildingFieldId}
      data-gid={getGidFromBuildingId(buildingId)}
      data-level={level}
      data-building-id={buildingFieldId}
      data-name={t(`BUILDINGS.${buildingId}.NAME`)}
      tabIndex={0}
      className={clsx(
        isVillageBuilding && 'building-slot',
        dorf2Classes,
        buildingFieldId <= 18 &&
          dynamicCellClasses({
            buildingField,
            resourceFieldComposition: currentVillage.resourceFieldComposition,
          }),
        isVillageBuilding
          ? 'relative size-16 lg:size-24 select-none focus:outline-hidden focus:ring-2 focus:ring-black/80 dark:focus:ring-ring'
          : 'relative size-10 lg:size-16 select-none focus:outline-hidden focus:ring-2 focus:ring-black/80 dark:focus:ring-ring',
      )}
      {...props}
    >
      {isVillageBuilding && (
        <div className="labelLayer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xs lg:text-sm z-10">
          {level}
        </div>
      )}
      {isVillageBuilding && !isWallBuilding(buildingId) && (
        <img
          src={getVillageBuildingImagePath(
            tribe,
            getGidFromBuildingId(buildingId),
          )}
          alt={t(`BUILDINGS.${buildingId}.NAME`)}
          className={clsx(
            'absolute inset-0 w-full h-full object-contain transition-transform duration-200',
            isHovered && 'scale-110',
            `g${getGidFromBuildingId(buildingId)}`,
            getTribeClass(tribe),
          )}
        />
      )}
      <div className="absolute absolute-centering">
        <BuildingUpgradeIndicator
          isHovered={isHovered}
          buildingField={buildingField}
          buildingEvent={currentBuildingFieldBuildingEvent}
        />
      </div>
      {shouldShowBuildingNames && (
        <span className="inline-flex flex-col lg:flex-row text-center text-3xs md:text-2xs px-0.5 md:px-1 z-10 bg-background border border-border rounded-xs whitespace-nowrap absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[calc(50%+20px)] lg:top-[calc(50%+25px)]">
          {hasEvent && (
            <Countdown
              endsAt={
                currentBuildingFieldBuildingEvent.startsAt +
                currentBuildingFieldBuildingEvent.duration
              }
            />
          )}
          {!hasEvent && t(`BUILDINGS.${buildingId}.NAME`)}
        </span>
      )}
    </Link>
  );
};
