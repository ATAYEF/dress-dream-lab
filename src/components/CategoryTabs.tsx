import React, { useMemo } from 'react';
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
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onCategoryChange,
  clothes = [],
}) => {
  const counts = useMemo(() => {
    const result: Record<string, number> = { all: clothes.length };
    clothes.forEach(c => {
      result[c.category] = (result[c.category] || 0) + 1;
    });
    return result;
  }, [clothes]);

  return (
    <div
      className="relative p-1.5 rounded-2xl bg-gradient-card hairline-border shadow-soft overflow-x-auto scrollbar-hide"
      dir="rtl"
    >
      <div className="flex gap-2 min-w-max">
        {CATEGORY_ORDER.map((catId) => {
          const cat: CategoryDefinition = CATEGORY_CONFIG[catId];
          const isActive = activeCategory === catId;
          const count = counts[catId] || 0;
          const Icon = cat.icon;

          return (
            <button
              key={catId}
              onClick={() => onCategoryChange(catId)}
              className={cn(
                'group relative flex items-center gap-2.5 px-4 md:px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-500',
                isActive
                  ? 'text-white shadow-lg scale-[1.02]'
                  : 'text-foreground/70 hover:text-foreground hover:bg-white/70'
              )}
              style={isActive ? {
                background: `linear-gradient(135deg, ${cat.hexFrom} 0%, ${cat.hexTo} 100%)`,
                boxShadow: `0 8px 24px -8px ${cat.hexFrom}99`,
              } : {}}
            >
              <span
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-500 shrink-0',
                  !isActive && 'group-hover:scale-110'
                )}
                style={!isActive ? {
                  background: `${cat.hexFrom}1f`,
                  color: cat.hexFrom,
                } : {
                  background: 'rgba(255,255,255,0.22)',
                  color: 'white',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Icon className="w-4 h-4" />
              </span>

              <span className="shrink-0">{cat.label}</span>

              <span
                className={cn(
                  'flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[10px] font-bold transition-all duration-500 shrink-0',
                  isActive
                    ? 'bg-white/25 text-white backdrop-blur-sm'
                    : 'bg-foreground/6 text-foreground/60 group-hover:bg-foreground/10 group-hover:text-foreground/80'
                )}
              >
                {count.toLocaleString('fa-IR')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
