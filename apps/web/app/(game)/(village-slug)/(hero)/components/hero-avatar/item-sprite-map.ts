// Maps item IDs to their equipment slot and z-order for the V2 compositing engine.
// V2 overlays are individual transparent PNGs stored at:
//   /V3 Hero/{Male|Female}/{filename}.png
// Their precise coordinates are stored in /v2-overlays/compact-positions-{gender}.json.

import { heroAssetMapping } from '@pillage-first/game-assets/hero-asset-mapping';
import { itemsMap } from '@pillage-first/game-assets/items';

type OverlayMapping = {
  /** Equipment slot (determines draw order) */
  slot: 'horse' | 'shoes' | 'body' | 'leftHand' | 'rightHand' | 'helmet';
  /** Z-layer for compositing order (lower = further back) */
  zOrder: number;
};

// Compositing layer order (back to front):
// 0: horse      — drawn BEFORE the hero body
// 2: shoes      — drawn on top of body
// 3: body armor — drawn on top of shoes
// 4: leftHand   — maps, flags, shields, horns
// 5: rightHand  — weapons (swords, axes, bows, etc.)
// 6: helmet     — drawn on top of everything

const SLOT_TO_OVERLAY: Record<string, OverlayMapping> = {
  head: { slot: 'helmet', zOrder: 6 },
  'right-hand': { slot: 'rightHand', zOrder: 5 },
  'left-hand': { slot: 'leftHand', zOrder: 4 },
  torso: { slot: 'body', zOrder: 3 },
  boots: { slot: 'shoes', zOrder: 2 },
  horse: { slot: 'horse', zOrder: 0 },
};

/**
 * Given a T4.6 item ID, returns the equipment slot and z-order
 * for the V2 overlay compositing system.
 * Returns null for consumables and items without visual overlays.
 */
export function getItemOverlayMapping(itemId: number): OverlayMapping | null {
  const itemDef = itemsMap.get(itemId);
  if (!itemDef) {
    return null;
  }
  return SLOT_TO_OVERLAY[itemDef.slot] ?? null;
}

/**
 * Build the filename for a V2 overlay PNG.
 * @param itemId - the item's typeId
 */
export function getV2OverlayFilename(itemId: number): string | null {
  return heroAssetMapping[itemId] || null;
}
