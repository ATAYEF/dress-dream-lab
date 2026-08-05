import React from 'react';
import { Plus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RailItem {
  id: string;
  name: string;
  imageUrl: string;
  reason?: string;
  score?: number;
  /** Can be added to the outfit (comes from the user's wardrobe) */
  addable?: boolean;
}

interface SuggestionRailProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  items: RailItem[];
  onSelect?: (id: string) => void;
  className?: string;
}

/**
 * Compact horizontal carousel of AI suggestions — premium, minimal, RTL.
 */
export const SuggestionRail: React.FC<SuggestionRailProps> = ({
  title,
  subtitle,
  icon: Icon,
  items,
  onSelect,
  className,
}) => {
  if (items.length === 0) return null;

  return (
    <section className={cn('space-y-3', className)} dir="rtl">
      <div className="flex items-center gap-2.5 px-0.5">
        <span className="w-8 h-8 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <h4 className="text-sm font-extrabold tracking-tight text-foreground leading-tight">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground font-medium leading-tight mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto custom-scroll-smooth pb-2 -mx-1 px-1 snap-x snap-mandatory">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => item.addable && onSelect?.(item.id)}
            disabled={!item.addable}
            title={item.reason}
            className={cn(
              'group snap-start shrink-0 w-[128px] text-right rounded-[1.25rem] bg-card p-2.5',
              'border border-border/70 transition-all duration-300',
              item.addable
                ? 'cursor-pointer hover:-translate-y-1 hover:border-primary/60 hover:shadow-card'
                : 'cursor-default opacity-95'
            )}
          >
            <div className="relative aspect-square rounded-[1rem] overflow-hidden bg-muted/50">
              <img
                src={item.imageUrl}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-contain p-1.5 transition-transform duration-500 group-hover:scale-105"
              />
              {item.addable ? (
                <span className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-background/85 text-[9px] font-bold text-muted-foreground">
                  ایده
                </span>
              )}
            </div>
            <p className="mt-2 text-[11px] font-extrabold leading-tight line-clamp-1 text-foreground">
              {item.name}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium line-clamp-1 mt-0.5">
              {typeof item.score === 'number' ? `تطبیق ${item.score}٪` : item.reason}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};
