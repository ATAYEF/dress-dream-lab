import React, { useEffect, useState } from 'react';
import { removeClothingBackground } from '@/lib/removeBackground';
import { cn } from '@/lib/utils';

interface GarmentImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  /** Skip processing (e.g. already transparent assets) */
  skip?: boolean;
  loading?: 'lazy' | 'eager';
  draggable?: boolean;
}

/**
 * Clothing image with client-side background removal for mannequin preview.
 */
export const GarmentImage: React.FC<GarmentImageProps> = ({
  src,
  alt,
  className,
  style,
  skip = false,
  loading = 'eager',
  draggable = false,
}) => {
  const [displaySrc, setDisplaySrc] = useState(src);
  const [ready, setReady] = useState(skip);

  useEffect(() => {
    if (skip || !src) {
      setDisplaySrc(src);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    setDisplaySrc(src);

    // Defer so first paint is not blocked
    const run = () => {
      removeClothingBackground(src)
        .then((url) => {
          if (!cancelled) {
            setDisplaySrc(url);
            setReady(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setDisplaySrc(src);
            setReady(true);
          }
        });
    };

    const id = window.setTimeout(run, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [src, skip]);

  return (
    <img
      src={displaySrc}
      alt={alt}
      loading={loading}
      draggable={draggable}
      style={style}
      className={cn(
        className,
        'transition-opacity duration-300',
        ready ? 'opacity-100' : 'opacity-70'
      )}
    />
  );
};
