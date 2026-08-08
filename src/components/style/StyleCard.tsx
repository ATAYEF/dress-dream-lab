import React, { memo, useCallback, useMemo } from 'react';
import { Heart } from 'lucide-react';
import type { OutfitSuggestion } from '@/types/wardrobe';
import { cn } from '@/lib/utils';
import {
  getStyleBadge,
  BADGE_LABEL,
  styleTitle,
  heroImage,
  type StyleBadge,
} from './styleUtils';

interface StyleCardProps {
  suggestion: OutfitSuggestion;
  index?: number;
  onOpen?: (s: OutfitSuggestion) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  className?: string;
  /** Below-fold cards skip eager work */
  priority?: boolean;
}

const badgeClass: Record<StyleBadge, string> = {
  ai_pick: 'bg-espresso/75 text-white',
  perfect_match: 'bg-emerald-700/85 text-white',
  trending: 'bg-primary/90 text-primary-foreground',
  favorite: 'bg-rose/90 text-white',
};

function StyleCardInner({
  suggestion,
  index = 1,
  onOpen,
  onToggleFavorite,
  className,
  priority = false,
}: StyleCardProps) {
  const badge = useMemo(() => getStyleBadge(suggestion, index), [suggestion, index]);
  const img = useMemo(() => heroImage(suggestion), [suggestion]);
  const title = useMemo(() => styleTitle(suggestion), [suggestion]);
  const itemCount = suggestion.items?.length ?? 0;
  const styleHint =
    suggestion.context?.style === 'formal'
      ? ' · رسمی'
      : suggestion.context?.style === 'party'
        ? ' · مهمانی'
        : ' · روزمره';

  const handleOpen = useCallback(() => {
    onOpen?.(suggestion);
  }, [onOpen, suggestion]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen?.(suggestion);
      }
    },
    [onOpen, suggestion]
  );

  const handleFav = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite?.(suggestion.id, !suggestion.isFavorite);
    },
    [onToggleFavorite, suggestion.id, suggestion.isFavorite]
  );

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKey}
      className={cn(
        'group relative rounded-2xl overflow-hidden bg-card border border-border/60 shadow-soft',
        'hover:shadow-card hover:border-gold/30 transition-shadow duration-300 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'content-visibility-auto',
        className
      )}
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 280px' }}
      dir="rtl"
    >
      <div className="relative aspect-[3/4] bg-muted/40 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover will-change-transform transition-transform duration-500 group-hover:scale-[1.03]"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'low'}
            width={240}
            height={320}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            بدون تصویر
          </div>
        )}
        <span
          className={cn(
            'absolute top-2.5 right-2.5 px-2 py-1 rounded-lg text-[9px] font-black tracking-wide backdrop-blur-sm',
            badgeClass[badge]
          )}
        >
          {BADGE_LABEL[badge]}
        </span>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={handleFav}
            className={cn(
              'absolute bottom-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center',
              'bg-white/90 border border-border/50 shadow-soft transition-colors',
              suggestion.isFavorite ? 'text-rose' : 'text-muted-foreground hover:text-rose'
            )}
            aria-label={suggestion.isFavorite ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
          >
            <Heart
              className="w-3.5 h-3.5"
              fill={suggestion.isFavorite ? 'currentColor' : 'none'}
              strokeWidth={2.2}
            />
          </button>
        )}
      </div>
      <div className="p-3 space-y-0.5">
        <h3 className="text-sm font-extrabold truncate leading-tight">{title}</h3>
        <p className="text-[11px] text-muted-foreground font-medium truncate">
          {itemCount.toLocaleString('fa-IR')} آیتم{styleHint}
        </p>
      </div>
    </article>
  );
}

function propsAreEqual(prev: StyleCardProps, next: StyleCardProps) {
  return (
    prev.suggestion.id === next.suggestion.id &&
    prev.suggestion.isFavorite === next.suggestion.isFavorite &&
    prev.suggestion.userFeedback === next.suggestion.userFeedback &&
    prev.suggestion.generatedImageUrl === next.suggestion.generatedImageUrl &&
    prev.suggestion.suggestionText === next.suggestion.suggestionText &&
    (prev.suggestion.items?.length ?? 0) === (next.suggestion.items?.length ?? 0) &&
    prev.index === next.index &&
    prev.priority === next.priority &&
    prev.className === next.className &&
    prev.onOpen === next.onOpen &&
    prev.onToggleFavorite === next.onToggleFavorite
  );
}

export const StyleCard = memo(StyleCardInner, propsAreEqual);
