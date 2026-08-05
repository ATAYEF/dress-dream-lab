import React, { useState, useMemo } from 'react';
import { useStagedProgress, OUTFIT_SUGGESTION_STAGES } from '@/hooks/useStagedProgress';
import { Wand2, Trash2, GripVertical, Plus, Check, User, Sparkles, ArrowLeft, ArrowRight, Shirt, Search, X, Pencil, Eye, ChevronDown, MapPin, CloudSun } from 'lucide-react';
import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { MannequinDisplay } from './MannequinDisplay';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { CATEGORY_CONFIG, CATEGORY_CLOTHING_ORDER } from '@/lib/categoryConfig';
import { ColorHarmonyBadge } from './ColorHarmonyBadge';
import { AccessorySuggestions } from './AccessorySuggestions';
import { ShoeSuggestions } from './ShoeSuggestions';
import { OutfitContextPicker } from './OutfitContextPicker';
import {
  DEFAULT_OUTFIT_CONTEXT,
  OutfitContext,
  buildContextOutfit,
  contextLabels,
  STYLE_OPTIONS,
  ENVIRONMENT_OPTIONS,
  WEATHER_OPTIONS,
} from '@/lib/outfitContext';

interface OutfitBuilderProps {
  clothes: ClothingItem[];
  onGenerateSuggestion: (items: ClothingItem[], context: OutfitContext) => void;
  isGenerating: boolean;
  /** The user's own profile photo, used for a real virtual try-on instead of a generic mannequin */
  profileImageUrl?: string | null;
  onEditItem?: (item: ClothingItem) => void;
  onViewItem?: (item: ClothingItem) => void;
  onRemoveItem?: (item: ClothingItem) => void;
}

