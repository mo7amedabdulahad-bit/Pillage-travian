import { clsx } from 'clsx';
import { memo } from 'react';
import { areEqual, type GridChildComponentProps } from 'react-window';
import type { MapFilters } from '@pillage-first/types/models/map-filters';
import type { MapMarker } from '@pillage-first/types/models/map-marker';
import type { Preferences } from '@pillage-first/types/models/preferences';
import { decodeGraphicsProperty } from '@pillage-first/utils/map';
import { TreasureIcon } from 'app/(game)/(village-slug)/(map)/components/treasure-icon';
import { BorderIndicator } from 'app/(game)/(village-slug)/components/border-indicator';
import {
  BORDER_TILES_OASIS_VARIANTS,
  type useMap,
} from 'app/(game)/(village-slug)/hooks/use-map';
import type { useReputations } from 'app/(game)/(village-slug)/hooks/use-reputations';
import { Icon } from 'app/components/icon';
import cellStyles from './cell.module.scss';

type Tile = ReturnType<typeof useMap>['map'][0];

type CellBaseProps = {
  map: Tile[];
  gridSize: number;
  mapFilters: MapFilters;
  magnification: number;
  preferences: Preferences;
  mapMarkers: MapMarker[];
  createMapMarker: (args: { tileId: number }) => void;
  deleteMapMarker: (args: { tileId: number }) => void;
  onClick: (tileId: number) => void;
  getReputation: ReturnType<typeof useReputations>['getReputation'];
};

const wheatFields = new Set(['00018', '11115', '3339']);

type CellIconsProps = CellBaseProps & {
  tile: NonNullable<Tile>;
};

const CellIcons = (props: CellIconsProps) => {
  const { tile, mapFilters, magnification, mapMarkers } = props;
  const {
    shouldShowTreasureIcons,
    shouldShowOasisIcons,
    shouldShowWheatFields,
  } = mapFilters;

  const hasMarker = mapMarkers.some((marker) => marker.tileId === tile.id);

  const classes = clsx(
    cellStyles['tile-icon'],
    cellStyles[`tile-icon-magnification-${magnification}`],
  );

  if (hasMarker) {
    return (
      <Icon
        type="mapMarker"
        shouldShowTooltip={false}
      />
    );
  }

  if (tile.type === 'free' && tile.ownerVillage !== null) {
    const population = tile.ownerVillage.population;
    let tier = 0;
    if (population >= 500) {
      tier = 3;
    } else if (population >= 250) {
      tier = 2;
    } else if (population >= 100) {
      tier = 1;
    }

    const tribeSuffix: Record<string, number> = {
      romans: 1,
      teutons: 2,
      gauls: 3,
      nature: 4,
      natars: 5,
      egyptians: 6,
      huns: 7,
      spartans: 8,
    };

    const tribe = tile.owner?.tribe;
    const suffix = tribe ? (tribeSuffix[tribe] ?? 0) : 0;

    const showWheat =
      shouldShowWheatFields &&
      wheatFields.has(tile.attributes.resourceFieldComposition);

    const showTreasure = shouldShowTreasureIcons && tile.item !== null;

    return (
      <>
        <div
          className={clsx(
            cellStyles['village-icon'],
            cellStyles[`village-icon-tier-${tier}`],
            suffix > 0 && cellStyles[`village-icon-tribe-${suffix}`],
          )}
        />
        {showWheat && (
          <BorderIndicator
            className={clsx(classes, 'absolute top-0 right-0')}
            variant="yellow"
          >
            <Icon
              type="wheat"
              className="scale-80"
              shouldShowTooltip={false}
            />
          </BorderIndicator>
        )}
        {showTreasure && tile.item !== null && (
          <TreasureIcon
            className={clsx(classes, 'absolute top-0 right-0')}
            itemId={tile.item.id}
          />
        )}
      </>
    );
  }

  if (
    shouldShowWheatFields &&
    tile.type === 'free' &&
    wheatFields.has(tile.attributes.resourceFieldComposition)
  ) {
    return (
      <BorderIndicator
        className={classes}
        variant="yellow"
      >
        <Icon
          type="wheat"
          className="scale-80"
          shouldShowTooltip={false}
        />
      </BorderIndicator>
    );
  }

  if (
    shouldShowOasisIcons &&
    tile.type === 'oasis' &&
    tile.attributes.isOccupiable
  ) {
    const { oasisResource } = decodeGraphicsProperty(
      tile.attributes.oasisGraphics,
    );

    return (
      <BorderIndicator
        className={clsx(classes, 'scale-80')}
        variant={tile.owner !== null ? 'red' : 'green'}
      >
        <Icon
          type={oasisResource}
          className="scale-80"
          shouldShowTooltip={false}
        />
      </BorderIndicator>
    );
  }

  if (shouldShowTreasureIcons && tile.type === 'free' && tile.item !== null) {
    return (
      <TreasureIcon
        className={classes}
        itemId={tile.item.id}
      />
    );
  }

  return null;
};

