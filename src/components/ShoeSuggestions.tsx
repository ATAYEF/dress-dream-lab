import React from 'react';
import { Footprints, Plus, Sparkles } from 'lucide-react';
import { ClothingItem } from '@/types/wardrobe';
import { suggestCoordinatedShoes, SuggestedShoe } from '@/lib/shoeSuggestion';
import type { OutfitContext } from '@/lib/outfitContext';
import { cn } from '@/lib/utils';

interface ShoeSuggestionsProps {
  outfitItems: ClothingItem[];
  wardrobe: ClothingItem[];
  gender?: 'female' | 'male';
  context?: OutfitContext;
  onAddWardrobeItem?: (item: ClothingItem) => void;
  className?: string;
}

export const ShoeSuggestions: React.FC<ShoeSuggestionsProps> = ({
  outfitItems,
  wardrobe,
  gender = 'female',
  context,
  onAddWardrobeItem,
  className,
}) => {
  if (outfitItems.length === 0) return null;
  if (outfitItems.some((i) => i.category === 'shoes')) return null;

  const suggestions = suggestCoordinatedShoes(
    outfitItems,
    wardrobe,
    gender,
    context
  );

  if (suggestions.length === 0) return null;

  const handleClick = (shoe: SuggestedShoe) => {
    if (shoe.wardrobeItem && onAddWardrobeItem) {
      onAddWardrobeItem(shoe.wardrobeItem);
    }
  };

  return (
    <div
      className={cn(
        'w-full max-w-[340px] rounded-2xl border border-teal-300/30 bg-gradient-to-br from-teal-500/10 via-white/50 to-emerald-500/10 p-3.5 md:p-4 shadow-soft space-y-3',
        className
      )}
      dir="rtl"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-teal-500/15 flex items-center justify-center border border-teal-300/30">
          <Footprints className="w-4 h-4 text-teal-700 dark:text-teal-300" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-extrabold flex items-center gap-1.5">
            کفش‌های هماهنگ
            <Sparkles className="w-3 h-3 text-gold" />
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            از کمد شما و پیشنهادهای تکمیلی
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {suggestions.map((shoe) => {
          const fromWardrobe = Boolean(shoe.wardrobeItem);
          return (
            <button
              key={shoe.id}
              type="button"
              onClick={() => handleClick(shoe)}
              disabled={!fromWardrobe}
              className={cn(
                'relative flex flex-col items-stretch gap-1.5 p-2 rounded-xl border text-right transition-all duration-300',
                fromWardrobe
                  ? 'bg-white/80 dark:bg-white/5 border-teal-300/40 hover:border-teal-500 hover:shadow-md cursor-pointer'
                  : 'bg-white/50 dark:bg-white/5 border-white/60 cursor-default opacity-95'
              )}
              title={shoe.reason}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-cream/40">
                <img
                  src={shoe.imageUrl}
                  alt={shoe.name}
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                />
                {fromWardrobe && (
                  <span className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-teal-600 text-white text-[9px] font-black shadow">
                    <Plus className="w-2.5 h-2.5" />
                    افزودن
                  </span>
                )}
                {!fromWardrobe && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-black/50 text-white text-[8px] font-bold">
                    ایده
                  </span>
                )}
              </div>
              <div className="px-0.5">
                <p className="text-[10px] font-extrabold line-clamp-1 leading-tight">
                  {shoe.name}
                </p>
                <p className="text-[9px] text-muted-foreground font-medium line-clamp-1">
                  {shoe.reason}
                </p>
                {typeof shoe.score === 'number' && (
                  <p className="text-[9px] font-black text-teal-700 dark:text-teal-300 mt-0.5">
                    تطبیق {shoe.score}٪
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
