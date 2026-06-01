// Hero avatar canvas compositing engine.
// Draws Travian hero layers onto a canvas in the correct back-to-front order.
// Appearance sprites are drawn from packed atlas textures.
// Equipment sprites are drawn from individual V3 Hero PNGs using compact positions.

import type { HeroAppearance } from '@pillage-first/types/models/hero-appearance';
import {
  createAtlasDrawer,
  drawEquipmentFromAtlas,
  layerNameToV2Prefix,
  loadV2Offsets,
} from './atlas-loader';
import { getItemOverlayMapping, getV2OverlayFilename } from './item-sprite-map';

export const CANVAS_WIDTH = 875;
export const CANVAS_HEIGHT = 1574;

export const HEAD_CROP = {
  x: 310,
  y: 150,
  w: 254,
  h: 334,
};

async function drawCdnOverlay(
  ctx: CanvasRenderingContext2D,
  cdnPath: string,
  dx = 0,
  dy = 0,
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, dx, dy);
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = cdnPath;
  });
}

type ArmState = 'armBase' | 'armFist' | 'armUp';

function getRightArmState(
  loadout: Array<{ itemId: number; slot: string }>,
): ArmState {
  const rightHandItem = loadout.find((item) => item.slot === 'right-hand');
  if (!rightHandItem) {
    return 'armBase';
  }

  const sprite = getV2OverlayFilename(rightHandItem.itemId);
  if (!sprite) {
    return 'armFist';
  }

  if (
    sprite.startsWith('spear-') ||
    sprite.startsWith('lance-') ||
    sprite.startsWith('staff-')
  ) {
    return 'armUp';
  }
  if (sprite.startsWith('bow-')) {
    if (sprite.endsWith('1') || sprite.endsWith('1_0')) {
      return 'armFist';
    }
    return 'armUp';
  }
  return 'armFist';
}

function getLeftArmState(
  loadout: Array<{ itemId: number; slot: string }>,
): ArmState {
  const leftHandItem = loadout.find((item) => item.slot === 'left-hand');
  if (!leftHandItem) {
    return 'armBase';
  }

  const sprite = getV2OverlayFilename(leftHandItem.itemId);
  if (!sprite) {
    return 'armFist';
  }

  if (sprite.startsWith('pennant') || sprite.startsWith('standard')) {
    return 'armUp';
  }
  return 'armFist';
}

function getBackHairSpriteName(
  hairId: number,
  hairColor: string,
  hasHelmet: boolean,
): string {
  if (hasHelmet) {
    return `back-hair${hairId}-helmet-${hairColor}`;
  }
  return `back-hair${hairId}-${hairColor}`;
}

// Front hair IDs that have a helmet variant sprite (from Unity game data).
// These get swapped to a clipped version that fits under the helmet.
// IDs NOT in this set (3, 4, 5, 14, 15) have no helmet variant and
// must be hidden entirely when the hero wears a helmet.
const FRONT_HAIR_HELMET_IDS = new Set([1, 2, 6, 7, 8, 9, 10, 11, 12, 13]);

function getFrontHairSpriteName(
  hairId: number,
  hairColor: string,
  hasHelmet: boolean,
): string | null {
  if (hasHelmet) {
    if (FRONT_HAIR_HELMET_IDS.has(hairId)) {
      return `front-hair${hairId}-helmet-${hairColor}`;
    }
    // This hair style has no helmet variant → hide it completely
    return null;
  }
  return `front-hair${hairId}-${hairColor}`;
}

