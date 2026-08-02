import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Palette, SlidersHorizontal } from 'lucide-react';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColors(false);
      }
    };
    if (showColors) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColors]);

  const hasFilter = searchQuery || colorFilter;

  return (
    <div className="flex flex-col sm:flex-row gap-2 md:gap-4" dir="rtl">
      {/* Search Input */}
      <div className="relative flex-1 group">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-gold opacity-0 blur-md group-focus-within:opacity-40 transition-all duration-500" />
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 flex items-center justify-center w-12 md:w-14 text-gold/80 group-focus-within:text-gold transition-colors">
            <Search className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={2.3} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="جستجوی نام لباس، برند یا رنگ..."
            maxLength={60}
            className={cn(
              'relative w-full rounded-2xl pr-12 md:pr-14 pl-10 md:pl-12 py-3 md:py-3.5 min-h-[44px] text-base outline-none transition-all duration-400 font-medium',
              'bg-gradient-card hairline-border shadow-soft',
              'placeholder:text-muted-foreground/60',
              'hover:shadow-card hover:border-gold/30',
              'focus:shadow-button-gold focus:border-gold/50 focus:shadow-[hsl(42,85%,45%)/0.18] focus:bg-white/90'
            )}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-xl text-muted-foreground/60 hover:text-rose hover:bg-rose/10 transition-all duration-300 hover:scale-110"
              aria-label="پاک کردن جستجو"
            >
              <X className="w-4 h-4 md:w-[18px] md:h-[18px]" strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      {/* Color Filter Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowColors(!showColors)}
          className={cn(
            'group relative flex items-center gap-2 md:gap-2.5 px-4 md:px-5 py-3 md:py-3.5 min-h-[44px] text-base rounded-2xl whitespace-nowrap transition-all duration-400 text-sm md:text-[15px] font-extrabold',
            'bg-gradient-card hairline-border shadow-soft hover:shadow-card',
            colorFilter
              ? 'border-gold/50 shadow-[hsl(42,85%,45%)/0.15] bg-gradient-to-br from-gold/10 via-white/80 to-gold/5'
              : 'text-foreground/75 hover:text-foreground hover:border-gold/30'
          )}
        >
          {colorFilter ? (
            <div className="relative w-5 h-5 md:w-6 md:h-6 rounded-full shadow-lg ring-2 ring-white overflow-hidden">
              <ColorSwatch color={colorFilter} />
            </div>
          ) : (
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-rose via-amber-300 via-50% to-indigo-400 shadow-md ring-2 ring-white/70 flex items-center justify-center">
              <Palette className="w-3 h-3 md:w-3.5 md:h-3.5 text-white drop-shadow" strokeWidth={2.75} />
            </div>
          )}

          <span>{colorFilter ? colorFilter : 'رنگ‌ها'}</span>

          {colorFilter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onColorFilterChange('');
              }}
              className="p-1 rounded-lg hover:bg-rose/15 text-muted-foreground/70 hover:text-rose hover:scale-110 transition-all duration-300 -mr-1"
              aria-label="پاک کردن فیلتر رنگ"
            >
              <X className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2.6} />
            </button>
          )}
        </button>

        {/* Dropdown */}
        {showColors && availableColors.length > 0 && (
          <div
            className={cn(
              'absolute top-full mt-2.5 right-0 z-30 min-w-[240px] max-w-[320px]',
              'animate-scale-in origin-top-right'
            )}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-card shadow-elevated hairline-border p-3 md:p-4 backdrop-blur-xl">
              {/* Blob accent */}
              <div
                className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30"
                style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)' }}
              />

              <div className="relative">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/60">
                  <div className="w-1 h-5 rounded-full bg-gradient-gold" />
                  <span className="text-sm font-black tracking-tight">انتخاب رنگ</span>
                  <span className="text-[10px] md:text-xs font-bold text-muted-foreground mr-auto">
                    {availableColors.length.toLocaleString('fa-IR')} رنگ
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto custom-scroll-smooth pr-1">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        onColorFilterChange(colorFilter === color ? '' : color);
                        setShowColors(false);
                      }}
                      className={cn(
                        'group relative flex items-center gap-2 pl-3 md:pl-3.5 pr-2.5 md:pr-3 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all duration-300',
                        colorFilter === color
                          ? 'bg-gradient-gold text-white shadow-button-gold scale-[1.02]'
                          : 'bg-white/60 hover:bg-white/90 hairline-border hover:border-gold/40 hover:-translate-y-0.5 hover:shadow-md'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 md:w-[18px] md:h-[18px] rounded-full ring-2 shrink-0 transition-all duration-300',
                          colorFilter === color
                            ? 'ring-white/80 shadow-inner'
                            : 'ring-white/70 group-hover:ring-gold/50 group-hover:scale-110'
                        )}
                      >
                        <ColorSwatch color={color} />
                      </div>
                      <span className="truncate max-w-[90px]">{color}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear all filters indicator */}
      {hasFilter && (
        <button
          onClick={() => {
            onSearchChange('');
            onColorFilterChange('');
          }}
          className="inline-flex items-center gap-1.5 md:gap-2 px-3.5 md:px-4 py-2 md:py-2.5 rounded-2xl text-xs md:text-sm font-black hairline-border bg-rose/5 hover:bg-rose/10 border-rose/20 text-rose hover:border-rose/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shrink-0 self-start sm:self-center"
        >
          <SlidersHorizontal className="w-4 h-4" strokeWidth={2.4} />
          <span>پاک کردن فیلترها</span>
        </button>
      )}
    </div>
  );
};

