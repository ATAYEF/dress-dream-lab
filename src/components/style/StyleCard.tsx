import React from 'react';
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
}

const badgeClass: Record<StyleBadge, string> = {
  ai_pick: 'bg-espresso/75 text-white',
  perfect_match: 'bg-emerald-700/85 text-white',
  trending: 'bg-primary/90 text-primary-foreground',
  favorite: 'bg-rose/90 text-white',
};

export const StyleCard: React.FC<StyleCardProps> = ({
  suggestion,
  index = 1,
  onOpen,
  onToggleFavorite,
  className,
}) => {
  const badge = getStyleBadge(suggestion, index);
  const img = heroImage(suggestion);
  const title = styleTitle(suggestion);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(suggestion)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(suggestion);
        }
      }}
      className={cn(
        'group relative rounded-2xl overflow-hidden bg-card border border-border/60 shadow-soft',
        'hover:shadow-card hover:border-gold/30 transition-all duration-300 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        className
      )}
      dir="rtl"
    >
      <div className="relative aspect-[3/4] bg-muted/40 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
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
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(suggestion.id, !suggestion.isFavorite);
            }}
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
          {(suggestion.items || []).length.toLocaleString('fa-IR')} آیتم
          {suggestion.context?.style === 'formal'
            ? ' · رسمی'
            : suggestion.context?.style === 'party'
              ? ' · مهمانی'
              : ' · روزمره'}
        </p>
      </div>
    </article>
  );
};
