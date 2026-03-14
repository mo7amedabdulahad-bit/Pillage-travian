import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import {
  BUILDING_ICON_SIZES,
  type BuildingImageSize,
  getBuildingBigImagePath,
  getBuildingIconPath,
  isResourceBuilding,
} from '@pillage-first/game-assets/building-icons';
import type { BuildingId } from '@pillage-first/types/models/building';
import type { Tribe } from '@pillage-first/types/models/tribe';

type BuildingIconProps = {
  buildingId: BuildingId;
  tribe?: Tribe;
  size?: BuildingImageSize;
  className?: string;
  style?: CSSProperties;
};

type BuildingBigImageProps = {
  buildingId: BuildingId;
  tribe?: Tribe;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_TRIBE: Tribe = 'romans';

export function BuildingIcon({
  buildingId,
  tribe = DEFAULT_TRIBE,
  size = 'small',
  className,
  style,
}: BuildingIconProps) {
  const imagePath = getBuildingIconPath(tribe, buildingId, size);
  const dimensions = BUILDING_ICON_SIZES[size];

  return (
    <img
      src={imagePath}
      alt={`Building ${buildingId}`}
      className={className}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        display: 'inline-block',
        objectFit: 'contain',
        ...style,
      }}
    />
  );
}

export function BuildingBigImage({
  buildingId,
  tribe = DEFAULT_TRIBE,
  className,
  style,
}: BuildingBigImageProps) {
  const imagePath = getBuildingBigImagePath(tribe, buildingId);

  return (
    <img
      src={imagePath}
      alt={`Building ${buildingId}`}
      className={className}
      style={{
        width: 200,
        height: 200,
        display: 'inline-block',
        objectFit: 'contain',
        ...style,
      }}
    />
  );
}

export function ResourceBuildingIcon({
  buildingId,
  tribe = DEFAULT_TRIBE,
  size = 'small',
  className,
  style,
}: BuildingIconProps) {
  if (!isResourceBuilding(buildingId)) {
    return null;
  }

  return (
    <BuildingIcon
      buildingId={buildingId}
      tribe={tribe}
      size={size}
      className={className}
      style={style}
    />
  );
}

export type { BuildingImageSize };
