import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClothingItem } from '@/types/wardrobe';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import mannequinFemale from '@/assets/mannequin-female.png';
import mannequinMale from '@/assets/mannequin-male.png';
import { suggestShoes } from '@/lib/shoeSuggestion';
import { ACCESSORY_OPTIONS, suggestAccessories, SuggestedAccessory } from '@/lib/accessorySuggestion';



export type MannequinGender = 'female' | 'male';

interface MannequinDisplayProps {
  items: ClothingItem[];
  className?: string;
  gender?: MannequinGender;
}

export const MannequinDisplay: React.FC<MannequinDisplayProps> = ({ 
  items, 
  className,
  gender = 'female'
}) => {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastItemsKey, setLastItemsKey] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  const mannequinImage = gender === 'male' ? mannequinMale : mannequinFemale;

  const suggestedShoe = suggestShoes(items, gender);
  const suggestedAccessories = suggestAccessories(items, gender);

  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([]);
  const activeAccessories = ACCESSORY_OPTIONS.filter((a) => selectedAccessoryIds.includes(a.id));
  const accessoriesKey = activeAccessories.map((a) => a.id).join(',');

  // Create a key from items, gender and accessories to detect changes
  const itemsKey = `${gender}-${items.map(i => i.id).sort().join(',')}-${accessoriesKey}`;
  const outfitKey = `${gender}-${items.map(i => i.id).sort().join(',')}`;

  // Reset accessory selection to the AI suggestion whenever the outfit changes
  useEffect(() => {
    setSelectedAccessoryIds(suggestAccessories(items, gender).map((a) => a.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfitKey]);

  const toggleAccessory = (accessory: SuggestedAccessory) => {
    setSelectedAccessoryIds((prev) => {
      if (prev.includes(accessory.id)) return prev.filter((id) => id !== accessory.id);
      const sameType = ACCESSORY_OPTIONS.filter((a) => a.type === accessory.type).map((a) => a.id);
      return [...prev.filter((id) => !sameType.includes(id)), accessory.id];
    });
  };



  const generateTryOn = useCallback(async () => {
    if (items.length === 0) {
      setGeneratedImage(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(mannequinImage);
      const blob = await response.blob();
      const mannequinBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const { data, error: fnError } = await supabase.functions.invoke('virtual-tryon', {
        body: {
          mannequinImageUrl: mannequinBase64,
          gender,
          suggestedFootwear: suggestShoes(items, gender)?.prompt ?? null,
          suggestedAccessory: activeAccessories.length
            ? activeAccessories.map((a) => a.prompt).join(' and ')
            : null,

          clothingItems: items.map(item => ({
            name: item.name,
            category: item.category,
            imageUrl: item.imageUrl
          }))
        }
      });


      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      
      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
      }
    } catch (err) {
      console.error('Virtual try-on error:', err);
      setError(err instanceof Error ? err.message : 'خطا در ایجاد تصویر');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, mannequinImage, gender, accessoriesKey]);

  useEffect(() => {
    if (itemsKey !== lastItemsKey) {
      setLastItemsKey(itemsKey);
      if (items.length > 0) {
        generateTryOn();
      } else {
        setGeneratedImage(null);
      }
    }
  }, [itemsKey, lastItemsKey, items.length, generateTryOn]);

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  // Pan handlers
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

  // Touch handlers for mobile
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

  const zoomControls = (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg z-50">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} disabled={zoom <= 0.5}>
        <ZoomOut className="w-4 h-4" />
      </Button>
      <span className="text-xs font-medium min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
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


  const accessoryPicker = items.length > 0 && (
    <div className="mt-3 rounded-xl border border-border/60 bg-card/60 p-3">
      <div className="mb-2 flex items-center gap-1 text-xs font-medium text-foreground">
        <Sparkles className="w-3 h-3 text-primary" />
        اکسسوری‌ها (کمربند و کیف را می‌توانید ترکیب کنید)
      </div>
      <div className="flex flex-wrap gap-2">
        {ACCESSORY_OPTIONS.map((option) => {
          const isActive = selectedAccessoryIds.includes(option.id);
          const isSuggested = suggestedAccessories.some((a) => a.id === option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleAccessory(option)}
              aria-pressed={isActive}
              className={cn(
                'flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] transition-all',
                isActive
                  ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                  : 'border-border bg-background/60 text-muted-foreground hover:border-primary/50'
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
              {isSuggested && <Sparkles className="w-3 h-3 text-primary" />}
            </button>
          );
        })}
      </div>
      {activeAccessories.length === 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">اکسسوری انتخاب نشده است</p>
      )}
    </div>
  );


  const zoomableStyle = {
    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
  };

  // Show generated AI image
  if (generatedImage && !isLoading) {
    return (
      <div className={cn('w-full max-w-[320px] mx-auto', className)}>
      <div 
        ref={containerRef}
        className="relative w-full aspect-[3/5] overflow-hidden rounded-xl"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={generatedImage} 
          alt="ست لباس"
          className="w-full h-full object-contain shadow-xl animate-scale-in select-none"
          style={zoomableStyle}
          draggable={false}
        />
        <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1 z-50">
          <Sparkles className="w-3 h-3" />
          هوش مصنوعی
        </div>
        {zoomControls}
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn('relative w-full aspect-[3/5] max-w-[320px] mx-auto overflow-hidden rounded-2xl', className)}>
        {/* Mannequin with pulse effect */}
        <img 
          src={mannequinImage} 
          alt="مانکن"
          className="absolute inset-0 w-full h-full object-contain opacity-40 animate-pulse"
        />
        
        {/* Animated overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-primary/10 animate-pulse" />
        
        {/* Scanning line effect */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Animated rings */}
          <div className="relative">
            <div className="absolute inset-0 w-20 h-20 border-4 border-primary/30 rounded-full animate-ping" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-primary/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 backdrop-blur-sm flex items-center justify-center border-2 border-primary/50">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          
          {/* Loading text with dots animation */}
          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-foreground mb-1">در حال پردازش هوش مصنوعی</p>
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        </div>
        
        {/* Corner decorations */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/50 rounded-tl-lg animate-pulse" />
        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary/50 rounded-tr-lg animate-pulse" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary/50 rounded-bl-lg animate-pulse" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/50 rounded-br-lg animate-pulse" />
      </div>
    );
  }

  // Fallback display with simple overlays (when no items or error)
  const top = items.find(item => item.category === 'tops');
  const bottom = items.find(item => item.category === 'bottoms');
  const dress = items.find(item => item.category === 'dresses');
  const shoes = items.find(item => item.category === 'shoes');
  const outerwear = items.find(item => item.category === 'outerwear');
  const accessory = items.find(item => item.category === 'accessories');

  return (
    <div 
      ref={containerRef}
      className={cn('relative w-full aspect-[3/5] max-w-[320px] mx-auto overflow-hidden rounded-2xl', className)}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div style={zoomableStyle} className="w-full h-full relative select-none">
        {/* Realistic Mannequin Image */}
        <img 
          src={mannequinImage} 
          alt="مانکن"
          className="absolute inset-0 w-full h-full object-contain drop-shadow-lg"
          draggable={false}
        />

        {/* Error message */}
        {error && items.length > 0 && (
          <div className="absolute top-2 left-2 right-2 bg-destructive/90 text-destructive-foreground text-xs px-2 py-1 rounded text-center">
            {error}
          </div>
        )}

        {/* Enhanced Clothing Overlays with staggered animations */}
        {accessory && (
          <div 
            key={accessory.id}
            className="absolute overflow-hidden z-20 animate-fade-up"
            style={{ 
              top: '0%', 
              left: '50%', 
              transform: 'translateX(-50%)',
              width: '28%',
              height: '8%',
              animationDelay: '0.5s',
              animationFillMode: 'backwards',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
            }}
          >
            <img 
              src={accessory.imageUrl} 
              alt={accessory.name}
              className="w-full h-full object-cover rounded-full transition-transform duration-500 hover:scale-110"
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
              animationDelay: '0.4s',
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
              animationDelay: '0.1s',
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
              animationDelay: '0.1s',
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
              animationDelay: '0.25s',
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

        {shoes && (
          <div 
            key={shoes.id}
            className="absolute overflow-hidden z-10 animate-fade-up"
            style={{ 
              top: '88%', 
              left: '26%', 
              width: '48%',
              height: '10%',
              clipPath: 'polygon(0% 30%, 20% 0%, 30% 30%, 50% 50%, 70% 30%, 80% 0%, 100% 30%, 90% 100%, 10% 100%)',
              animationDelay: '0.35s',
              animationFillMode: 'backwards',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
            }}
          >
            <img 
              src={shoes.imageUrl} 
              alt={shoes.name}
              className="w-full h-full object-cover transition-all duration-500 hover:brightness-110"
              draggable={false}
            />
          </div>
        )}

        {/* AI-suggested shoes when the user has not picked any */}
        {!shoes && suggestedShoe && (
          <>
            <div
              className="absolute z-10 animate-fade-up"
              style={{
                top: '87%',
                left: '26%',
                width: '48%',
                height: '11%',
                animationDelay: '0.35s',
                animationFillMode: 'backwards',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
              }}
            >
              <img
                src={suggestedShoe.imageUrl}
                alt={suggestedShoe.name}
                loading="lazy"
                className="w-full h-full object-contain transition-all duration-500 hover:brightness-110"
                draggable={false}
              />
            </div>
            <div className="absolute bottom-[13%] left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 text-[10px] text-primary-foreground shadow-lg animate-fade-in whitespace-nowrap">
              <Sparkles className="w-3 h-3" />
              کفش پیشنهادی: {suggestedShoe.name}
            </div>
          </>
        )}

        {/* Suggested / selected accessories (belt + bag can be combined) */}
        {activeAccessories.map((accessory, index) => (
          <div
            key={accessory.id}
            className="absolute z-40 animate-fade-up"
            style={
              accessory.type === 'belt'
                ? {
                    top: '44%',
                    left: '30%',
                    width: '40%',
                    height: '6%',
                    animationDelay: `${0.45 + index * 0.1}s`,
                    animationFillMode: 'backwards',
                    filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.3))',
                  }
                : {
                    top: '46%',
                    left: '68%',
                    width: '26%',
                    height: '18%',
                    animationDelay: `${0.45 + index * 0.1}s`,
                    animationFillMode: 'backwards',
                    filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.3))',
                  }
            }
          >
            <img
              src={accessory.imageUrl}
              alt={accessory.name}
              loading="lazy"
              className="w-full h-full object-contain transition-all duration-500 hover:brightness-110"
              draggable={false}
            />
          </div>
        ))}


        {/* Empty state with gentle pulse */}
        {items.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/30 backdrop-blur-[1px] rounded-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3 animate-pulse">
              <svg className="w-8 h-8 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-muted-foreground text-sm font-medium">لباسی انتخاب نشده</p>
            <p className="text-muted-foreground/60 text-xs mt-1">از لیست بالا لباس انتخاب کنید</p>
          </div>
        )}
      </div>

      {zoomControls}
    </div>
  );
};
