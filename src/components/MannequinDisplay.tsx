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
      {/* Elegant Mannequin SVG */}
      <svg 
        viewBox="0 0 200 400" 
        className="absolute inset-0 w-full h-full drop-shadow-sm"
        fill="none"
      >
        <defs>
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(30, 30%, 85%)" />
            <stop offset="100%" stopColor="hsl(25, 25%, 75%)" />
          </linearGradient>
          <linearGradient id="hairGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(25, 40%, 25%)" />
            <stop offset="100%" stopColor="hsl(20, 35%, 18%)" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
          </filter>
        </defs>

        {/* Hair */}
        <ellipse cx="100" cy="30" rx="28" ry="30" fill="url(#hairGradient)" />
        <path 
          d="M72 30 Q65 50 70 70 Q75 55 80 45 Q85 55 90 50 L90 42 Q85 50 80 42 Q75 48 72 30" 
          fill="url(#hairGradient)"
        />
        <path 
          d="M128 30 Q135 50 130 70 Q125 55 120 45 Q115 55 110 50 L110 42 Q115 50 120 42 Q125 48 128 30" 
          fill="url(#hairGradient)"
        />

        {/* Face */}
        <ellipse cx="100" cy="45" rx="22" ry="26" fill="url(#skinGradient)" filter="url(#softShadow)" />
        
        {/* Face features */}
        <ellipse cx="92" cy="42" rx="3" ry="2" fill="hsl(25, 20%, 30%)" />
        <ellipse cx="108" cy="42" rx="3" ry="2" fill="hsl(25, 20%, 30%)" />
        <path d="M96 52 Q100 55 104 52" stroke="hsl(0, 40%, 65%)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M97 48 L100 50 L103 48" stroke="hsl(25, 25%, 55%)" strokeWidth="1" fill="none" />
        
        {/* Neck */}
        <path d="M92 68 L92 82 Q100 85 108 82 L108 68" fill="url(#skinGradient)" />

        {/* Shoulders */}
        <path 
          d="M92 82 Q70 88 55 95 Q50 98 52 105 L60 103 Q75 98 92 95" 
          fill="url(#skinGradient)"
        />
        <path 
          d="M108 82 Q130 88 145 95 Q150 98 148 105 L140 103 Q125 98 108 95" 
          fill="url(#skinGradient)"
        />

        {/* Arms */}
        <path 
          d="M52 105 Q45 140 42 175 Q40 190 45 192 Q50 190 52 175 Q55 145 60 115" 
          fill="url(#skinGradient)"
        />
        <path 
          d="M148 105 Q155 140 158 175 Q160 190 155 192 Q150 190 148 175 Q145 145 140 115" 
          fill="url(#skinGradient)"
        />

        {/* Hands */}
        <ellipse cx="43" cy="195" rx="8" ry="12" fill="url(#skinGradient)" />
        <ellipse cx="157" cy="195" rx="8" ry="12" fill="url(#skinGradient)" />

        {/* Torso outline (visible when no clothes) */}
        <path 
          d="M92 95 L65 100 L62 180 Q80 185 100 185 Q120 185 138 180 L135 100 L108 95 Q100 92 92 95" 
          className="fill-muted/10 stroke-muted/20"
          strokeWidth="1"
        />

        {/* Legs outline (visible when no clothes) */}
        <path 
          d="M62 180 L60 280 Q58 320 62 355 L75 355 Q78 320 80 290 L100 190 L120 290 Q122 320 125 355 L138 355 Q142 320 140 280 L138 180" 
          className="fill-muted/10 stroke-muted/20"
          strokeWidth="1"
        />

        {/* Feet */}
        <ellipse cx="68" cy="365" rx="18" ry="10" fill="url(#skinGradient)" />
        <ellipse cx="132" cy="365" rx="18" ry="10" fill="url(#skinGradient)" />
      </svg>

      {/* Clothing Overlays - Fitted to body shape */}
      
      {/* Accessory (hat/jewelry) */}
      {accessory && (
        <div 
          key={accessory.id}
          className="absolute overflow-hidden rounded-full shadow-md border border-background/50 animate-scale-in"
          style={{ 
            top: '1%', 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: '22%',
            height: '7%',
          }}
        >
          <img 
            src={accessory.imageUrl} 
            alt={accessory.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Outerwear (jacket/coat) - Fitted to torso with arms */}
      {outerwear && (
        <div 
          key={outerwear.id}
          className="absolute overflow-hidden shadow-lg z-10 animate-scale-in"
          style={{ 
            top: '20%', 
            left: '12%', 
            width: '76%',
            height: '30%',
            clipPath: 'polygon(20% 0%, 80% 0%, 95% 8%, 100% 100%, 85% 98%, 80% 40%, 50% 45%, 20% 40%, 15% 98%, 0% 100%, 5% 8%)',
          }}
        >
          <img 
            src={outerwear.imageUrl} 
            alt={outerwear.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Dress (full body) - Fitted silhouette */}
      {dress && !top && !bottom && (
        <div 
          key={dress.id}
          className="absolute overflow-hidden shadow-lg animate-scale-in"
          style={{ 
            top: '22%', 
            left: '18%', 
            width: '64%',
            height: '48%',
            clipPath: 'polygon(25% 0%, 75% 0%, 80% 5%, 85% 25%, 90% 60%, 95% 100%, 5% 100%, 10% 60%, 15% 25%, 20% 5%)',
          }}
        >
          <img 
            src={dress.imageUrl} 
            alt={dress.name}
            className="w-full h-full object-cover scale-110"
          />
        </div>
      )}

      {/* Top (shirt/blouse) - Fitted to torso shape */}
      {top && (
        <div 
          key={top.id}
          className="absolute overflow-hidden shadow-lg animate-scale-in"
          style={{ 
            top: '22%', 
            left: '17%', 
            width: '66%',
            height: '24%',
            clipPath: 'polygon(22% 0%, 78% 0%, 85% 8%, 100% 20%, 95% 100%, 50% 95%, 5% 100%, 0% 20%, 15% 8%)',
          }}
        >
          <img 
            src={top.imageUrl} 
            alt={top.name}
            className="w-full h-full object-cover scale-110"
          />
        </div>
      )}

      {/* Bottom (pants/skirt) - Fitted to legs shape */}
      {bottom && (
        <div 
          key={bottom.id}
          className="absolute overflow-hidden shadow-lg animate-scale-in"
          style={{ 
            top: '44%', 
            left: '18%', 
            width: '64%',
            height: '42%',
            clipPath: 'polygon(5% 0%, 95% 0%, 90% 30%, 85% 60%, 80% 100%, 58% 98%, 50% 50%, 42% 98%, 20% 100%, 15% 60%, 10% 30%)',
          }}
        >
          <img 
            src={bottom.imageUrl} 
            alt={bottom.name}
            className="w-full h-full object-cover scale-105"
          />
        </div>
      )}

      {/* Shoes - Fitted to feet */}
      {shoes && (
        <div 
          key={shoes.id}
          className="absolute overflow-hidden shadow-md animate-scale-in"
          style={{ 
            top: '88%', 
            left: '20%', 
            width: '60%',
            height: '10%',
            clipPath: 'polygon(5% 50%, 15% 0%, 35% 20%, 50% 50%, 65% 20%, 85% 0%, 95% 50%, 85% 100%, 15% 100%)',
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
          <p className="text-muted-foreground text-sm">لباسی انتخاب نشده</p>
        </div>
      )}
    </div>
  );
};
