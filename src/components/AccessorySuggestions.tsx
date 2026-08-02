import React from 'react';
import { Watch, Plus, Sparkles } from 'lucide-react';
import { ClothingItem } from '@/types/wardrobe';
import {
  suggestCoordinatedAccessories,
  SuggestedAccessory,
} from '@/lib/accessorySuggestion';
import type { OutfitContext } from '@/lib/outfitContext';
import { cn } from '@/lib/utils';

interface AccessorySuggestionsProps {
  outfitItems: ClothingItem[];
  wardrobe: ClothingItem[];
  gender?: 'female' | 'male';
  context?: OutfitContext;
  /** Add a wardrobe accessory into the current outfit */
  onAddWardrobeItem?: (item: ClothingItem) => void;
  className?: string;
}

export const AccessorySuggestions: React.FC<AccessorySuggestionsProps> = ({
  outfitItems,
  wardrobe,
  gender = 'female',
  context,
  onAddWardrobeItem,
  className,
}) => {
  if (outfitItems.length === 0) return null;
  if (outfitItems.some((i) => i.category === 'accessories')) return null;

  const suggestions = suggestCoordinatedAccessories(
    outfitItems,
    wardrobe,
    gender,
    context
  );

  if (suggestions.length === 0) return null;

  const handleClick = (acc: SuggestedAccessory) => {
    if (acc.wardrobeItem && onAddWardrobeItem) {
      onAddWardrobeItem(acc.wardrobeItem);
    }
  };

  return (
    <div
      className={cn(
        'w-full max-w-[340px] rounded-2xl border border-violet-300/30 bg-gradient-to-br from-violet-500/10 via-white/50 to-fuchsia-500/10 p-3.5 md:p-4 shadow-soft space-y-3',
        className
      )}
      dir="rtl"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center border border-violet-300/30">
          <Watch className="w-4 h-4 text-violet-600 dark:text-violet-300" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-extrabold flex items-center gap-1.5">
            اکسسوری‌های هماهنگ
            <Sparkles className="w-3 h-3 text-gold" />
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            از کمد شما و پیشنهادهای تکمیلی
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {suggestions.map((acc) => {
          const fromWardrobe = Boolean(acc.wardrobeItem);
          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => handleClick(acc)}
              disabled={!fromWardrobe}
              className={cn(
                'relative flex flex-col items-stretch gap-1.5 p-2 rounded-xl border text-right transition-all duration-300',
                fromWardrobe
                  ? 'bg-white/80 dark:bg-white/5 border-violet-300/40 hover:border-violet-400 hover:shadow-md cursor-pointer'
                  : 'bg-white/50 dark:bg-white/5 border-white/60 cursor-default opacity-95'
              )}
              title={acc.reason}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-cream/40">
                <img
                  src={acc.imageUrl}
                  alt={acc.name}
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                />
                {fromWardrobe && (
                  <span className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-violet-600 text-white text-[9px] font-black shadow">
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
                <p className="text-[10px] font-extrabold line-clamp-1 leading-tight">{acc.name}</p>
                <p className="text-[9px] text-muted-foreground font-medium line-clamp-1">
                  {acc.reason}
                </p>
                {typeof acc.score === 'number' && (
                  <p className="text-[9px] font-black text-violet-600 dark:text-violet-300 mt-0.5">
                    تطبیق {acc.score}٪
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
