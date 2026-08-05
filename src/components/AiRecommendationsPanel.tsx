import React, { useMemo } from 'react';
import { Footprints, ShoppingBag, Gem, Watch, Sparkles } from 'lucide-react';
import { ClothingItem } from '@/types/wardrobe';
import { suggestCoordinatedShoes } from '@/lib/shoeSuggestion';
import { suggestCoordinatedAccessories } from '@/lib/accessorySuggestion';
import type { OutfitContext } from '@/lib/outfitContext';
import { SuggestionRail, RailItem } from './SuggestionRail';
import { ColorHarmonyBadge } from './ColorHarmonyBadge';
import { cn } from '@/lib/utils';

interface AiRecommendationsPanelProps {
  outfitItems: ClothingItem[];
  wardrobe: ClothingItem[];
  gender?: 'female' | 'male';
  context?: OutfitContext;
  onAddWardrobeItem?: (item: ClothingItem) => void;
  className?: string;
}

const WATCH_PATTERN = /ساعت|watch/i;

/**
 * Right-hand AI stylist column — recommendations grouped into
 * shoes / bags / accessories / watches, each a compact horizontal carousel.
 * All underlying suggestion logic is unchanged.
 */
export const AiRecommendationsPanel: React.FC<AiRecommendationsPanelProps> = ({
  outfitItems,
  wardrobe,
  gender = 'female',
  context,
  onAddWardrobeItem,
  className,
}) => {
  const hasOutfit = outfitItems.length > 0;

  const { shoes, bags, accessories, watches, addMap } = useMemo(() => {
    const addMap = new Map<string, ClothingItem>();
    const shoes: RailItem[] = [];
    const bags: RailItem[] = [];
    const accessories: RailItem[] = [];
    const watches: RailItem[] = [];

    if (!hasOutfit) return { shoes, bags, accessories, watches, addMap };

    // ---- Shoes (skipped when the outfit already has shoes, as before) ----
    if (!outfitItems.some((i) => i.category === 'shoes')) {
      suggestCoordinatedShoes(outfitItems, wardrobe, gender, context).forEach((s) => {
        if (s.wardrobeItem) addMap.set(s.id, s.wardrobeItem);
        shoes.push({
          id: s.id,
          name: s.name,
          imageUrl: s.imageUrl,
          reason: s.reason,
          score: s.score,
          addable: Boolean(s.wardrobeItem),
        });
      });
    }

    // ---- Bags / belts / watches (skipped when accessories already chosen) ----
    if (!outfitItems.some((i) => i.category === 'accessories')) {
      suggestCoordinatedAccessories(outfitItems, wardrobe, gender, context).forEach((a) => {
        if (a.wardrobeItem) addMap.set(a.id, a.wardrobeItem);
        const rail: RailItem = {
          id: a.id,
          name: a.name,
          imageUrl: a.imageUrl,
          reason: a.reason,
          score: a.score,
          addable: Boolean(a.wardrobeItem),
        };
        if (a.type === 'bag') bags.push(rail);
        else if (WATCH_PATTERN.test(a.name)) watches.push(rail);
        else accessories.push(rail);
      });

      // Watches from the wardrobe that the generic engine did not surface
      wardrobe
        .filter(
          (c) =>
            c.category === 'accessories' &&
            WATCH_PATTERN.test(`${c.name} ${(c.tags || []).join(' ')}`) &&
            !outfitItems.some((i) => i.id === c.id)
        )
        .slice(0, 6)
        .forEach((c) => {
          if (watches.some((w) => addMap.get(w.id)?.id === c.id)) return;
          addMap.set(`wardrobe-watch-${c.id}`, c);
          watches.push({
            id: `wardrobe-watch-${c.id}`,
            name: c.name,
            imageUrl: c.imageUrl,
            reason: 'از کمد شما',
            addable: true,
          });
        });
    }

    return { shoes, bags, accessories, watches, addMap };
  }, [outfitItems, wardrobe, gender, context, hasOutfit]);

  const handleSelect = (id: string) => {
    const item = addMap.get(id);
    if (item && onAddWardrobeItem) onAddWardrobeItem(item);
  };

  const isEmpty =
    shoes.length === 0 && bags.length === 0 && accessories.length === 0 && watches.length === 0;

  return (
    <div className={cn('space-y-7', className)} dir="rtl">
      <header className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-black tracking-tight leading-tight">پیشنهاد استایلیست</h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            تکمیل ست شما با هوش مصنوعی
          </p>
        </div>
      </header>

      {!hasOutfit || isEmpty ? (
        <p className="text-xs text-muted-foreground font-medium leading-relaxed py-6">
          {hasOutfit
            ? 'ست شما کامل است؛ پیشنهاد تازه‌ای نداریم.'
            : 'یک لباس انتخاب کنید تا کفش، کیف، اکسسوری و ساعت هماهنگ پیشنهاد شود.'}
        </p>
      ) : (
        <>
          <ColorHarmonyBadge items={outfitItems} wardrobe={wardrobe} onSuggestClick={onAddWardrobeItem} />
          <SuggestionRail
            title="کفش"
            subtitle="هماهنگ با ست انتخابی"
            icon={Footprints}
            items={shoes}
            onSelect={handleSelect}
          />
          <SuggestionRail
            title="کیف"
            subtitle="تکمیل‌کننده استایل"
            icon={ShoppingBag}
            items={bags}
            onSelect={handleSelect}
          />
          <SuggestionRail
            title="اکسسوری"
            subtitle="کمربند و جزئیات"
            icon={Gem}
            items={accessories}
            onSelect={handleSelect}
          />
          <SuggestionRail
            title="ساعت"
            subtitle="از کمد شما"
            icon={Watch}
            items={watches}
            onSelect={handleSelect}
          />
        </>
      )}
    </div>
  );
};
