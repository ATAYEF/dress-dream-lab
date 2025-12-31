import React from 'react';
import { ClothingItem } from '@/types/wardrobe';
import { cn } from '@/lib/utils';

interface MannequinDisplayProps {
  items: ClothingItem[];
  className?: string;
}

export const MannequinDisplay: React.FC<MannequinDisplayProps> = ({ items, className }) => {
  // Group items by category
  const top = items.find(item => item.category === 'tops');
  const bottom = items.find(item => item.category === 'bottoms');
  const dress = items.find(item => item.category === 'dresses');
  const shoes = items.find(item => item.category === 'shoes');
  const outerwear = items.find(item => item.category === 'outerwear');
  const accessory = items.find(item => item.category === 'accessories');

  return (
    <div className={cn('relative w-full aspect-[3/5] max-w-[280px] mx-auto', className)}>
      {/* Mannequin SVG Silhouette */}
      <svg 
        viewBox="0 0 200 340" 
        className="absolute inset-0 w-full h-full"
        fill="none"
      >
        {/* Head */}
        <ellipse cx="100" cy="28" rx="22" ry="26" className="fill-muted/30 stroke-muted-foreground/20" strokeWidth="1.5" />
        
        {/* Neck */}
        <path d="M92 52 L92 65 L108 65 L108 52" className="fill-muted/30 stroke-muted-foreground/20" strokeWidth="1.5" />
        
        {/* Shoulders and Torso */}
        <path 
          d="M92 65 L50 80 L45 85 L50 90 L55 88 L60 130 L65 175 L135 175 L140 130 L145 88 L150 90 L155 85 L150 80 L108 65" 
          className="fill-muted/20 stroke-muted-foreground/20" 
          strokeWidth="1.5"
        />
        
        {/* Arms Left */}
        <path 
          d="M50 90 L35 140 L30 175 L40 178 L48 145 L55 115" 
          className="fill-muted/20 stroke-muted-foreground/20" 
          strokeWidth="1.5"
        />
        
        {/* Arms Right */}
        <path 
          d="M150 90 L165 140 L170 175 L160 178 L152 145 L145 115" 
          className="fill-muted/20 stroke-muted-foreground/20" 
          strokeWidth="1.5"
        />
        
        {/* Legs */}
        <path 
          d="M65 175 L60 260 L55 310 L75 312 L80 265 L100 180 L120 265 L125 312 L145 310 L140 260 L135 175" 
          className="fill-muted/20 stroke-muted-foreground/20" 
          strokeWidth="1.5"
        />
        
        {/* Feet */}
        <ellipse cx="65" cy="322" rx="18" ry="8" className="fill-muted/20 stroke-muted-foreground/20" strokeWidth="1.5" />
        <ellipse cx="135" cy="322" rx="18" ry="8" className="fill-muted/20 stroke-muted-foreground/20" strokeWidth="1.5" />
      </svg>

      {/* Clothing Overlays */}
      
      {/* Accessory (hat/necklace area) */}
      {accessory && (
        <div 
          className="absolute rounded-full overflow-hidden border-2 border-background shadow-lg"
          style={{ 
            top: '0%', 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: '20%',
            height: '8%'
          }}
        >
          <img 
            src={accessory.imageUrl} 
            alt={accessory.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Outerwear (jacket/coat) - behind other items */}
      {outerwear && (
        <div 
          className="absolute rounded-xl overflow-hidden border-2 border-background shadow-lg opacity-90"
          style={{ 
            top: '18%', 
            left: '10%', 
            width: '80%',
            height: '35%'
          }}
        >
          <img 
            src={outerwear.imageUrl} 
            alt={outerwear.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Dress (full body) */}
      {dress && !top && !bottom && (
        <div 
          className="absolute rounded-xl overflow-hidden border-2 border-background shadow-lg"
          style={{ 
            top: '19%', 
            left: '18%', 
            width: '64%',
            height: '45%'
          }}
        >
          <img 
            src={dress.imageUrl} 
            alt={dress.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Top (shirt/blouse) */}
      {top && (
        <div 
          className="absolute rounded-xl overflow-hidden border-2 border-background shadow-lg"
          style={{ 
            top: '19%', 
            left: '20%', 
            width: '60%',
            height: '25%'
          }}
        >
          <img 
            src={top.imageUrl} 
            alt={top.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Bottom (pants/skirt) */}
      {bottom && (
        <div 
          className="absolute rounded-xl overflow-hidden border-2 border-background shadow-lg"
          style={{ 
            top: '43%', 
            left: '22%', 
            width: '56%',
            height: '32%'
          }}
        >
          <img 
            src={bottom.imageUrl} 
            alt={bottom.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Shoes */}
      {shoes && (
        <div 
          className="absolute rounded-lg overflow-hidden border-2 border-background shadow-lg"
          style={{ 
            top: '85%', 
            left: '25%', 
            width: '50%',
            height: '12%'
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
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">بدون لباس</p>
        </div>
      )}
    </div>
  );
};
