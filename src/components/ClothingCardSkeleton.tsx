import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ClothingCardSkeletonProps {
  count?: number;
  className?: string;
}

export const ClothingCardSkeleton: React.FC<ClothingCardSkeletonProps> = ({
  count = 8,
  className,
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden bg-gradient-card hairline-border shadow-soft"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <Skeleton className="aspect-[4/5] w-full rounded-none bg-muted/70" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3.5 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};
