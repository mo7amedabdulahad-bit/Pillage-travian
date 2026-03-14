import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';
import type { Resource } from '@pillage-first/types/models/resource';
import { formatNumber } from '@pillage-first/utils/format';
import { ResourceIcon } from 'app/components/resource-icon';

type ResourcesProps = {
  resources: number[];
  iconClassName?: string;
  iconSize?: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  useSprite?: boolean;
} & HTMLAttributes<HTMLSpanElement>;

const RESOURCE_ORDER: Resource[] = ['wood', 'clay', 'iron', 'wheat'];

export const Resources = ({
  resources,
  className,
  iconClassName = 'size-5',
  iconSize = 'medium',
  useSprite = false,
  ...rest
}: ResourcesProps) => {
  return (
    <span
      className={clsx('flex gap-2 transition-colors', className)}
      {...rest}
    >
      {resources.map((amount, index) => (
        <span
          key={RESOURCE_ORDER[index]}
          className="flex gap-1 items-center"
        >
          <ResourceIcon
            resource={RESOURCE_ORDER[index]}
            size={iconSize}
            useSprite={useSprite}
            className={iconClassName}
          />
          {formatNumber(amount)}
        </span>
      ))}
    </span>
  );
};
