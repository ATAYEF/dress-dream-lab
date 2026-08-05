import React, { useState, useMemo } from 'react';
import { useStagedProgress, OUTFIT_SUGGESTION_STAGES } from '@/hooks/useStagedProgress';
import {
  Trash2,
  Check,
  User,
  Sparkles,
  Shirt,
  Search,
  X,
  Pencil,
  Eye,
  ChevronDown,
  MapPin,
  CloudSun,
  RotateCcw,
  CircleDot,
  Sun,
  Footprints,
} from 'lucide-react';
import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { MannequinDisplay } from './MannequinDisplay';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { CATEGORY_CONFIG } from '@/lib/categoryConfig';
import { AiRecommendationsPanel } from './AiRecommendationsPanel';
import { OutfitContextPicker } from './OutfitContextPicker';
import {
  DEFAULT_OUTFIT_CONTEXT,
  OutfitContext,
  buildContextOutfit,
  STYLE_OPTIONS,
  ENVIRONMENT_OPTIONS,
  WEATHER_OPTIONS,
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

/** Category tabs matching mock (icon + Persian label) */
const PICKER_TABS: {
  key: ClothingCategory | 'all';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: 'all', label: 'همه', icon: Shirt },
  { key: 'tops', label: 'پیرهن', icon: Shirt },
  { key: 'outerwear', label: 'مانتو', icon: Sun },
  { key: 'bottoms', label: 'شلوار', icon: CircleDot },
  { key: 'outerwear', label: 'کت و ژاکت', icon: Sun },
  { key: 'dresses', label: 'لباس', icon: Shirt },
];

/** Common pattern keywords for طرح filter */
const PATTERN_OPTIONS = [
  { value: 'all', label: 'همه' },
  { value: 'ساده', label: 'ساده' },
  { value: 'راه', label: 'راه‌راه' },
  { value: 'چهارخونه', label: 'چهارخونه' },
  { value: 'گل', label: 'گل‌دار' },
  { value: 'چاپ', label: 'چاپ‌دار' },
] as const;

/** Common occasion keywords for مناسبت filter */
const OCCASION_OPTIONS = [
  { value: 'all', label: 'همه' },
  { value: 'روزمره', label: 'روزمره' },
  { value: 'رسمی', label: 'رسمی' },
  { value: 'مهمانی', label: 'مهمانی' },
  { value: 'ورزشی', label: 'ورزشی' },
  { value: 'اداری', label: 'اداری' },
] as const;

function itemMatchesKeyword(item: ClothingItem, keyword: string): boolean {
  const hay = `${item.name} ${(item.tags || []).join(' ')} ${(item.color || '')}`.toLowerCase();
  return hay.includes(keyword.toLowerCase());
}

