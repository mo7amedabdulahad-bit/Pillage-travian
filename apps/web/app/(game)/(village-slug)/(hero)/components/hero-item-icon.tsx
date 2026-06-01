import { clsx } from 'clsx';
import { memo, useState } from 'react';
import type { HeroItem } from '@pillage-first/types/models/hero-item';

type HeroItemIconProps = {
  item: HeroItem | null;
  amount?: number;
  className?: string;
  slotName?: string;
  size?: 'sm' | 'md';
};

export const HeroItemIcon = memo(
  ({ item, amount, className, slotName, size = 'md' }: HeroItemIconProps) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const sizeClass = size === 'sm' ? 'w-11 h-11' : 'w-14 h-14';

    if (!item) {
      let bgUrl = '';
      if (slotName === 'head') {
        bgUrl = '/hero-assets/slots/slotHelmet_medium.png';
      } else if (slotName === 'torso') {
        bgUrl = '/hero-assets/slots/slotBody_medium.png';
      } else if (slotName === 'boots') {
        bgUrl = '/hero-assets/slots/slotShoes_medium.png';
      } else if (slotName === 'horse') {
        bgUrl = '/hero-assets/slots/slotHorse_medium.png';
      } else {
        bgUrl = '/hero-assets/slots/slotBag_medium.png';
      }

      return (
        <div
          className={clsx(
            sizeClass,
            'rounded border border-[#806D53] bg-[#E3D4B6] shadow-[inset_0_0_8px_rgba(0,0,0,0.3)] flex items-center justify-center opacity-70',
            className,
          )}
        >
          {bgUrl && (
            <img
              src={bgUrl}
              alt="Empty Slot"
              className="w-[85%] h-[85%] object-contain opacity-50"
            />
          )}
        </div>
      );
    }

    return (
      <button
        type="button"
        className={clsx(
          'relative rounded border border-[#806D53] bg-[#E3D4B6] flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-amber-500 transition-all',
          sizeClass,
          className,
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <img
          src={`/hero-assets/items/item${item.imageId}.png`}
          alt={item.displayName}
          className="w-[90%] h-[90%] object-contain drop-shadow-md"
        />
        {amount !== undefined && amount > 1 && (
          <span className="absolute bottom-0 right-0.5 px-1 text-[10px] font-bold text-white bg-black/70 rounded-sm leading-tight">
            {amount}
          </span>
        )}
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#3D3929] border border-[#806D53] rounded-md p-2 text-xs text-[#E8DFC7] shadow-xl pointer-events-none">
            <div className="font-bold text-[#F5E6C4] mb-0.5">
              {item.displayName}
            </div>
            <div className="text-[#C8B890]">{item.description}</div>
            {item.tribe !== 'any' && (
              <div className="text-[#8B7E65] mt-0.5 capitalize italic">
                {item.tribe} only
              </div>
            )}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#3D3929]" />
          </div>
        )}
      </button>
    );
  },
);

HeroItemIcon.displayName = 'HeroItemIcon';
