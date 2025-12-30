import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { ClothingItem } from '@/types/wardrobe';
import { cn } from '@/lib/utils';

interface ClothingCardProps {
  item: ClothingItem;
  onRemove?: (id: string) => void;
  onSelect?: (item: ClothingItem) => void;
  isSelected?: boolean;
  showActions?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ClothingCard: React.FC<ClothingCardProps> = ({
  item,
  onRemove,
  onSelect,
  isSelected = false,
  showActions = true,
  className,
  style,
}) => {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-card shadow-sm transition-all duration-300 hover:shadow-lg cursor-pointer',
        isSelected && 'ring-2 ring-[hsl(42,85%,55%)]',
        className
      )}
      style={style}
      onClick={() => onSelect?.(item)}
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white text-sm font-medium truncate">
          {item.name}
        </p>
        <p className="text-white/70 text-xs capitalize">
          {item.category}
        </p>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 p-1.5 bg-[hsl(42,85%,55%)] rounded-full animate-scale-in">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}
      
      {/* Remove button */}
      {showActions && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="absolute top-2 right-2 p-1.5 bg-background/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
