import React, { useState, useEffect, useRef } from 'react';
import { ClothingItem } from '@/types/wardrobe';
import { cn } from '@/lib/utils';
import { useStagedProgress, TRYON_RENDER_STAGES } from '@/hooks/useStagedProgress';
import { StagedProgress } from '@/components/StagedProgress';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles, Check, X, Wand2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import mannequinFemale from '@/assets/mannequin-female.png';
import mannequinMale from '@/assets/mannequin-male.png';
import { suggestShoes, SuggestedShoe, ALL_SHOE_OPTIONS } from '@/lib/shoeSuggestion';
import { suggestAccessories, SuggestedAccessory, ALL_ACCESSORY_OPTIONS } from '@/lib/accessorySuggestion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { persianEdgeError, readFunctionErrorBody } from '@/lib/edgeFunctionError';
import AiImageViewer from './AiImageViewer';
import { GarmentImage } from './GarmentImage';

/**
 * Converts any image (bundled asset, blob, data url or remote url) into a
 * compressed base64 JPEG data URL. Downscaling is essential: raw camera photos
 * are several MB in base64 and make the try-on request fail silently.
 */
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
  // Some remote images block CORS; retry without it (canvas may still work for
  // same-origin / data URLs, and the retry catches transient failures).
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
  // White backdrop so transparent PNGs stay clean once flattened to JPEG
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.72);
}



export type MannequinGender = 'female' | 'male';

interface MannequinDisplayProps {
  items: ClothingItem[];
  className?: string;
  gender?: MannequinGender;
  /** @deprecated Ignored - we always use the curated mannequin assets to avoid broken AI generations. */
  profileImageUrl?: string | null;
  /** Preview-only: hide AI try-on, shoe/accessory pickers, zoom chrome */
  compact?: boolean;
}

