import React, { useMemo } from 'react';
import { Layers, Palette, LayoutGrid, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { CATEGORY_CONFIG, CATEGORY_CLOTHING_ORDER } from '@/lib/categoryConfig';
import { colorNameToHex, resolveColorName } from '@/lib/colorHarmony';
import { cn } from '@/lib/utils';

interface WardrobeOverviewProps {
  clothes: ClothingItem[];
  className?: string;
}

/** Digital wardrobe health + coverage overview */
export const WardrobeOverview: React.FC<WardrobeOverviewProps> = ({ clothes, className }) => {
  const stats = useMemo(() => {
    const byCategory = CATEGORY_CLOTHING_ORDER.reduce(
      (acc, key) => {
        acc[key] = clothes.filter((c) => c.category === key).length;
        return acc;
      },
      {} as Record<ClothingCategory, number>
    );

    const filledCategories = CATEGORY_CLOTHING_ORDER.filter((k) => byCategory[k] > 0).length;
    const colors = new Set(
      clothes
        .map((c) => resolveColorName(c.color))
        .filter((c): c is string => Boolean(c))
    );

    const withColor = clothes.filter((c) => c.color?.trim()).length;
    const completeness =
      clothes.length === 0
        ? 0
        : Math.round(
            ((filledCategories / CATEGORY_CLOTHING_ORDER.length) * 0.55 +
              (withColor / Math.max(clothes.length, 1)) * 0.45) *
              100
          );

    const missing = CATEGORY_CLOTHING_ORDER.filter((k) => byCategory[k] === 0);

    const topColors = [...colors].slice(0, 8);

    return {
      byCategory,
      filledCategories,
      colorCount: colors.size,
      completeness,
      missing,
      topColors,
      total: clothes.length,
    };
  }, [clothes]);

  if (clothes.length === 0) return null;

  return (
    <div
      className={cn(
        'rounded-[1.75rem] bg-gradient-card hairline-border shadow-soft p-4 md:p-5 space-y-4',
        className
      )}
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 flex items-center justify-center border border-indigo-200/40">
            <Layers className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-extrabold">مدیریت کمد دیجیتال</h3>
            <p className="text-[11px] text-muted-foreground font-medium">
              پوشش دسته‌ها، تنوع رنگ و سلامت کمد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border',
              stats.completeness >= 75
                ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-700 dark:text-emerald-300'
                : stats.completeness >= 45
                  ? 'bg-gold/10 border-gold/30 text-gold'
                  : 'bg-rose-500/10 border-rose-400/30 text-rose-600 dark:text-rose-300'
            )}
          >
            {stats.completeness >= 75 ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            سلامت کمد {stats.completeness.toLocaleString('fa-IR')}٪
          </span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {[
          {
            icon: LayoutGrid,
            label: 'کل لباس‌ها',
            value: stats.total.toLocaleString('fa-IR'),
            color: 'text-gold',
          },
          {
            icon: Layers,
            label: 'دسته‌های پر',
            value: `${stats.filledCategories.toLocaleString('fa-IR')} / ${CATEGORY_CLOTHING_ORDER.length.toLocaleString('fa-IR')}`,
            color: 'text-indigo-500',
          },
          {
            icon: Palette,
            label: 'تنوع رنگ',
            value: stats.colorCount.toLocaleString('fa-IR'),
            color: 'text-rose-500',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl bg-white/60 dark:bg-white/5 border border-white/70 dark:border-white/10 p-3 text-center shadow-sm"
          >
            <kpi.icon className={cn('w-4 h-4 mx-auto mb-1.5', kpi.color)} />
            <div className="text-base md:text-lg font-black tabular-nums">{kpi.value}</div>
            <div className="text-[10px] md:text-[11px] font-bold text-muted-foreground">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Category mini bars */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {CATEGORY_CLOTHING_ORDER.map((key) => {
          const cat = CATEGORY_CONFIG[key];
          const count = stats.byCategory[key];
          const max = Math.max(...Object.values(stats.byCategory), 1);
          const pct = (count / max) * 100;
          const Icon = cat.icon;
          return (
            <div
              key={key}
              className={cn(
                'rounded-xl p-2.5 border transition-colors',
                count === 0
                  ? 'bg-muted/40 border-dashed border-border/60'
                  : 'bg-white/50 dark:bg-white/5 border-white/60'
              )}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1 min-w-0">
                  <Icon className="w-3 h-3 shrink-0" style={{ color: cat.hexFrom }} />
                  <span className="text-[10px] font-bold truncate">{cat.label}</span>
                </div>
                <span className="text-[10px] font-black text-muted-foreground">
                  {count.toLocaleString('fa-IR')}
                </span>
              </div>
              <div className="h-1 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${cat.hexFrom}, ${cat.hexTo})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Color palette strip */}
      {stats.topColors.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-muted-foreground">پالت کمد:</span>
          {stats.topColors.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full bg-white/70 dark:bg-white/5 border border-white/80 text-[10px] font-bold shadow-sm"
            >
              <span
                className="w-3 h-3 rounded-full border border-black/10"
                style={{ backgroundColor: colorNameToHex(c) }}
              />
              {c}
            </span>
          ))}
        </div>
      )}

      {stats.missing.length > 0 && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-extrabold text-foreground/80">پیشنهاد تکمیل: </span>
          دسته‌های{' '}
          {stats.missing
            .map((k) => CATEGORY_CONFIG[k].label)
            .join('، ')}{' '}
          هنوز خالی‌اند — با افزودن لباس، ست‌سازی قوی‌تر می‌شود.
        </p>
      )}
    </div>
  );
};
