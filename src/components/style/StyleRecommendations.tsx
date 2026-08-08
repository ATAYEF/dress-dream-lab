import React, { useMemo, useState, useCallback, memo } from 'react';
import { Sparkles, SlidersHorizontal } from 'lucide-react';
import type { OutfitSuggestion } from '@/types/wardrobe';
import { cn } from '@/lib/utils';
import { StyleFeatured } from './StyleFeatured';
import { StyleCard } from './StyleCard';
import { OutfitSuggestionCard } from '@/components/OutfitSuggestionCard';

type HubTab = 'for_you' | 'occasion' | 'trending' | 'saved';

const GRID_PAGE = 10;

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

function StyleRecommendationsInner({
  suggestions,
  showFavoritesOnly,
  onShowFavoritesOnly,
  onToggleFavorite,
  onFeedback,
  onDelete,
  onGenerateNew,
  profileImageUrl,
  className,
}: StyleRecommendationsProps) {
  const [hubTab, setHubTab] = useState<HubTab>('for_you');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(GRID_PAGE);

  const filtered = useMemo(() => {
    let list = suggestions;
    if (hubTab === 'saved' || showFavoritesOnly) {
      list = suggestions.filter((s) => s.isFavorite);
    } else if (hubTab === 'trending') {
      const liked = suggestions.filter((s) => s.userFeedback === 'liked' || s.isFavorite);
      list = liked.length > 0 ? liked : suggestions.slice(0, 6);
    } else if (hubTab === 'occasion') {
      const occ = suggestions.filter(
        (s) => s.context?.style === 'formal' || s.context?.style === 'party'
      );
      list = occ.length > 0 ? occ : suggestions;
    }
    return list;
  }, [suggestions, hubTab, showFavoritesOnly]);

  const featured = filtered[0];
  const rest = useMemo(
    () => (featured ? filtered.filter((s) => s.id !== featured.id) : filtered),
    [filtered, featured]
  );
  const visibleRest = useMemo(() => rest.slice(0, visibleCount), [rest, visibleCount]);
  const hasMore = rest.length > visibleCount;

  const detail = useMemo(
    () => (detailId ? suggestions.find((s) => s.id === detailId) ?? null : null),
    [detailId, suggestions]
  );

  const handleOpen = useCallback((s: OutfitSuggestion) => {
    setDetailId(s.id);
  }, []);

  const handleTab = useCallback(
    (id: HubTab) => {
      setHubTab(id);
      setVisibleCount(GRID_PAGE);
      setDetailId(null);
      onShowFavoritesOnly(id === 'saved');
    },
    [onShowFavoritesOnly]
  );

  const handleFeedbackFeatured = useCallback(
    (liked: boolean) => {
      if (featured) onFeedback(featured, liked);
    },
    [featured, onFeedback]
  );

  const handleFeedbackDetail = useCallback(
    (liked: boolean) => {
      if (detail) onFeedback(detail, liked);
    },
    [detail, onFeedback]
  );

  const tabs: { id: HubTab; label: string }[] = useMemo(
    () => [
      { id: 'for_you', label: 'برای شما' },
      { id: 'occasion', label: 'مناسبت‌ها' },
      { id: 'trending', label: 'ترندها' },
      { id: 'saved', label: 'استایل‌های ذخیره‌شده' },
    ],
    []
  );

  return (
    <section className={cn('space-y-5 md:space-y-6 animate-fade-up', className)} dir="rtl">
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

      <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scroll-smooth" role="tablist">
        {tabs.map((tab) => {
          const active = hubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleTab(tab.id)}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-xs font-extrabold transition-colors',
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
            onClick={() => handleTab('for_you')}
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
              onViewDetails={handleOpen}
              onFeedback={handleFeedbackFeatured}
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
                onFeedback={handleFeedbackDetail}
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
                  {visibleRest.length.toLocaleString('fa-IR')} از{' '}
                  {rest.length.toLocaleString('fa-IR')}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {visibleRest.map((s, i) => (
                  <StyleCard
                    key={s.id}
                    suggestion={s}
                    index={i + 1}
                    priority={i < 4}
                    onOpen={handleOpen}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + GRID_PAGE)}
                    className="h-10 px-5 rounded-full border border-border/70 bg-card text-xs font-extrabold hover:border-gold/40 transition-colors"
                  >
                    نمایش بیشتر (
                    {(rest.length - visibleCount).toLocaleString('fa-IR')} باقی‌مانده)
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export const StyleRecommendations = memo(StyleRecommendationsInner);
