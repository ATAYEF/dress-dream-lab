import React, { useEffect, useState } from 'react';
import { removeClothingBackground } from '@/lib/removeBackground';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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
    <span className="relative block w-full h-full">
      <img
        src={displaySrc}
        alt={alt}
        loading={loading}
        draggable={draggable}
        style={style}
        className={cn(
          className,
          'transition-opacity duration-500',
          ready ? 'opacity-100' : 'opacity-55'
        )}
      />
      {!ready && (
        <span
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-busy="true"
          aria-label="در حال حذف پس‌زمینه"
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur-sm px-2 py-1 shadow-sm border border-border/40">
            <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
            <span className="text-[9px] font-extrabold text-foreground/80 whitespace-nowrap">
              پردازش…
            </span>
          </span>
        </span>
      )}
    </span>
  );
};
