import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import {
  RESOURCE_ICON_PATHS,
  RESOURCE_SPRITE_DIMENSIONS,
  RESOURCE_SPRITE_POSITIONS,
  RESOURCE_SPRITESHEET_PATHS,
  type Resource,
  type ResourceIconSize,
} from '@pillage-first/game-assets/resource-icons';

type ResourceIconProps = {
  resource: Resource;
  size?: ResourceIconSize;
  useSprite?: boolean;
  className?: string;
  style?: CSSProperties;
};

export const ResourceIcon = ({
  resource,
  size = 'medium',
  useSprite = false,
  className,
  style,
}: ResourceIconProps) => {
  if (
    useSprite &&
    (size === 'small' || size === 'medium' || size === 'large')
  ) {
    const spritePath = RESOURCE_SPRITESHEET_PATHS[size];
    const position = RESOURCE_SPRITE_POSITIONS[resource];
    const dims = RESOURCE_SPRITE_DIMENSIONS[size];

    const spriteStyle: CSSProperties = {
      backgroundImage: `url(${spritePath})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: `${position.x} ${position.y}`,
      backgroundSize: 'auto 100%',
      width: dims.iconWidth,
      height: dims.height,
      display: 'inline-block',
      flexShrink: 0,
      ...style,
    };

    return (
      <span
        role="img"
        className={clsx(
          'resource-icon',
          `resource-icon--${resource}`,
          className,
        )}
        style={spriteStyle}
        aria-label={resource}
      />
    );
  }

  const iconPath = RESOURCE_ICON_PATHS[resource][size];

  return (
    <img
      src={iconPath}
      alt={resource}
      className={className}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        objectFit: 'contain',
        ...style,
      }}
    />
  );
};

export type { Resource, ResourceIconSize };
