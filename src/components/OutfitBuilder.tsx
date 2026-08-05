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
import { AiRecommendationsPanel } from './AiRecommendationsPanel';
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
    <div className="relative overflow-hidden rounded-[1.75rem] bg-background">
      {/* Soft warm-white canvas — minimal, luxury */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--gold)/0.06),_transparent_60%)]" />

      <div className="relative p-4 sm:p-7 md:p-10 lg:p-12">
        {/* ===== Header ===== */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              اتاق پرو
            </h2>
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
            {[
              { n: '۱', t: 'انتخاب' },
              { n: '۲', t: 'مانکن' },
              { n: '۳', t: 'تولید ست' },
            ].map((step, i) => {
              const active =
                (i === 0 && outfitItems.length === 0) ||
                (i === 1 && outfitItems.length > 0 && outfitItems.length < 2) ||
                (i === 2 && canGenerate);
              return (
                <div
                  key={step.n}
                  className={cn(
                    'hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'bg-card border border-border/70 text-muted-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black',
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {step.n}
                  </span>
                  {step.t}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== Context bar ===== */}
        <div className="mb-8 md:mb-10 rounded-[1.5rem] bg-card border border-border/70 shadow-soft overflow-hidden">
          <div
            className={cn(
              'flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5',
              showContext && 'border-b border-border/60'
            )}
          >
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
                ).map((chip) => (
                  <span
                    key={chip.key}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-muted/70 text-xs font-bold text-foreground"
                  >
                    <chip.Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    {chip.label}
                  </span>
                ))}
              </div>
              <span className="shrink-0 text-[11px] font-extrabold px-3.5 py-2 rounded-full text-primary hover:bg-primary/10 transition-colors">
                {showContext ? 'بستن' : 'تغییر'}
              </span>
            </button>
            <Button
              type="button"
              variant="gold"
              size="default"
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="font-extrabold shrink-0 min-h-[46px] rounded-full sm:min-w-[150px] shadow-button-gold"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'در حال تولید…' : 'تولید ست'}
            </Button>
          </div>

          {showContext && (
            <div className="p-4 sm:p-6">
              <OutfitContextPicker
                value={outfitContext}
                onChange={setOutfitContext}
                onClear={() => setOutfitContext(DEFAULT_OUTFIT_CONTEXT)}
                embedded
              />
            </div>
          )}
        </div>

        {/* ===== Three-column studio: خلاصه | مانکن + گالری | پیشنهادها ===== */}
        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_260px] gap-6 lg:gap-8">

          {/* ---------- LEFT: selected summary + categories ---------- */}
          <aside className="order-2 xl:order-3 flex flex-col gap-6 xl:sticky xl:top-24 self-start">
            {/* Selected clothing summary */}
            <div className="rounded-[1.5rem] bg-card border border-border/70 shadow-soft p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-black tracking-tight">انتخاب‌های شما</h3>
                {outfitItems.length > 0 && (
                  <button
                    type="button"
                    onClick={clearOutfit}
                    className="text-[11px] font-bold text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    پاک کردن
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                        'group relative aspect-square rounded-[1.25rem] overflow-hidden flex flex-col items-center justify-center transition-all duration-300',
                        item
                          ? 'ring-2 ring-primary bg-muted/40'
                          : 'bg-muted/40 hover:bg-muted/70'
                      )}
                      title={item ? `${item.name} — برای حذف کلیک` : `افزودن ${slot.label}`}
                    >
                      {item ? (
                        <>
                          <img src={item.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </span>
                        </>
                      ) : (
                        <Plus className="w-4 h-4 text-muted-foreground transition-transform group-hover:scale-125" />
                      )}
                      <span className="relative z-10 mt-auto mb-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-background/85 text-foreground">
                        {slot.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="gold"
                size="lg"
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className="w-full mt-5 font-extrabold min-h-[48px] rounded-full shadow-button-gold"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span className="truncate max-w-[150px]">{genProgress.stage.label}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    تولید ست
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleAutoFill}
                className="w-full mt-2.5 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors py-2"
              >
                پیشنهاد خودکار ست
              </button>
            </div>

            {/* Category selector */}
            <nav
              className="rounded-[1.5rem] bg-card border border-border/70 shadow-soft p-3"
              aria-label="دسته‌بندی لباس"
            >
              <button
                type="button"
                onClick={() => {
                  setGalleryCategory('all');
                  setOpenGalleryCat(null);
                }}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-[1.15rem] text-right transition-all duration-300',
                  galleryCategory === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'
                )}
              >
                <span className="w-9 h-9 rounded-2xl bg-muted/70 text-muted-foreground flex items-center justify-center shrink-0">
                  <Shirt className="w-4 h-4" />
                </span>
                <span className="flex-1 text-xs font-extrabold">همه لباس‌ها</span>
                <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                  {clothes.length.toLocaleString('fa-IR')}
                </span>
              </button>

              {CATEGORY_CLOTHING_ORDER.map((cat) => {
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
                      'w-full flex items-center gap-3 p-3 rounded-[1.15rem] text-right transition-all duration-300',
                      active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'
                    )}
                  >
                    <span
                      className={cn(
                        'w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-colors',
                        active ? 'bg-primary text-primary-foreground' : 'bg-muted/70 text-muted-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-extrabold truncate">{cfg.label}</span>
                      <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                        {selected ? 'انتخاب شده' : count ? `${count.toLocaleString('fa-IR')} مورد` : 'خالی'}
                      </span>
                    </span>
                    {selected && <Check className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={3} />}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ---------- CENTER: mannequin + gallery ---------- */}
          <section className="order-1 xl:order-2 min-w-0 space-y-6">
            {/* Mannequin stage */}
            <div
              onDragOver={!isMobile ? handleDragOver : undefined}
              onDragLeave={!isMobile ? handleDragLeave : undefined}
              onDrop={!isMobile ? handleDrop : undefined}
              className={cn(
                'relative rounded-[1.75rem] overflow-hidden bg-card border border-border/70 shadow-card transition-all',
                isDragOver && 'ring-2 ring-primary'
              )}
            >
              <div className="relative mx-auto w-full aspect-[4/5] sm:aspect-[3/3.2] max-h-[560px] bg-gradient-to-b from-muted/40 to-background">
                <MannequinDisplay
                  items={outfitItems}
                  profileImageUrl={profileImageUrl}
                  className="w-full h-full"
                />
                {clothes.length > 0 && outfitItems.length === 0 && !isDragOver && (
                  <div className="absolute inset-x-4 bottom-4 flex justify-center pointer-events-none">
                    <span className="px-4 py-2 rounded-full bg-background/90 backdrop-blur text-[11px] font-bold text-muted-foreground shadow-soft">
                      {isMobile ? 'روی لباس‌ها تپ کنید' : 'لباس را بکشید اینجا'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Clothing grid */}
            <div className="rounded-[1.75rem] bg-card border border-border/70 shadow-soft p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="min-w-0">
                  <h3 className="text-lg font-black tracking-tight leading-tight">کمد لباس</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    لباس مورد نظر خود را انتخاب کنید
                  </p>
                </div>
                <span className="text-xs font-bold text-muted-foreground tabular-nums shrink-0">
                  {galleryClothes.length.toLocaleString('fa-IR')} مورد
                </span>
              </div>

              <div className="relative mb-5">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="search"
                  value={galleryQuery}
                  onChange={(e) => setGalleryQuery(e.target.value)}
                  placeholder="جستجوی نام، رنگ یا تگ..."
                  className="w-full rounded-full pr-11 pl-10 py-3 min-h-[46px] text-sm bg-muted/50 border border-transparent outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-primary/25 font-medium transition-all"
                />
                {galleryQuery && (
                  <button
                    type="button"
                    onClick={() => setGalleryQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted-foreground hover:bg-muted"
                    aria-label="پاک کردن"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Mobile category pills */}
              <div className="xl:hidden flex gap-2 overflow-x-auto pb-2 mb-4 custom-scroll-smooth">
                <button
                  type="button"
                  onClick={() => {
                    setGalleryCategory('all');
                    setOpenGalleryCat(null);
                  }}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-full text-xs font-extrabold transition-all',
                    galleryCategory === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground'
                  )}
                >
                  همه
                </button>
                {CATEGORY_CLOTHING_ORDER.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setGalleryCategory(cat);
                      setOpenGalleryCat(cat);
                    }}
                    className={cn(
                      'shrink-0 px-4 py-2 rounded-full text-xs font-extrabold transition-all',
                      galleryCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-muted-foreground'
                    )}
                  >
                    {CATEGORY_CONFIG[cat].label}
                  </button>
                ))}
              </div>

              <div className="max-h-[min(620px,62vh)] overflow-y-auto custom-scroll-smooth -mx-1 px-1">
                {galleryClothes.length === 0 ? (
                  <div className="text-center py-16 text-sm text-muted-foreground font-medium">
                    لباسی یافت نشد
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                            'group relative text-right rounded-[1.25rem] p-2 transition-all duration-300',
                            isSelected
                              ? 'bg-primary/5 ring-2 ring-primary shadow-soft'
                              : 'bg-transparent hover:bg-muted/40 hover:-translate-y-1'
                          )}
                        >
                          <div className="aspect-[3/4] relative rounded-[1rem] overflow-hidden bg-muted/40">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                              draggable={false}
                            />
                            {isSelected && (
                              <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                                <Check className="w-4 h-4" strokeWidth={3} />
                              </span>
                            )}
                            <div
                              className={cn(
                                'absolute top-2 right-2 flex flex-col gap-1.5 transition-opacity duration-300',
                                isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {onViewItem && (
                                <span
                                  role="button"
                                  title="مشاهده"
                                  className="w-8 h-8 rounded-full bg-background/90 backdrop-blur shadow-soft flex items-center justify-center"
                                  onClick={() => onViewItem(item)}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {onEditItem && (
                                <span
                                  role="button"
                                  title="ویرایش"
                                  className="w-8 h-8 rounded-full bg-background/90 backdrop-blur shadow-soft flex items-center justify-center"
                                  onClick={() => onEditItem(item)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="px-1 pt-2.5 pb-1">
                            <p className="text-xs font-extrabold truncate leading-tight">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1">
                              {CATEGORY_CONFIG[item.category]?.label}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ---------- RIGHT: AI recommendations ---------- */}
          <aside className="order-3 xl:order-1 min-w-0 xl:sticky xl:top-24 self-start">
            <div className="rounded-[1.75rem] bg-card border border-border/70 shadow-soft p-5 sm:p-6">
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
