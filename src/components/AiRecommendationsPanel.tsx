import React, { useMemo } from 'react';
import { Footprints, ShoppingBag, Gem, Watch, Sparkles, ChevronLeft, X } from 'lucide-react';
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
  onClose?: () => void;
  className?: string;
}

const WATCH_PATTERN = /ساعت|watch/i;

/**
 * Right-hand AI stylist column — matches mock: header + shoes/bags/accessories rails
 * with selected gold ring and «مشاهده همه».
 */
export const AiRecommendationsPanel: React.FC<AiRecommendationsPanelProps> = ({
  outfitItems,
  wardrobe,
  gender = 'female',
  context,
  onAddWardrobeItem,
  onClose,
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
    <div className={cn('space-y-6', className)} dir="rtl">
      {/* Header matching mock */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black tracking-tight leading-tight">پیشنهادهای هوش مصنوعی</h3>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
              تکمیل ست شما با هوش مصنوعی
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            aria-label="بستن پیشنهادهای هوش مصنوعی"
            title="بستن برای فضای بیشتر مانکن"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </header>

      {!hasOutfit || isEmpty ? (
        <p className="text-xs text-muted-foreground font-medium leading-relaxed py-8 text-center">
          {hasOutfit
            ? 'ست شما کامل است؛ پیشنهاد تازه‌ای نداریم.'
            : 'یک لباس انتخاب کنید تا کفش، کیف، اکسسوری و ساعت هماهنگ پیشنهاد شود.'}
        </p>
      ) : (
        <>
          <ColorHarmonyBadge items={outfitItems} wardrobe={wardrobe} onSuggestClick={onAddWardrobeItem} />

          <SuggestionRail
            title="کفش پیشنهادی"
            icon={Footprints}
            items={shoes}
            onSelect={handleSelect}
            selectedIds={outfitItems.filter((i) => i.category === 'shoes').map((i) => i.id)}
            showViewAll
          />
          <SuggestionRail
            title="کیف پیشنهادی"
            icon={ShoppingBag}
            items={bags}
            onSelect={handleSelect}
            selectedIds={outfitItems.filter((i) => i.category === 'accessories').map((i) => i.id)}
            showViewAll
          />
          <SuggestionRail
            title="اکسسوری پیشنهادی"
            icon={Gem}
            items={[...accessories, ...watches]}
            onSelect={handleSelect}
            selectedIds={outfitItems.filter((i) => i.category === 'accessories').map((i) => i.id)}
            showViewAll
          />
        </>
      )}
    </div>
  );
};
