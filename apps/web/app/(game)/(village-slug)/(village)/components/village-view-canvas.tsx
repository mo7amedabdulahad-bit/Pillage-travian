import { clsx } from 'clsx';
import { type ReactElement, useEffect, useRef, useState } from 'react';

type VillageViewCanvasProps = {
  children: ReactElement | ReactElement[];
  className?: string;
};

// The native resolution of the Travian dorf2 village container
const NATIVE_WIDTH = 1280;
const NATIVE_HEIGHT = 720;

export const VillageViewCanvas = ({
  children,
  className,
}: VillageViewCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) {
        return;
      }

      const containerWidth = containerRef.current.offsetWidth;
      // Calculate scale based on container width relative to native width
      let newScale = containerWidth / NATIVE_WIDTH;

      // Prevent making it larger than its native size as Travian bounds it there
      if (newScale > 1.15) {
        newScale = 1.15;
      }

      // Prevent it from becoming too small on mobile (below 1.0)
      if (newScale < 1.0) {
        newScale = 1.0;
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
          'absolute top-0 left-1/2 -translate-x-1/2 transition-transform duration-300 ease-out origin-top-center',
          'w-[1280px] h-[720px]',
        )}
        style={{
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
