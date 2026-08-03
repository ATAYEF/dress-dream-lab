import React, { useState, useMemo } from 'react';
import { useStagedProgress, OUTFIT_SUGGESTION_STAGES } from '@/hooks/useStagedProgress';
import { Wand2, Trash2, GripVertical, Plus, Check, User, Sparkles, ArrowLeft, ArrowRight, Shirt, Search, X, Pencil, Eye } from 'lucide-react';
import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { MannequinDisplay, MannequinGender } from './MannequinDisplay';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { CATEGORY_CONFIG, CATEGORY_CLOTHING_ORDER } from '@/lib/categoryConfig';
import { ColorHarmonyBadge } from './ColorHarmonyBadge';
import { CategoryTabs } from './CategoryTabs';
import { AccessorySuggestions } from './AccessorySuggestions';
import { ShoeSuggestions } from './ShoeSuggestions';
import { OutfitContextPicker } from './OutfitContextPicker';
import {
  DEFAULT_OUTFIT_CONTEXT,
  OutfitContext,
  buildContextOutfit,
  contextLabels,
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
  const [mannequinGender, setMannequinGender] = useState<MannequinGender>('female');
  const [outfitContext, setOutfitContext] = useState<OutfitContext>(DEFAULT_OUTFIT_CONTEXT);
  const [galleryQuery, setGalleryQuery] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<ClothingCategory | 'all'>('all');
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

    // Reflect auto-picked set on mannequin before clearing
    setOutfitItems(finalItems);
    onGenerateSuggestion(finalItems, outfitContext);
    // Keep items briefly visible on mannequin; clear after short delay
    window.setTimeout(() => setOutfitItems([]), 400);
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
              { n: '۳', t: 'ساخت ست AI' },
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

          {/* Gender toggle */}
          {!profileImageUrl && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground hidden sm:block">مانکن:</span>
              <ToggleGroup
                type="single"
                value={mannequinGender}
                onValueChange={(value) => value && setMannequinGender(value as MannequinGender)}
                className="bg-white/70 backdrop-blur-md rounded-2xl p-1 shadow-soft border border-white/80 hairline-border"
              >
                <ToggleGroupItem
                  value="female"
                  aria-label="مانکن زن"
                  className="text-xs font-bold px-4 py-2 rounded-xl data-[state=on]:bg-gradient-gold data-[state=on]:text-white data-[state=on]:shadow-md transition-all duration-400"
                >
                  <User className="w-3.5 h-3.5 ml-1.5" />
                  زن
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="male"
                  aria-label="مانکن مرد"
                  className="text-xs font-bold px-4 py-2 rounded-xl data-[state=on]:bg-gradient-to-br data-[state=on]:from-indigo-500 data-[state=on]:to-purple-600 data-[state=on]:text-white data-[state=on]:shadow-md transition-all duration-400"
                >
                  <User className="w-3.5 h-3.5 ml-1.5" />
                  مرد
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}
          {profileImageUrl && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <User className="w-3.5 h-3.5" />
              امتحان روی عکس شما
            </div>
          )}
        </div>

        {/* Occasion context — collapsed by default to reduce noise */}
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowContext((v) => !v)}
              className="flex-1 min-w-[140px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-extrabold bg-white/55 border border-border/40 hover:bg-white/80 transition-colors"
            >
              <span>شرایط ست (اختیاری)</span>
              <span className="text-muted-foreground font-bold">{showContext ? 'بستن' : 'باز کردن'}</span>
            </button>
            <Button
              type="button"
              variant="soft"
              size="sm"
              onClick={handleAutoFill}
              disabled={clothes.length < 2 || isGenerating}
              className="font-bold shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              پر کردن خودکار
            </Button>
          </div>
          {!showContext && (
            <p className="text-[11px] text-muted-foreground font-medium px-1">
              پیشنهاد برای: <span className="font-extrabold text-foreground">{contextLabels(outfitContext)}</span>
            </p>
          )}
          {showContext && (
            <OutfitContextPicker value={outfitContext} onChange={setOutfitContext} />
          )}
        </div>

        {/* Main Grid — mannequin first on mobile for focus */}
        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
          {/* ========== Mannequin / Drop Zone ========== */}
          <div className="flex-shrink-0 xl:sticky xl:top-24 self-start w-full xl:w-auto">
            <div className="flex flex-col items-center">
              {/* Progress bar */}
              <div className="w-full max-w-[340px] mb-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground/80">پیشرفت ست شما</span>
                  <span className="font-extrabold text-gold">
                    {completedCategories} از ۴ بخش
                  </span>
                </div>
                <div className="relative h-2.5 w-full rounded-full bg-white/70 backdrop-blur-sm shadow-inner overflow-hidden border border-white/60">
                  <div
                    className="absolute inset-y-0 right-0 rounded-full bg-gradient-gold shadow-glow transition-all duration-700 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                  {progressPct < 100 && progressPct > 0 && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-gold transition-all duration-700"
                      style={{ right: `calc(${progressPct}% - 7px)` }}
                    />
                  )}
                </div>
                {!canGenerate && (
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    برای ساخت ست، حداقل ۲ لباس انتخاب کنید 👆
                  </p>
                )}
              </div>

              {/* Drop area */}
              <div
                onDragOver={!isMobile ? handleDragOver : undefined}
                onDragLeave={!isMobile ? handleDragLeave : undefined}
                onDrop={!isMobile ? handleDrop : undefined}
                className={cn(
                  'relative w-full max-w-[320px] rounded-[1.75rem] bg-white/50 backdrop-blur-md border-2 transition-all duration-500 ease-out overflow-hidden',
                  'shadow-card p-4 md:p-5',
                  isDragOver
                    ? 'border-gold bg-gradient-gold/10 scale-[1.02] shadow-elevated ring-4 ring-gold/20'
                    : 'border-white/70',
                  draggedItem && !isDragOver && 'border-dashed border-gold/60'
                )}
              >
                <MannequinDisplay
                  items={outfitItems}
                  gender={mannequinGender}
                  profileImageUrl={profileImageUrl}
                  className="w-full"
                />

                {/* Hint overlay */}
                {clothes.length > 0 && outfitItems.length === 0 && !isDragOver && (
                  <div className="absolute inset-x-4 bottom-5 flex items-center justify-center pointer-events-none">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/85 backdrop-blur-md shadow-md border border-white/90 text-xs font-bold text-foreground/75">
                      {isMobile ? (
                        <>
                          <Plus className="w-4 h-4 text-gold" />
                          روی لباس‌ها تپ کنید
                        </>
                      ) : (
                        <>
                          <GripVertical className="w-4 h-4 text-gold" />
                          لباس را اینجا بکشید
                        </>
                      )}
                    </div>
                  </div>
                )}

                {isDragOver && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-gold/15 backdrop-blur-md pointer-events-none">
                    <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-3xl bg-white/80 backdrop-blur-md shadow-elevated">
                      <div className="w-14 h-14 rounded-full bg-gradient-gold flex items-center justify-center animate-bounce">
                        <Check className="w-7 h-7 text-white" strokeWidth={3} />
                      </div>
                      <p className="font-extrabold text-foreground">رها کنید تا ست شود! ✨</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected chips + Color harmony + Actions */}
              <div className="w-full max-w-[340px] mt-5 space-y-4">
                {/* Selected chips */}
                {outfitItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center p-3 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 hairline-border shadow-soft">
                    {outfitItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => removeFromOutfit(item.id)}
                        className="group relative flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-gradient-card hairline-border shadow-sm hover:shadow-md hover:bg-rose-50 hover:border-rose-200 transition-all duration-300 hover:-translate-y-0.5"
                        title="برای حذف کلیک کنید"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-7 h-7 rounded-lg object-cover ring-2 ring-white shadow-sm"
                        />
                        <span className="text-xs font-bold text-foreground/85 max-w-[90px] truncate">
                          {item.name}
                        </span>
                        <span className="w-5 h-5 rounded-full bg-muted group-hover:bg-rose-500 group-hover:text-white flex items-center justify-center transition-all duration-300 text-muted-foreground text-[11px] font-bold">
                          ×
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Smart color matching */}
                {outfitItems.length > 0 && (
                  <ColorHarmonyBadge
                    items={outfitItems}
                    wardrobe={clothes}
                    onSuggestClick={addItemToOutfit}
                    className="mx-auto"
                  />
                )}

                {/* Coordinated accessories */}
                {outfitItems.length > 0 && (
                  <AccessorySuggestions
                    outfitItems={outfitItems}
                    wardrobe={clothes}
                    gender={mannequinGender}
                    context={outfitContext}
                    onAddWardrobeItem={addItemToOutfit}
                    className="mx-auto"
                  />
                )}

                {/* Coordinated shoes */}
                {outfitItems.length > 0 && (
                  <ShoeSuggestions
                    outfitItems={outfitItems}
                    wardrobe={clothes}
                    gender={mannequinGender}
                    context={outfitContext}
                    onAddWardrobeItem={addItemToOutfit}
                    className="mx-auto"
                  />
                )}

                {/* Action buttons — primary CTA */}
                <div className="flex gap-2.5 justify-center w-full max-w-[340px] mobile-sticky-actions md:!static md:!bg-transparent md:!p-0 md:!z-auto">
                  <Button
                    onClick={handleGenerate}
                    variant="gold"
                    size="xl"
                    disabled={!canGenerate || isGenerating}
                    className={cn(
                      'flex-1 relative overflow-hidden group shadow-lg',
                      canGenerate && !isGenerating && 'animate-glow-pulse shadow-[0_0_32px_hsl(var(--gold)/0.35)]'
                    )}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span className="relative truncate max-w-[200px]">{genProgress.stage.label}</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 relative" />
                        <span className="relative font-extrabold">
                          {outfitItems.length >= 2
                            ? 'ساخت ست با هوش مصنوعی'
                            : clothes.length >= 2
                              ? 'پیشنهاد ست هوشمند از کمد'
                              : 'حداقل ۲ لباس در کمد لازم است'}
                        </span>
                      </>
                    )}
                  </Button>

                  {outfitItems.length > 0 && (
                    <Button
                      onClick={clearOutfit}
                      variant="soft"
                      size="lg"
                      className="w-12 px-0"
                      title="پاک کردن ست"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========== Clothing Palette ========== */}
          <div className="flex-1 min-w-0">
            {/* Palette Header */}
            <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-400/20 to-purple-400/10 flex items-center justify-center border border-indigo-200/50 shrink-0">
                  <Shirt className="w-4 h-4 text-gold" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base md:text-lg font-display font-extrabold tracking-tight">
                    گالری لباس‌های شما
                  </h3>
                  <p className="text-[11px] md:text-xs text-muted-foreground font-medium truncate">
                    جستجو، ویرایش و انتخاب برای ست
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground shrink-0">
                <span>{galleryClothes.length.toLocaleString('fa-IR')}</span>
                <span className="hidden sm:inline">از</span>
                <span className="hidden sm:inline">{clothes.length.toLocaleString('fa-IR')}</span>
              </div>
            </div>

            {/* Search + category dropdown (closed by default) */}
            <div className="flex flex-col gap-2.5 mb-3 md:mb-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="search"
                  value={galleryQuery}
                  onChange={(e) => setGalleryQuery(e.target.value)}
                  placeholder="جستجوی نام، رنگ یا تگ..."
                  className="w-full rounded-xl pr-10 pl-9 py-2.5 min-h-[44px] text-base bg-white/70 dark:bg-white/5 border border-border/50 outline-none focus:ring-2 focus:ring-gold/40 font-medium"
                />
                {galleryQuery && (
                  <button
                    type="button"
                    onClick={() => setGalleryQuery('')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-rose"
                    aria-label="پاک کردن جستجو"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <CategoryTabs
                activeCategory={galleryCategory}
                onCategoryChange={setGalleryCategory}
                clothes={clothes}
                defaultOpen={false}
              />
            </div>

            {/* Flat item grid (filtered by dropdown + search) */}
            <div className="max-h-[620px] overflow-y-auto pr-1 pl-1 custom-scroll-smooth">
              {galleryClothes.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl bg-white/50 border border-dashed border-border/60">
                  <p className="text-sm font-extrabold mb-1">لباسی یافت نشد</p>
                  <p className="text-xs text-muted-foreground">جستجو یا دسته را تغییر دهید</p>
                  {(galleryQuery || galleryCategory !== 'all') && (
                    <button
                      type="button"
                      className="mt-3 text-xs font-bold text-gold underline"
                      onClick={() => {
                        setGalleryQuery('');
                        setGalleryCategory('all');
                      }}
                    >
                      پاک کردن فیلترها
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-2.5">
                  {galleryClothes.map((item) => {
                    const isSelected = outfitItems.some((i) => i.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'group relative aspect-square rounded-2xl overflow-hidden transition-all duration-400 ease-out select-none',
                          !isMobile && 'cursor-grab active:cursor-grabbing active:scale-95',
                          isMobile && 'cursor-pointer active:scale-95',
                          'hover:-translate-y-1 hover:shadow-lg',
                          isSelected
                            ? 'ring-[3px] ring-gold shadow-xl -translate-y-1 scale-[1.03]'
                            : 'ring-1 ring-black/5 bg-cream/40 hover:ring-gold/50',
                          draggedItem?.id === item.id && 'opacity-40 scale-95'
                        )}
                        draggable={!isMobile}
                        onDragStart={!isMobile ? (e) => handleDragStart(e, item) : undefined}
                        onDragEnd={!isMobile ? handleDragEnd : undefined}
                        onClick={() => handleItemTap(item)}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
                          draggable={false}
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />
                        <p className="absolute bottom-1 right-1 left-1 text-[9px] font-bold text-white truncate drop-shadow pointer-events-none">
                          {item.name}
                        </p>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-gradient-gold text-white flex items-center justify-center shadow-md z-10">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </div>
                        )}
                        <div
                          className={cn(
                            'absolute top-1 left-1 z-20 flex flex-col gap-1 transition-opacity duration-200',
                            isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {onViewItem && (
                            <button
                              type="button"
                              title="مشاهده"
                              className="w-7 h-7 rounded-lg bg-white/90 shadow flex items-center justify-center text-foreground/80 hover:text-gold"
                              onClick={() => onViewItem(item)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onEditItem && (
                            <button
                              type="button"
                              title="ویرایش"
                              className="w-7 h-7 rounded-lg bg-white/90 shadow flex items-center justify-center text-foreground/80 hover:text-indigo-600"
                              onClick={() => onEditItem(item)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onRemoveItem && (
                            <button
                              type="button"
                              title="حذف"
                              className="w-7 h-7 rounded-lg bg-white/90 shadow flex items-center justify-center text-foreground/80 hover:text-destructive"
                              onClick={() => onRemoveItem(item)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>



        <p className="mt-4 text-center text-[11px] text-muted-foreground font-medium">
          برای انتخاب لباس تپ کنید · حداقل ۲ لباس برای ساخت ست
        </p>
        </div>
      </div>
    </div>
  );
};
