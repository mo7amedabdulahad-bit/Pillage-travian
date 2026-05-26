import { useState } from 'react';
import type { HeroItem } from '@pillage-first/types/models/hero-item';
import type { HeroLoadoutSlot } from '@pillage-first/types/models/hero-loadout';

type HeroItemPopupProps = {
  item: HeroItem;
  amount: number;
  /** Position anchor for the popup */
  anchorRect: DOMRect | null;
  onClose: () => void;
  onEquip: (args: {
    itemId: number;
    slot: HeroLoadoutSlot;
    amount: number;
  }) => void;
  onUse: (args: { itemId: number; amount: number }) => void;
};

const CONSUMABLE_IDS = [106, 107, 108, 109, 110, 111];

const RARITY_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  common: { bg: '#3d3929', border: '#8a7d5a', text: '#c4b88a' },
  uncommon: { bg: '#2a3329', border: '#5a8a5e', text: '#8ac490' },
  rare: { bg: '#29293d', border: '#5a5a8a', text: '#8a8ac4' },
  epic: { bg: '#3d2939', border: '#8a5a7d', text: '#c48ab8' },
};

function formatBonusAttribute(attr: string): string {
  const labels: Record<string, string> = {
    experience: 'Experience gain',
    health: 'HP regeneration/day',
    culturePoints: 'Culture points/day',
    cavalryTraining: 'Cavalry training speed',
    infantryTraining: 'Infantry training speed',
    power: 'Fighting strength',
    unitAttack: 'Attack bonus per unit',
    unitDefence: 'Defence bonus per unit',
    returnSpeed: 'Faster return',
    ownVillageSpeed: 'Faster to own villages',
    allianceSpeed: 'Faster to alliance members',
    crannyReduction: 'Cranny reduction',
    natarBonus: 'Attack vs. Natars',
    troopSpeed: 'Troop speed (after 20 fields)',
    heroSpeed: 'Hero speed',
    speed: 'Hero speed',
    damageReduction: 'Damage reduction',
  };
  return labels[attr] ?? attr;
}

