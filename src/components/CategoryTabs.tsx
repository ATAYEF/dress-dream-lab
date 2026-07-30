import React, { useMemo } from 'react';
import { ClothingCategory, ClothingItem } from '@/types/wardrobe';
import { cn } from '@/lib/utils';
import { Shirt, CircleDot, Sparkles, Sun, Footprints, Watch, Crown } from 'lucide-react';

interface CategoryTabsProps {
  activeCategory: ClothingCategory | 'all';
  onCategoryChange: (category: ClothingCategory | 'all') => void;
  clothes?: ClothingItem[];
}

const iconColorMap: Record<string, { from: string; to: string; softBg: string }> = {
  all: { from: '#f5c451', to: '#c9912a', softBg: 'rgba(245, 196, 81, 0.12)' },
  tops: { from: '#818cf8', to: '#6366f1', softBg: 'rgba(129, 140, 248, 0.12)' },
  bottoms: { from: '#f472b6', to: '#ec4899', softBg: 'rgba(244, 114, 182, 0.12)' },
  dresses: { from: '#c084fc', to: '#a855f7', softBg: 'rgba(192, 132, 252, 0.12)' },
  outerwear: { from: '#fb923c', to: '#f97316', softBg: 'rgba(251, 146, 60, 0.12)' },
  shoes: { from: '#34d399', to: '#10b981', softBg: 'rgba(52, 211, 153, 0.12)' },
  accessories: { from: '#60a5fa', to: '#3b82f6', softBg: 'rgba(96, 165, 250, 0.12)' },
};

const getIcon = (id: string) => {
  switch (id) {
    case 'all': return <Crown className="w-4 h-4" />;
    case 'tops': return <Shirt className="w-4 h-4" />;
    case 'bottoms': return <CircleDot className="w-4 h-4" />;
    case 'dresses': return <Sparkles className="w-4 h-4" />;
    case 'outerwear': return <Sun className="w-4 h-4" />;
    case 'shoes': return <Footprints className="w-4 h-4" />;
    case 'accessories': return <Watch className="w-4 h-4" />;
    default: return <Sparkles className="w-4 h-4" />;
  }
};

const labelMap: Record<string, string> = {
  all: 'همه',
  tops: 'بالاتنه',
  bottoms: 'پایین‌تنه',
  dresses: 'لباس یکسره',
  outerwear: 'ژاکت و کت',
  shoes: 'کفش',
  accessories: 'اکسسوری',
};

const categoryOrder: (ClothingCategory | 'all')[] = ['all', 'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];

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
        {categoryOrder.map((catId) => {
          const colors = iconColorMap[catId] || iconColorMap.all;
          const isActive = activeCategory === catId;
          const count = counts[catId] || 0;

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
                background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
                boxShadow: `0 8px 24px -8px ${colors.from}99`,
              } : {}}
            >
              {/* Icon container */}
              <span
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-500 shrink-0',
                  !isActive && 'group-hover:scale-110'
                )}
                style={!isActive ? {
                  background: colors.softBg,
                  color: colors.from,
                } : {
                  background: 'rgba(255,255,255,0.22)',
                  color: 'white',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {getIcon(catId)}
              </span>

              {/* Label */}
              <span className="shrink-0">{labelMap[catId]}</span>

              {/* Count badge */}
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
