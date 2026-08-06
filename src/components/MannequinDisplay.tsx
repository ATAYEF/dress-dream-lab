import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { ClothingItem } from '@/types/wardrobe';
import { cn } from '@/lib/utils';
import { useStagedProgress, TRYON_RENDER_STAGES } from '@/hooks/useStagedProgress';
import { StagedProgress } from '@/components/StagedProgress';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles, Check, X, Wand2, Loader2, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import mannequinFemale from '@/assets/mannequin-female.png';
import { suggestShoes, SuggestedShoe, ALL_SHOE_OPTIONS } from '@/lib/shoeSuggestion';
import { suggestAccessories, SuggestedAccessory, ALL_ACCESSORY_OPTIONS } from '@/lib/accessorySuggestion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { persianEdgeError, readFunctionErrorBody } from '@/lib/edgeFunctionError';
import AiImageViewer from './AiImageViewer';
import { GarmentImage } from './GarmentImage';

async function loadImage(src: string, useCors: boolean) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (useCors) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('تصویر قابل بارگذاری نیست'));
    image.src = src;
  });
}

async function toDataUrl(src: string, maxSize = 768): Promise<string> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(src, true);
  } catch {
    img = await loadImage(src, false);
  }

  let { width, height } = img;
  const scale = Math.min(1, maxSize / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('عدم پشتیبانی مرورگر');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

export type MannequinGender = 'female';

export type MannequinDisplayHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
};

interface MannequinDisplayProps {
  items: ClothingItem[];
  className?: string;
  gender?: MannequinGender;
  profileImageUrl?: string | null;
  compact?: boolean;
  /** Hide built-in zoom chrome (parent will drive zoom via ref) */
  hideZoomChrome?: boolean;
  /** Remove a single garment from the outfit by id */
  onRemoveItem?: (itemId: string) => void;
  /** Clear entire outfit */
  onClearAll?: () => void;
}

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.15;
const ZOOM_DEFAULT = 1;

