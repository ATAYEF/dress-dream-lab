import React from 'react';
import { Palette, Sparkles } from 'lucide-react';
import {
  scoreOutfitColors,
  suggestMatchingItems,
  colorNameToHex,
  scoreLabel,
  ColorMatchResult,
} from '@/lib/colorHarmony';
import { ClothingItem } from '@/types/wardrobe';
import { cn } from '@/lib/utils';

interface ColorHarmonyBadgeProps {
  items: ClothingItem[];
  wardrobe?: ClothingItem[];
  onSuggestClick?: (item: ClothingItem) => void;
  className?: string;
}

/** Convert number to Persian digits */
function toFa(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export const ColorHarmonyBadge: React.FC<ColorHarmonyBadgeProps> = ({
  items,
  wardrobe = [],
  onSuggestClick,
  className,
}) => {
  if (items.length === 0) return null;

  const result: ColorMatchResult = scoreOutfitColors(items);
  const label = scoreLabel(result.score);
  const suggestions =
    wardrobe.length > 0 && items.length >= 1
      ? suggestMatchingItems(items, wardrobe, { limit: 4 })
      : [];

  const toneStyles = {
    great: 'from-emerald-500/15 to-teal-500/10 border-emerald-400/35 text-emerald-800 dark:text-emerald-200',
    good: 'from-gold/15 to-amber-500/10 border-gold/35 text-foreground',
    ok: 'from-amber-500/10 to-orange-500/10 border-amber-400/30 text-foreground/90',
    weak: 'from-rose-500/10 to-pink-500/10 border-rose-400/30 text-foreground/90',
  };

  const barColor = {
    great: 'bg-emerald-500',
    good: 'bg-gradient-to-l from-gold to-amber-500',
    ok: 'bg-amber-500',
    weak: 'bg-rose-400',
  };

  return (
    <div
      className={cn(
        'w-full max-w-[340px] rounded-2xl border bg-gradient-to-br p-3.5 md:p-4 shadow-soft space-y-3',
        toneStyles[label.tone],
        className
      )}
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/70 dark:bg-white/10 flex items-center justify-center shrink-0 shadow-sm">
            <Palette className="w-4 h-4 text-gold" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold flex items-center gap-1.5">
              تطبیق رنگ هوشمند
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-white/10">
                {label.text}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium truncate">
              {result.label}
            </p>
          </div>
        </div>
        <div className="text-lg font-black text-gold shrink-0" style={{ fontFeatureSettings: '"ss01"' }}>
          {toFa(result.score)}
          <span className="text-[10px] font-bold text-muted-foreground mr-0.5">/{toFa(100)}</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor[label.tone])}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* Swatches */}
      {result.colors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {result.colors.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full bg-white/70 dark:bg-white/10 text-[10px] font-bold border border-white/80 shadow-sm"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-inner"
                style={{ backgroundColor: colorNameToHex(c) }}
              />
              {c}
            </span>
          ))}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">{result.explanation}</p>

      {/* Suggested next pieces */}
      {suggestions.length > 0 && onSuggestClick && items.length < 5 && (
        <div className="pt-1 border-t border-black/5 dark:border-white/10 space-y-2">
          <div className="flex items-center gap-1 text-[11px] font-extrabold text-foreground/80">
            <Sparkles className="w-3 h-3 text-gold" />
            پیشنهاد تکمیل ست
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {suggestions.map(({ item, score, reason, fromCatalog }) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSuggestClick(item)}
                className="group shrink-0 flex flex-col items-center gap-1 w-[72px] p-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/70 hover:border-gold/40 hover:shadow-md transition-all duration-300"
                title={`${item.name} · ${reason} (${toFa(score)})`}
              >
                <div className="relative">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover ring-1 ring-black/5 group-hover:scale-105 transition-transform"
                  />
                  {fromCatalog && (
                    <span className="absolute -top-1 -left-1 text-[8px] font-black px-1 py-0.5 rounded-md bg-indigo-500 text-white shadow">
                      الگو
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold text-center line-clamp-1 w-full">
                  {item.name}
                </span>
                <span className="text-[9px] font-extrabold text-gold">{toFa(score)}٪</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
