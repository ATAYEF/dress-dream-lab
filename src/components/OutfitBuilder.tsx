import React, { useState, useMemo, useRef, useCallback } from 'react';
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
  MapPin,
  CloudSun,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { MannequinDisplay, type MannequinDisplayHandle } from './MannequinDisplay';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { CATEGORY_CONFIG, CATEGORY_ORDER } from '@/lib/categoryConfig';
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

/** Smooth horizontal drag-to-scroll for category tabs */
function useSmoothDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const moved = useRef(false);
  const raf = useRef<number | null>(null);
  const targetScroll = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    dragging.current = true;
    moved.current = false;
    startX.current = e.pageX;
    scrollStart.current = el.scrollLeft;
    targetScroll.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.scrollBehavior = 'auto';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !ref.current) return;
    e.preventDefault();
    const dx = e.pageX - startX.current;
    if (Math.abs(dx) > 3) moved.current = true;
    targetScroll.current = scrollStart.current - dx * 1.15;
    if (raf.current == null) {
      raf.current = requestAnimationFrame(() => {
        if (ref.current) ref.current.scrollLeft = targetScroll.current;
        raf.current = null;
      });
    }
  }, []);

  const endDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (ref.current) {
      ref.current.style.cursor = 'grab';
      ref.current.style.scrollBehavior = 'smooth';
    }
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  }, []);

  return { ref, onMouseDown, onMouseMove, onMouseUp: endDrag, onMouseLeave: endDrag, moved };
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
  const isMobile = useIsMobile();
  const genProgress = useStagedProgress(isGenerating, OUTFIT_SUGGESTION_STAGES);
  const [showContext, setShowContext] = useState(false);
  const [showPickerPanel, setShowPickerPanel] = useState(true);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const catScroll = useSmoothDragScroll();
  const mannequinRef = useRef<MannequinDisplayHandle>(null);

  /** Tabs from real category config (DB) */
  const pickerTabs = useMemo(
    () =>
      CATEGORY_ORDER.map((key) => ({
        key,
        label: CATEGORY_CONFIG[key].label,
        icon: CATEGORY_CONFIG[key].icon,
      })),
    []
  );

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

      let next = [...prev];

      // لباس یکسره با بالاتنه/پایین‌تنه هم‌زمان نمی‌آید
      if (item.category === 'dresses') {
        next = next.filter(
          (i) => i.category !== 'tops' && i.category !== 'bottoms' && i.category !== 'dresses'
        );
        return [...next, item];
      }
      if (item.category === 'tops' || item.category === 'bottoms') {
        next = next.filter((i) => i.category !== 'dresses');
      }

      // رویه: یک عدد
      if (item.category === 'outerwear') {
        next = next.filter((i) => i.category !== 'outerwear');
        return [...next, item];
      }

      // اکسسوری چندتایی مجاز
      if (item.category === 'accessories') {
        return [...next, item];
      }

      // بالاتنه/پایین‌تنه/کفش: جایگزین هم‌دسته
      const existingIndex = next.findIndex((i) => i.category === item.category);
      if (existingIndex !== -1) {
        next[existingIndex] = item;
        return next;
      }
      return [...next, item];
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

  const handleClosePicker = () => {
    setGalleryCategory('all');
    setGalleryQuery('');
    setShowPickerPanel(false);
  };

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
        {/* نوار باز کردن پنل‌های جمع‌شده — بالای استودیو */}
        {(!showPickerPanel || !showAiPanel) && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            {!showPickerPanel && (
              <button
                type="button"
                onClick={() => setShowPickerPanel(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border/70 shadow-soft text-xs font-extrabold hover:border-gold/40 transition-colors"
              >
                <Shirt className="w-4 h-4 text-amber-600" />
                انتخاب لباس
              </button>
            )}
            {!showAiPanel && (
              <button
                type="button"
                onClick={() => setShowAiPanel(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border/70 shadow-soft text-xs font-extrabold hover:border-gold/40 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                پیشنهادهای هوش مصنوعی
              </button>
            )}
          </div>
        )}

        <div
          className={cn(
            'grid grid-cols-1 gap-5 lg:gap-6 items-start transition-all duration-300',
            showPickerPanel && showAiPanel &&
              'xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(260px,300px)]',
            showPickerPanel && !showAiPanel &&
              'xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]',
            !showPickerPanel && showAiPanel &&
              'xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)]',
            !showPickerPanel && !showAiPanel &&
              'xl:grid-cols-[minmax(0,1fr)] max-w-3xl mx-auto w-full'
          )}
        >

          {/* LEFT: Clothing picker */}
          {showPickerPanel && (
          <aside className="order-2 xl:order-1 flex flex-col gap-4 xl:sticky xl:top-20 self-start">
            <div className="rounded-[1.5rem] bg-card border border-border/70 shadow-soft overflow-hidden flex flex-col max-h-[min(780px,85vh)]">
              <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border/50">
                <button
                  type="button"
                  onClick={handleClosePicker}
                  className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                  aria-label="جمع کردن انتخاب لباس"
                  title="جمع کردن برای فضای بیشتر مانکن"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="text-base font-black tracking-tight">انتخاب لباس</h3>
              </div>

              {/* Category tabs from DB config — smooth drag scroll */}
              <div className="px-3 pt-4 pb-4">
                <div
                  ref={catScroll.ref}
                  onMouseDown={catScroll.onMouseDown}
                  onMouseMove={catScroll.onMouseMove}
                  onMouseUp={catScroll.onMouseUp}
                  onMouseLeave={catScroll.onMouseLeave}
                  className="flex gap-2 overflow-x-auto custom-scroll-smooth pb-1 cursor-grab active:cursor-grabbing select-none"
                  style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
                >
                  {pickerTabs.map((tab) => {
                    const isActive = galleryCategory === tab.key;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          if (catScroll.moved.current) {
                            catScroll.moved.current = false;
                            return;
                          }
                          setGalleryCategory(tab.key);
                        }}
                        className={cn(
                          'shrink-0 flex flex-col items-center gap-2 px-3 py-3 rounded-2xl min-w-[68px] transition-all',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        <span
                          className={cn(
                            'w-11 h-11 rounded-2xl flex items-center justify-center transition-colors pointer-events-none',
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-muted/70'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="text-[11px] font-extrabold leading-tight whitespace-nowrap pointer-events-none">
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
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
                      aria-label="پاک کردن جستجو"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {(galleryCategory !== 'all' || galleryQuery) && (
                <div className="px-3 pb-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                    {galleryClothes.length.toLocaleString('fa-IR')} مورد
                  </span>
                  <button
                    type="button"
                    onClick={handleClosePicker}
                    className="text-[10px] font-extrabold text-primary hover:underline"
                  >
                    نمایش همه
                  </button>
                </div>
              )}

              {/* Grid */}
              <div className="flex-1 overflow-y-auto custom-scroll-smooth px-3 pb-4">
                {galleryClothes.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">لباسی یافت نشد</p>
                    {(galleryCategory !== 'all' || galleryQuery) && (
                      <button
                        type="button"
                        onClick={handleClosePicker}
                        className="text-[11px] font-extrabold text-primary"
                      >
                        نمایش همه
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
          </aside>
          )}

          {/* CENTER: Mannequin + try-on controls (must not clip MannequinDisplay chrome) */}
          <section className="order-1 xl:order-2 min-w-0">
            <div
              onDragOver={!isMobile ? handleDragOver : undefined}
              onDragLeave={!isMobile ? handleDragLeave : undefined}
              onDrop={!isMobile ? handleDrop : undefined}
              className={cn(
                'relative rounded-[1.75rem] bg-card border border-border/70 shadow-card transition-all',
                isDragOver && 'ring-2 ring-primary'
              )}
            >
              {outfitItems.length === 0 ? (
                <div className="relative mx-auto w-full aspect-[3/5] sm:aspect-[3/5.1] max-h-[720px] min-h-[420px] overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-muted/30 via-background to-muted/20">
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
                </div>
              ) : (
                <div className="relative p-3 sm:p-4">
                  <MannequinDisplay
                    ref={mannequinRef}
                    items={outfitItems}
                    profileImageUrl={profileImageUrl}
                    className="w-full max-w-none mx-auto"
                    onRemoveItem={removeFromOutfit}
                    onClearAll={clearOutfit}
                  />
                </div>
              )}
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
          {showAiPanel && (
          <aside className="order-3 xl:order-3 min-w-0 xl:sticky xl:top-20 self-start">
            <div className="rounded-[1.5rem] bg-card border border-border/70 shadow-soft p-5">
              <AiRecommendationsPanel
                outfitItems={outfitItems}
                wardrobe={clothes}
                context={outfitContext}
                onAddWardrobeItem={addItemToOutfit}
                onClose={() => setShowAiPanel(false)}
              />
            </div>
          </aside>
          )}
        </div>
      </div>
    </div>
  );
};