/* ========== Tiny Color Swatch helper ========== */
const ColorSwatch: React.FC<{ color: string }> = ({ color }) => {
  const colorName = (color || '').toLowerCase().trim();

  const map: Record<string, string> = {
    مشکی: '#111827',
    سیاه: '#111827',
    سفید: '#ffffff',
    خاکستری: '#6b7280',
    خاکستری_روشن: '#9ca3af',
    طوسی: '#6b7280',
    قرمز: '#dc2626',
    سرمه: '#1e40af',
    آبی: '#2563eb',
    آبی_آسمانی: '#0ea5e9',
    زرشکی: '#ea580c',
    نارنجی: '#f97316',
    قهوه: '#78350f',
    قهوه‌ای: '#78350f',
    بژ: '#f5e6d3',
    کرم: '#fef3c7',
    زرد: '#eab308',
    طلایی: '#d97706',
    طلا: '#d97706',
    سبز: '#16a34a',
    سبز_زمردی: '#059669',
    سبز_نخودی: '#84cc16',
    بنفش: '#7c3aed',
    بنفش_کم: '#a855f7',
    ارغوانی: '#9333ea',
    صورتی: '#ec4899',
    رز: '#f43f5e',
    قرمز_کم: '#f87171',
    سرخ: '#dc2626',
  };

  const swatch = map[colorName] ||
    (colorName.includes('آبی') ? '#3b82f6' :
    colorName.includes('سبز') ? '#22c55e' :
    colorName.includes('قرمز') || colorName.includes('سرخ') ? '#ef4444' :
    colorName.includes('زرد') || colorName.includes('طل') ? '#eab308' :
    colorName.includes('نارنجی') || colorName.includes('زرشکی') ? '#f97316' :
    colorName.includes('صورتی') || colorName.includes('رز') ? '#f472b6' :
    colorName.includes('بنفش') || colorName.includes('ارغوانی') ? '#8b5cf6' :
    colorName.includes('قهوه') || colorName.includes('بژ') || colorName.includes('کرم') ? '#d4a373' :
    colorName.includes('خاکستری') || colorName.includes('طوسی') ? '#6b7280' :
    colorName.includes('سفید') ? '#ffffff' :
    colorName.includes('مشک') || colorName.includes('سیاه') ? '#111827' :
    '#94a3b8');

  return (
    <div
      className="w-full h-full rounded-full"
      style={{
        background: swatch === '#ffffff'
          ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
          : `linear-gradient(135deg, ${swatch} 0%, ${adjustBrightness(swatch, -20)} 100%)`,
      }}
    />
  );
};

function adjustBrightness(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return '#' + ((R << 16) | (G << 8) | B).toString(16).padStart(6, '0');
}
