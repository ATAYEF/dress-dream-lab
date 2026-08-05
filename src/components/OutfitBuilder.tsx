import React, { useState, useMemo } from 'react';
import { useStagedProgress, OUTFIT_SUGGESTION_STAGES } from '@/hooks/useStagedProgress';
import {
  Check,
  X,
  Search,
  Sparkles,
  Share2,
  Bookmark,
  ChevronDown,
  User,
  Maximize2,
  Crop,
  ZoomIn,
  RotateCcw,
} from 'lucide-react';
import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { MannequinDisplay } from './MannequinDisplay';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { CATEGORY_CONFIG, CATEGORY_ORDER } from '@/lib/categoryConfig';
import { AiRecommendationsPanel } from './AiRecommendationsPanel';
import {
  DEFAULT_OUTFIT_CONTEXT,
  OutfitContext,
  buildContextOutfit,
} from '@/lib/outfitContext';

interface OutfitBuilderProps {
  clothes: ClothingItem[];
  onGenerateSuggestion: (items: ClothingItem[], context: OutfitContext) => void;
  isGenerating: boolean;
  profileImageUrl?: string | null;
  onEditItem?: (item: ClothingItem) => void;
  onViewItem?: (item: ClothingItem) => void;
  onRemoveItem?: (item: ClothingItem) => void;
}

const LAYERABLE_CATEGORIES: ClothingCategory[] = ['tops', 'outerwear', 'accessories'];

type ViewMode = 'full' | 'half' | 'zoom';

