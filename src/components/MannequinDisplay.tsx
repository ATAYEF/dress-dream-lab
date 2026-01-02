import React, { useState, useEffect, useCallback } from 'react';
import { ClothingItem } from '@/types/wardrobe';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles } from 'lucide-react';
import mannequinImage from '@/assets/mannequin.png';

interface MannequinDisplayProps {
  items: ClothingItem[];
  className?: string;
}

export const MannequinDisplay: React.FC<MannequinDisplayProps> = ({ items, className }) => {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastItemsKey, setLastItemsKey] = useState<string>('');

  // Create a key from items to detect changes
  const itemsKey = items.map(i => i.id).sort().join(',');

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
  }, [items]);

  // Auto-generate when items change
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

  // Show generated AI image
  if (generatedImage && !isLoading) {
    return (
      <div className={cn('relative w-full aspect-[3/5] max-w-[280px] mx-auto', className)}>
        <img 
          src={generatedImage} 
          alt="ست لباس"
          className="w-full h-full object-contain rounded-xl shadow-xl animate-scale-in"
        />
        <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          هوش مصنوعی
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn('relative w-full aspect-[3/5] max-w-[280px] mx-auto', className)}>
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
    <div className={cn('relative w-full aspect-[3/5] max-w-[280px] mx-auto', className)}>
      {/* Realistic Mannequin Image */}
      <img 
        src={mannequinImage} 
        alt="مانکن"
        className="absolute inset-0 w-full h-full object-contain drop-shadow-lg"
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
  );
};