const LAYERABLE_CATEGORIES: ClothingCategory[] = ['tops', 'outerwear', 'accessories'];

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
  const [openGalleryCat, setOpenGalleryCat] = useState<ClothingCategory | null>('tops');
  const isMobile = useIsMobile();
  const genProgress = useStagedProgress(isGenerating, OUTFIT_SUGGESTION_STAGES);
  const [showContext, setShowContext] = useState(false);

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

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (draggedItem) {
      addItemToOutfit(draggedItem);
    }
  };

  const addItemToOutfit = (item: ClothingItem) => {
    setOutfitItems(prev => {
      if (prev.some(i => i.id === item.id)) {
        return prev;
      }

      if (LAYERABLE_CATEGORIES.includes(item.category)) {
        return [...prev, item];
      }

      const existingIndex = prev.findIndex(i => i.category === item.category);
      if (existingIndex !== -1) {
        const newItems = [...prev];
        newItems[existingIndex] = item;
        return newItems;
      }
      return [...prev, item];
    });
  };

  const handleItemTap = (item: ClothingItem) => {
    const isSelected = outfitItems.some(i => i.id === item.id);
    if (isSelected) {
      removeFromOutfit(item.id);
    } else {
      addItemToOutfit(item);
    }
  };

  const removeFromOutfit = (itemId: string) => {
    setOutfitItems(prev => prev.filter(i => i.id !== itemId));
  };

  const clearOutfit = () => {
    setOutfitItems([]);
  };

  const handleGenerate = () => {
    // If user picked items, use them as anchors; otherwise auto-build from wardrobe + context
    const anchors = outfitItems.length >= 1 ? outfitItems : [];
    const finalItems =
      outfitItems.length >= 2
        ? outfitItems
        : buildContextOutfit(clothes, outfitContext, anchors);

    if (finalItems.length < 2) {
      return;
    }

    // Suggestion is saved as a card — do NOT dump auto-picked set onto the mannequin.
    // Mannequin only shows what the user explicitly selected in category body-slots.
    onGenerateSuggestion(finalItems, outfitContext);
  };

  const handleAutoFill = () => {
    const built = buildContextOutfit(clothes, outfitContext, []);
    setOutfitItems(built);
  };

  const completedCategories = new Set(outfitItems.map(i => i.category)).size;
  const progressPct = Math.min((completedCategories / 4) * 100, 100);
  // Can generate with 2+ selected OR with enough wardrobe items for auto-suggest
  const canGenerate = outfitItems.length >= 2 || clothes.length >= 2;

  return (
    <div className="relative overflow-hidden rounded-[2rem]">
      {/* Background layers — richer for hero presence */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--gold)/0.12),_transparent_55%)]" />
      <div
        className="absolute -top-32 -right-20 w-80 h-80 rounded-full opacity-40 animate-blob pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full opacity-30 animate-blob animation-delay-2000 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--rose)) 0%, transparent 70%)' }}
      />

      <div className="relative p-3 sm:p-5 md:p-7 lg:p-8">
        {/* Toolbar: steps + mannequin gender */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 md:mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { n: '۱', t: 'انتخاب لباس' },
              { n: '۲', t: 'دیدن روی مانکن' },
              { n: '۳', t: 'تولید ست' },
            ].map((step, i) => (
              <div
                key={step.n}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] md:text-xs font-bold',
                  i === 0 && outfitItems.length === 0 && 'bg-gold/15 text-gold border border-gold/30',
                  i === 1 && outfitItems.length > 0 && outfitItems.length < 2 && 'bg-gold/15 text-gold border border-gold/30',
                  i === 2 && canGenerate && 'bg-gold/15 text-gold border border-gold/30',
                  !(
                    (i === 0 && outfitItems.length === 0) ||
                    (i === 1 && outfitItems.length > 0 && outfitItems.length < 2) ||
                    (i === 2 && canGenerate)
                  ) && 'bg-white/50 text-muted-foreground border border-white/60'
                )}
              >
                <span className="w-5 h-5 rounded-lg bg-gradient-gold text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                  {step.n}
                </span>
                {step.t}
              </div>
            ))}
          </div>

          {profileImageUrl && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <User className="w-3.5 h-3.5" />
              امتحان روی عکس شما
            </div>
          )}
        </div>

        {/* فرم شرایط + تولید ست — یک بلوک پیوسته */}
        <div className="mb-8 md:mb-10 rounded-3xl border border-border/40 bg-white dark:bg-card shadow-soft overflow-hidden">
          {/* نوار خلاصه — دقیقاً همان chipهای «انتخاب‌های شما» */}
          <div
            className={cn(
              'flex flex-col sm:flex-row sm:items-center gap-2.5 p-3.5 sm:p-4',
              showContext && 'border-b border-border/30'
            )}
          >
            <button
              type="button"
              onClick={() => setShowContext((v) => !v)}
              className="flex-1 min-w-0 flex items-center justify-between gap-2 text-right touch-manipulation"
              aria-expanded={showContext}
            >
              <div className="min-w-0 flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-foreground shrink-0">شرایط</span>
                {(
                  [
                    {
                      key: 'style',
                      label: STYLE_OPTIONS.find((o) => o.value === outfitContext.style)?.label ?? 'روزمره',
                      Icon: Shirt,
                    },
                    {
                      key: 'env',
                      label:
                        ENVIRONMENT_OPTIONS.find((o) => o.value === outfitContext.environment)?.label ??
                        'مکان',
                      Icon: MapPin,
                    },
                    {
                      key: 'weather',
                      label:
                        WEATHER_OPTIONS.find((o) => o.value === outfitContext.weather)?.label ?? 'هوا',
                      Icon: CloudSun,
                    },
                  ] as const
                ).map((chip, i) => (
                  <React.Fragment key={chip.key}>
                    {i > 0 && <span className="text-muted-foreground/40 text-xs">|</span>}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs font-extrabold text-foreground">
                      <chip.Icon className="w-3.5 h-3.5 shrink-0" />
                      {chip.label}
                    </span>
                  </React.Fragment>
                ))}
              </div>
              <span
                className={cn(
                  'shrink-0 text-[11px] font-extrabold px-3 py-1.5 rounded-full transition-colors',
                  showContext
                    ? 'bg-muted/60 text-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                )}
              >
                {showContext ? 'بستن' : 'تغییر'}
              </span>
            </button>
            <Button
              type="button"
              variant="gold"
              size="default"
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="font-extrabold shrink-0 min-h-[44px] sm:min-w-[140px] shadow-button-gold"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'در حال تولید…' : 'تولید ست'}
            </Button>
          </div>

          {showContext && (
            <div className="p-3.5 sm:p-5 bg-white dark:bg-card">
              <OutfitContextPicker
                value={outfitContext}
                onChange={setOutfitContext}
                onClear={() => setOutfitContext(DEFAULT_OUTFIT_CONTEXT)}
                embedded
              />
            </div>
          )}
        </div>

        {/* ===== Studio layout: مانکن | گالری | دسته‌بندی ===== */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_220px] gap-4 lg:gap-5">

          {/* ---- مانکن + انتخاب‌ها + تولید ---- */}
          <aside className="order-1 xl:order-none flex flex-col gap-3 xl:sticky xl:top-24 self-start">
            <div className="rounded-[1.75rem] bg-white dark:bg-card border border-border/40 shadow-soft overflow-hidden">
              <div
                onDragOver={!isMobile ? handleDragOver : undefined}
                onDragLeave={!isMobile ? handleDragLeave : undefined}
                onDrop={!isMobile ? handleDrop : undefined}
                className={cn(
                  'relative mx-auto w-full aspect-[3/5] max-h-[420px] overflow-hidden bg-gradient-to-b from-muted/30 to-background transition-all',
                  isDragOver && 'ring-2 ring-gold ring-inset'
                )}
              >
                <MannequinDisplay
                  items={outfitItems}
                  profileImageUrl={profileImageUrl}
                  compact
                  className="w-full h-full"
                />
                {clothes.length > 0 && outfitItems.length === 0 && !isDragOver && (
                  <div className="absolute inset-x-3 bottom-3 flex justify-center pointer-events-none">
                    <span className="px-3 py-1.5 rounded-full bg-white/90 text-[11px] font-bold text-muted-foreground shadow-sm">
                      {isMobile ? 'روی لباس‌ها تپ کنید' : 'لباس را بکشید اینجا'}
                    </span>
                  </div>
                )}
              </div>

              {/* انتخاب‌های شما — پایین‌تر از کنترل زوم مانکن */}
              <div className="p-3 pt-5 mt-1 border-t border-border/30">
                <p className="text-xs font-black text-center mb-3">انتخاب‌های شما</p>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { cat: 'dresses' as const, label: 'لباس', fallback: 'tops' as const },
                      { cat: 'accessories' as const, label: 'اکسسوری' },
                      { cat: 'shoes' as const, label: 'کفش' },
                      { cat: 'outerwear' as const, label: 'رویه' },
                    ] as const
                  ).map((slot) => {
                    const item =
                      outfitItems.find((i) => i.category === slot.cat) ||
                      ('fallback' in slot && slot.fallback
                        ? outfitItems.find((i) => i.category === slot.fallback)
                        : undefined);
                    return (
                      <button
                        key={slot.cat}
                        type="button"
                        onClick={() => {
                          setOpenGalleryCat(slot.cat);
                          setGalleryCategory(slot.cat);
                          if (item) removeFromOutfit(item.id);
                        }}
                        className={cn(
                          'relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-0.5 overflow-hidden transition-all',
                          item
                            ? 'border-gold/50 bg-gold/5'
                            : 'border-border/50 bg-muted/20 hover:border-gold/40 hover:bg-gold/5'
                        )}
                        title={item ? `${item.name} — برای حذف کلیک` : `افزودن ${slot.label}`}
                      >
                        {item ? (
                          <>
                            <img src={item.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white/90 text-[10px] flex items-center justify-center shadow">
                              ×
                            </span>
                          </>
                        ) : (
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="relative z-10 mt-auto mb-0.5 text-[9px] font-extrabold bg-white/90 px-1 rounded text-foreground/80">
                          {slot.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 pt-0">
                <Button
                  type="button"
                  variant="gold"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={!canGenerate || isGenerating}
                  className={cn(
                    'w-full font-extrabold min-h-[48px] shadow-button-gold',
                    canGenerate && !isGenerating && 'animate-glow-pulse'
                  )}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span className="truncate max-w-[180px]">{genProgress.stage.label}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      تولید ست
                    </>
                  )}
                </Button>
              </div>
            </div>
          </aside>

          {/* ---- گالری ---- */}
          <section className="order-2 xl:order-none rounded-[1.75rem] bg-white dark:bg-card border border-border/40 shadow-soft p-3.5 sm:p-5 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Shirt className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black tracking-tight">لباس</h3>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    لباس مورد نظر خود را انتخاب کنید
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-muted-foreground tabular-nums shrink-0">
                {galleryClothes.length.toLocaleString('fa-IR')}
              </span>
            </div>

            {/* جستجو */}
            <div className="relative mb-3">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={galleryQuery}
                onChange={(e) => setGalleryQuery(e.target.value)}
                placeholder="جستجوی نام، رنگ یا تگ..."
                className="w-full rounded-2xl pr-10 pl-9 py-2.5 min-h-[44px] text-sm bg-muted/40 border border-transparent outline-none focus:ring-2 focus:ring-gold/35 font-medium"
              />
              {galleryQuery && (
                <button
                  type="button"
                  onClick={() => setGalleryQuery('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground"
                  aria-label="پاک کردن"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* فیلترهای pill دسته */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 custom-scroll-smooth -mx-0.5 px-0.5">
              <button
                type="button"
                onClick={() => {
                  setGalleryCategory('all');
                  setOpenGalleryCat(null);
                }}
                className={cn(
                  'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all',
                  galleryCategory === 'all'
                    ? 'bg-gradient-gold text-white shadow-md'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                همه
              </button>
              {CATEGORY_CLOTHING_ORDER.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const active = galleryCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setGalleryCategory(cat);
                      setOpenGalleryCat(cat);
                    }}
                    className={cn(
                      'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all',
                      active
                        ? 'bg-gradient-gold text-white shadow-md'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* شبکه کارت‌ها */}
            <div className="max-h-[min(560px,58vh)] overflow-y-auto custom-scroll-smooth">
              {galleryClothes.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground font-medium">
                  لباسی یافت نشد
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
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
                          'group relative text-right rounded-2xl overflow-hidden border-2 bg-muted/20 transition-all duration-300',
                          isSelected
                            ? 'border-amber-400 shadow-md ring-2 ring-amber-400/30'
                            : 'border-transparent hover:border-border/60 hover:shadow-sm'
                        )}
                      >
                        <div className="aspect-[3/4] relative bg-muted/30">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            draggable={false}
                          />
                          {isSelected && (
                            <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow">
                              <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                          )}
                          <div
                            className={cn(
                              'absolute top-2 right-2 flex flex-col gap-1',
                              isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {onViewItem && (
                              <span
                                role="button"
                                title="مشاهده"
                                className="w-7 h-7 rounded-lg bg-white/90 shadow flex items-center justify-center"
                                onClick={() => onViewItem(item)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </span>
                            )}
                            {onEditItem && (
                              <span
                                role="button"
                                title="ویرایش"
                                className="w-7 h-7 rounded-lg bg-white/90 shadow flex items-center justify-center"
                                onClick={() => onEditItem(item)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="px-2 py-2">
                          <p className="text-[11px] sm:text-xs font-extrabold truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {CATEGORY_CONFIG[item.category]?.label}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {outfitItems.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-border/30 pt-3">
                <ColorHarmonyBadge
                  items={outfitItems}
                  wardrobe={clothes}
                  onSuggestClick={addItemToOutfit}
                  className="mx-auto"
                />
                <AccessorySuggestions
                  outfitItems={outfitItems}
                  wardrobe={clothes}
                  context={outfitContext}
                  onAddWardrobeItem={addItemToOutfit}
                  className="mx-auto"
                />
                <ShoeSuggestions
                  outfitItems={outfitItems}
                  wardrobe={clothes}
                  context={outfitContext}
                  onAddWardrobeItem={addItemToOutfit}
                  className="mx-auto"
                />
              </div>
            )}
          </section>

          {/* ---- سایدبار دسته‌بندی (دسکتاپ) ---- */}
          <aside className="hidden xl:flex order-3 flex-col rounded-[1.75rem] bg-white dark:bg-card border border-border/40 shadow-soft p-4 self-start sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-black">دسته‌بندی‌ها</h3>
            </div>
            <nav className="space-y-1.5" aria-label="دسته‌بندی لباس">
              {CATEGORY_CLOTHING_ORDER.map((cat, idx) => {
                const cfg = CATEGORY_CONFIG[cat];
                const Icon = cfg.icon;
                const active = galleryCategory === cat;
                const selected = outfitItems.some((i) => i.category === cat);
                const count = clothes.filter((c) => c.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setGalleryCategory(cat);
                      setOpenGalleryCat(cat);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 p-2.5 rounded-2xl text-right transition-all',
                      active
                        ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-300/60 shadow-sm'
                        : 'hover:bg-muted/50 border border-transparent'
                    )}
                  >
                    <span
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                        active ? 'bg-white text-amber-600 shadow-sm' : 'bg-muted/60 text-muted-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-extrabold truncate">{cfg.label}</span>
                      <span className="block text-[10px] text-muted-foreground font-medium">
                        {selected ? 'انتخاب شده' : count ? `${count.toLocaleString('fa-IR')} مورد` : 'انتخاب کنید'}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center shrink-0',
                        active ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {(idx + 1).toLocaleString('fa-IR')}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>

      </div>
    </div>
  );
};
