import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { ClothingCategory, ClothingItem } from '@/types/wardrobe';
import { cn } from '@/lib/utils';
import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  CategoryDefinition,
} from '@/lib/categoryConfig';

interface CategoryTabsProps {
  activeCategory: ClothingCategory | 'all';
  onCategoryChange: (category: ClothingCategory | 'all') => void;
  clothes?: ClothingItem[];
  /** Default closed (collapsed dropdown) */
  defaultOpen?: boolean;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onCategoryChange,
  clothes = [],
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: clothes.length };
    clothes.forEach((c) => {
      result[c.category] = (result[c.category] || 0) + 1;
    });
    return result;
  }, [clothes]);

  const active = CATEGORY_CONFIG[activeCategory] as CategoryDefinition;
  const ActiveIcon = active.icon;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="relative" ref={rootRef} dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full sm:w-auto min-w-[200px] flex items-center justify-between gap-3',
          'px-4 py-2.5 rounded-2xl text-sm font-extrabold',
          'bg-gradient-card hairline-border shadow-soft',
          'hover:shadow-md transition-all duration-300',
          open && 'ring-2 ring-gold/30'
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${active.hexFrom}, ${active.hexTo})`,
            }}
          >
            <ActiveIcon className="w-4 h-4" />
          </span>
          <span className="truncate">{active.label}</span>
          <span className="text-[11px] font-bold text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-full">
            {(counts[activeCategory] || 0).toLocaleString('fa-IR')}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 right-0 z-40 w-full sm:w-72 max-h-72 overflow-y-auto rounded-2xl bg-white/95 dark:bg-background/95 backdrop-blur-xl border border-border/60 shadow-elevated p-1.5 animate-fade-up"
          role="listbox"
        >
          {CATEGORY_ORDER.map((catId) => {
            const cat = CATEGORY_CONFIG[catId];
            const isActive = activeCategory === catId;
            const count = counts[catId] || 0;
            const Icon = cat.icon;

            return (
              <button
                key={catId}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onCategoryChange(catId);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 text-right',
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-foreground/80 hover:bg-foreground/5'
                )}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${cat.hexFrom}, ${cat.hexTo})`,
                      }
                    : undefined
                }
              >
                <span
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    isActive ? 'bg-white/20' : ''
                  )}
                  style={
                    !isActive
                      ? { background: `${cat.hexFrom}18`, color: cat.hexFrom }
                      : undefined
                  }
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1">{cat.label}</span>
                <span
                  className={cn(
                    'text-[11px] font-black px-2 py-0.5 rounded-full',
                    isActive ? 'bg-white/25 text-white' : 'bg-foreground/6 text-muted-foreground'
                  )}
                >
                  {count.toLocaleString('fa-IR')}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
