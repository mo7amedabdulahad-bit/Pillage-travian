import { type ReactElement, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';

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
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      // Calculate scale based on container width relative to native width
      let newScale = containerWidth / NATIVE_WIDTH;
      
      // Prevent making it larger than its native size as Travian bounds it there
      if (newScale > 1.15) {
        newScale = 1.15;
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
        // Make sure the container maintains the aspect ratio of 1280x720
        'aspect-[16/9]',
        className,
      )}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: NATIVE_WIDTH,
          height: NATIVE_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
