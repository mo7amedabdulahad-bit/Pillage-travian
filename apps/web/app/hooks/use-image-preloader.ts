import { useEffect, useRef, useState } from 'react';
import type { BuildingId } from '@pillage-first/types/models/building';
import type { Tribe } from '@pillage-first/types/models/tribe';

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function preloadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

export function preloadImages(srcs: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(srcs.map((src) => preloadImage(src)));
}

export function isImageCached(src: string): boolean {
  return imageCache.has(src);
}

export function clearImageCache(): void {
  imageCache.clear();
}

export function useImagePreloader(
  imageSources: string[],
  options?: {
    enabled?: boolean;
  },
): {
  isLoading: boolean;
  hasError: boolean;
  loadedCount: number;
  totalCount: number;
} {
  const { enabled = true } = options ?? {};

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || imageSources.length === 0) {
      return;
    }

    const uncachedSources = imageSources.filter((src) => !isImageCached(src));

    if (uncachedSources.length === 0) {
      setIsLoading(false);
      setLoadedCount(imageSources.length);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setLoadedCount(imageSources.length - uncachedSources.length);

    let loaded = imageSources.length - uncachedSources.length;

    const loadNext = async () => {
      for (const src of uncachedSources) {
        try {
          await preloadImage(src);
          if (mountedRef.current) {
            loaded++;
            setLoadedCount(loaded);
          }
        } catch {
          if (mountedRef.current) {
            setHasError(true);
          }
        }
      }
      if (mountedRef.current) {
        setIsLoading(false);
      }
    };

    loadNext();
  }, [imageSources, enabled]);

  return {
    isLoading,
    hasError,
    loadedCount,
    totalCount: imageSources.length,
  };
}

const BUILDING_IMAGE_BASE_PATHS = {
  day: '/graphic-packs/day/buildings',
  night: '/graphic-packs/night/buildings',
};

const TRIBE_FOLDERS: Record<Tribe, string> = {
  romans: 'roman',
  teutons: 'teuton',
  gauls: 'gaul',
  egyptians: 'egyptian',
  huns: 'hun',
  spartans: 'spartan',
  natars: 'natar',
  nature: 'nature',
};

export function getVillageBuildingImagePaths(
  tribe: Tribe,
  buildingGids: number[],
  theme: 'day' | 'night' = 'day',
): string[] {
  const tribeFolder = TRIBE_FOLDERS[tribe];
  const basePath = BUILDING_IMAGE_BASE_PATHS[theme];

  if (theme === 'day') {
    return buildingGids.map(
      (gid) => `${basePath}/${tribeFolder}/big/g${gid}.png`,
    );
  }
  return buildingGids.map((gid) => `${basePath}/${tribeFolder}/g${gid}.png`);
}

export function useBuildingPreloader(
  tribe: Tribe,
  buildingIds: BuildingId[],
  getGid: (buildingId: BuildingId) => number,
  theme: 'day' | 'night' = 'day',
  options?: {
    enabled?: boolean;
  },
): {
  isLoading: boolean;
  hasError: boolean;
} {
  const imageSources = buildingIds.map((id) => {
    const gid = getGid(id);
    const tribeFolder = TRIBE_FOLDERS[tribe];
    const basePath = BUILDING_IMAGE_BASE_PATHS[theme];

    if (theme === 'day') {
      return `${basePath}/${tribeFolder}/big/g${gid}.png`;
    }
    return `${basePath}/${tribeFolder}/g${gid}.png`;
  });

  const { isLoading, hasError } = useImagePreloader(imageSources, options);

  return { isLoading, hasError };
}