const getTileClassNames = (
  tile: NonNullable<Tile>,
  getReputation: CellBaseProps['getReputation'],
  magnification: number,
  shouldShowFactionReputation: boolean,
): string => {
  if (tile.type === 'free' && tile.owner === null) {
    const { resourceFieldComposition } = tile.attributes;
    return clsx(
      cellStyles.tile,
      cellStyles[`unoccupied-tile-${resourceFieldComposition}`],
    );
  }

  if (tile.type === 'free' && tile.owner !== null) {
    const { faction } = tile.owner;
    const reputationLevel =
      faction === 'player' ? 'player' : getReputation(faction).reputationLevel;

    return clsx(
      cellStyles.tile,
      cellStyles['occupied-tile'],
      cellStyles[`occupied-tile-magnification-${magnification}`],
      shouldShowFactionReputation &&
        cellStyles[`occupied-tile-reputation-${reputationLevel}`],
    );
  }

  if (tile.type === 'oasis') {
    const { oasisResource, oasisGroup, oasisGroupPositions, variant } =
      decodeGraphicsProperty(tile.attributes.oasisGraphics);

    return clsx(
      cellStyles.tile,
      cellStyles[
        `oasis-tile-${oasisResource}-${oasisGroup}-${oasisGroupPositions}-${variant}`
      ],
    );
  }

  return '';
};

type CellProps = GridChildComponentProps<CellBaseProps>;

export const Cell = memo<CellProps>(
  ({ data, style, rowIndex, columnIndex }) => {
    const { map, gridSize, mapFilters, magnification, onClick, getReputation } =
      data;

    const tileIndex = gridSize * rowIndex + columnIndex;
    const tileId = tileIndex + 1;

    const tile = map[tileIndex];
    const isBorderTile =
      tile.type === 'oasis' &&
      !tile.attributes.isOccupiable &&
      BORDER_TILES_OASIS_VARIANTS.has(tile.attributes.oasisGraphics);

    // const onContextMenu = (event: ReactMouseEvent) => {
    //   event.preventDefault();
    //
    //   const hasMarker = mapMarkers.some((marker) => marker.tileId === tileId);
    //
    //   if (hasMarker) {
    //     deleteMapMarker({ tileId });
    //   } else {
    //     createMapMarker({ tileId });
    //   }
    // };

    const className = isBorderTile
      ? clsx(
          cellStyles.tile,
          cellStyles[`border-tile-${tile.attributes.oasisGraphics}`],
        )
      : getTileClassNames(
          tile,
          getReputation,
          magnification,
          mapFilters.shouldShowFactionReputation,
        );

    return (
      <button
        onClick={() => onClick(tileId)}
        // onContextMenu={onContextMenu}
        type="button"
        style={style}
        data-tile-id={tileId}
        className={className}
      >
        {!isBorderTile && (
          <CellIcons
            tile={tile}
            {...data}
          />
        )}
      </button>
    );
  },
  areEqual,
);
