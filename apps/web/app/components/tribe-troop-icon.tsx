import type { CSSProperties } from 'react';
import type {
  TroopIconSize,
  TroopImageSize,
} from '@pillage-first/game-assets/troop-icons';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { TroopIcon } from 'app/components/troop-icon';

type TribeTroopIconSpriteProps = {
  unitId: string;
  size?: TroopIconSize;
  variant?: 'sprite';
  className?: string;
  style?: CSSProperties;
};

type TribeTroopImageProps = {
  unitId: string;
  size?: TroopImageSize;
  variant: 'section' | 'full';
  className?: string;
  style?: CSSProperties;
};

type TribeTroopIconProps = TribeTroopIconSpriteProps | TribeTroopImageProps;

export function TribeTroopIcon(props: TribeTroopIconProps) {
  const tribe = useTribe();
  return (
    <TroopIcon
      {...props}
      tribe={tribe}
    />
  );
}

export type { TroopIconSize, TroopImageSize };