export const MannequinDisplay: React.FC<MannequinDisplayProps> = ({
  items,
  className,
  gender = 'female',
  compact = false,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Always use bundled mannequin assets (never user photo) - guarantees clean result
  const mannequinImage = gender === 'male' ? mannequinMale : mannequinFemale;

  // ===== AI outfit suggestions (shoes + accessories) =====
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
  const userAccessory = items.find((i) => i.category === 'accessories');
  const activeAccessories: (SuggestedAccessory | ClothingItem)[] = userAccessory
    ? [userAccessory as ClothingItem]
    : ALL_ACCESSORY_OPTIONS.filter((a) => selectedAccessoryIds.includes(a.id));

  // outfit key - re-sync suggestions when the user changes items
  const outfitKey = `${gender}-${items.map((i) => i.id).sort().join(',')}`;
  useEffect(() => {
    // Default suggestions first
    setSelectedShoeId(suggestedShoe?.id ?? null);
    setSelectedAccessoryIds(suggestedAccessories.map((a) => a.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfitKey]);

  const toggleShoe = (shoe: SuggestedShoe) => {
    if (items.some((i) => i.category === 'shoes')) return; // user already selected their own shoes
    setSelectedShoeId((prev) => (prev === shoe.id ? null : shoe.id));
  };

  const toggleAccessory = (accessory: SuggestedAccessory) => {
    if (userAccessory) return;
    setSelectedAccessoryIds((prev) => {
      if (prev.includes(accessory.id)) {
        return prev.filter((id) => id !== accessory.id);
      }
      // Swap out same-type accessories (only one belt, one bag at a time)
      const sameTypeIds = ALL_ACCESSORY_OPTIONS.filter((a) => a.type === accessory.type).map((a) => a.id);
      return [...prev.filter((id) => !sameTypeIds.includes(id)), accessory.id];
    });
  };

  // ===== AI Virtual Try-on =====
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const tryonProgress = useStagedProgress(aiLoading, TRYON_RENDER_STAGES);

  // Drop a stale generated image whenever the outfit or model changes
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
      // Cap the number of garments and downscale them harder — keeps the
      // request payload small enough for the edge function to accept it.
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

      const payloadKb = Math.round(
        (baseImageUrl.length + clothingItems.reduce((s, c) => s + c.imageUrl.length, 0)) / 1024
      );
      console.log('Virtual try-on payload ~', payloadKb, 'KB (auto model chain)');

      const { data, error } = await supabase.functions.invoke('virtual-tryon', {
        body: { baseImageUrl, clothingItems, suggestedFootwear, suggestedAccessory },
      });

      // Non-2xx: Supabase sets error with English "Edge Function returned a non-2xx..."
      // Real Persian message is usually in the response body (error.context).
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



  // ===== Zoom & Pan =====
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 3));
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

  // ===== UI pieces =====
  const zoomControls = (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/90 backdrop-blur-md rounded-full px-2 py-1 shadow-lg z-50 hairline-border">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} disabled={zoom <= 0.5}>
        <ZoomOut className="w-4 h-4" />
      </Button>
      <span className="text-xs font-bold min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} disabled={zoom >= 3}>
        <ZoomIn className="w-4 h-4" />
      </Button>
      {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset}>
          <RotateCcw className="w-3 h-3" />
        </Button>
      )}
    </div>
  );

  const zoomableStyle: React.CSSProperties = {
    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
  };

  // ===== Body-slot layout (category zones — not "stuck on" mannequin face) =====
  const top = items.find((i) => i.category === 'tops');
  const bottom = items.find((i) => i.category === 'bottoms');
  const dress = items.find((i) => i.category === 'dresses');
  const outerwear = items.find((i) => i.category === 'outerwear');
  const shoesItem = items.find((i) => i.category === 'shoes');
  const accessoryItems = items.filter((i) => i.category === 'accessories');

  /** Precise body zones for a standing figure in aspect-[3/5] frame */
  const SLOT = {
    // shoulders → mid-torso
    tops: { top: '16%', left: '24%', width: '52%', height: '28%' },
    // coat / jacket over torso, slightly wider
    outerwear: { top: '14%', left: '18%', width: '64%', height: '36%' },
    // waist → ankles
    bottoms: { top: '42%', left: '27%', width: '46%', height: '40%' },
    // full one-piece
    dresses: { top: '16%', left: '24%', width: '52%', height: '58%' },
    // feet
    shoes: { top: '84%', left: '28%', width: '44%', height: '12%' },
    // neck / scarf
    accessoryHead: { top: '9%', left: '35%', width: '30%', height: '9%' },
    // belt at waist
    accessoryBelt: { top: '41%', left: '30%', width: '40%', height: '5%' },
    // bag at right hip
    accessoryBag: { top: '48%', left: '68%', width: '28%', height: '16%' },
  } as const;

  const slotStyle = (
    slot: { top: string; left: string; width: string; height: string },
    z: number,
    delay = '0.05s'
  ): React.CSSProperties => ({
    ...slot,
    zIndex: z,
    position: 'absolute',
    animationDelay: delay,
    animationFillMode: 'backwards',
    filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.22))',
  });

  return (
    <div className={cn(!compact && 'w-full max-w-[320px] mx-auto', compact && 'w-full', className)}>
      {/* Body canvas */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[3/5] overflow-hidden rounded-3xl bg-gradient-card hairline-border shadow-card"
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
          {/* Faint silhouette guide only — garments sit in category slots, not glued on mannequin */}
          <img
            src={mannequinImage}
            alt=""
            aria-hidden
            className={cn(
              'absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-500',
              hasSelectedItems ? 'opacity-[0.12]' : 'opacity-90 drop-shadow-xl'
            )}
            draggable={false}
          />

          {/* Zone labels when items present */}
          {hasSelectedItems && (
            <>
              <span className="absolute top-[14%] right-2 z-[5] text-[9px] font-black text-muted-foreground/70 bg-background/70 px-1.5 py-0.5 rounded-md">
                بالاتنه
              </span>
              <span className="absolute top-[48%] right-2 z-[5] text-[9px] font-black text-muted-foreground/70 bg-background/70 px-1.5 py-0.5 rounded-md">
                پایین‌تنه
              </span>
              <span className="absolute top-[86%] right-2 z-[5] text-[9px] font-black text-muted-foreground/70 bg-background/70 px-1.5 py-0.5 rounded-md">
                کفش
              </span>
            </>
          )}

          {/* Dress (full body) — only when no separate top/bottom */}
          {dress && !top && !bottom && (
            <div key={dress.id} className="animate-fade-up" style={slotStyle(SLOT.dresses, 10, '0.05s')}>
              <GarmentImage
                src={dress.imageUrl}
                alt={dress.name}
                className="w-full h-full object-contain object-center"
                draggable={false}
              />
            </div>
          )}

          {/* Tops — chest / torso */}
          {top && (
            <div key={top.id} className="animate-fade-up" style={slotStyle(SLOT.tops, 12, '0.05s')}>
              <GarmentImage
                src={top.imageUrl}
                alt={top.name}
                className="w-full h-full object-contain object-center"
                draggable={false}
              />
            </div>
          )}

          {/* Outerwear — over torso, wider */}
          {outerwear && (
            <div
              key={outerwear.id}
              className="animate-fade-up"
              style={slotStyle(SLOT.outerwear, 18, '0.12s')}
            >
              <GarmentImage
                src={outerwear.imageUrl}
                alt={outerwear.name}
                className="w-full h-full object-contain object-center"
                draggable={false}
              />
            </div>
          )}

          {/* Bottoms — hips to ankles */}
          {bottom && (
            <div key={bottom.id} className="animate-fade-up" style={slotStyle(SLOT.bottoms, 14, '0.08s')}>
              <GarmentImage
                src={bottom.imageUrl}
                alt={bottom.name}
                className="w-full h-full object-contain object-center"
                draggable={false}
              />
            </div>
          )}

          {/* Shoes — feet zone */}
          {activeShoe && (
            <div
              className="animate-fade-up"
              style={slotStyle(SLOT.shoes, 16, '0.15s')}
            >
              <GarmentImage
                src={activeShoe.imageUrl}
                alt={activeShoe.name}
                loading="lazy"
                className="w-full h-full object-contain object-center"
                draggable={false}
              />
            </div>
          )}

          {/* User accessories — distribute by type heuristic */}
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
                className="animate-fade-up overflow-hidden"
                style={slotStyle(slot, z, `${0.18 + index * 0.06}s`)}
              >
                <GarmentImage
                  src={acc.imageUrl}
                  alt={acc.name}
                  className={cn(
                    'w-full h-full object-contain object-center',
                    !isBelt && !isBag && 'rounded-full object-cover'
                  )}
                  draggable={false}
                />
              </div>
            );
          })}

          {/* AI suggested accessories only if user has none */}
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
                    className="w-full h-full object-contain object-center opacity-90"
                    draggable={false}
                  />
                </div>
              );
            })}

          {/* Empty state */}
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

        {/* Instant composite indicator (before any AI generation) */}
        {!compact && hasSelectedItems && !aiImage && !aiLoading && (
          <div className="absolute top-2 right-2 z-40 flex items-center gap-1 rounded-full bg-background/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-black text-foreground/80 shadow-md hairline-border animate-fade-in">
            <Sparkles className="w-3 h-3 text-gold" />
            پیش‌نمایش فوری (بدون هوش مصنوعی)
          </div>
        )}


        {/* AI generated try-on result */}
        {aiImage && (
          <AiImageViewer
            src={aiImage}
            alt="نتیجه پرو مجازی با هوش مصنوعی"
            onClose={() => setAiImage(null)}
          />
        )}


        {/* Generating overlay — multi-stage progress */}
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

      {/* ===== AI generate — no model picker; server auto-selects ===== */}
      {!compact && (
      <div className="mt-3 rounded-2xl hairline-border bg-gradient-card/80 backdrop-blur p-3 shadow-soft">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-foreground">
          <Wand2 className="w-3.5 h-3.5 text-gold" />
          پرو مجازی
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
              ساخت تصویر واقع‌گرایانه
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

      {/* ===== Shoe picker ===== */}
      {!compact && hasSelectedItems && !items.some((i) => i.category === 'shoes') && (
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

      {/* ===== Accessory picker ===== */}
      {!compact && hasSelectedItems && !userAccessory && (
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
};
