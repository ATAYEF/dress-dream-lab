import React, { useState, useEffect, useRef } from 'react';
import { ClothingItem } from '@/types/wardrobe';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles, Check, X, Wand2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import mannequinFemale from '@/assets/mannequin-female.png';
import mannequinMale from '@/assets/mannequin-male.png';
import { suggestShoes, SuggestedShoe, ALL_SHOE_OPTIONS } from '@/lib/shoeSuggestion';
import { suggestAccessories, SuggestedAccessory, ALL_ACCESSORY_OPTIONS } from '@/lib/accessorySuggestion';
import { TRYON_MODELS, DEFAULT_TRYON_MODEL } from '@/lib/tryonModels';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/** Converts any image (bundled asset, blob or remote url) into a base64 data URL */
async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) return src;
  const res = await fetch(src);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


export type MannequinGender = 'female' | 'male';

interface MannequinDisplayProps {
  items: ClothingItem[];
  className?: string;
  gender?: MannequinGender;
  /** @deprecated Ignored - we always use the curated mannequin assets to avoid broken AI generations. */
  profileImageUrl?: string | null;
}

export const MannequinDisplay: React.FC<MannequinDisplayProps> = ({
  items,
  className,
  gender = 'female',
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Always use bundled mannequin assets (never user photo) - guarantees clean result
  const mannequinImage = gender === 'male' ? mannequinMale : mannequinFemale;

  // ===== AI outfit suggestions (shoes + accessories) =====
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

  // ===== Item layout positions =====
  const top = items.find((i) => i.category === 'tops');
  const bottom = items.find((i) => i.category === 'bottoms');
  const dress = items.find((i) => i.category === 'dresses');
  const outerwear = items.find((i) => i.category === 'outerwear');

  return (
    <div className={cn('w-full max-w-[320px] mx-auto', className)}>
      {/* Mannequin Canvas */}
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
        {/* Background decorative blobs */}
        <div
          className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-40 animate-blob"
          style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-14 w-44 h-44 rounded-full opacity-25 animate-blob animation-delay-2000"
          style={{ background: 'radial-gradient(circle, hsl(var(--rose)) 0%, transparent 70%)' }}
        />

        <div style={zoomableStyle} className="w-full h-full relative select-none">
          {/* Base mannequin */}
          <img
            src={mannequinImage}
            alt="مانکن"
            className="absolute inset-0 w-full h-full object-contain drop-shadow-xl"
            draggable={false}
          />

          {/* User clothing overlays */}
          {dress && !top && !bottom && (
            <div
              key={dress.id}
              className="absolute overflow-hidden z-10 animate-fade-up"
              style={{
                top: '13%',
                left: '22%',
                width: '56%',
                height: '55%',
                clipPath: 'polygon(20% 0%, 80% 0%, 88% 5%, 90% 18%, 85% 40%, 95% 100%, 5% 100%, 15% 40%, 10% 18%, 12% 5%)',
                animationDelay: '0.05s',
                animationFillMode: 'backwards',
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))',
              }}
            >
              <img
                src={dress.imageUrl}
                alt={dress.name}
                className="w-full h-full object-cover scale-110 transition-all duration-500 hover:brightness-110"
                draggable={false}
              />
            </div>
          )}

          {top && (
            <div
              key={top.id}
              className="absolute overflow-hidden z-10 animate-fade-up"
              style={{
                top: '13%',
                left: '18%',
                width: '64%',
                height: '28%',
                clipPath: 'polygon(18% 0%, 82% 0%, 92% 8%, 100% 22%, 95% 100%, 50% 95%, 5% 100%, 0% 22%, 8% 8%)',
                animationDelay: '0.05s',
                animationFillMode: 'backwards',
                filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.25))',
              }}
            >
              <img
                src={top.imageUrl}
                alt={top.name}
                className="w-full h-full object-cover scale-110 transition-all duration-500 hover:brightness-110"
                draggable={false}
              />
            </div>
          )}

          {outerwear && (
            <div
              key={outerwear.id}
              className="absolute overflow-hidden z-30 animate-fade-up"
              style={{
                top: '12%',
                left: '15%',
                width: '70%',
                height: '38%',
                clipPath: 'polygon(15% 0%, 85% 0%, 100% 8%, 100% 100%, 80% 95%, 75% 35%, 50% 38%, 25% 35%, 20% 95%, 0% 100%, 0% 8%)',
                animationDelay: '0.15s',
                animationFillMode: 'backwards',
                filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.3))',
              }}
            >
              <img
                src={outerwear.imageUrl}
                alt={outerwear.name}
                className="w-full h-full object-cover transition-all duration-500 hover:brightness-110"
                draggable={false}
              />
            </div>
          )}

          {bottom && (
            <div
              key={bottom.id}
              className="absolute overflow-hidden z-10 animate-fade-up"
              style={{
                top: '38%',
                left: '24%',
                width: '52%',
                height: '48%',
                clipPath: 'polygon(0% 0%, 100% 0%, 95% 25%, 88% 50%, 78% 100%, 55% 98%, 50% 45%, 45% 98%, 22% 100%, 12% 50%, 5% 25%)',
                animationDelay: '0.1s',
                animationFillMode: 'backwards',
                filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.25))',
              }}
            >
              <img
                src={bottom.imageUrl}
                alt={bottom.name}
                className="w-full h-full object-cover scale-105 transition-all duration-500 hover:brightness-110"
                draggable={false}
              />
            </div>
          )}

          {/* Active shoes - either user's own, or suggested */}
          {activeShoe && (
            <>
              <div
                className="absolute z-10 animate-fade-up"
                style={{
                  top: '87%',
                  left: '26%',
                  width: '48%',
                  height: '11%',
                  animationDelay: '0.2s',
                  animationFillMode: 'backwards',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                }}
              >
                <img
                  src={activeShoe.imageUrl}
                  alt={activeShoe.name}
                  loading="lazy"
                  className="w-full h-full object-contain transition-all duration-500 hover:brightness-110"
                  draggable={false}
                />
              </div>
              {!items.some((i) => i.category === 'shoes') && (
                <div className="absolute bottom-[13%] left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full bg-gradient-gold px-2.5 py-1 text-[10px] text-primary-foreground shadow-lg shadow-gold/30 animate-fade-in whitespace-nowrap font-black">
                  <Sparkles className="w-3 h-3" />
                  {activeShoe.name}
                </div>
              )}
            </>
          )}

          {/* User's own accessory (when user actually added one) */}
          {userAccessory && (
            <div
              key={userAccessory.id}
              className="absolute overflow-hidden z-20 animate-fade-up"
              style={{
                top: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '30%',
                height: '10%',
                animationDelay: '0.3s',
                animationFillMode: 'backwards',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
              }}
            >
              <img
                src={userAccessory.imageUrl}
                alt={userAccessory.name}
                className="w-full h-full object-cover rounded-full transition-transform duration-500 hover:scale-110"
                draggable={false}
              />
            </div>
          )}

          {/* AI suggested accessories (belt + bag) */}
          {!userAccessory &&
            activeAccessories.map((accessory, index) => {
              const a = accessory as SuggestedAccessory;
              return (
                <div
                  key={a.id}
                  className="absolute z-40 animate-fade-up"
                  style={
                    a.type === 'belt'
                      ? {
                          top: '44%',
                          left: '30%',
                          width: '40%',
                          height: '6%',
                          animationDelay: `${0.3 + index * 0.08}s`,
                          animationFillMode: 'backwards',
                          filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.3))',
                        }
                      : {
                          top: '46%',
                          left: '68%',
                          width: '26%',
                          height: '18%',
                          animationDelay: `${0.3 + index * 0.08}s`,
                          animationFillMode: 'backwards',
                          filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.3))',
                        }
                  }
                >
                  <img
                    src={a.imageUrl}
                    alt={a.name}
                    loading="lazy"
                    className="w-full h-full object-contain transition-all duration-500 hover:brightness-110"
                    draggable={false}
                  />
                </div>
              );
            })}

          {/* Empty state */}
          {items.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-3xl animate-fade-in">
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

        {zoomControls}
      </div>

      {/* ===== Shoe picker ===== */}
      {!items.some((i) => i.category === 'shoes') && (
        <div className="mt-3 rounded-2xl hairline-border bg-gradient-card/80 backdrop-blur p-3 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              کفش پیشنهادی
            </div>
            {activeShoe && (
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
      {!userAccessory && (
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