export async function renderHeroAvatar(
  canvas: HTMLCanvasElement,
  appearance: HeroAppearance,
  _tribeId: string,
  mode: 'body' | 'head' = 'body',
  loadout: Array<{ itemId: number; slot: string }> = [],
  crop?: { x: number; y: number; w: number; h: number },
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const activeCrop =
    mode === 'head'
      ? (crop ?? HEAD_CROP)
      : { x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT };

  if (mode === 'head') {
    canvas.width = activeCrop.w;
    canvas.height = activeCrop.h;
  } else {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (mode === 'head') {
    ctx.save();
    ctx.translate(-activeCrop.x, -activeCrop.y);
  }

  const gender = appearance.gender;
  const skin = appearance.skinColor;
  const hair = appearance.hairColor;
  const eyes = appearance.eyeColor;

  // Create atlas-based drawer for appearance sprites (uses spriteSourceSize positioning)
  const draw = await createAtlasDrawer(
    gender,
    skin,
    hair,
    eyes,
    appearance.bodyArmor,
  );

  const hasHelmet = loadout.some((item) => item.slot === 'head');
  const rightArmState = getRightArmState(loadout);
  const leftArmState = getLeftArmState(loadout);

  const overlayLayers: Array<{ zOrder: number; slot: string; itemId: number }> =
    [];
  for (const equipped of loadout) {
    const mapping = getItemOverlayMapping(equipped.itemId);
    if (mapping) {
      overlayLayers.push({
        zOrder: mapping.zOrder,
        slot: mapping.slot,
        itemId: equipped.itemId,
      });
    }
  }
  overlayLayers.sort((a, b) => a.zOrder - b.zOrder);

  // ── RENDER LAYERS (back to front) ──

  // 0. HORSE — PNG is 162×340. Position from Travian CSS:
  //   game container 491.667×500, horse at left=20 top=25 (natural size)
  //   hero body at left=183.667 top=-5 (278×500)
  //   Scale by height ratio: canvas hero body h=1402 / game hero body h=500 = 2.804
  const horseLayer = overlayLayers.find((l) => l.slot === 'horse');
  if (horseLayer && mode === 'body') {
    await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const S = 1402 / 500;
        const dw = img.naturalWidth * S;
        const dh = img.naturalHeight * S;
        const dx = 220 - 3 - dw;
        const dy = 150 + 30 * S;
        ctx.drawImage(img, dx, dy, dw, dh);
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = `/hero-assets/overlays/horse/item${horseLayer.itemId}.png`;
    });
  }

  // 1. BACK HAIR
  if (appearance.hairId > 0) {
    const backHairName = getBackHairSpriteName(
      appearance.hairId,
      hair,
      hasHelmet,
    );
    if (!(await draw(ctx, backHairName))) {
      await drawEquipmentFromAtlas(ctx, gender, backHairName);
    }
  }
  await draw(ctx, `base-${skin}`);

  // 3. TRIBAL CLOTHING
  {
    const clothingName = `basic-clothing-${appearance.bodyArmor}`;
    await draw(ctx, clothingName);
  }
  await draw(ctx, `${leftArmState}L-${skin}`);
  await draw(ctx, `${rightArmState}R-${skin}`);

  // 5. BOOTS (z=2)
  if (mode === 'body') {
    const bootsLayer = overlayLayers.find((l) => l.slot === 'shoes');
    if (bootsLayer) {
      const bootsFilename = getV2OverlayFilename(bootsLayer.itemId);
      if (bootsFilename) {
        await drawEquipmentFromAtlas(ctx, gender, bootsFilename);
      }
    }
  }

  // 6. BODY ARMOR (z=3)
  if (mode === 'body') {
    const armorLayer = overlayLayers.find((l) => l.slot === 'body');
    if (armorLayer) {
      const filename = getV2OverlayFilename(armorLayer.itemId);
      if (filename) {
        await drawEquipmentFromAtlas(ctx, gender, filename);
      }
    }
  }

  // 7. FACE FEATURES
  // Ears
  if (appearance.earsId > 0) {
    await draw(ctx, `ears${appearance.earsId}-${skin}`);
  }
  await draw(ctx, `jaw${appearance.jawId}-${skin}`);

  // Eyes (skin/white base)
  {
    const eyesBaseName = `eyesBase${appearance.eyesId}-${skin}`;
    await draw(ctx, eyesBaseName);
  }
  await draw(ctx, `eyes${appearance.eyesId}-${eyes}`);
  await draw(ctx, `mouth${appearance.mouthId}-${skin}`);
  await draw(ctx, `nose${appearance.noseId}-${skin}`);

  // Brows (skin base)
  {
    const browsBaseName = `browsBase${appearance.browsId}-${skin}`;
    await draw(ctx, browsBaseName);
  }
  await draw(ctx, `brows${appearance.browsId}-${hair}`);

  // 8. LEFT HAND ITEM (z=4)
  if (mode === 'body') {
    const leftLayer = overlayLayers.find((l) => l.slot === 'leftHand');
    if (leftLayer) {
      const filename = getV2OverlayFilename(leftLayer.itemId);
      if (filename) {
        await drawEquipmentFromAtlas(ctx, gender, filename);
      }
    }
  }

  // 9. RIGHT HAND ITEM (z=5)
  if (mode === 'body') {
    const rightLayer = overlayLayers.find((l) => l.slot === 'rightHand');
    if (rightLayer) {
      const filename = getV2OverlayFilename(rightLayer.itemId);
      if (filename) {
        await drawEquipmentFromAtlas(ctx, gender, filename);
      }
    }
  }

  // 10. TATTOO
  if (appearance.tattooId > 0) {
    await draw(ctx, `tattoo${appearance.tattooId}`);
  }

  // 11. SCAR
  if (appearance.scarId > 0) {
    await draw(ctx, `scar${appearance.scarId}-${skin}`);
  }

  // 12. FRONT HAIR (uses helmet variant or hides based on game data)
  if (appearance.hairId > 0) {
    const frontHairName = getFrontHairSpriteName(
      appearance.hairId,
      hair,
      hasHelmet,
    );
    if (frontHairName) {
      if (!(await draw(ctx, frontHairName))) {
        await drawEquipmentFromAtlas(ctx, gender, frontHairName);
      }
    }
  }

  // 13. BEARD
  if (appearance.beardId > 0) {
    await draw(ctx, `beard${appearance.beardId}-${hair}`);
  }

  // 14. HELMET (z=6, on top of everything)
  if (mode === 'body') {
    const helmetLayer = overlayLayers.find((l) => l.slot === 'helmet');
    if (helmetLayer) {
      const filename = getV2OverlayFilename(helmetLayer.itemId);
      if (filename) {
        await drawEquipmentFromAtlas(ctx, gender, filename);
      }
    }
  }

  if (mode === 'head') {
    ctx.restore();
  }
}

export async function getAvailableVariants(
  gender: string,
  _featureType: string,
  _color: string,
  layerName: string,
): Promise<number[]> {
  const offsets = await loadV2Offsets(gender);
  const ids = new Set<number>();
  const prefix = layerNameToV2Prefix(layerName);

  for (const key of Object.keys(offsets)) {
    const match = key.match(new RegExp(`^${prefix}(\\d+)`));
    if (match) {
      ids.add(Number.parseInt(match[1], 10));
    }
  }

  return Array.from(ids).sort((a, b) => a - b);
}
