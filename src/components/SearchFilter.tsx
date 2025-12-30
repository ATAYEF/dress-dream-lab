import React, { useState } from 'react';
import { Search, X, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  colorFilter: string;
  onColorFilterChange: (color: string) => void;
  availableColors: string[];
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchQuery,
  onSearchChange,
  colorFilter,
  onColorFilterChange,
  availableColors,
}) => {
  const [showColors, setShowColors] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4" dir="rtl">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="جستجو بر اساس نام..."
          maxLength={50}
          className="w-full pr-12 pl-10 py-3 bg-cream border border-border rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Color Filter */}
      <div className="relative">
        <button
          onClick={() => setShowColors(!showColors)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-xl border transition-all whitespace-nowrap',
            colorFilter
              ? 'bg-gold/20 border-gold text-foreground'
              : 'bg-cream border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <Palette className="w-5 h-5" />
          <span>{colorFilter || 'فیلتر رنگ'}</span>
          {colorFilter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onColorFilterChange('');
              }}
              className="p-0.5 hover:bg-gold/30 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </button>

        {/* Color Dropdown */}
        {showColors && availableColors.length > 0 && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowColors(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-card border border-border rounded-xl shadow-elevated z-20 min-w-[200px]">
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onColorFilterChange(color);
                      setShowColors(false);
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm transition-all',
                      colorFilter === color
                        ? 'bg-foreground text-background'
                        : 'bg-cream hover:bg-cream-dark'
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
