import React from 'react';
import { ClothingCategory } from '@/types/wardrobe';
import { cn } from '@/lib/utils';
import { Shirt, CircleDot, Footprints, Watch, CloudSun, Sparkles } from 'lucide-react';

interface CategoryTabsProps {
  activeCategory: ClothingCategory | 'all';
  onCategoryChange: (category: ClothingCategory | 'all') => void;
}

const categories: { id: ClothingCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'همه', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'tops', label: 'بالاتنه', icon: <Shirt className="w-4 h-4" /> },
  { id: 'bottoms', label: 'پایین‌تنه', icon: <CircleDot className="w-4 h-4" /> },
  { id: 'dresses', label: 'لباس یکسره', icon: <CloudSun className="w-4 h-4" /> },
  { id: 'outerwear', label: 'ژاکت و کت', icon: <CloudSun className="w-4 h-4" /> },
  { id: 'shoes', label: 'کفش', icon: <Footprints className="w-4 h-4" /> },
  { id: 'accessories', label: 'اکسسوری', icon: <Watch className="w-4 h-4" /> },
];

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" dir="rtl">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-smooth',
            activeCategory === category.id
              ? 'bg-foreground text-background shadow-card'
              : 'bg-cream text-foreground hover:bg-cream-dark'
          )}
        >
          {category.icon}
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  );
};
