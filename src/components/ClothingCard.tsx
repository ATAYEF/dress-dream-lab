import React from 'react';
import { Check, Eye, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { cn } from '@/lib/utils';

interface ClothingCardProps {
  item: ClothingItem;
  onRemove?: (item: ClothingItem) => void;
  onSelect?: (item: ClothingItem) => void;
  onEdit?: (item: ClothingItem) => void;
  isSelected?: boolean;
  showActions?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const categoryBadgeStyles: Record<ClothingCategory, { bg: string; label: string }> = {
  tops: { bg: 'hsl(var(--gold) / 0.92)', label: 'بالا' },
  bottoms: { bg: 'hsl(var(--rose) / 0.92)', label: 'پایین' },
  dresses: { bg: 'hsl(var(--gold-light) / 0.92)', label: 'لباس' },
  outerwear: { bg: 'hsl(var(--espresso) / 0.92)', label: 'بیرونی' },
  shoes: { bg: 'hsl(var(--sage) / 0.92)', label: 'کفش' },
  accessories: { bg: 'hsl(var(--lavender) / 0.92)', label: 'اکسسوری' },
};

export const ClothingCard: React.FC<ClothingCardProps> = ({
  item,
  onRemove,
  onSelect,
  onEdit,
  isSelected = false,
  showActions = true,
  className,
  style,
}) => {
  const badge = categoryBadgeStyles[item.category];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-gradient-card hairline-border transition-all duration-500 ease-out cursor-pointer',
        'hover:shadow-elevated hover:-translate-y-1.5 hover:scale-[1.02]',
        isSelected && 'ring-2 ring-gold shadow-elevated scale-[1.02] -translate-y-1',
        className
      )}
      style={style}
      onClick={() => onSelect?.(item)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-cream/50">
        {/* Image */}
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-[1deg]"
          draggable={false}
        />

        {/* Top overlay gradient */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/25 via-black/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Bottom gradient for text */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 via-black/25 to-transparent pointer-events-none" />

        {/* Category Badge */}
        <div
          className="absolute top-2.5 right-2.5 backdrop-blur-md rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-lg pointer-events-none"
          style={{ backgroundColor: badge.bg }}
        >
          {badge.label}
        </div>

        {/* Color Badge */}
        {item.color && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 backdrop-blur-md bg-white/80 rounded-full pl-1 pr-2.5 py-1 text-[10px] font-bold text-foreground shadow-lg pointer-events-none">
            <span
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              title={item.color}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(0,0,0,0.08))',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
              }}
            />
            <span className="max-w-[60px] truncate">{item.color}</span>
          </div>
        )}

        {/* AI Badge - permanent when item has AI tag */}
        {item.tags?.includes('AI') && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 pointer-events-none">
            <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 text-white px-2.5 py-1 shadow-elevated text-[10px] font-black tracking-tight animate-float">
              <Sparkles className="w-3 h-3 shrink-0 animate-pulse" />
              AI
            </div>
          </div>
        )}

        {/* Selected overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-transparent to-gold/15 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-gold shadow-glow flex items-center justify-center animate-scale-in">
              <Check className="w-8 h-8 text-white drop-shadow-md" strokeWidth={3} />
            </div>
          </div>
        )}

        {showActions && (onSelect || onEdit || onRemove) && (
          <div className="absolute bottom-3 inset-x-3 z-10 flex items-center justify-center gap-2 opacity-100 transition-all duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
            {onSelect && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(item);
                }}
                className="flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`مشاهده ${item.name}`}
                title="مشاهده"
              >
                <Eye className="size-4" aria-hidden="true" />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(item);
                }}
                className="flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`ویرایش ${item.name}`}
                title="ویرایش"
              >
                <Pencil className="size-4" aria-hidden="true" />
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(item);
                }}
                className="flex size-9 items-center justify-center rounded-full bg-background/90 text-destructive shadow-md backdrop-blur-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`حذف ${item.name}`}
                title="حذف"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="p-3.5 pt-3 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm truncate leading-tight group-hover:text-gold transition-colors duration-300">
              {item.name}
            </h3>
          </div>

          {/* Small category color indicator */}
          <div
            className="w-2 h-2 rounded-full shrink-0 mt-1.5"
            style={{ backgroundColor: badge.bg }}
          />
        </div>

        {/* Tags */}
        {item.tags && item.tags.filter(t => t !== 'AI').length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags
              .filter(t => t !== 'AI')
              .slice(0, 3)
              .map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-cream border border-border/50 text-foreground/70"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}

        {/* Date or subtle info */}
        <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
          {item.createdAt && new Date(item.createdAt).toLocaleDateString('fa-IR', {
            month: 'short',
            day: 'numeric',
          })}
        </p>

      </div>
    </div>
  );
};
