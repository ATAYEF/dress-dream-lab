import React, { useState } from 'react';
import { Plus, Check, LucideIcon, ChevronLeft, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSmoothDragScroll } from '@/hooks/useSmoothDragScroll';

export interface RailItem {
  id: string;
  name: string;
  imageUrl: string;
  reason?: string;
  score?: number;
  addable?: boolean;
}

interface SuggestionRailProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  items: RailItem[];
  onSelect?: (id: string) => void;
  selectedIds?: string[];
  showViewAll?: boolean;
  className?: string;
}

export const SuggestionRail: React.FC<SuggestionRailProps> = ({
  title,
  subtitle,
  icon: Icon,
  items,
  onSelect,
  selectedIds = [],
  showViewAll = false,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);
  const drag = useSmoothDragScroll();

  if (items.length === 0) return null;

  const renderItem = (item: RailItem, wide = false) => {
    const isSelected =
      selectedIds.includes(item.id) || selectedIds.some((sid) => item.id.includes(sid));
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          if (drag.moved.current) {
            drag.moved.current = false;
            return;
          }
          if (item.addable) onSelect?.(item.id);
        }}
        disabled={!item.addable}
        title={item.reason}
        className={cn(
          'group text-right rounded-[1.1rem] bg-card p-1.5',
          'border transition-all duration-300',
          wide ? 'w-full' : 'snap-start shrink-0 w-[92px]',
          isSelected
            ? 'border-primary ring-2 ring-primary/30 shadow-soft'
            : 'border-border/60',
          item.addable
            ? 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/50'
            : 'cursor-default opacity-95'
        )}
      >
        <div className="relative aspect-square overflow-hidden bg-muted/40 rounded-[0.85rem]">
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            draggable={false}
            className="w-full h-full object-contain p-1 transition-transform duration-500 group-hover:scale-105 pointer-events-none"
          />
          {isSelected ? (
            <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
          ) : item.addable ? (
            <span className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus className="w-3 h-3" strokeWidth={3} />
            </span>
          ) : (
            <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-background/85 text-[8px] font-bold text-muted-foreground">
              ایده
            </span>
          )}
        </div>
        {wide && (
          <p className="mt-1.5 text-[10px] font-extrabold truncate leading-tight px-0.5">{item.name}</p>
        )}
      </button>
    );
  };

  return (
    <section className={cn('space-y-2.5', className)} dir="rtl">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold tracking-tight text-foreground leading-tight">{title}</h4>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {showViewAll && items.length > 2 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            {expanded ? (
              <>
                بستن
                <ChevronDown className="w-3.5 h-3.5 rotate-180" />
              </>
            ) : (
              <>
                مشاهده همه
                <ChevronLeft className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {expanded ? (
        <div className="grid grid-cols-3 gap-2.5 animate-in fade-in duration-200">
          {items.map((item) => renderItem(item, true))}
        </div>
      ) : (
        <div
          ref={drag.ref}
          onMouseDown={drag.onMouseDown}
          className="flex gap-2.5 overflow-x-auto custom-scroll-smooth pb-1.5 -mx-0.5 px-0.5 snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
          style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((item) => renderItem(item, false))}
        </div>
      )}
    </section>
  );
};
