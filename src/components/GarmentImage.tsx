import React, { useEffect, useState } from 'react';
import { removeClothingBackground } from '@/lib/removeBackground';
import { cn } from '@/lib/utils';

interface GarmentImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Skip processing (e.g. already transparent assets) */
  skip?: boolean;
  loading?: 'lazy' | 'eager';
  draggable?: boolean;
}

/**
 * Shows clothing image with client-side background removal for cleaner outfit preview.
 */
export const GarmentImage: React.FC<GarmentImageProps> = ({
  src,
  alt,
  className,
  skip = false,
  loading = 'lazy',
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

    return () => {
      cancelled = true;
    };
  }, [src, skip]);

  return (
    <img
      src={displaySrc}
      alt={alt}
      loading={loading}
      draggable={draggable}
      className={cn(
        className,
        'transition-opacity duration-300',
        ready ? 'opacity-100' : 'opacity-80'
      )}
    />
  );
};