export const MannequinDisplay = forwardRef<MannequinDisplayHandle, MannequinDisplayProps>(
  function MannequinDisplay(
    { items, className, compact = false, hideZoomChrome = false, onRemoveItem, onClearAll },
    ref
  ) {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const mannequinImage = mannequinFemale;
  const gender = 'female' as const;

  const hasSelectedItems = items.length > 0;
  const suggestedShoe = suggestShoes(items, gender);
  const suggestedAccessories = suggestAccessories(items, gender);

  const [selectedShoeId, setSelectedShoeId] = useState<string | null>(null);
  const activeShoe =
    items.find((i) => i.category === 'shoes') ||
    ALL_SHOE_OPTIONS.find((s) => s.id === selectedShoeId) ||
    suggestedShoe ||
    null;

  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([]);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const userAccessory = items.find((i) => i.category === 'accessories');
  const activeAccessories: (SuggestedAccessory | ClothingItem)[] = userAccessory
    ? [userAccessory as ClothingItem]
    : ALL_ACCESSORY_OPTIONS.filter((a) => selectedAccessoryIds.includes(a.id));

  const outfitKey = `${gender}-${items.map((i) => i.id).sort().join(',')}`;
  useEffect(() => {
    setSelectedShoeId(suggestedShoe?.id ?? null);
    setSelectedAccessoryIds(suggestedAccessories.map((a) => a.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfitKey]);

  const toggleShoe = (shoe: SuggestedShoe) => {
    if (items.some((i) => i.category === 'shoes')) return;
    setSelectedShoeId((prev) => (prev === shoe.id ? null : shoe.id));
  };

  const toggleAccessory = (accessory: SuggestedAccessory) => {
    if (userAccessory) return;
    setSelectedAccessoryIds((prev) => {
      if (prev.includes(accessory.id)) {
        return prev.filter((id) => id !== accessory.id);
      }
      const sameTypeIds = ALL_ACCESSORY_OPTIONS.filter((a) => a.type === accessory.type).map((a) => a.id);
      return [...prev.filter((id) => !sameTypeIds.includes(id)), accessory.id];
    });
  };

  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const tryonProgress = useStagedProgress(aiLoading, TRYON_RENDER_STAGES);

  const generationKey = `${outfitKey}-${selectedShoeId ?? ''}-${selectedAccessoryIds.join(',')}`;
  useEffect(() => {
    setAiImage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationKey]);

  const handleGenerate = async () => {
    if (items.length === 0 || aiLoading) return;
    setAiLoading(true);
    try {
      const baseImageUrl = await toDataUrl(mannequinImage, 512);
      const converted = await Promise.all(
        items.slice(0, 4).map(async (item) => {
          try {
            return {
              name: item.name,
              category: item.category,
              imageUrl: await toDataUrl(item.imageUrl, 384),
            };
          } catch (e) {
            console.warn('Skipping unreadable garment image:', item.name, e);
            return null;
          }
        })
      );
      const clothingItems = converted.filter(Boolean) as {
        name: string;
        category: string;
        imageUrl: string;
      }[];
      if (clothingItems.length === 0) {
        throw new Error('تصویر لباس‌ها قابل خواندن نیست؛ لباس دیگری امتحان کنید');
      }

      const suggestedFootwear =
        !items.some((i) => i.category === 'shoes') && activeShoe ? activeShoe.name : undefined;
      const suggestedAccessory =
        !userAccessory && activeAccessories.length > 0
          ? activeAccessories.map((a) => a.name).join(' و ')
          : undefined;

      const { data, error } = await supabase.functions.invoke('virtual-tryon', {
        body: { baseImageUrl, clothingItems, suggestedFootwear, suggestedAccessory },
      });

      if (error) {
        const body = await readFunctionErrorBody(error);
        throw new Error(persianEdgeError(error, body || data));
      }
      if (data?.error) {
        throw new Error(persianEdgeError(null, data));
      }
      if (!data?.imageUrl) {
        throw new Error('تصویری تولید نشد، دوباره تلاش کنید');
      }

      setAiImage(data.imageUrl as string);
      if (data.fallbackUsed) {
        toast({
          title: 'تصویر آماده شد',
          description: 'با مدل پشتیبان تولید شد (مدل اول در دسترس نبود)',
        });
      }
    } catch (err) {
      console.error('Virtual try-on failed:', err);
      const message = persianEdgeError(err, null);
      toast({
        title: /اعتبار/i.test(message) ? 'اعتبار تمام شده' : 'خطا در تصویرسازی',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

  // ===== Zoom & Pan (smooth) =====
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(+(prev + ZOOM_STEP).toFixed(2), ZOOM_MAX));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(+(prev - ZOOM_STEP).toFixed(2), ZOOM_MIN));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(ZOOM_DEFAULT);
    setPan({ x: 0, y: 0 });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      resetView: handleReset,
    }),
    [handleZoomIn, handleZoomOut, handleReset]
  );

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((prev) => Math.min(Math.max(+(prev + delta).toFixed(2), ZOOM_MIN), ZOOM_MAX));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && zoom > 1 && e.touches.length === 1) {
      setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };
  const handleTouchEnd = () => setIsDragging(false);

  const zoomControls = !hideZoomChrome && (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-background/95 backdrop-blur-md rounded-full px-1.5 py-1 shadow-lg z-50 hairline-border">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full transition-transform active:scale-90"
        onClick={handleZoomOut}
        disabled={zoom <= ZOOM_MIN}
        aria-label="کوچک‌نمایی"
        title="کوچک‌نمایی"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <span className="text-[11px] font-bold min-w-[44px] text-center tabular-nums select-none">
        {Math.round(zoom * 100).toLocaleString('fa-IR')}٪
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full transition-transform active:scale-90"
        onClick={handleZoomIn}
        disabled={zoom >= ZOOM_MAX}
        aria-label="بزرگ‌نمایی"
        title="بزرگ‌نمایی"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <div className="w-px h-5 bg-border/60 mx-0.5" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full transition-transform active:scale-90"
        onClick={handleReset}
        aria-label="بازنشانی اندازه"
        title="بازنشانی اندازه"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </Button>
      {hasSelectedItems && onClearAll && (
        <>
          <div className="w-px h-5 bg-border/60 mx-0.5" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full transition-transform active:scale-90 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={onClearAll}
            aria-label="پاک کردن همه لباس‌ها"
            title="پاک کردن همه"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </>
      )}
    </div>
  );

  const zoomableStyle: React.CSSProperties = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: 'center center',
    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
    transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
    willChange: 'transform',
  };

  const top = items.find((i) => i.category === 'tops');
  const bottom = items.find((i) => i.category === 'bottoms');
  const dress = items.find((i) => i.category === 'dresses');
  const outerwear = items.find((i) => i.category === 'outerwear');
  const shoeItem = items.find((i) => i.category === 'shoes');
  const accessoryItems = items.filter((i) => i.category === 'accessories');

  /**
   * Body slots retuned for flat product photography (white bg, no model).
   * Values are % of the taller aspect-[3/5.2] canvas.
   */
  const SLOT = {
    tops: {
      top: '15%', left: '22%', width: '56%', height: '26%',
      objectPosition: '50% 15%',
    },
    outerwear: {
      top: '12%', left: '14%', width: '72%', height: '40%',
      objectPosition: '50% 18%',
    },
    bottoms: {
      top: '40%', left: '24%', width: '52%', height: '40%',
      objectPosition: '50% 10%',
    },
    dresses: {
      top: '13%', left: '17%', width: '66%', height: '66%',
      objectPosition: '50% 8%',
    },
    shoes: {
      top: '84%', left: '28%', width: '44%', height: '14%',
      objectPosition: '50% 60%',
    },
    accessoryHead: {
      top: '7%', left: '34%', width: '32%', height: '9%',
      objectPosition: '50% 40%',
    },
    accessoryBelt: {
      top: '39%', left: '28%', width: '44%', height: '6%',
      objectPosition: '50% 50%',
    },
    accessoryBag: {
      top: '44%', left: '64%', width: '30%', height: '18%',
      objectPosition: '50% 40%',
    },
  } as const;

  type SlotBox = {
    top: string;
    left: string;
    width: string;
    height: string;
    objectPosition?: string;
  };

  const slotStyle = (slot: SlotBox, z: number, delay = '0.05s'): React.CSSProperties => {
    const { objectPosition: _op, ...box } = slot;
    return {
      ...box,
      zIndex: z,
      position: 'absolute',
      animationDelay: delay,
      animationFillMode: 'backwards',
      filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))',
    };
  };

  const garmentImgStyle = (slot: SlotBox): React.CSSProperties => ({
    objectPosition: slot.objectPosition ?? '50% 50%',
  });

  /** Small X badge on a garment layer */
  const RemoveBadge = ({ itemId, label }: { itemId: string; label: string }) => {
    if (!onRemoveItem) return null;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemoveItem(itemId);
        }}
        className="absolute -top-1.5 -right-1.5 z-[60] w-6 h-6 rounded-full bg-background/95 border border-border/80 shadow-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-colors touch-manipulation"
        aria-label={`حذف ${label}`}
        title={`حذف ${label}`}
      >
        <X className="w-3 h-3" strokeWidth={2.5} />
      </button>
    );
  };

  return (
    <div className={cn(!compact && 'w-full max-w-[360px] mx-auto', compact && 'w-full', className)}>
      {/* Taller body canvas so shoes stay visible */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[3/5.2] min-h-[420px] overflow-hidden rounded-3xl bg-gradient-card hairline-border shadow-card"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-40 animate-blob"
          style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-14 w-44 h-44 rounded-full opacity-25 animate-blob animation-delay-2000"
          style={{ background: 'radial-gradient(circle, hsl(var(--rose)) 0%, transparent 70%)' }}
        />

        <div style={zoomableStyle} className="w-full h-full relative select-none">
          <img
            src={mannequinImage}
            alt=""
            aria-hidden
            className={cn(
              'absolute inset-0 w-full h-full object-contain object-bottom pointer-events-none transition-opacity duration-500',
              hasSelectedItems ? 'opacity-40' : 'opacity-90 drop-shadow-xl'
            )}
            draggable={false}
          />

          {dress && !top && !bottom && (
            <div key={dress.id} className="animate-fade-up group/garment" style={slotStyle(SLOT.dresses, 10, '0.05s')}>
              <GarmentImage
                src={dress.imageUrl}
                alt={dress.name}
                className="w-full h-full object-contain"
                style={garmentImgStyle(SLOT.dresses)}
                draggable={false}
              />
              <RemoveBadge itemId={dress.id} label={dress.name} />
            </div>
          )}

          {top && (
            <div key={top.id} className="animate-fade-up group/garment" style={slotStyle(SLOT.tops, 12, '0.05s')}>
              <GarmentImage
                src={top.imageUrl}
                alt={top.name}
                className="w-full h-full object-contain"
                style={garmentImgStyle(SLOT.tops)}
                draggable={false}
              />
              <RemoveBadge itemId={top.id} label={top.name} />
            </div>
          )}

          {outerwear && (
            <div
              key={outerwear.id}
              className="animate-fade-up group/garment"
              style={slotStyle(SLOT.outerwear, 18, '0.12s')}
            >
              <GarmentImage
                src={outerwear.imageUrl}
                alt={outerwear.name}
                className="w-full h-full object-contain"
                style={garmentImgStyle(SLOT.outerwear)}
                draggable={false}
              />
              <RemoveBadge itemId={outerwear.id} label={outerwear.name} />
            </div>
          )}

          {bottom && (
            <div key={bottom.id} className="animate-fade-up group/garment" style={slotStyle(SLOT.bottoms, 14, '0.08s')}>
              <GarmentImage
                src={bottom.imageUrl}
                alt={bottom.name}
                className="w-full h-full object-contain"
                style={garmentImgStyle(SLOT.bottoms)}
                draggable={false}
              />
              <RemoveBadge itemId={bottom.id} label={bottom.name} />
            </div>
          )}

          {activeShoe && (
            <div
              className="animate-fade-up group/garment"
              style={slotStyle(SLOT.shoes, 16, '0.15s')}
            >
              <GarmentImage
                src={activeShoe.imageUrl}
                alt={activeShoe.name}
                loading="lazy"
                className="w-full h-full object-contain"
                style={garmentImgStyle(SLOT.shoes)}
                draggable={false}
              />
              {shoeItem && <RemoveBadge itemId={shoeItem.id} label={shoeItem.name} />}
            </div>
          )}

          {accessoryItems.map((acc, index) => {
            const name = `${acc.name} ${(acc.tags || []).join(' ')}`.toLowerCase();
            const isBelt = /کمربند|belt/.test(name);
            const isBag = /کیف|bag|clutch|کوله/.test(name);
            const slot = isBelt
              ? SLOT.accessoryBelt
              : isBag
                ? SLOT.accessoryBag
                : SLOT.accessoryHead;
            const z = isBelt ? 20 : isBag ? 22 : 15;
            return (
              <div
                key={acc.id}
                className="animate-fade-up overflow-visible group/garment"
                style={slotStyle(slot, z, `${0.18 + index * 0.06}s`)}
              >
                <GarmentImage
                  src={acc.imageUrl}
                  alt={acc.name}
                  className={cn(
                    'w-full h-full object-contain',
                    !isBelt && !isBag && 'rounded-full object-cover'
                  )}
                  style={garmentImgStyle(slot)}
                  draggable={false}
                />
                <RemoveBadge itemId={acc.id} label={acc.name} />
              </div>
            );
          })}

          {hasSelectedItems &&
            accessoryItems.length === 0 &&
            activeAccessories.map((accessory, index) => {
              const a = accessory as SuggestedAccessory;
              const slot = a.type === 'belt' ? SLOT.accessoryBelt : SLOT.accessoryBag;
              return (
                <div
                  key={a.id}
                  className="animate-fade-up"
                  style={slotStyle(slot, 22, `${0.25 + index * 0.08}s`)}
                >
                  <GarmentImage
                    src={a.imageUrl}
                    alt={a.name}
                    loading="lazy"
                    className="w-full h-full object-contain opacity-90"
                    style={garmentImgStyle(slot)}
                    draggable={false}
                  />
                </div>
              );
            })}

          {items.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/75 backdrop-blur-md rounded-3xl animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gold/20 blur-xl animate-glow-pulse" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-card hairline-border shadow-card flex items-center justify-center animate-float">
                  <svg className="w-10 h-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <p className="text-foreground/80 text-sm font-black mt-4">ست شما خالی است</p>
              <p className="text-muted-foreground text-xs mt-1 max-w-[180px] text-center leading-relaxed">
                از پالت لباس‌های پایین، لباس‌ها را انتخاب کنید یا روی آنها کلیک کنید
              </p>
            </div>
          )}
        </div>

        {aiImage && (
          <AiImageViewer
            src={aiImage}
            alt="نتیجه پرو مجازی با هوش مصنوعی"
            onClose={() => setAiImage(null)}
          />
        )}

        {aiLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm animate-fade-in">
            <StagedProgress
              stages={TRYON_RENDER_STAGES}
              stageIndex={tryonProgress.stageIndex}
              label={tryonProgress.stage.label}
              progress={tryonProgress.progress}
              variant="full"
            />
          </div>
        )}

        {zoomControls}
      </div>

      {!compact && (
      <div className="mt-3 rounded-2xl hairline-border bg-gradient-card/80 backdrop-blur p-3 shadow-soft">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-foreground">
          <Wand2 className="w-3.5 h-3.5 text-gold" />
          پرو روی مانکن
        </div>
        <p className="text-[10px] text-muted-foreground font-medium mb-2.5 leading-relaxed">
          با یک کلیک تصویر ست ساخته می‌شود. انتخاب مدل در پس‌زمینه و خودکار است.
        </p>
        <Button
          onClick={handleGenerate}
          disabled={items.length === 0 || aiLoading}
          className="w-full h-10 rounded-xl bg-gradient-gold text-white text-xs font-black shadow-button-gold"
        >
          {aiLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="truncate">{tryonProgress.stage.label}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              پرو واقعی‌تر با AI
            </>
          )}
        </Button>
        {items.length === 0 && (
          <p className="mt-2 text-[11px] font-medium text-muted-foreground/70">
            ابتدا چند لباس به ست اضافه کنید
          </p>
        )}
      </div>
      )}

      {!compact && hasSelectedItems && (
        <button
          type="button"
          onClick={() => setExtrasOpen((v) => !v)}
          className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl hairline-border bg-gradient-card/80 text-xs font-extrabold shadow-soft"
        >
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            کفش و اکسسوری پیشنهادی
          </span>
          <ChevronDown className={cn('w-4 h-4 transition-transform', extrasOpen && 'rotate-180')} />
        </button>
      )}

      {!compact && extrasOpen && hasSelectedItems && !items.some((i) => i.category === 'shoes') && (
        <div className="mt-3 rounded-2xl hairline-border bg-gradient-card/80 backdrop-blur p-3 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              کفش پیشنهادی
            </div>
          {hasSelectedItems && activeShoe && (
              <button
                onClick={() => setSelectedShoeId(null)}
                className="inline-flex items-center gap-1 text-[10px] font-black text-muted-foreground/70 hover:text-rose hover:bg-rose/10 rounded-lg px-2 py-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
                حذف
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SHOE_OPTIONS.map((shoe) => {
              const isActive = activeShoe?.id === shoe.id;
              const isSuggested = suggestedShoe?.id === shoe.id;
              return (
                <button
                  key={shoe.id}
                  onClick={() => toggleShoe(shoe)}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-xl border px-2 py-1 text-[11px] font-bold transition-all duration-300',
                    isActive
                      ? 'border-transparent bg-gradient-gold text-white shadow-button-gold scale-[1.02]'
                      : 'border-border/70 bg-white/60 text-foreground/75 hover:border-gold/40 hover:bg-white/90 hover:text-foreground hover:-translate-y-0.5'
                  )}
                >
                  <img
                    src={shoe.imageUrl}
                    alt={shoe.name}
                    loading="lazy"
                    className="h-6 w-6 object-contain"
                    draggable={false}
                  />
                  <span className="whitespace-nowrap">{shoe.name}</span>
                  {isSuggested && !isActive && (
                    <Sparkles className="w-3 h-3 text-gold shrink-0" />
                  )}
                  {isActive && (
                    <Check className="w-3 h-3 drop-shadow shrink-0" strokeWidth={3.5} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!compact && extrasOpen && hasSelectedItems && !userAccessory && (
        <div className="mt-2.5 rounded-2xl hairline-border bg-gradient-card/80 backdrop-blur p-3 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              اکسسوری‌های پیشنهادی
            </div>
            {activeAccessories.length > 0 && (
              <button
                onClick={() => setSelectedAccessoryIds([])}
                className="inline-flex items-center gap-1 text-[10px] font-black text-muted-foreground/70 hover:text-rose hover:bg-rose/10 rounded-lg px-2 py-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
                پاک کردن
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_ACCESSORY_OPTIONS.map((option) => {
              const isActive = selectedAccessoryIds.includes(option.id);
              const isSuggested = suggestedAccessories.some((a) => a.id === option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleAccessory(option)}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-xl border px-2 py-1 text-[11px] font-bold transition-all duration-300',
                    isActive
                      ? 'border-transparent bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 text-white shadow-elevated scale-[1.02]'
                      : 'border-border/70 bg-white/60 text-foreground/75 hover:border-gold/40 hover:bg-white/90 hover:text-foreground hover:-translate-y-0.5'
                  )}
                >
                  <img
                    src={option.imageUrl}
                    alt={option.name}
                    loading="lazy"
                    className="h-6 w-6 object-contain"
                    draggable={false}
                  />
                  <span className="whitespace-nowrap">{option.name}</span>
                  {isSuggested && !isActive && (
                    <Sparkles className="w-3 h-3 text-gold shrink-0" />
                  )}
                  {isActive && (
                    <Check className="w-3 h-3 drop-shadow shrink-0" strokeWidth={3.5} />
                  )}
                </button>
              );
            })}
          </div>
          {selectedAccessoryIds.length === 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground/70 font-medium">
              اکسسوری‌ای انتخاب نشده — روی گزینه‌های بالا کلیک کنید
            </p>
          )}
        </div>
      )}
    </div>
  );
});
