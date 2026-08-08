import React, { useMemo, useState } from 'react';
import { Sparkles, SlidersHorizontal } from 'lucide-react';
import type { OutfitSuggestion } from '@/types/wardrobe';
import { cn } from '@/lib/utils';
import { FilterChip, FilterChipGroup } from '@/components/shared';
import { StyleFeatured } from './StyleFeatured';
import { StyleCard } from './StyleCard';
import { OutfitSuggestionCard } from '@/components/OutfitSuggestionCard';

type HubTab = 'for_you' | 'occasion' | 'trending' | 'saved';

interface StyleRecommendationsProps {
  suggestions: OutfitSuggestion[];
  showFavoritesOnly: boolean;
  onShowFavoritesOnly: (v: boolean) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onFeedback: (s: OutfitSuggestion, liked: boolean) => void;
  onDelete: (id: string) => void;
  onGenerateNew?: () => void;
  profileImageUrl?: string | null;
  className?: string;
}

export const StyleRecommendations: React.FC<StyleRecommendationsProps> = ({
  suggestions,
  showFavoritesOnly,
  onShowFavoritesOnly,
  onToggleFavorite,
  onFeedback,
  onDelete,
  onGenerateNew,
  profileImageUrl,
  className,
}) => {
  const [hubTab, setHubTab] = useState<HubTab>('for_you');
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...suggestions];
    if (hubTab === 'saved' || showFavoritesOnly) {
      list = list.filter((s) => s.isFavorite);
    } else if (hubTab === 'trending') {
      list = list.filter((s) => s.userFeedback === 'liked' || s.isFavorite);
      if (list.length === 0) list = suggestions.slice(0, 6);
    } else if (hubTab === 'occasion') {
      list = list.filter((s) => s.context?.style === 'formal' || s.context?.style === 'party');
      if (list.length === 0) list = suggestions;
    }
    return list;
  }, [suggestions, hubTab, showFavoritesOnly]);

  const featured = filtered[0] ?? suggestions[0];
  const rest = filtered.filter((s) => s.id !== featured?.id);

  const detail = detailId
    ? suggestions.find((s) => s.id === detailId) ?? null
    : null;

  const tabs: { id: HubTab; label: string }[] = [
    { id: 'for_you', label: 'برای شما' },
    { id: 'occasion', label: 'مناسبت‌ها' },
    { id: 'trending', label: 'ترندها' },
    { id: 'saved', label: 'استایل‌های ذخیره‌شده' },
  ];

  return (
    <section className={cn('space-y-5 md:space-y-6 animate-fade-up', className)} dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-black tracking-tight inline-flex items-center gap-2">
            پیشنهاد استایل برای شما
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground font-medium mt-1.5">
            استایل‌های منتخب با هوش مصنوعی بر اساس سلیقه، کمد لباس و موقعیت فعلی
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerateNew}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto h-9 px-3.5 rounded-full border border-border/70 bg-card text-xs font-extrabold hover:border-gold/40 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          تنظیمات سلیقه شما
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scroll-smooth" role="tablist">
        {tabs.map((tab) => {
          const active = hubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setHubTab(tab.id);
                onShowFavoritesOnly(tab.id === 'saved');
              }}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-xs font-extrabold transition-all',
                active
                  ? 'bg-primary text-primary-foreground shadow-button-gold'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {suggestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-10 text-center">
          <p className="text-sm font-extrabold mb-2">هنوز استایلی ساخته نشده</p>
          <p className="text-xs text-muted-foreground mb-4">
            از اتاق پرو یک ست بسازید تا اینجا پیشنهادها نمایش داده شوند
          </p>
          {onGenerateNew && (
            <button
              type="button"
              onClick={onGenerateNew}
              className="h-10 px-5 rounded-full bg-gradient-gold text-white text-xs font-extrabold shadow-button-gold"
            >
              رفتن به اتاق پرو
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center space-y-3">
          <p className="text-sm font-extrabold">موردی در این فیلتر نیست</p>
          <button
            type="button"
            className="text-xs font-bold text-primary"
            onClick={() => {
              setHubTab('for_you');
              onShowFavoritesOnly(false);
            }}
          >
            نمایش همه
          </button>
        </div>
      ) : (
        <>
          {featured && !detail && (
            <StyleFeatured
              suggestion={featured}
              onToggleFavorite={onToggleFavorite}
              onViewDetails={(s) => setDetailId(s.id)}
              onFeedback={(liked) => onFeedback(featured, liked)}
            />
          )}

          {detail && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="text-xs font-extrabold text-muted-foreground hover:text-foreground"
              >
                ← بازگشت به پیشنهادها
              </button>
              <OutfitSuggestionCard
                suggestion={detail}
                onToggleFavorite={onToggleFavorite}
                onFeedback={(liked) => onFeedback(detail, liked)}
                onDelete={onDelete}
                profileImageUrl={profileImageUrl}
              />
            </div>
          )}

          {!detail && rest.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-black">استایل‌های بیشتر برای شما</h3>
                <span className="text-[11px] font-bold text-muted-foreground">
                  {rest.length.toLocaleString('fa-IR')} استایل
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {rest.map((s, i) => (
                  <StyleCard
                    key={s.id}
                    suggestion={s}
                    index={i + 1}
                    onOpen={(x) => setDetailId(x.id)}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
