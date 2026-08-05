import React, { useMemo, useState } from 'react';
import { Shirt, Plus } from 'lucide-react';
import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { CATEGORY_CLOTHING_ORDER } from '@/lib/categoryConfig';
import { CategoryTabs } from '@/components/CategoryTabs';
import { SearchFilter } from '@/components/SearchFilter';
import { ActiveFilters } from '@/components/ActiveFilters';
import { WardrobeOverview } from '@/components/WardrobeOverview';
import {
  WardrobeToolbar,
  WardrobeSort,
  WardrobeDensity,
} from '@/components/WardrobeToolbar';
import { ClothingCard } from '@/components/ClothingCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MyWardrobeSectionProps {
  clothes: ClothingItem[];
  isLoading?: boolean;
  onAdd: () => void;
  onBulkAdd?: () => void;
  onView: (item: ClothingItem) => void;
  onEdit: (item: ClothingItem) => void;
  onRemove: (item: ClothingItem) => void;
  onBulkRemove?: (ids: string[]) => Promise<void> | void;
}

/**
 * Full wardrobe management view — grid, filters, overview.
 * Complements the compact gallery inside OutfitBuilder.
 */
export const MyWardrobeSection: React.FC<MyWardrobeSectionProps> = ({
  clothes,
  isLoading,
  onAdd,
  onBulkAdd,
  onView,
  onEdit,
  onRemove,
  onBulkRemove,
}) => {
  const [activeCategory, setActiveCategory] = useState<ClothingCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [sort, setSort] = useState<WardrobeSort>('newest');
  const [density, setDensity] = useState<WardrobeDensity>('comfortable');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const availableColors = useMemo(() => {
    const colors = clothes
      .map((item) => item.color)
      .filter((c): c is string => !!c && c.trim() !== '');
    return [...new Set(colors)];
  }, [clothes]);

  const filteredClothes = useMemo(() => {
    let result = [...clothes];

    if (activeCategory !== 'all') {
      result = result.filter((item) => item.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.color && item.color.toLowerCase().includes(q)) ||
          (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (colorFilter) {
      result = result.filter(
        (item) => item.color && item.color.toLowerCase() === colorFilter.toLowerCase()
      );
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name, 'fa');
        case 'color':
          return (a.color || 'ی').localeCompare(b.color || 'ی', 'fa');
        case 'category': {
          const ai = CATEGORY_CLOTHING_ORDER.indexOf(a.category);
          const bi = CATEGORY_CLOTHING_ORDER.indexOf(b.category);
          return ai - bi || a.name.localeCompare(b.name, 'fa');
        }
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [clothes, activeCategory, searchQuery, colorFilter, sort]);

  const clearFilters = () => {
    setSearchQuery('');
    setColorFilter('');
    setActiveCategory('all');
  };

  const toggleSelect = (item: ClothingItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!onBulkRemove || selectedIds.size === 0 || bulkBusy) return;
    const n = selectedIds.size;
    if (
      !window.confirm(
        `آیا از حذف ${n.toLocaleString('fa-IR')} لباس انتخاب‌شده مطمئن هستید؟ این کار قابل بازگشت نیست.`
      )
    ) {
      return;
    }
    setBulkBusy(true);
    try {
      await onBulkRemove([...selectedIds]);
      setSelectedIds(new Set());
      setSelectionMode(false);
    } finally {
      setBulkBusy(false);
    }
  };

  const gridClass =
    density === 'compact'
      ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3'
      : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4';

  return (
    <section id="my-wardrobe" className="animate-fade-up scroll-mt-20 md:scroll-mt-24" dir="rtl">
      <div className="flex items-end justify-between mb-4 md:mb-5 flex-wrap gap-3">
        <div className="flex items-end gap-3">
          <div className="w-1.5 h-10 md:h-12 rounded-full bg-gradient-to-b from-indigo-400 to-purple-600" />
          <div>
            <h2 className="text-2xl md:text-[28px] font-display font-black tracking-tight mb-1">
              کمد من
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              مدیریت کامل لباس‌ها — جستجو، دسته‌بندی و ویرایش سریع
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-card hairline-border shadow-soft text-xs font-extrabold">
            <Shirt className="w-4 h-4 text-gold" />
            {filteredClothes.length.toLocaleString('fa-IR')}
            <span className="text-muted-foreground font-bold">از</span>
            {clothes.length.toLocaleString('fa-IR')}
          </span>
          <Button onClick={onAdd} variant="gold" size="sm" className="font-extrabold shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">افزودن</span>
          </Button>
          {onBulkAdd && (
            <Button onClick={onBulkAdd} variant="soft" size="sm" className="font-extrabold shrink-0">
              گروهی
            </Button>
          )}
        </div>
      </div>

      {clothes.length > 0 && <WardrobeOverview clothes={clothes} className="mb-3" />}

      {clothes.length > 0 && (
        <div className="space-y-2.5 mb-4">
          {/* ۱) نوع لباس → ۲) رنگ → ۳) جستجو */}
          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            clothes={clothes}
            defaultOpen={false}
          />
          <SearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            colorFilter={colorFilter}
            onColorFilterChange={setColorFilter}
            availableColors={availableColors}
          />
          <ActiveFilters
            searchQuery={searchQuery}
            colorFilter={colorFilter}
            activeCategory={activeCategory}
            onClearSearch={() => setSearchQuery('')}
            onClearColor={() => setColorFilter('')}
            onClearCategory={() => setActiveCategory('all')}
            onClearAll={clearFilters}
          />
          <WardrobeToolbar
            sort={sort}
            onSortChange={setSort}
            density={density}
            onDensityChange={setDensity}
            selectionMode={selectionMode}
            onSelectionModeChange={(v) => {
              setSelectionMode(v);
              if (!v) setSelectedIds(new Set());
            }}
            selectedCount={selectedIds.size}
            totalVisible={filteredClothes.length}
            onSelectAll={() => setSelectedIds(new Set(filteredClothes.map((c) => c.id)))}
            onClearSelection={() => setSelectedIds(new Set())}
            onBulkDelete={() => void handleBulkDelete()}
          />
          {bulkBusy && (
            <p className="text-xs font-bold text-muted-foreground text-center animate-pulse">
              در حال حذف گروهی...
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className={cn(gridClass)}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] rounded-2xl bg-muted/60 animate-pulse"
            />
          ))}
        </div>
      ) : clothes.length === 0 ? (
        <EmptyState onAddClick={onAdd} />
      ) : filteredClothes.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-[2rem] bg-gradient-card hairline-border shadow-soft">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-extrabold mb-1">لباسی با این فیلتر پیدا نشد</p>
          <p className="text-sm text-muted-foreground mb-4">جستجو یا دسته را تغییر دهید</p>
          <Button variant="soft" onClick={clearFilters} className="font-bold">
            پاک کردن فیلترها
          </Button>
        </div>
      ) : (
        <div className={gridClass}>
          {filteredClothes.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              onSelect={onView}
              onEdit={onEdit}
              onRemove={onRemove}
              showActions
              selectionMode={selectionMode}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
};
