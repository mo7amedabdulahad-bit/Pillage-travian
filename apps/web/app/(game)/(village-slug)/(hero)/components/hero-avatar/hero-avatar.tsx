import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { HeroAppearance } from '@pillage-first/types/models/hero-appearance';
import { HEAD_CROP, renderHeroAvatar } from './hero-avatar-renderer';

type HeroAvatarProps = {
  appearance: HeroAppearance;
  tribe?: string;
  mode?: 'head' | 'body';
  className?: string;
  loadout?: Array<{ itemId: number; slot: string }>;
  crop?: { x: number; y: number; w: number; h: number };
};

export const HeroAvatar = memo(
  ({
    appearance,
    tribe = 'teuton',
    mode = 'body',
    className = '',
    loadout = [],
    crop,
  }: HeroAvatarProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderingRef = useRef(false);

    const render = useCallback(async () => {
      const canvas = canvasRef.current;
      if (!canvas || renderingRef.current) {
        return;
      }

      renderingRef.current = true;
      try {
        await renderHeroAvatar(canvas, appearance, tribe, mode, loadout, crop);
      } finally {
        renderingRef.current = false;
      }
    }, [appearance, tribe, mode, loadout, crop]);

    useEffect(() => {
      render();
    }, [render]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
      />
    );
  },
);

HeroAvatar.displayName = 'HeroAvatar';
