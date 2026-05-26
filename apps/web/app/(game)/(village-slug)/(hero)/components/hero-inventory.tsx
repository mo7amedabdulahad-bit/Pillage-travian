import { useCallback, useMemo, useState } from 'react';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import type { HeroLoadoutSlot } from '@pillage-first/types/models/hero-loadout';
import { useUseHeroItem } from 'app/(game)/(village-slug)/(hero)/hooks/use-use-hero-item';
import { useHeroInventory } from 'app/(game)/(village-slug)/hooks/use-hero-inventory';
import { useHeroLoadout } from 'app/(game)/(village-slug)/hooks/use-hero-loadout';
import { HeroAvatar } from './hero-avatar/hero-avatar';
import { HeroItemIcon } from './hero-item-icon';
import { HeroItemPopup } from './hero-item-popup';
import { useHeroAppearance } from './hooks/use-hero-appearance';

// Travian T4.6 exact inventory layout (from reference screenshot):
// ┌──────────┬──────────────────────────────────┐
// │ [Helmet] │                                  │
// │ [LHand]  │                                  │
// │ [RHand]  │        Hero Avatar               │
// │ [Body]   │        (with scenic bg)           │
// │ [Boots]  │                                  │
// │ [Consum] │                                  │
// │ [Horse]  │                                  │
// └──────────┴──────────────────────────────────┘
// ┌─ category tabs ─────────────────────────────┐
// │  [bag grid: 8 columns]                      │
// └─────────────────────────────────────────────┘

type SlotConfig = {
  id: HeroLoadoutSlot;
  label: string;
  slotBg: string;
};

const EQUIPMENT_SLOTS: SlotConfig[] = [
  {
    id: 'head',
    label: 'Helmet',
    slotBg: '/hero-assets/slots/slotHelmet_medium.png',
  },
  {
    id: 'left-hand',
    label: 'Left Hand',
    slotBg: '/hero-assets/slots/slotBag_medium.png',
  },
  {
    id: 'right-hand',
    label: 'Right Hand',
    slotBg: '/hero-assets/slots/slotBag_medium.png',
  },
  {
    id: 'torso',
    label: 'Body',
    slotBg: '/hero-assets/slots/slotBody_medium.png',
  },
  {
    id: 'boots',
    label: 'Shoes',
    slotBg: '/hero-assets/slots/slotShoes_medium.png',
  },
  {
    id: 'consumable',
    label: 'Bag',
    slotBg: '/hero-assets/slots/slotBag_medium.png',
  },
  {
    id: 'horse',
    label: 'Horse',
    slotBg: '/hero-assets/slots/slotHorse_medium.png',
  },
];

