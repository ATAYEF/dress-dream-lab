import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClothingItem } from '@/types/wardrobe';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import mannequinFemale from '@/assets/mannequin-female.png';
import mannequinMale from '@/assets/mannequin-male.png';

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

  // Create a key from items and gender to detect changes
  const itemsKey = `${gender}-${items.map(i => i.id).sort().join(',')}`;

  const generateTryOn = useCallback(async () => {
    if (items.length === 0) {
      setGeneratedImage(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert mannequin image to base64 for the API
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
  }, [items, mannequinImage, gender]);

  // Auto-generate when items or gender change
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

  const zoomableStyle = {
    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
  };

  // Show generated AI image
  if (generatedImage && !isLoading) {
    return (
      <div 
        ref={containerRef}
        className={cn('relative w-full aspect-[3/5] max-w-[320px] mx-auto overflow-hidden rounded-xl', className)}
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
      <div className={cn('relative w-full aspect-[3/5] max-w-[320px] mx-auto', className)}>
        <img 
          src={mannequinImage} 
          alt="مانکن"
          className="absolute inset-0 w-full h-full object-contain opacity-50"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 rounded-xl backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">در حال پردازش...</p>
        </div>
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

        {/* Simple Clothing Overlays as fallback */}
        {accessory && (
          <div 
            key={accessory.id}
            className="absolute overflow-hidden shadow-lg animate-scale-in z-20"
            style={{ 
              top: '0%', 
              left: '50%', 
              transform: 'translateX(-50%)',
              width: '28%',
              height: '8%',
            }}
          >
            <img 
              src={accessory.imageUrl} 
              alt={accessory.name}
              className="w-full h-full object-cover rounded-full"
              draggable={false}
            />
          </div>
        )}

        {outerwear && (
          <div 
            key={outerwear.id}
            className="absolute overflow-hidden shadow-xl z-30 animate-scale-in"
            style={{ 
              top: '12%', 
              left: '15%', 
              width: '70%',
              height: '38%',
              clipPath: 'polygon(15% 0%, 85% 0%, 100% 8%, 100% 100%, 80% 95%, 75% 35%, 50% 38%, 25% 35%, 20% 95%, 0% 100%, 0% 8%)',
            }}
          >
            <img 
              src={outerwear.imageUrl} 
              alt={outerwear.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        )}

        {dress && !top && !bottom && (
          <div 
            key={dress.id}
            className="absolute overflow-hidden shadow-xl animate-scale-in z-10"
            style={{ 
              top: '13%', 
              left: '22%', 
              width: '56%',
              height: '55%',
              clipPath: 'polygon(20% 0%, 80% 0%, 88% 5%, 90% 18%, 85% 40%, 95% 100%, 5% 100%, 15% 40%, 10% 18%, 12% 5%)',
            }}
          >
            <img 
              src={dress.imageUrl} 
              alt={dress.name}
              className="w-full h-full object-cover scale-110"
              draggable={false}
            />
          </div>
        )}

        {top && (
          <div 
            key={top.id}
            className="absolute overflow-hidden shadow-xl animate-scale-in z-10"
            style={{ 
              top: '13%', 
              left: '18%', 
              width: '64%',
              height: '28%',
              clipPath: 'polygon(18% 0%, 82% 0%, 92% 8%, 100% 22%, 95% 100%, 50% 95%, 5% 100%, 0% 22%, 8% 8%)',
            }}
          >
            <img 
              src={top.imageUrl} 
              alt={top.name}
              className="w-full h-full object-cover scale-110"
              draggable={false}
            />
          </div>
        )}

        {bottom && (
          <div 
            key={bottom.id}
            className="absolute overflow-hidden shadow-xl animate-scale-in z-10"
            style={{ 
              top: '38%', 
              left: '24%', 
              width: '52%',
              height: '48%',
              clipPath: 'polygon(0% 0%, 100% 0%, 95% 25%, 88% 50%, 78% 100%, 55% 98%, 50% 45%, 45% 98%, 22% 100%, 12% 50%, 5% 25%)',
            }}
          >
            <img 
              src={bottom.imageUrl} 
              alt={bottom.name}
              className="w-full h-full object-cover scale-105"
              draggable={false}
            />
          </div>
        )}

        {shoes && (
          <div 
            key={shoes.id}
            className="absolute overflow-hidden shadow-lg animate-scale-in z-10"
            style={{ 
              top: '88%', 
              left: '26%', 
              width: '48%',
              height: '10%',
              clipPath: 'polygon(0% 30%, 20% 0%, 30% 30%, 50% 50%, 70% 30%, 80% 0%, 100% 30%, 90% 100%, 10% 100%)',
            }}
          >
            <img 
              src={shoes.imageUrl} 
              alt={shoes.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/20 rounded-2xl">
            <p className="text-muted-foreground text-sm font-medium">لباسی انتخاب نشده</p>
          </div>
        )}
      </div>

      {zoomControls}
    </div>
  );
};
