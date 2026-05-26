// Atlas loading + caching utility for hero texture atlases.
// Given a gender, feature type, and color, it resolves the JSON metadata and PNG image,
// caches them in memory, and provides frame lookups.

type AtlasFrame = {
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
};

type AtlasData = {
  frames: Record<string, AtlasFrame>;
  meta: {
    image: string;
    size: { w: number; h: number };
  };
};

export type V2Offset = { x: number; y: number; w: number; h: number };

const jsonCache = new Map<string, AtlasData>();
const imageCache = new Map<string, HTMLImageElement>();

const BASE_PATH = '/hero-assets/v2/textures';
const BASE_PATH_V2 = '/hero-assets/v2';

function getAtlasBaseName(
  gender: string,
  featureType: string,
  color: string,
  isV2 = false,
): string {
  if (isV2) {
    // V2 naming: {gender}-{category}-{attribute}
    // E.g. male-skinColor-skin1
    return `${gender}-${featureType}-${color}`;
  }
  if (featureType === 'tattoo') {
    return `${gender}-tattoo`;
  }
  return `${gender}-${featureType}-${color}`;
}

export async function loadAtlasJson(
  gender: string,
  featureType: string,
  color: string,
  isV2 = false,
): Promise<AtlasData | null> {
  const baseName = getAtlasBaseName(gender, featureType, color, isV2);
  const cacheKey = `v2-${baseName}`;

  if (jsonCache.has(cacheKey)) {
    return jsonCache.get(cacheKey)!;
  }

  try {
    const path = isV2
      ? `${BASE_PATH_V2}/textures/${baseName}.json`
      : `${BASE_PATH}/${baseName}.json`;
    const response = await fetch(path);
    if (!response.ok) {
      return null;
    }
    const data: AtlasData = await response.json();
    jsonCache.set(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

export async function loadAtlasImage(
  gender: string,
  featureType: string,
  color: string,
  isV2 = false,
): Promise<HTMLImageElement | null> {
  const baseName = getAtlasBaseName(gender, featureType, color, isV2);
  const cacheKey = `img-v2-${baseName}`;

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(cacheKey, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    const path = isV2
      ? `${BASE_PATH_V2}/textures/${baseName}.png`
      : `${BASE_PATH}/${baseName}.png`;
    img.src = path;
  });
}

// Loads a single-item overlay image (for equipped gear)
export async function loadOverlayImage(
  slot: string,
  itemId: number,
  isV2 = false,
): Promise<HTMLImageElement | null> {
  const cacheKey = `overlay-${slot}-${itemId}-${isV2 ? 'v2' : 'v1'}`;

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(cacheKey, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    // V2 overlays are in v2/overlays
    const path = isV2
      ? `${BASE_PATH_V2}/overlays/${slot}/item${itemId}.png`
      : `/hero-assets/overlays/${slot}/item${itemId}.png`;

    // Note: If V2 horse is not found, it might be in v2/overlays/shadow_male.png etc
    // but the horse pattern is horse/item103.png
    img.src = path;
  });
}

const v2SpriteCache = new Map<string, HTMLImageElement>();
const unityOffsetsCache: Record<string, Record<string, V2Offset>> = {};

export async function loadV2SpriteImage(
  gender: string,
  spriteName: string,
): Promise<HTMLImageElement | null> {
  const cacheKey = `v2-sprite-${gender}-${spriteName}`;
  if (v2SpriteCache.has(cacheKey)) {
    return v2SpriteCache.get(cacheKey)!;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      v2SpriteCache.set(cacheKey, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = `/v2-overlays/${gender}/${spriteName}.png`;
  });
}

export async function loadV2Offsets(
  gender: string,
): Promise<Record<string, V2Offset>> {
  if (unityOffsetsCache[gender]) return unityOffsetsCache[gender];
  try {
    const res = await fetch('/v2-overlays/unity-sprite-map.json');
    if (res.ok) {
      const data = await res.json();
      const genderData = data[gender] || {};
      const result: Record<string, V2Offset> = {};
      const ATLAS_H = 1574;

      for (const [spriteName, payload] of Object.entries(genderData)) {
        const { x, y, w, h } = (payload as any).rect;
        result[spriteName] = {
          x: x,
          y: ATLAS_H - y - h,
          w: w,
          h: h,
        };
      }

      unityOffsetsCache[gender] = result;
      return result;
    }
  } catch (e) {
    console.error(`Failed to load unity-sprite-map.json for ${gender}`, e);
  }
  return {};
}

/** Convert atlas frame name (last segment) to renderer-friendly sprite names.
 *  Atlas naming (from TextilePacker):  e.g. frontHair10-black, body-teuton, leftArmDefault-skin1
 *  Renderer naming:                    e.g. front-hair10-black, basic-clothing-teuton, armBaseL-skin1
 *  Returns both the original atlas name AND all derived renderer names. */
function atlasNameToV2(atlasName: string): string[] {
  const results = [atlasName];

  // body-{armor} → basic-clothing-{armor}
  const bodyMatch = atlasName.match(/^body-(.+)$/);
  if (bodyMatch) {
    results.push(`basic-clothing-${bodyMatch[1]}`);
  }

  // leftArm{State}-{suffix} → arm{State}L-{suffix}
  const leftArmMatch = atlasName.match(/^leftArm(Default|Down|Up)-(.+)$/);
  if (leftArmMatch) {
    const state =
      leftArmMatch[1] === 'Default'
        ? 'Base'
        : leftArmMatch[1] === 'Down'
          ? 'Fist'
          : 'Up';
    results.push(`arm${state}L-${leftArmMatch[2]}`);
  }

  // rightArm{State}-{suffix} → arm{State}R-{suffix}
  const rightArmMatch = atlasName.match(/^rightArm(Default|Down|Up)-(.+)$/);
  if (rightArmMatch) {
    const state =
      rightArmMatch[1] === 'Default'
        ? 'Base'
        : rightArmMatch[1] === 'Down'
          ? 'Fist'
          : 'Up';
    results.push(`arm${state}R-${rightArmMatch[2]}`);
  }

  // frontHair{rest} → front-hair{rest}
  if (atlasName.startsWith('frontHair')) {
    results.push(`front-hair${atlasName.slice(9)}`);
  }

  // backHair{rest} → back-hair{rest}
  if (atlasName.startsWith('backHair')) {
    results.push(`back-hair${atlasName.slice(8)}`);
  }

  // eyesBase{rest} → eyes{rest}
  if (atlasName.startsWith('eyesBase')) {
    results.push(`eyes${atlasName.slice(8)}`);
  }

  // browsBase{rest} → brows{rest}
  if (atlasName.startsWith('browsBase')) {
    results.push(`brows${atlasName.slice(9)}`);
  }

  return results;
}

type AtlasEntry = { img: HTMLImageElement; frame: AtlasFrame };

/** Build a drawer that renders appearance sprites from atlas textures.
 *  Pre-computes a sprite-name → atlas-frame lookup so each draw is O(1).
 *  Uses spriteSourceSize for positioning (top-left origin, no Y-flip needed). */
export async function createAtlasDrawer(
  gender: string,
  skinColor: string,
  hairColor: string,
  eyeColor: string,
  bodyArmor?: string,
): Promise<
  (ctx: CanvasRenderingContext2D, spriteName: string) => Promise<boolean>
> {
  const skinAtlas = await loadAtlasJson(gender, 'skinColor', skinColor);
  const hairAtlas = await loadAtlasJson(gender, 'hairColor', hairColor);
  const eyeAtlas = await loadAtlasJson(gender, 'eyeColor', eyeColor);
  const skinImg = skinAtlas
    ? await loadAtlasImage(gender, 'skinColor', skinColor)
    : null;
  const hairImg = hairAtlas
    ? await loadAtlasImage(gender, 'hairColor', hairColor)
    : null;
  const eyeImg = eyeAtlas
    ? await loadAtlasImage(gender, 'eyeColor', eyeColor)
    : null;

  // Also load tribe color and tattoo atlases
  const tribeAtlas = bodyArmor
    ? await loadAtlasJson(gender, 'tribeColor', bodyArmor)
    : null;
  const tribeImg =
    bodyArmor && tribeAtlas
      ? await loadAtlasImage(gender, 'tribeColor', bodyArmor)
      : null;
  const tattooAtlas = await loadAtlasJson(gender, 'tattoo', '');
  const tattooImg = tattooAtlas
    ? await loadAtlasImage(gender, 'tattoo', '')
    : null;

  const nameMap = new Map<string, AtlasEntry>();

  for (const entry of [
    { data: skinAtlas, img: skinImg },
    { data: hairAtlas, img: hairImg },
    { data: eyeAtlas, img: eyeImg },
    { data: tribeAtlas, img: tribeImg },
    { data: tattooAtlas, img: tattooImg },
  ]) {
    if (!entry.data || !entry.img) continue;
    for (const [frameName, frame] of Object.entries(entry.data.frames)) {
      const lastSegment = frameName.split('/').pop()!;
      const names = atlasNameToV2(lastSegment);
      for (const name of names) {
        if (!nameMap.has(name)) {
          nameMap.set(name, { img: entry.img, frame });
        }
      }
    }
  }

  return async (
    ctx: CanvasRenderingContext2D,
    spriteName: string,
  ): Promise<boolean> => {
    const entry = nameMap.get(spriteName);
    if (!entry) {
      if (typeof globalThis !== 'undefined' && 'console' in globalThis) {
        console.warn(`[atlas-loader] sprite not in atlas: "${spriteName}"`);
      }
      return false;
    }

    ctx.save();
    if (entry.frame.rotated) {
      ctx.translate(
        entry.frame.spriteSourceSize.x,
        entry.frame.spriteSourceSize.y,
      );
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(
        entry.img,
        entry.frame.frame.x,
        entry.frame.frame.y,
        entry.frame.frame.h,
        entry.frame.frame.w,
        -entry.frame.frame.h,
        0,
        entry.frame.frame.h,
        entry.frame.frame.w,
      );
    } else {
      ctx.drawImage(
        entry.img,
        entry.frame.frame.x,
        entry.frame.frame.y,
        entry.frame.frame.w,
        entry.frame.frame.h,
        entry.frame.spriteSourceSize.x,
        entry.frame.spriteSourceSize.y,
        entry.frame.spriteSourceSize.w,
        entry.frame.spriteSourceSize.h,
      );
    }
    ctx.restore();
    return true;
  };
}

/** Convert PascalCase layer name to V2-style kebab-case prefix used in unity-sprite-map.
 *  e.g. frontHair → front-hair, backHair → back-hair, eyesBase → eyes */
export function layerNameToV2Prefix(layerName: string): string {
  if (layerName === 'frontHair') return 'front-hair';
  if (layerName === 'backHair') return 'back-hair';
  if (layerName === 'eyesBase') return 'eyes';
  if (layerName === 'browsBase') return 'brows';
  return layerName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export type { AtlasData, AtlasFrame };
