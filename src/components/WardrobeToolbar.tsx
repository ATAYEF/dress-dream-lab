import React from 'react';
import {
  ArrowUpDown,
  CheckSquare,
  Square,
  Trash2,
  LayoutGrid,
  Rows3,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type WardrobeSort = 'newest' | 'oldest' | 'name' | 'color' | 'category';
export type WardrobeDensity = 'comfortable' | 'compact';

interface WardrobeToolbarProps {
  sort: WardrobeSort;
  onSortChange: (sort: WardrobeSort) => void;
  density: WardrobeDensity;
  onDensityChange: (d: WardrobeDensity) => void;
  selectionMode: boolean;
  onSelectionModeChange: (v: boolean) => void;
  selectedCount: number;
  totalVisible: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  className?: string;
}

const SORT_OPTIONS: { value: WardrobeSort; label: string }[] = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'oldest', label: 'قدیمی‌ترین' },
  { value: 'name', label: 'نام' },
  { value: 'color', label: 'رنگ' },
  { value: 'category', label: 'دسته' },
];

export const WardrobeToolbar: React.FC<WardrobeToolbarProps> = ({
  sort,
  onSortChange,
  density,
  onDensityChange,
  selectionMode,
  onSelectionModeChange,
  selectedCount,
  totalVisible,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-card hairline-border shadow-soft',
        className
      )}
      dir="rtl"
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort */}
        <div className="relative flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as WardrobeSort)}
            className="appearance-none bg-white/70 dark:bg-white/5 border border-border/50 rounded-xl text-xs font-bold px-3 py-2 pr-3 pl-7 outline-none focus:ring-2 focus:ring-gold/40 cursor-pointer"
            aria-label="مرتب‌سازی"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Density */}
        <div className="flex items-center rounded-xl border border-border/50 bg-white/50 dark:bg-white/5 p-0.5">
          <button
            type="button"
            onClick={() => onDensityChange('comfortable')}
            className={cn(
              'p-2 rounded-lg transition-all',
              density === 'comfortable'
                ? 'bg-gradient-gold text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="نمای راحت"
            aria-label="نمای راحت"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDensityChange('compact')}
            className={cn(
              'p-2 rounded-lg transition-all',
              density === 'compact'
                ? 'bg-gradient-gold text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="نمای فشرده"
            aria-label="نمای فشرده"
          >
            <Rows3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selection controls */}
      <div className="flex flex-wrap items-center gap-2">
        {!selectionMode ? (
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={() => onSelectionModeChange(true)}
            className="font-bold"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            انتخاب گروهی
          </Button>
        ) : (
          <>
            <span className="text-xs font-extrabold text-muted-foreground">
              {selectedCount.toLocaleString('fa-IR')} انتخاب‌شده
            </span>
            <Button
              type="button"
              variant="soft"
              size="sm"
              onClick={selectedCount === totalVisible ? onClearSelection : onSelectAll}
              className="font-bold"
            >
              {selectedCount === totalVisible ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  لغو همه
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  انتخاب همه
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={selectedCount === 0}
              onClick={onBulkDelete}
              className="font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف ({selectedCount.toLocaleString('fa-IR')})
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onClearSelection();
                onSelectionModeChange(false);
              }}
              className="font-bold"
            >
              <X className="w-3.5 h-3.5" />
              بستن
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
