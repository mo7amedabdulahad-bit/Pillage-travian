import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import type { HeroItem } from '@pillage-first/types/models/hero-item';
import { BorderIndicator } from 'app/(game)/(village-slug)/components/border-indicator';
import { Icon } from 'app/components/icon';

type TreasureIconProps = Omit<ComponentProps<typeof Icon>, 'type'> & {
  itemId: HeroItem['id'];
};

const categoryToIconTypeMap = new Map<
  HeroItem['category'],
  ComponentProps<typeof Icon>['type']
>([
  ['artifact', 'treasureTileArtifact'],
  ['helmet', 'treasureTileItem'],
  ['armour', 'treasureTileItem'],
  ['boots', 'treasureTileItem'],
  ['left-hand', 'treasureTileItem'],
  ['right-hand', 'treasureTileItem'],
  ['horse', 'treasureTileItem'],
  ['consumable', 'treasureTileMiscellaneous'],
]);

export const TreasureIcon = ({ itemId, className }: TreasureIconProps) => {
  const item = getItemDefinition(itemId);

  if (!item) {
    // Item ID not found in our definitions — show generic icon
    return (
      <BorderIndicator
        className={className}
        variant="blue"
      >
        <Icon
          type="treasureTileMiscellaneous"
          shouldShowTooltip={false}
        />
      </BorderIndicator>
    );
  }

  const iconType =
    categoryToIconTypeMap.get(item.category) ?? 'treasureTileMiscellaneous';

  return (
    <BorderIndicator
      className={className}
      variant="blue"
    >
      <Icon
        type={iconType}
        className={clsx(iconType === 'treasureTileResources' && 'scale-80')}
        shouldShowTooltip={false}
      />
    </BorderIndicator>
  );
};
