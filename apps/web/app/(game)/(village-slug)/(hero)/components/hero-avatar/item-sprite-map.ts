// Maps item IDs to their equipment slot and z-order for the V2 compositing engine.
// V2 overlays are gender-separated cropped transparent PNGs stored at:
//   /v2-overlays/{male|female}/{filename}.png
// Their precise coordinates are stored in /v2-overlays/offsets-{gender}.json.

import { heroAssetMapping } from '@pillage-first/game-assets/hero-asset-mapping';

type OverlayMapping = {
  /** Equipment slot (determines directory and draw order) */
  slot: 'horse' | 'shoes' | 'body' | 'leftHand' | 'rightHand' | 'helmet';
  /** Z-layer for compositing order (lower = further back) */
  zOrder: number;
};

// Compositing layer order (back to front):
// 0: horse      — drawn BEFORE the hero body
// 1: base body  — always drawn (not an overlay)
// 2: shoes      — drawn on top of body
// 3: body armor — drawn on top of shoes
// 4: leftHand   — maps, flags, shields, horns
// 5: rightHand  — weapons (swords, axes, bows, etc.)
// 6: helmet     — drawn on top of everything

// === HELMETS (IDs 1-15) ===
function getHelmetMapping(itemId: number): OverlayMapping | null {
  if (itemId >= 1 && itemId <= 15) return { slot: 'helmet', zOrder: 6 };
  return null;
}

// === WEAPONS / RIGHT HAND (IDs 16-60, 115-144, 149-163) ===
function getRightHandMapping(itemId: number): OverlayMapping | null {
  if (itemId >= 16 && itemId <= 60) return { slot: 'rightHand', zOrder: 5 };
  if (itemId >= 115 && itemId <= 144) return { slot: 'rightHand', zOrder: 5 };
  if (itemId >= 149 && itemId <= 163) return { slot: 'rightHand', zOrder: 5 };
  return null;
}

// === LEFT HAND (IDs 61-81) ===
function getLeftHandMapping(itemId: number): OverlayMapping | null {
  if (itemId >= 61 && itemId <= 81) return { slot: 'leftHand', zOrder: 4 };
  return null;
}

// === BODY ARMOR (IDs 82-93) ===
function getBodyArmorMapping(itemId: number): OverlayMapping | null {
  if (itemId >= 82 && itemId <= 93) return { slot: 'body', zOrder: 3 };
  return null;
}

// === BOOTS (IDs 94-102) ===
function getBootsMapping(itemId: number): OverlayMapping | null {
  if (itemId >= 94 && itemId <= 102) return { slot: 'shoes', zOrder: 2 };
  return null;
}

// === HORSE (IDs 103-105) ===
function getHorseMapping(itemId: number): OverlayMapping | null {
  if (itemId >= 103 && itemId <= 105) return { slot: 'horse', zOrder: 0 };
  return null;
}

/**
 * Given a T4.6 item ID, returns the equipment slot and z-order
 * for the V2 overlay compositing system.
 * Returns null for consumables and items without visual overlays.
 */
export function getItemOverlayMapping(itemId: number): OverlayMapping | null {
  return (
    getHelmetMapping(itemId) ??
    getRightHandMapping(itemId) ??
    getLeftHandMapping(itemId) ??
    getBodyArmorMapping(itemId) ??
    getBootsMapping(itemId) ??
    getHorseMapping(itemId) ??
    null
  );
}

/**
 * Build the filename for a V2 overlay PNG.
 * @param itemId - the item's typeId
 */
export function getV2OverlayFilename(itemId: number): string | null {
  return heroAssetMapping[itemId] || null;
}