export const OutfitBuilder: React.FC<OutfitBuilderProps> = ({
  clothes,
  onGenerateSuggestion,
  isGenerating,
  profileImageUrl = null,
  onEditItem,
  onViewItem,
}) => {
  const [outfitItems, setOutfitItems] = useState<ClothingItem[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [outfitContext, setOutfitContext] = useState<OutfitContext>(DEFAULT_OUTFIT_CONTEXT);
  const [galleryQuery, setGalleryQuery] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<ClothingCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [filterOpen, setFilterOpen] = useState<'color' | 'pattern' | 'occasion' | null>(null);
  const isMobile = useIsMobile();
  const genProgress = useStagedProgress(isGenerating, OUTFIT_SUGGESTION_STAGES);

  const galleryClothes = useMemo(() => {
    let list = clothes;
    if (galleryCategory !== 'all') {
      list = list.filter((c) => c.category === galleryCategory);
    }
    const q = galleryQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.color && c.color.toLowerCase().includes(q)) ||
          (c.tags && c.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }
    return list;
  }, [clothes, galleryQuery, galleryCategory]);

  const primarySelected = outfitItems[0] ?? null;

  const addItemToOutfit = (item: ClothingItem) => {
    setConfirmed(false);
    setOutfitItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      if (LAYERABLE_CATEGORIES.includes(item.category)) return [...prev, item];
      const existingIndex = prev.findIndex((i) => i.category === item.category);
      if (existingIndex !== -1) {
        const next = [...prev];
        next[existingIndex] = item;
        return next;
      }
      return [...prev, item];
    });
  };

  const handleItemTap = (item: ClothingItem) => {
    const isSelected = outfitItems.some((i) => i.id === item.id);
    if (isSelected) {
      setOutfitItems((prev) => prev.filter((i) => i.id !== item.id));
      setConfirmed(false);
    } else {
      addItemToOutfit(item);
    }
  };

  const clearOutfit = () => {
    setOutfitItems([]);
    setConfirmed(false);
  };

  const handleConfirmSelection = () => {
    if (outfitItems.length === 0) return;
    setConfirmed(true);
  };

  const handleGenerate = () => {
    const anchors = outfitItems.length >= 1 ? outfitItems : [];
    const finalItems =
      outfitItems.length >= 2 ? outfitItems : buildContextOutfit(clothes, outfitContext, anchors);
    if (finalItems.length < 2) return;
    onGenerateSuggestion(finalItems, outfitContext);
  };

  const canGenerate = outfitItems.length >= 2 || clothes.length >= 2;

  const viewModes: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'full', label: 'تمام قد', icon: <User className="w-4 h-4" /> },
    { id: 'half', label: 'نیم تنه', icon: <Crop className="w-4 h-4" /> },
    { id: 'zoom', label: 'زوم', icon: <ZoomIn className="w-4 h-4" /> },
  ];

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-[#FAF8F5] dark:bg-background" dir="rtl">
      <div className="relative p-3 sm:p-4 md:p-5">
        {/* ===== Studio grid: clothing | mannequin | AI (visual LTR-like per mock) ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(240px,300px)] gap-3 md:gap-4 items-start">

          {/* ---------- CLOTHING PICKER (matches mock left panel) ---------- */}
          <aside className="order-2 lg:order-1 rounded-[1.25rem] bg-white dark:bg-card border border-border/50 shadow-soft overflow-hidden flex flex-col max-h-[min(720px,85vh)]">
            {!confirmed || outfitItems.length === 0 ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
                  <h3 className="text-sm font-black tracking-tight">انتخاب لباس</h3>
                  {outfitItems.length > 0 && (
                    <button
                      type="button"
                      onClick={clearOutfit}
                      className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                      aria-label="بستن و پاک کردن"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category icon row */}
                <div className="px-3 pb-3 overflow-x-auto scrollbar-none">
                  <div className="flex items-center gap-1.5 min-w-max">
                    {CATEGORY_ORDER.map((catId) => {
                      const cfg = CATEGORY_CONFIG[catId];
                      const Icon = cfg.icon;
                      const active = galleryCategory === catId;
                      return (
                        <button
                          key={catId}
                          type="button"
                          onClick={() => setGalleryCategory(catId)}
                          className={cn(
                            'flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl min-w-[52px] transition-all',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                            active
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted/60'
                          )}
                          aria-pressed={active}
                        >
                          <span
                            className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
                              active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/70'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="text-[9px] font-extrabold whitespace-nowrap">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter chips row */}
                <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'color' as const, label: 'رنگ' },
                      { id: 'pattern' as const, label: 'طرح' },
                      { id: 'occasion' as const, label: 'مناسبت' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterOpen((v) => (v === f.id ? null : f.id))}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold border transition-colors',
                        filterOpen === f.id
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {f.label}
                      <ChevronDown className={cn('w-3 h-3 transition-transform', filterOpen === f.id && 'rotate-180')} />
                    </button>
                  ))}
                  <div className="relative flex-1 min-w-[100px]">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="search"
                      value={galleryQuery}
                      onChange={(e) => setGalleryQuery(e.target.value)}
                      placeholder="جستجو..."
                      className="w-full rounded-full pr-8 pl-3 py-1.5 text-[11px] bg-muted/40 border border-border/40 outline-none focus:border-primary/40 font-medium"
                    />
                  </div>
                </div>

                {/* Clothing grid */}
                <div className="flex-1 overflow-y-auto custom-scroll-smooth px-3 pb-3">
                  {galleryClothes.length === 0 ? (
                    <div className="text-center py-12 text-xs text-muted-foreground font-medium">
                      لباسی یافت نشد
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {galleryClothes.map((item) => {
                        const isSelected = outfitItems.some((i) => i.id === item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleItemTap(item)}
                            className={cn(
                              'group relative aspect-[3/4] rounded-xl overflow-hidden bg-muted/30 transition-all duration-300',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                              isSelected
                                ? 'ring-2 ring-primary shadow-md scale-[1.02]'
                                : 'hover:ring-1 hover:ring-border hover:-translate-y-0.5'
                            )}
                            aria-pressed={isSelected}
                            aria-label={item.name}
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                              draggable={false}
                            />
                            {isSelected && (
                              <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                                <Check className="w-3 h-3" strokeWidth={3} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Confirm CTA */}
                <div className="p-3 border-t border-border/40 bg-white/80 dark:bg-card/80 backdrop-blur">
                  <Button
                    type="button"
                    variant="gold"
                    size="lg"
                    onClick={handleConfirmSelection}
                    disabled={outfitItems.length === 0}
                    className="w-full font-extrabold min-h-[46px] rounded-full shadow-button-gold"
                  >
                    <Check className="w-4 h-4" strokeWidth={3} />
                    تأیید انتخاب این لباس
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-2 font-medium">
                    پس از تأیید، پیشنهادهای هوشمند برای شما نمایش داده می‌شود.
                  </p>
                </div>
              </>
            ) : (
              /* Selected state — matches mock bottom-left card */
              <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </span>
                    <h3 className="text-sm font-black">لباس انتخاب شد</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmed(false)}
                    className="p-1.5 rounded-full text-muted-foreground hover:bg-muted"
                    aria-label="بازگشت به انتخاب"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {primarySelected && (
                  <div className="rounded-2xl border border-border/50 bg-muted/20 p-3 flex gap-3">
                    <div className="w-20 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                      <img
                        src={primarySelected.imageUrl}
                        alt={primarySelected.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                      <p className="text-sm font-black truncate">{primarySelected.name}</p>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {CATEGORY_CONFIG[primarySelected.category]?.label}
                        {primarySelected.color ? ` · ${primarySelected.color}` : ''}
                      </p>
                      {outfitItems.length > 1 && (
                        <p className="text-[10px] text-primary font-bold mt-1">
                          +{(outfitItems.length - 1).toLocaleString('fa-IR')} مورد دیگر در ست
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (primarySelected && onViewItem) onViewItem(primarySelected);
                    }}
                    className="w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted/60 transition-colors"
                  >
                    مشاهده و تغییر لباس
                    <ChevronDown className="w-3.5 h-3.5 inline-block mr-1 rotate-90" />
                  </button>
                  <Button
                    type="button"
                    variant="soft"
                    onClick={() => setConfirmed(false)}
                    className="w-full font-bold rounded-full"
                  >
                    تغییر انتخاب
                  </Button>
                </div>

                {/* Mini selected stack */}
                {outfitItems.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto scrollbar-none pt-1">
                    {outfitItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemTap(item)}
                        className="relative w-14 h-16 rounded-lg overflow-hidden ring-1 ring-border/60 shrink-0"
                        title={`حذف ${item.name}`}
                      >
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background/90 flex items-center justify-center">
                          <X className="w-2.5 h-2.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* ---------- MANNEQUIN CENTER ---------- */}
          <section className="order-1 lg:order-2 min-w-0">
            <div className="relative rounded-[1.25rem] bg-white dark:bg-card border border-border/50 shadow-soft overflow-hidden">
              {/* Soft spotlight */}
              <div
                className="pointer-events-none absolute top-8 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full opacity-50 blur-3xl"
                style={{ background: 'radial-gradient(circle, hsl(var(--gold) / 0.35), transparent 70%)' }}
                aria-hidden="true"
              />

              {/* Side view-mode controls */}
              <div className="absolute top-1/2 -translate-y-1/2 right-2 z-20 flex flex-col gap-1.5">
                {viewModes.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setViewMode(m.id)}
                    title={m.label}
                    aria-label={m.label}
                    aria-pressed={viewMode === m.id}
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                      viewMode === m.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white/90 dark:bg-card text-muted-foreground hover:text-foreground border border-border/50'
                    )}
                  >
                    {m.icon}
                  </button>
                ))}
              </div>

              <div
                className={cn(
                  'relative mx-auto w-full transition-all duration-500',
                  viewMode === 'full' && 'aspect-[3/4] max-h-[560px]',
                  viewMode === 'half' && 'aspect-[3/3.2] max-h-[420px]',
                  viewMode === 'zoom' && 'aspect-[3/3.6] max-h-[520px] scale-105'
                )}
              >
                <MannequinDisplay
                  items={outfitItems}
                  profileImageUrl={profileImageUrl}
                  className="w-full h-full max-w-none"
                  compact
                />
              </div>

              {/* Bottom zoom strip (mock style) */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/90 dark:bg-card/90 backdrop-blur-md rounded-full px-2 py-1 shadow-md border border-border/40">
                <button
                  type="button"
                  onClick={() => setViewMode('half')}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
                  aria-label="کوچک‌نمایی"
                >
                  −
                </button>
                <span className="text-[11px] font-bold min-w-[40px] text-center tabular-nums">
                  {viewMode === 'zoom' ? '۱۲۵٪' : viewMode === 'half' ? '۷۵٪' : '۱۰۰٪'}
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode('zoom')}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
                  aria-label="بزرگ‌نمایی"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('full')}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
                  aria-label="بازنشانی"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Bottom action bar — matches mock */}
            <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                type="button"
                variant="soft"
                className="rounded-full font-bold min-h-[44px] sm:flex-1"
                disabled={outfitItems.length === 0}
                onClick={() => {
                  /* placeholder: save style */
                }}
              >
                <Bookmark className="w-4 h-4" />
                ذخیره استایل
              </Button>
              <Button
                type="button"
                variant="gold"
                className="rounded-full font-extrabold min-h-[48px] sm:flex-[1.4] shadow-button-gold"
                disabled={!canGenerate || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span className="truncate max-w-[140px]">{genProgress.stage.label}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    تولید ست کامل
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="soft"
                className="rounded-full font-bold min-h-[44px] sm:flex-1"
                disabled={outfitItems.length === 0}
                onClick={() => {
                  if (navigator.share && primarySelected) {
                    void navigator.share({
                      title: 'استایلر',
                      text: `ست ${primarySelected.name}`,
                    }).catch(() => undefined);
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
                اشتراک‌گذاری
              </Button>
            </div>
          </section>

          {/* ---------- AI RECOMMENDATIONS (matches mock right panel) ---------- */}
          <aside className="order-3 rounded-[1.25rem] bg-white dark:bg-card border border-border/50 shadow-soft p-4 max-h-[min(720px,85vh)] overflow-y-auto custom-scroll-smooth lg:sticky lg:top-24">
            <AiRecommendationsPanel
              outfitItems={outfitItems}
              wardrobe={clothes}
              context={outfitContext}
              onAddWardrobeItem={addItemToOutfit}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};
