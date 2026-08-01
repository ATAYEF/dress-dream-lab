import React, { useState } from 'react';
import { Wand2, Trash2, GripVertical, Plus, Check, User, Sparkles, ArrowLeft, ArrowRight, Shirt } from 'lucide-react';
import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { MannequinDisplay, MannequinGender } from './MannequinDisplay';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { CATEGORY_CONFIG, CATEGORY_CLOTHING_ORDER } from '@/lib/categoryConfig';

interface OutfitBuilderProps {
  clothes: ClothingItem[];
  onGenerateSuggestion: (items: ClothingItem[]) => void;
  isGenerating: boolean;
  /** The user's own profile photo, used for a real virtual try-on instead of a generic mannequin */
  profileImageUrl?: string | null;
}

const LAYERABLE_CATEGORIES: ClothingCategory[] = ['tops', 'outerwear', 'accessories'];

export const OutfitBuilder: React.FC<OutfitBuilderProps> = ({
  clothes,
  onGenerateSuggestion,
  isGenerating,
  profileImageUrl = null,
}) => {
  const [outfitItems, setOutfitItems] = useState<ClothingItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<ClothingItem | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [mannequinGender, setMannequinGender] = useState<MannequinGender>('female');
  const isMobile = useIsMobile();

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
    if (outfitItems.length >= 2) {
      onGenerateSuggestion(outfitItems);
      setOutfitItems([]);
    }
  };

  const completedCategories = new Set(outfitItems.map(i => i.category)).size;
  const progressPct = Math.min((completedCategories / 4) * 100, 100);
  const canGenerate = outfitItems.length >= 2;

  return (
    <div className="relative overflow-hidden rounded-[2rem]">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div
        className="absolute -top-32 -right-20 w-80 h-80 rounded-full opacity-35 animate-blob pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full opacity-25 animate-blob animation-delay-2000 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--rose)) 0%, transparent 70%)' }}
      />

      <div className="relative p-6 md:p-8 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-7">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-gold opacity-30 blur-md animate-glow-pulse" />
              <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-gold shadow-button-gold flex items-center justify-center">
                <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h2 className="text-xl md:text-2xl font-display font-extrabold tracking-tight">
                  ست‌ساز هوشمند
                </h2>
                <span className="chip bg-gradient-gold/15 border border-gold/20 text-gold font-bold">
                  ✨ پیشرفته
                </span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-md">
                لباس‌ها را با درگ یا کلیک به ست خود اضافه کنید و بگذارید هوش مصنوعی توضیحات حرفه‌ای ست را برای شما بنویسد.
              </p>
            </div>
          </div>

          {/* Gender toggle */}
          {!profileImageUrl && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground hidden sm:block">مانکن:</span>
              <ToggleGroup
                type="single"
                value={mannequinGender}
                onValueChange={(value) => value && setMannequinGender(value as MannequinGender)}
                className="bg-white/60 backdrop-blur-md rounded-2xl p-1 shadow-soft border border-white/80 hairline-border"
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
        </div>

        {/* Main Grid */}
        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
          {/* ========== Mannequin / Drop Zone ========== */}
          <div className="flex-shrink-0 xl:sticky xl:top-24 self-start">
            <div className="flex flex-col items-center">
              {/* Progress bar */}
              <div className="w-full max-w-[320px] mb-4 space-y-2">
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

              {/* Selected chips + Actions */}
              <div className="w-full max-w-[320px] mt-5 space-y-4">
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

                {/* Action buttons */}
                <div className="flex gap-2.5 justify-center">
                  <Button
                    onClick={handleGenerate}
                    variant="gold"
                    size="lg"
                    disabled={!canGenerate || isGenerating}
                    className={cn(
                      'flex-1 max-w-[240px] relative overflow-hidden group',
                      canGenerate && !isGenerating && 'animate-glow-pulse'
                    )}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    {isGenerating ? (
                      <>
                        <div className="w-4.5 h-4.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>در حال ساخت ست...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 relative" />
                        <span className="relative">ساخت و توصیف ست</span>
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
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-400/20 to-purple-400/10 flex items-center justify-center border border-indigo-200/50">
                  <Shirt className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-display font-extrabold tracking-tight">
                    گالری لباس‌های شما
                  </h3>
                  <p className="text-[11px] md:text-xs text-muted-foreground font-medium">
                    {isMobile ? 'برای انتخاب تپ کنید' : 'برای اضافه کردن به ست، بکشید یا کلیک کنید'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <span>{clothes.length.toLocaleString('fa-IR')}</span>
                <span>لباس آماده</span>
              </div>
            </div>

            {/* Categories list */}
            <div className="space-y-4 md:space-y-5 max-h-[620px] overflow-y-auto pr-1 pl-2 custom-scroll-smooth">
              {CATEGORY_CLOTHING_ORDER.map((catKey) => {
                const group = CATEGORY_CONFIG[catKey];
                const Icon = group.icon;
                const categoryItems = clothes.filter(c => c.category === catKey);
                if (categoryItems.length === 0) return null;

                const hasSelected = categoryItems.some(i =>
                  outfitItems.some(s => s.id === i.id)
                );

                return (
                  <div
                    key={catKey}
                    className="relative rounded-3xl bg-gradient-to-br p-[1px] overflow-hidden shadow-soft"
                    style={{
                      background: hasSelected
                        ? `linear-gradient(135deg, ${group.hexFrom} 0%, ${group.hexFrom}00 60%)`
                        : `linear-gradient(135deg, hsl(var(--border)) 0%, transparent 60%)`,
                    }}
                  >
                    <div className={cn(
                      'relative rounded-[calc(1.5rem-1px)] bg-white/70 backdrop-blur-sm p-4 md:p-5',
                    )}>
                      {/* Group header */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm"
                            style={{
                              background: `linear-gradient(135deg, ${group.hexFrom}33 0%, ${group.hexFrom}0d 100%)`,
                              color: group.hexFrom,
                            }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-foreground">{group.label}</h4>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {categoryItems.length.toLocaleString('fa-IR')} گزینه
                            </p>
                          </div>
                        </div>

                        {hasSelected && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-gold text-white shadow-md">
                            <Check className="w-3 h-3" strokeWidth={3} />
                            <span className="text-[10px] font-bold">انتخاب شد</span>
                          </div>
                        )}
                      </div>

                      {/* Items grid */}
                      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-2.5">
                        {categoryItems.map(item => {
                          const isSelected = outfitItems.some(i => i.id === item.id);
                          return (
                            <div
                              key={item.id}
                              draggable={!isMobile}
                              onDragStart={!isMobile ? (e) => handleDragStart(e, item) : undefined}
                              onDragEnd={!isMobile ? handleDragEnd : undefined}
                              onClick={() => handleItemTap(item)}
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
                            >
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
                                draggable={false}
                                loading="lazy"
                              />

                              {/* Overlay bottom gradient */}
                              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

                              {/* Name hint on hover */}
                              <div className="absolute inset-x-0 bottom-0 p-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-400 pointer-events-none">
                                <p className="text-[9px] font-bold text-white text-center truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                                  {item.name}
                                </p>
                              </div>

                              {/* Selected badge */}
                              {isSelected && (
                                <div className="absolute inset-0 bg-gradient-to-br from-gold/28 via-transparent to-gold/18 flex items-start justify-end p-1.5 pointer-events-none">
                                  <div className="w-6 h-6 rounded-full bg-gradient-gold shadow-md flex items-center justify-center animate-scale-in">
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
                                  </div>
                                </div>
                              )}

                              {/* Drag indicator (desktop only) */}
                              {!isMobile && !isSelected && (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                                  <div className="w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm shadow-md flex items-center justify-center transition-transform duration-400 group-hover:scale-110">
                                    {outfitItems.some(i => i.id === item.id) ? (
                                      <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
                                    ) : (
                                      isMobile ? (
                                        <Plus className="w-4 h-4 text-gold" strokeWidth={3} />
                                      ) : (
                                        <GripVertical className="w-4 h-4 text-foreground/70" strokeWidth={2.5} />
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {clothes.length === 0 && (
                <div className="py-14 text-center">
                  <div className="text-5xl mb-3 animate-float">👗</div>
                  <p className="text-sm font-medium text-muted-foreground">
                    هنوز لباسی به کمد اضافه نکرده‌اید
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tip bar */}
        <div className="mt-7 md:mt-8 p-4 md:p-5 rounded-3xl bg-gradient-to-r from-gold/10 via-white/60 to-rose/10 backdrop-blur-sm border border-white/70 shadow-soft">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-gold/15 flex items-center justify-center border border-gold/25">
                  <Sparkles className="w-5 h-5 text-gold" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-gold flex items-center justify-center text-[9px] text-white font-black animate-bounce">
                  !
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs md:text-sm font-extrabold text-foreground">
                  نکته ست‌سازی حرفه‌ای
                </p>
                <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  سعی کنید در هر ست یک دسته بالا، پایین، کفش و اکسسوری داشته باشید تا ست کامل و چشمگیر شود. 💡
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/70 border border-white hairline-border">
                <ArrowLeft className="w-3.5 h-3.5" />
                بکشید
              </span>
              <span className="px-3 py-1.5 rounded-2xl bg-gradient-gold/10 text-gold border border-gold/20">
                یا
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/70 border border-white hairline-border">
                تپ کنید
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
