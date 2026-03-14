import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import {
  getSpriteUnitId,
  getTroopFullImagePath,
  getTroopSectionImagePath,
  getTroopSpritePositionPercent,
  getTroopSpritesheetPath,
  isUnitInSpritesheet,
  type SpriteUnitId,
  TRIBE_FOLDER_NAMES,
  type TroopIconSize,
  type TroopImageSize,
} from '@pillage-first/game-assets/troop-icons';
import type { Tribe } from '@pillage-first/types/models/tribe';

type TroopIconBaseProps = {
  tribe?: Tribe;
  unitId: string;
  className?: string;
  style?: CSSProperties;
};

type TroopSpriteProps = TroopIconBaseProps & {
  variant?: 'sprite';
  size?: TroopIconSize;
};

type TroopSectionProps = TroopIconBaseProps & {
  variant: 'section';
  size?: TroopImageSize;
};

type TroopFullProps = TroopIconBaseProps & {
  variant: 'full';
  size?: TroopImageSize;
};

type TroopIconProps = TroopSpriteProps | TroopSectionProps | TroopFullProps;

const SPRITE_DIMENSIONS: Record<
  TroopIconSize,
  { width: number; height: number }
> = {
  small: { width: 16, height: 16 },
  medium: { width: 26, height: 26 },
};

const IMAGE_DIMENSIONS: Record<
  TroopImageSize,
  { width: number; height: number }
> = {
  section: { width: 140, height: 140 },
  full: { width: 200, height: 200 },
};

const DEFAULT_TRIBE: Tribe = 'romans';

function TroopIconSprite(props: TroopSpriteProps) {
  const {
    tribe = DEFAULT_TRIBE,
    unitId,
    size = 'small',
    className,
    style,
  } = props;

  const spriteId = getSpriteUnitId(tribe, unitId);
  if (!spriteId) {
    return null;
  }

  const tribeFolder = TRIBE_FOLDER_NAMES[tribe];

  // Units not in spritesheet (901-904) should use individual images
  if (!isUnitInSpritesheet(spriteId)) {
    const imagePath = getTroopSectionImagePath(tribe, spriteId);
    const dimensions = IMAGE_DIMENSIONS.section;

    const imgStyle: CSSProperties = {
      width: dimensions.width,
      height: dimensions.height,
      display: 'inline-block',
      flexShrink: 0,
      ...style,
    };

    return (
      <img
        src={imagePath}
        alt={`${tribe} unit ${unitId}`}
        className={className}
        style={imgStyle}
      />
    );
  }

  const spritePath = getTroopSpritesheetPath(tribe, size);
  const positionPercent = getTroopSpritePositionPercent(spriteId);
  const dimensions = SPRITE_DIMENSIONS[size];

  const spriteStyle: CSSProperties = {
    backgroundImage: `url(${spritePath})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: `0 ${positionPercent}`,
    backgroundSize: '100% auto',
    width: dimensions.width,
    height: dimensions.height,
    display: 'inline-block',
    flexShrink: 0,
    ...style,
  };

  return (
    <span
      role="img"
      className={clsx(
        'troop-icon',
        `troop-icon--${tribeFolder}`,
        `u${spriteId}`,
        className,
      )}
      style={spriteStyle}
      aria-label={`${tribe} unit ${unitId}`}
    />
  );
}

function TroopSectionImage(props: TroopSectionProps) {
  const { tribe = DEFAULT_TRIBE, unitId, className, style } = props;

  const spriteId = getSpriteUnitId(tribe, unitId);
  if (!spriteId) {
    return null;
  }

  const imagePath = getTroopSectionImagePath(tribe, spriteId);
  const dimensions = IMAGE_DIMENSIONS.section;

  const imgStyle: CSSProperties = {
    width: dimensions.width,
    height: dimensions.height,
    display: 'inline-block',
    flexShrink: 0,
    ...style,
  };

  return (
    <img
      src={imagePath}
      alt={`${tribe} unit ${unitId}`}
      className={className}
      style={imgStyle}
    />
  );
}

function TroopFullImage(props: TroopFullProps) {
  const { tribe = DEFAULT_TRIBE, unitId, className, style } = props;

  const spriteId = getSpriteUnitId(tribe, unitId);
  if (!spriteId) {
    return null;
  }

  const imagePath = getTroopFullImagePath(tribe, spriteId);
  const dimensions = IMAGE_DIMENSIONS.full;

  const imgStyle: CSSProperties = {
    width: dimensions.width,
    height: dimensions.height,
    display: 'inline-block',
    flexShrink: 0,
    ...style,
  };

  return (
    <img
      src={imagePath}
      alt={`${tribe} unit ${unitId}`}
      className={className}
      style={imgStyle}
    />
  );
}

export function TroopIcon(props: TroopIconProps) {
  if (props.variant === 'section') {
    return <TroopSectionImage {...props} />;
  }
  if (props.variant === 'full') {
    return <TroopFullImage {...props} />;
  }
  return <TroopIconSprite {...props} />;
}

export type { SpriteUnitId, TroopIconSize, TroopImageSize };
