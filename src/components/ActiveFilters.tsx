import React from 'react';
import { X } from 'lucide-react';
import { ClothingCategory } from '@/types/wardrobe';
import { CATEGORY_CONFIG } from '@/lib/categoryConfig';
import { cn } from '@/lib/utils';

interface ActiveFiltersProps {
  searchQuery: string;
  colorFilter: string;
  activeCategory: ClothingCategory | 'all';
  onClearSearch: () => void;
  onClearColor: () => void;
  onClearCategory: () => void;
  onClearAll: () => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  searchQuery,
  colorFilter,
  activeCategory,
  onClearSearch,
  onClearColor,
  onClearCategory,
  onClearAll,
}) => {
  const hasAny =
    Boolean(searchQuery.trim()) ||
    Boolean(colorFilter) ||
    activeCategory !== 'all';

  if (!hasAny) return null;

  const chips: { key: string; label: string; onClear: () => void }[] = [];

  if (activeCategory !== 'all') {
    const cat = CATEGORY_CONFIG[activeCategory];
    chips.push({
      key: 'category',
      label: cat?.label || activeCategory,
      onClear: onClearCategory,
    });
  }

  if (searchQuery.trim()) {
    chips.push({
      key: 'search',
      label: `«${searchQuery.trim()}»`,
      onClear: onClearSearch,
    });
  }

  if (colorFilter) {
    chips.push({
      key: 'color',
      label: colorFilter,
      onClear: onClearColor,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 md:mt-4" dir="rtl">
      <span className="text-[11px] md:text-xs font-bold text-muted-foreground">
        فیلترهای فعال:
      </span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClear}
          className={cn(
            'group inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-full',
            'bg-gold/10 border border-gold/25 text-foreground/85',
            'text-[11px] md:text-xs font-bold',
            'hover:bg-gold/20 hover:border-gold/40 transition-all duration-300'
          )}
        >
          <span>{chip.label}</span>
          <X className="w-3 h-3 opacity-60 group-hover:opacity-100" strokeWidth={2.5} />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] md:text-xs font-extrabold text-muted-foreground hover:text-gold transition-colors underline-offset-2 hover:underline"
        >
          پاک کردن همه
        </button>
      )}
    </div>
  );
};