export const HeroItemPopup = ({
  item,
  amount,
  anchorRect,
  onClose,
  onEquip,
  onUse,
}: HeroItemPopupProps) => {
  const [useAmount, setUseAmount] = useState(1);
  const isConsumable = CONSUMABLE_IDS.includes(item.id);
  const rarity = RARITY_COLORS[item.rarity ?? 'common'] ?? RARITY_COLORS.common;

  if (!anchorRect) return null;

  // Position popup above the clicked item
  const popupStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.max(8, Math.min(anchorRect.left - 80, window.innerWidth - 280)),
    top: Math.max(8, anchorRect.top - 260),
    zIndex: 9999,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />

      {/* Popup */}
      <div
        style={popupStyle}
        className="w-[260px] rounded shadow-xl border text-sm select-none"
      >
        {/* Header with item image and name */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-t"
          style={{
            background: `linear-gradient(135deg, ${rarity.bg}, ${rarity.bg}dd)`,
            borderBottom: `2px solid ${rarity.border}`,
          }}
        >
          <div
            className="w-12 h-12 flex-shrink-0 rounded border flex items-center justify-center"
            style={{ borderColor: rarity.border, background: '#1a1710' }}
          >
            <img
              src={`/hero-assets/items/item${item.imageId}.png`}
              alt={item.displayName}
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="font-bold text-[13px] truncate"
              style={{ color: rarity.text }}
            >
              {item.displayName}
            </div>
            {item.tier && (
              <div
                className="text-[10px] opacity-70"
                style={{ color: rarity.text }}
              >
                Tier {item.tier} •{' '}
                {(item.rarity ?? 'common').charAt(0).toUpperCase() +
                  (item.rarity ?? 'common').slice(1)}
              </div>
            )}
            {amount > 1 && (
              <div className="text-[10px] text-amber-300">
                Quantity: ×{amount}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div
          className="px-3 py-2 text-[11px] italic"
          style={{
            background: '#2a2517',
            color: '#a89870',
            borderBottom: `1px solid ${rarity.border}44`,
          }}
        >
          {item.description}
        </div>

        {/* Effects */}
        {item.heroBonus && item.heroBonus.length > 0 && (
          <div
            className="px-3 py-2"
            style={{ background: '#2a2517' }}
          >
            <div className="text-[10px] font-bold text-[#8a7d5a] uppercase mb-1">
              Effects
            </div>
            {item.heroBonus.map((bonus, idx) => (
              <div
                key={`${bonus.attribute}-${idx}`}
                className="flex items-center justify-between text-[11px] py-0.5"
              >
                <span className="text-[#c4b88a]">
                  {formatBonusAttribute(bonus.attribute)}
                  {'unit' in bonus && bonus.unit ? ` (${bonus.unit})` : ''}
                </span>
                <span className="text-green-400 font-bold">
                  +{bonus.value}
                  {[
                    'experience',
                    'cavalryTraining',
                    'infantryTraining',
                    'returnSpeed',
                    'ownVillageSpeed',
                    'allianceSpeed',
                    'crannyReduction',
                    'natarBonus',
                    'troopSpeed',
                  ].includes(bonus.attribute)
                    ? '%'
                    : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Slot info */}
        <div
          className="px-3 py-1.5 text-[10px] flex items-center justify-between"
          style={{
            background: '#221e13',
            color: '#7a6e50',
            borderTop: `1px solid ${rarity.border}44`,
          }}
        >
          <span>
            Slot:{' '}
            <span className="text-[#a89870] capitalize">
              {item.slot === 'right-hand'
                ? 'Right Hand'
                : item.slot === 'left-hand'
                  ? 'Left Hand'
                  : item.slot}
            </span>
          </span>
          {item.tribe && item.tribe !== 'any' && (
            <span className="capitalize text-[#a89870]">{item.tribe}</span>
          )}
        </div>

        {/* Action area */}
        <div
          className="px-3 py-2 flex items-center gap-2 rounded-b"
          style={{
            background: '#1a1710',
            borderTop: `1px solid ${rarity.border}66`,
          }}
        >
          {isConsumable ? (
            <>
              {/* Quantity selector */}
              <div className="flex items-center border border-[#5a4f3a] rounded overflow-hidden">
                <button
                  type="button"
                  className="w-6 h-6 flex items-center justify-center bg-[#2a2517] text-[#a89870] hover:bg-[#3d351f] text-xs font-bold"
                  onClick={() => setUseAmount(Math.max(1, useAmount - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={amount}
                  value={useAmount}
                  onChange={(e) =>
                    setUseAmount(
                      Math.max(
                        1,
                        Math.min(amount, Number(e.target.value) || 1),
                      ),
                    )
                  }
                  className="w-10 h-6 text-center text-[11px] bg-[#1a1710] text-[#c4b88a] border-x border-[#5a4f3a] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  className="w-6 h-6 flex items-center justify-center bg-[#2a2517] text-[#a89870] hover:bg-[#3d351f] text-xs font-bold"
                  onClick={() => setUseAmount(Math.min(amount, useAmount + 1))}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="flex-1 h-7 rounded text-[11px] font-bold bg-gradient-to-b from-[#4a7a2a] to-[#3a6020] text-white hover:from-[#5a8a3a] hover:to-[#4a7030] transition-colors shadow-sm"
                onClick={() => {
                  onUse({ itemId: item.id, amount: useAmount });
                  onClose();
                }}
              >
                Use
              </button>
            </>
          ) : item.slot !== 'consumable' && item.slot !== 'non-equipable' ? (
            <button
              type="button"
              className="flex-1 h-7 rounded text-[11px] font-bold bg-gradient-to-b from-[#6a5a2a] to-[#5a4a20] text-white hover:from-[#7a6a3a] hover:to-[#6a5a30] transition-colors shadow-sm"
              onClick={() => {
                onEquip({
                  itemId: item.id,
                  slot: item.slot as HeroLoadoutSlot,
                  amount: 1,
                });
                onClose();
              }}
            >
              Equip
            </button>
          ) : null}
          <button
            type="button"
            className="h-7 px-3 rounded text-[11px] bg-[#2a2517] text-[#8a7d5a] hover:bg-[#3d351f] border border-[#5a4f3a] transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};
