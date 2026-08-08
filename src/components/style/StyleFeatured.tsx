import React from 'react';
import { Heart, ChevronLeft, MapPin, Sparkles, Check } from 'lucide-react';
import type { OutfitSuggestion } from '@/types/wardrobe';
import { CATEGORY_CONFIG } from '@/lib/categoryConfig';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  BADGE_LABEL,
  styleTitle,
  styleSubtitle,
  contextChips,
  buildStyleReasons,
  heroImage,
  getStyleBadge,
} from './styleUtils';

interface StyleFeaturedProps {
  suggestion: OutfitSuggestion;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onViewDetails?: (s: OutfitSuggestion) => void;
  onFeedback?: (liked: boolean) => void;
  className?: string;
}

export const StyleFeatured: React.FC<StyleFeaturedProps> = ({
  suggestion,
  onToggleFavorite,
  onViewDetails,
  onFeedback,
  className,
}) => {
  const badge = getStyleBadge(suggestion, 0);
  const img = heroImage(suggestion);
  const title = styleTitle(suggestion);
  const subtitle = styleSubtitle(suggestion);
  const chips = contextChips(suggestion);
  const reasons = buildStyleReasons(suggestion);
  const items = suggestion.items || [];

  return (
    <section
      className={cn(
        'rounded-[1.5rem] bg-card border border-border/70 shadow-card overflow-hidden',
        className
      )}
      dir="rtl"
      aria-labelledby="featured-style-title"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(200px,240px)] gap-0">
        {/* Image */}
        <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[380px] bg-muted/30 overflow-hidden">
          {img ? (
            <img src={img} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              بدون تصویر
            </div>
          )}
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-espresso/80 text-white text-[10px] font-black tracking-wide backdrop-blur-sm">
            {BADGE_LABEL[badge]}
          </span>
        </div>

        {/* Details */}
        <div className="p-5 sm:p-6 flex flex-col gap-4 border-t lg:border-t-0 lg:border-r border-border/50">
          <div>
            <p className="text-[11px] font-bold text-primary inline-flex items-center gap-1 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              استایل پیشنهادی
            </p>
            <h2 id="featured-style-title" className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground font-medium mt-1">{subtitle}</p>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/70 text-[11px] font-bold text-foreground"
                >
                  {c.key === 'env' && <MapPin className="w-3 h-3 text-muted-foreground" />}
                  {c.label}
                </span>
              ))}
            </div>
          )}

          <div>
            <p className="text-sm font-extrabold mb-2.5">چرا این استایل مناسب شماست؟</p>
            <ul className="space-y-2">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-foreground/90 font-medium leading-snug">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" strokeWidth={2.5} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="gold"
              className="rounded-full font-extrabold h-10 px-4"
              onClick={() => onViewDetails?.(suggestion)}
            >
              مشاهده جزئیات استایل
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'rounded-full font-extrabold h-10 px-4',
                suggestion.isFavorite && 'border-rose/40 text-rose bg-rose/5'
              )}
              onClick={() => onToggleFavorite?.(suggestion.id, !suggestion.isFavorite)}
            >
              <Heart
                className="w-4 h-4"
                fill={suggestion.isFavorite ? 'currentColor' : 'none'}
              />
              {suggestion.isFavorite ? 'ذخیره شده' : 'ذخیره استایل'}
            </Button>
          </div>
        </div>

        {/* Items rail */}
        <aside className="border-t lg:border-t-0 lg:border-r border-border/50 bg-muted/20 p-4 sm:p-5">
          <p className="text-xs font-black text-foreground mb-3">آیتم‌های این استایل</p>
          <ul className="space-y-2.5 max-h-[320px] overflow-y-auto custom-scroll-smooth">
            {items.map((item) => {
              const cat = CATEGORY_CONFIG[item.category];
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-card border border-border/50"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover bg-muted shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-extrabold truncate leading-tight">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate">
                      {cat?.label || item.category}
                      {item.color ? ` · ${item.color}` : ''}
                    </p>
                  </div>
                </li>
              );
            })}
            {items.length === 0 && (
              <li className="text-xs text-muted-foreground text-center py-6">آیتمی ثبت نشده</li>
            )}
          </ul>
        </aside>
      </div>
    </section>
  );
};
