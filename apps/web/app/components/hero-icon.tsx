import type { CSSProperties } from 'react';
import {
  getHeroImagePath,
  HERO_STATE_IMAGES,
  type HeroState,
  type TroopIconSize,
} from '@pillage-first/game-assets/troop-icons';

type HeroIconProps = {
  size?: TroopIconSize;
  state?: HeroState;
  className?: string;
  style?: CSSProperties;
  alt?: string;
};

const SIZE_DIMENSIONS: Record<TroopIconSize, number> = {
  small: 16,
  medium: 26,
};

export function HeroIcon({
  size = 'small',
  state,
  className,
  style,
  alt = 'Hero',
}: HeroIconProps) {
  const dimension = SIZE_DIMENSIONS[size];

  if (state) {
    const imagePath = HERO_STATE_IMAGES[state];
    return (
      <img
        src={imagePath}
        alt={alt}
        className={className}
        style={{
          width: dimension,
          height: dimension,
          display: 'inline-block',
          flexShrink: 0,
          objectFit: 'contain',
          ...style,
        }}
      />
    );
  }

  const imagePath = getHeroImagePath(size);
  return (
    <img
      src={imagePath}
      alt={alt}
      className={className}
      style={{
        width: dimension,
        height: dimension,
        display: 'inline-block',
        flexShrink: 0,
        objectFit: 'contain',
        ...style,
      }}
    />
  );
}

export type { TroopIconSize, HeroState };
