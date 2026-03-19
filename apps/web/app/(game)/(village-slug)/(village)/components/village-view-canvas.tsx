import { clsx } from 'clsx';
import { type ReactNode, useEffect, useRef, useState } from 'react';

// Native SVG size
const NATIVE_WIDTH = 1280;
const NATIVE_HEIGHT = 720;

export const VillageViewCanvas = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) {
        return;
      }

      const containerWidth = containerRef.current.clientWidth;
      // Calculate scale based on container width relative to native width
      let newScale = containerWidth / NATIVE_WIDTH;

      // Prevent making it larger than its native size as Travian bounds it there
      if (newScale > 1.15) {
        newScale = 1.15;
      }

      // Live Travian forces minimum scale 0.5 on mobile so fields aren't too small
      if (newScale < 0.5) {
        newScale = 0.5;
      }

      setScale(newScale);
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative w-full max-w-none mx-auto overflow-hidden',
        className,
      )}
      style={{
        height: NATIVE_HEIGHT * scale,
      }}
    >
      <div
        className={clsx(
          'absolute top-0 left-1/2 -translate-x-1/2 transition-transform duration-300 ease-out',
          'w-[1280px] h-[720px]',
        )}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {children}
      </div>
    </div>
  );
};