export const HeroInventory = () => {
  const { appearance } = useHeroAppearance();
  const { loadout, equipItem, unequipItem } = useHeroLoadout();
  const { heroInventory } = useHeroInventory();
  const { mutate: useHeroItem } = useUseHeroItem();

  // Popup state
  const [selectedItem, setSelectedItem] = useState<{
    itemDef: NonNullable<ReturnType<typeof getItemDefinition>>;
    amount: number;
    anchorRect: DOMRect;
  } | null>(null);

  const closePopup = useCallback(() => setSelectedItem(null), []);

  const getEquippedItem = (slot: HeroLoadoutSlot) => {
    const equipped = loadout.find((l) => l.slot === slot);
    if (!equipped) return null;
    return {
      item: getItemDefinition(equipped.itemId),
      amount: equipped.amount,
      slot: equipped.slot,
    };
  };

  const bagItems = useMemo(() => {
    return heroInventory.map((invItem) => ({
      ...invItem,
      itemDef: getItemDefinition(invItem.id),
    }));
  }, [heroInventory]);

  return (
    <div className="w-full max-w-[620px] mx-auto">
      {/* Main equipment area: left slots + right avatar */}
      <div
        className="flex border border-[#b5a57d] rounded-t overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #e8dfc7, #ddd3b5)',
        }}
      >
        {/* Left column: 7 stacked equipment slots */}
        <div
          className="flex flex-col border-r border-[#b5a57d]"
          style={{ width: '62px' }}
        >
          {EQUIPMENT_SLOTS.map((slotConfig) => {
            const equipped = getEquippedItem(slotConfig.id);
            return (
              <div
                key={slotConfig.id}
                className="flex items-center justify-center border-b border-[#c4b68e] last:border-b-0 cursor-pointer hover:bg-[#d4c9a8] transition-colors"
                style={{ width: '62px', height: '62px' }}
                title={
                  equipped
                    ? `${equipped.item?.displayName ?? slotConfig.label} (click to unequip)`
                    : slotConfig.label
                }
                onClick={() => {
                  if (equipped) {
                    unequipItem({ slot: slotConfig.id });
                  }
                }}
              >
                {equipped?.item ? (
                  <img
                    src={`/hero-assets/items/item${equipped.item.imageId}.png`}
                    alt={equipped.item.displayName}
                    className="w-[52px] h-[52px] object-contain drop-shadow-sm"
                  />
                ) : (
                  <img
                    src={slotConfig.slotBg}
                    alt={slotConfig.label}
                    className="w-[40px] h-[40px] object-contain opacity-40"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Right area: Hero avatar with authentic scenic background */}
        <div
          className="flex-1 flex items-center justify-center relative overflow-hidden"
          style={{
            backgroundImage:
              "url('/hero-assets/backgrounds/heroPageBackground.jpg')",
            backgroundPosition: 'top center',
            backgroundSize: 'cover',
            minHeight: '434px',
          }}
        >
          <div className="relative z-10 flex flex-col items-center justify-center h-full pb-2">
            {/* The authentic shadow */}
            <img
              src={
                appearance.gender === 'male'
                  ? '/hero-assets/backgrounds/shadow_male.png'
                  : '/hero-assets/backgrounds/shadow_female.png'
              }
              alt=""
              className="absolute pointer-events-none"
              style={{
                top: '-7px',
                left: '-19px',
                width: '120%', // Match native scaling if necessary, we'll try to center it behind
                maxWidth: 'none',
                opacity: 0.8,
                zIndex: -1,
                transform: 'translateY(-10px)',
              }}
            />
            <HeroAvatar
              appearance={appearance}
              tribe={appearance.bodyArmor}
              mode="body"
              loadout={loadout ?? []}
              className="h-[430px] w-auto object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </div>

      {/* Category filter tabs row */}
      <div className="flex items-center border-x border-[#b5a57d] bg-gradient-to-b from-[#d4c9a8] to-[#c4b68e]">
        {[
          { icon: '/hero-assets/slots/slotHelmet_medium.png', label: 'All' },
          { icon: '/hero-assets/slots/slotBody_medium.png', label: 'Armor' },
          { icon: '/hero-assets/slots/slotShoes_medium.png', label: 'Boots' },
          { icon: '/hero-assets/slots/slotBag_medium.png', label: 'Weapons' },
          { icon: '/hero-assets/slots/slotHorse_medium.png', label: 'Horse' },
          { icon: '/hero-assets/slots/slotBag_medium.png', label: 'Other' },
        ].map((tab) => (
          <div
            key={tab.label}
            className="flex items-center justify-center w-10 h-10 border-r border-[#b5a57d] last:border-r-0 cursor-pointer hover:bg-[#bfb38f] transition-colors"
            title={tab.label}
          >
            <img
              src={tab.icon}
              alt={tab.label}
              className="w-6 h-6 object-contain opacity-60"
            />
          </div>
        ))}
        <div className="flex-1" />
        <span className="text-[11px] text-[#6b5e3f] pr-2 italic">
          ▶ Trade items
        </span>
      </div>

      {/* Bag grid */}
      <div
        className="border border-t-0 border-[#b5a57d] rounded-b overflow-hidden"
        style={{
          background: '#3d3929',
        }}
      >
        <div className="grid grid-cols-8 gap-px p-px">
          {Array.from({
            length: Math.max(
              16,
              bagItems.length + (16 - (bagItems.length % 8 || 8)),
            ),
          }).map((_, i) => {
            const bagItem = bagItems[i];

            if (!bagItem?.itemDef) {
              return (
                <div
                  key={`empty-${i}`}
                  className="bg-[#2a2517] aspect-square flex items-center justify-center"
                  style={{ minHeight: '52px' }}
                />
              );
            }

            return (
              <div
                key={`inv-${bagItem.id}`}
                className="bg-[#2a2517] aspect-square flex items-center justify-center cursor-pointer hover:bg-[#3d351f] transition-colors relative group"
                style={{ minHeight: '52px' }}
                title={bagItem.itemDef.displayName}
                onClick={(e) => {
                  if (bagItem.itemDef) {
                    const rect = (
                      e.currentTarget as HTMLElement
                    ).getBoundingClientRect();
                    setSelectedItem({
                      itemDef: bagItem.itemDef,
                      amount: bagItem.amount,
                      anchorRect: rect,
                    });
                  }
                }}
              >
                <img
                  src={`/hero-assets/items/item${bagItem.itemDef.imageId}.png`}
                  alt={bagItem.itemDef.displayName}
                  className="w-[85%] h-[85%] object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
                />
                {bagItem.amount > 1 && (
                  <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-white bg-black/70 px-0.5 rounded-sm leading-tight">
                    {bagItem.amount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Popup */}
      {selectedItem && (
        <HeroItemPopup
          item={selectedItem.itemDef}
          amount={selectedItem.amount}
          anchorRect={selectedItem.anchorRect}
          onClose={closePopup}
          onEquip={(args) => {
            equipItem(args);
            closePopup();
          }}
          onUse={(args) => {
            useHeroItem(args);
            closePopup();
          }}
        />
      )}
    </div>
  );
};
