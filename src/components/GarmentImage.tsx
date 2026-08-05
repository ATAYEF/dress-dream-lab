import React, { useEffect, useState } from 'react';
import { removeClothingBackground } from '@/lib/removeBackground';
import { cn } from '@/lib/utils';

interface GarmentImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  skip?: boolean;
  loading?: 'lazy' | 'eager';
  draggable?: boolean;
}

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
    // Keep previous processed frame if same category reshuffle — still start from src
    setDisplaySrc(src);

    removeClothingBackground(src)
      .then((url) => {
        if (cancelled) return;
        setDisplaySrc(url || src);
        setReady(true);
      })
      .catch((err) => {
        console.warn('[GarmentImage] bg remove failed', err);
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
      style={style}
      className={cn(
        className,
        'transition-opacity duration-500',
        ready ? 'opacity-100' : 'opacity-50'
      )}
    />
  );
};