export const OutfitBuilder: React.FC<OutfitBuilderProps> = ({
  clothes,
  onGenerateSuggestion,
  isGenerating,
  profileImageUrl = null,
  onEditItem,
  onViewItem,
  onRemoveItem,
}) => {
  const [outfitItems, setOutfitItems] = useState<ClothingItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<ClothingItem | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [outfitContext, setOutfitContext] = useState<OutfitContext>(DEFAULT_OUTFIT_CONTEXT);
  const [galleryQuery, setGalleryQuery] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<ClothingCategory | 'all'>('all');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [filterPattern, setFilterPattern] = useState<string>('all');
  const [filterOccasion, setFilterOccasion] = useState<string>('all');
  const [openFilter, setOpenFilter] = useState<'color' | 'pattern' | 'occasion' | null>(null);
  const isMobile = useIsMobile();
  const genProgress = useStagedProgress(isGenerating, OUTFIT_SUGGESTION_STAGES);
  const [showContext, setShowContext] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(true);

  /** Unique colors present in wardrobe (for رنگ dropdown) */
  const availableColors = useMemo(() => {
    const set = new Set<string>();
    clothes.forEach((c) => {
      if (c.color && c.color.trim()) set.add(c.color.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [clothes]);

  const galleryClothes = useMemo(() => {
    let list = clothes;

    // Category
    if (galleryCategory !== 'all') {
      list = list.filter((c) => c.category === galleryCategory);
    }

    // Color
    if (filterColor !== 'all') {
      list = list.filter(
        (c) => c.color && c.color.trim().toLowerCase() === filterColor.toLowerCase()
      );
    }

    // Pattern (طرح) — match against name + tags
    if (filterPattern !== 'all') {
      list = list.filter((c) => itemMatchesKeyword(c, filterPattern));
    }

    // Occasion (مناسبت) — match against name + tags
    if (filterOccasion !== 'all') {
      list = list.filter((c) => itemMatchesKeyword(c, filterOccasion));
    }

    // Search
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
  }, [clothes, galleryQuery, galleryCategory, filterColor, filterPattern, filterOccasion]);

  const hasActiveFilters =
    filterColor !== 'all' || filterPattern !== 'all' || filterOccasion !== 'all' || galleryCategory !== 'all';

  const clearFilters = () => {
    setFilterColor('all');
    setFilterPattern('all');
    setFilterOccasion('all');
    setGalleryCategory('all');
    setGalleryQuery('');
    setOpenFilter(null);
  };

  const primarySelected = outfitItems[0] ?? null;

  const handleDragStart = (e: React.DragEvent, item: ClothingItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (draggedItem) addItemToOutfit(draggedItem);
  };

  const addItemToOutfit = (item: ClothingItem) => {
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
    if (isSelected) removeFromOutfit(item.id);
    else addItemToOutfit(item);
  };

  const removeFromOutfit = (itemId: string) => {
    setOutfitItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearOutfit = () => setOutfitItems([]);

  const handleGenerate = () => {
    const anchors = outfitItems.length >= 1 ? outfitItems : [];
    const finalItems =
      outfitItems.length >= 2 ? outfitItems : buildContextOutfit(clothes, outfitContext, anchors);
    if (finalItems.length < 2) return;
    onGenerateSuggestion(finalItems, outfitContext);
  };

  const handleAutoFill = () => {
    setOutfitItems(buildContextOutfit(clothes, outfitContext, []));
  };

  const canGenerate = outfitItems.length >= 2 || clothes.length >= 2;

  const colorLabel =
    filterColor === 'all' ? 'رنگ' : filterColor;
  const patternLabel =
    filterPattern === 'all'
      ? 'طرح'
      : PATTERN_OPTIONS.find((o) => o.value === filterPattern)?.label ?? filterPattern;
  const occasionLabel =
    filterOccasion === 'all'
      ? 'مناسبت'
      : OCCASION_OPTIONS.find((o) => o.value === filterOccasion)?.label ?? filterOccasion;

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-background">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--gold)/0.06),_transparent_60%)]" />

      <div className="relative p-4 sm:p-6 md:p-8 lg:p-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">اتاق پرو</h2>
            <p className="text-sm text-muted-foreground font-medium mt-1.5">
              لباس‌ها را انتخاب کنید، روی مانکن ببینید و ست نهایی را بسازید.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {profileImageUrl && (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-card border border-border/70 text-xs font-bold text-muted-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                امتحان روی عکس شما
              </span>
            )}
            <Button
              type="button"
              variant="gold"
              size="default"
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="font-extrabold min-h-[44px] rounded-full shadow-button-gold"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? genProgress.stage.label : 'تولید ست'}
            </Button>
          </div>
        </div>

        {/* Context bar */}
        <div className="mb-6 md:mb-8 rounded-[1.5rem] bg-card border border-border/70 shadow-soft overflow-hidden">
          <div className={cn('flex flex-col sm:flex-row sm:items-center gap-3 p-4', showContext && 'border-b border-border/60')}>
            <button
              type="button"
              onClick={() => setShowContext((v) => !v)}
              className="flex-1 min-w-0 flex items-center justify-between gap-3 text-right touch-manipulation"
              aria-expanded={showContext}
            >
              <div className="min-w-0 flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-foreground shrink-0 ml-1">شرایط</span>
                {(
                  [
                    { key: 'style', label: STYLE_OPTIONS.find((o) => o.value === outfitContext.style)?.label ?? 'روزمره', Icon: Shirt },
                    { key: 'env', label: ENVIRONMENT_OPTIONS.find((o) => o.value === outfitContext.environment)?.label ?? 'مکان', Icon: MapPin },
                    { key: 'weather', label: WEATHER_OPTIONS.find((o) => o.value === outfitContext.weather)?.label ?? 'هوا', Icon: CloudSun },
                  ] as const
                ).map((chip) => (
                  <span key={chip.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/70 text-xs font-bold">
                    <chip.Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    {chip.label}
                  </span>
                ))}
              </div>
              <span className="shrink-0 text-[11px] font-extrabold px-3 py-1.5 rounded-full text-primary hover:bg-primary/10 transition-colors">
                {showContext ? 'بستن' : 'تغییر'}
              </span>
            </button>
          </div>
          {showContext && (
            <div className="p-4 sm:p-5">
              <OutfitContextPicker
                value={outfitContext}
                onChange={setOutfitContext}
                onClear={() => setOutfitContext(DEFAULT_OUTFIT_CONTEXT)}
                embedded
              />
            </div>
          )}
        </div>

        {/* 3-column studio */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(260px,300px)] gap-5 lg:gap-6 items-start">

          {/* LEFT: Clothing picker */}
          <aside className="order-2 xl:order-1 flex flex-col gap-4 xl:sticky xl:top-20 self-start">
            {primarySelected && !pickerOpen ? (
              <div className="rounded-[1.5rem] bg-card border border-border/70 shadow-soft p-5 relative">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="w-8 h-8 rounded-full bg-muted/70 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                    aria-label="بستن"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black">لباس انتخاب شد</span>
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-28 h-36 rounded-[1.15rem] overflow-hidden bg-muted/40 border border-border/50">
                    <img src={primarySelected.imageUrl} alt={primarySelected.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-sm font-extrabold text-center">{primarySelected.name}</p>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                  >
                    مشاهده و تغییر لباس
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] bg-card border border-border/70 shadow-soft overflow-hidden flex flex-col max-h-[min(780px,85vh)]">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border/50">
                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0"
                    aria-label="بستن پنل"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <h3 className="text-base font-black tracking-tight">انتخاب لباس</h3>
                </div>

                {/* Category tabs with icons (match mock right image) */}
                <div className="px-3 pt-3 pb-2 flex gap-1.5 overflow-x-auto custom-scroll-smooth">
                  {PICKER_TABS.map((tab, idx) => {
                    // For duplicate outerwear keys, both highlight when outerwear is active
                    const isActive = galleryCategory === tab.key;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={`${tab.key}-${tab.label}-${idx}`}
                        type="button"
                        onClick={() => {
                          setGalleryCategory(tab.key);
                          setOpenFilter(null);
                        }}
                        className={cn(
                          'shrink-0 flex flex-col items-center gap-1 px-2.5 py-2 rounded-2xl min-w-[52px] transition-all',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        <span
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
                            isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] font-extrabold leading-tight whitespace-nowrap">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Filter dropdowns: رنگ / طرح / مناسبت — now functional */}
                <div className="px-3 pb-2 relative">
                  <div className="flex gap-2 overflow-x-auto custom-scroll-smooth">
                    {/* رنگ */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpenFilter(openFilter === 'color' ? null : 'color')}
                        className={cn(
                          'inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors',
                          filterColor !== 'all'
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-muted/40 border-border/50 text-muted-foreground'
                        )}
                      >
                        {colorLabel}
                        <ChevronDown className={cn('w-3 h-3 opacity-60 transition-transform', openFilter === 'color' && 'rotate-180')} />
                      </button>
                      {openFilter === 'color' && (
                        <div className="absolute top-full right-0 mt-1.5 z-30 min-w-[140px] max-h-48 overflow-y-auto rounded-xl bg-card border border-border/70 shadow-elevated py-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterColor('all');
                              setOpenFilter(null);
                            }}
                            className={cn(
                              'w-full text-right px-3 py-2 text-xs font-bold hover:bg-muted/60',
                              filterColor === 'all' && 'text-primary bg-primary/5'
                            )}
                          >
                            همه رنگ‌ها
                          </button>
                          {availableColors.length === 0 ? (
                            <p className="px-3 py-2 text-[11px] text-muted-foreground">رنگی ثبت نشده</p>
                          ) : (
                            availableColors.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setFilterColor(c);
                                  setOpenFilter(null);
                                }}
                                className={cn(
                                  'w-full text-right px-3 py-2 text-xs font-bold hover:bg-muted/60 flex items-center justify-between gap-2',
                                  filterColor === c && 'text-primary bg-primary/5'
                                )}
                              >
                                <span className="truncate">{c}</span>
                                {filterColor === c && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* طرح */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpenFilter(openFilter === 'pattern' ? null : 'pattern')}
                        className={cn(
                          'inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors',
                          filterPattern !== 'all'
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-muted/40 border-border/50 text-muted-foreground'
                        )}
                      >
                        {patternLabel}
                        <ChevronDown className={cn('w-3 h-3 opacity-60 transition-transform', openFilter === 'pattern' && 'rotate-180')} />
                      </button>
                      {openFilter === 'pattern' && (
                        <div className="absolute top-full right-0 mt-1.5 z-30 min-w-[130px] rounded-xl bg-card border border-border/70 shadow-elevated py-1.5">
                          {PATTERN_OPTIONS.map((o) => (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => {
                                setFilterPattern(o.value);
                                setOpenFilter(null);
                              }}
                              className={cn(
                                'w-full text-right px-3 py-2 text-xs font-bold hover:bg-muted/60 flex items-center justify-between gap-2',
                                filterPattern === o.value && 'text-primary bg-primary/5'
                              )}
                            >
                              {o.label}
                              {filterPattern === o.value && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* مناسبت */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpenFilter(openFilter === 'occasion' ? null : 'occasion')}
                        className={cn(
                          'inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors',
                          filterOccasion !== 'all'
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-muted/40 border-border/50 text-muted-foreground'
                        )}
                      >
                        {occasionLabel}
                        <ChevronDown className={cn('w-3 h-3 opacity-60 transition-transform', openFilter === 'occasion' && 'rotate-180')} />
                      </button>
                      {openFilter === 'occasion' && (
                        <div className="absolute top-full right-0 mt-1.5 z-30 min-w-[130px] rounded-xl bg-card border border-border/70 shadow-elevated py-1.5">
                          {OCCASION_OPTIONS.map((o) => (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => {
                                setFilterOccasion(o.value);
                                setOpenFilter(null);
                              }}
                              className={cn(
                                'w-full text-right px-3 py-2 text-xs font-bold hover:bg-muted/60 flex items-center justify-between gap-2',
                                filterOccasion === o.value && 'text-primary bg-primary/5'
                              )}
                            >
                              {o.label}
                              {filterOccasion === o.value && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Click-outside overlay when a filter is open */}
                  {openFilter && (
                    <div className="fixed inset-0 z-20" onClick={() => setOpenFilter(null)} aria-hidden="true" />
                  )}
                </div>

                {/* Search */}
                <div className="px-3 pb-3">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="search"
                      value={galleryQuery}
                      onChange={(e) => setGalleryQuery(e.target.value)}
                      placeholder="جستجو..."
                      className="w-full rounded-full pr-9 pl-8 py-2.5 text-xs bg-muted/40 border border-transparent outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-primary/20 font-medium"
                    />
                    {galleryQuery && (
                      <button
                        type="button"
                        onClick={() => setGalleryQuery('')}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                        aria-label="پاک کردن"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Active filter summary + clear */}
                {hasActiveFilters && (
                  <div className="px-3 pb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                      {galleryClothes.length.toLocaleString('fa-IR')} مورد
                    </span>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[10px] font-extrabold text-primary hover:underline"
                    >
                      پاک کردن فیلترها
                    </button>
                  </div>
                )}

                {/* Grid */}
                <div className="flex-1 overflow-y-auto custom-scroll-smooth px-3 pb-4">
                  {galleryClothes.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">لباسی با این فیلتر یافت نشد</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="text-[11px] font-extrabold text-primary"
                        >
                          پاک کردن فیلترها
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {galleryClothes.map((item) => {
                        const isSelected = outfitItems.some((i) => i.id === item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleItemTap(item)}
                            draggable={!isMobile}
                            onDragStart={!isMobile ? (e) => handleDragStart(e, item) : undefined}
                            onDragEnd={!isMobile ? handleDragEnd : undefined}
                            className={cn(
                              'group relative text-right rounded-[1.1rem] p-1.5 transition-all duration-300',
                              isSelected
                                ? 'ring-2 ring-primary bg-primary/5 shadow-soft'
                                : 'hover:bg-muted/40'
                            )}
                          >
                            <div className="aspect-[3/4] relative rounded-[0.9rem] overflow-hidden bg-muted/30">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                                draggable={false}
                              />
                              {isSelected && (
                                <span className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                </span>
                              )}
                              <div
                                className={cn(
                                  'absolute top-1.5 right-1.5 flex flex-col gap-1 transition-opacity',
                                  isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                )}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {onViewItem && (
                                  <span
                                    role="button"
                                    className="w-7 h-7 rounded-full bg-background/90 backdrop-blur shadow-soft flex items-center justify-center"
                                    onClick={() => onViewItem(item)}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </span>
                                )}
                                {onEditItem && (
                                  <span
                                    role="button"
                                    className="w-7 h-7 rounded-full bg-background/90 backdrop-blur shadow-soft flex items-center justify-center"
                                    onClick={() => onEditItem(item)}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="px-1 pt-1.5 text-[10px] font-extrabold truncate leading-tight">{item.name}</p>
                            {item.color && (
                              <p className="px-1 text-[9px] text-muted-foreground font-medium truncate">{item.color}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {outfitItems.length > 0 && (
                  <div className="border-t border-border/50 px-3 py-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={clearOutfit}
                      className="text-[11px] font-bold text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      پاک کردن
                    </button>
                    <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                      {outfitItems.length.toLocaleString('fa-IR')} انتخاب
                    </span>
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* CENTER: Mannequin */}
          <section className="order-1 xl:order-2 min-w-0">
            <div
              onDragOver={!isMobile ? handleDragOver : undefined}
              onDragLeave={!isMobile ? handleDragLeave : undefined}
              onDrop={!isMobile ? handleDrop : undefined}
              className={cn(
                'relative rounded-[1.75rem] overflow-hidden bg-card border border-border/70 shadow-card transition-all',
                isDragOver && 'ring-2 ring-primary'
              )}
            >
              <div className="relative mx-auto w-full aspect-[3/4] sm:aspect-[3/3.6] max-h-[620px] bg-gradient-to-b from-muted/30 via-background to-muted/20">
                {outfitItems.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Shirt className="w-7 h-7" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-base font-black text-foreground">ست شما خالی است</p>
                      <p className="text-xs text-muted-foreground font-medium mt-1.5 leading-relaxed max-w-[220px]">
                        از پالت لباس‌های کنار، لباس‌ها را انتخاب کنید
                      </p>
                    </div>
                    <span className="px-4 py-2 rounded-full bg-background/90 border border-border/60 text-[11px] font-bold text-muted-foreground shadow-soft">
                      {isMobile ? 'روی لباس‌ها تپ کنید' : 'لباس را بکشید اینجا'}
                    </span>
                  </div>
                ) : (
                  <MannequinDisplay
                    items={outfitItems}
                    profileImageUrl={profileImageUrl}
                    className="w-full h-full"
                  />
                )}

                {outfitItems.length > 0 && (
                  <button
                    type="button"
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur border border-border/70 shadow-soft flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    title="چرخش"
                    aria-label="چرخش مانکن"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleAutoFill}
                className="px-4 py-2 rounded-full text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
              >
                پیشنهاد خودکار ست
              </button>
              {outfitItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearOutfit}
                  className="px-4 py-2 rounded-full text-[11px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  پاک کردن ست
                </button>
              )}
            </div>
          </section>

          {/* RIGHT: AI */}
          <aside className="order-3 xl:order-3 min-w-0 xl:sticky xl:top-20 self-start">
            <div className="rounded-[1.5rem] bg-card border border-border/70 shadow-soft p-5">
              <AiRecommendationsPanel
                outfitItems={outfitItems}
                wardrobe={clothes}
                context={outfitContext}
                onAddWardrobeItem={addItemToOutfit}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
