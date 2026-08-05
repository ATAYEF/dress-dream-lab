import React, { useMemo } from 'react';
import {
  OutfitContext,
  ENVIRONMENT_OPTIONS,
  WEATHER_OPTIONS,
  OutfitStyle,
  OutfitEnvironment,
  OutfitWeather,
  withStyle,
  coerceOutfitContext,
  contextLabels,
} from '@/lib/outfitContext';
import { cn } from '@/lib/utils';
import {
  Briefcase,
  Building2,
  PartyPopper,
  Dumbbell,
  Plane,
  Shirt,
  Sun,
  CloudRain,
  Snowflake,
  MapPin,
  X,
} from 'lucide-react';

interface OutfitContextPickerProps {
  value: OutfitContext;
  onChange: (next: OutfitContext) => void;
  className?: string;
  onClear?: () => void;
}

/** Primary activity cards — matches product design (card grid + selection summary) */
const ACTIVITY_CARDS: {
  value: OutfitStyle;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: 'casual',
    label: 'روزمره',
    hint: 'استایل راحت و روزانه',
    icon: Briefcase,
  },
  {
    value: 'formal',
    label: 'رسمی',
    hint: 'مناسب محل کار و جلسات',
    icon: Building2,
  },
  {
    value: 'party',
    label: 'مهمانی',
    hint: 'مجلس و دورهمی‌ها',
    icon: PartyPopper,
  },
];

/** Extra visual activities map onto existing styles (engine stays compatible) */
const EXTRA_ACTIVITIES: {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  apply: (ctx: OutfitContext) => OutfitContext;
  isActive: (ctx: OutfitContext) => boolean;
}[] = [
  {
    id: 'sport',
    label: 'ورزشی',
    hint: 'ورزش و فعالیت‌های بدنی',
    icon: Dumbbell,
    apply: (ctx) =>
      coerceOutfitContext({
        ...ctx,
        style: 'casual',
        environment: 'gathering',
        weather: ctx.weather === 'cold' ? 'cold' : 'sunny',
      }),
    isActive: (ctx) => ctx.style === 'casual' && ctx.environment === 'gathering' && false, // toggled via local below
  },
  {
    id: 'travel',
    label: 'سفر',
    hint: 'سفر و گردشگری',
    icon: Plane,
    apply: (ctx) =>
      coerceOutfitContext({
        ...ctx,
        style: 'casual',
        environment: 'gathering',
      }),
    isActive: () => false,
  },
];

export const OutfitContextPicker: React.FC<OutfitContextPickerProps> = ({
  value,
  onChange,
  className,
  onClear,
}) => {
  const [extraId, setExtraId] = React.useState<string | null>(null);

  const selectionChips = useMemo(() => {
    const chips: { key: string; label: string; icon: React.ReactNode }[] = [];
    const styleCard =
      ACTIVITY_CARDS.find((c) => c.value === value.style) ||
      (extraId === 'sport'
        ? { label: 'ورزشی' }
        : extraId === 'travel'
          ? { label: 'سفر' }
          : null);
    chips.push({
      key: 'style',
      label:
        extraId === 'sport'
          ? 'ورزشی'
          : extraId === 'travel'
            ? 'سفر'
            : styleCard?.label || 'روزمره',
      icon: <Shirt className="w-3.5 h-3.5" />,
    });
    const env = ENVIRONMENT_OPTIONS.find((o) => o.value === value.environment);
    chips.push({
      key: 'env',
      label: env?.label || 'مکان',
      icon: <MapPin className="w-3.5 h-3.5" />,
    });
    const weather = WEATHER_OPTIONS.find((o) => o.value === value.weather);
    const WeatherIcon =
      value.weather === 'rainy' ? CloudRain : value.weather === 'cold' ? Snowflake : Sun;
    chips.push({
      key: 'weather',
      label: weather?.label || 'هوا',
      icon: <WeatherIcon className="w-3.5 h-3.5" />,
    });
    return chips;
  }, [value, extraId]);

  const selectActivity = (style: OutfitStyle) => {
    setExtraId(null);
    onChange(withStyle(value, style));
  };

  const selectExtra = (id: string) => {
    const extra = EXTRA_ACTIVITIES.find((e) => e.id === id);
    if (!extra) return;
    setExtraId(id);
    onChange(extra.apply(value));
  };

  const isActivityActive = (style: OutfitStyle) => !extraId && value.style === style;

  return (
    <div
      className={cn(
        'rounded-3xl bg-white dark:bg-card border border-border/40 shadow-soft p-4 sm:p-5 space-y-5',
        className
      )}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
          <Shirt className="w-5 h-5 text-amber-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-black text-foreground">شرایط / نوع فعالیت</h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            نوع فعالیت خود را برای پیشنهاد بهتر انتخاب کنید.
          </p>
        </div>
      </div>

      {/* Activity cards — 2 rows on mobile, 5 cols on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {ACTIVITY_CARDS.map((card) => {
          const active = isActivityActive(card.value);
          const Icon = card.icon;
          return (
            <button
              key={card.value}
              type="button"
              onClick={() => selectActivity(card.value)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-2 p-3 sm:p-4 min-h-[100px] rounded-2xl border-2 transition-all duration-300 touch-manipulation text-center',
                active
                  ? 'border-amber-400 bg-amber-50/80 dark:bg-amber-500/10 shadow-md scale-[1.02]'
                  : 'border-transparent bg-muted/40 hover:bg-muted/70 hover:border-border/50'
              )}
            >
              {active && (
                <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <span
                className={cn(
                  'w-11 h-11 rounded-2xl flex items-center justify-center',
                  active ? 'bg-white shadow-sm text-amber-600' : 'bg-white/80 text-sky-600 dark:bg-white/10'
                )}
              >
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-sm font-extrabold text-foreground">{card.label}</span>
              <span className="text-[10px] text-muted-foreground font-medium leading-snug px-1">
                {card.hint}
              </span>
            </button>
          );
        })}

        {EXTRA_ACTIVITIES.map((card) => {
          const active = extraId === card.id;
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => selectExtra(card.id)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-2 p-3 sm:p-4 min-h-[100px] rounded-2xl border-2 transition-all duration-300 touch-manipulation text-center',
                active
                  ? 'border-amber-400 bg-amber-50/80 dark:bg-amber-500/10 shadow-md scale-[1.02]'
                  : 'border-transparent bg-muted/40 hover:bg-muted/70 hover:border-border/50'
              )}
            >
              {active && (
                <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <span
                className={cn(
                  'w-11 h-11 rounded-2xl flex items-center justify-center',
                  active ? 'bg-white shadow-sm text-amber-600' : 'bg-white/80 text-sky-600 dark:bg-white/10'
                )}
              >
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-sm font-extrabold text-foreground">{card.label}</span>
              <span className="text-[10px] text-muted-foreground font-medium leading-snug px-1">
                {card.hint}
              </span>
            </button>
          );
        })}
      </div>

      {/* Place + weather — compact secondary row */}
      <div className="space-y-3 pt-1">
        <div>
          <p className="text-[11px] font-black text-muted-foreground mb-1.5">مکان</p>
          <div className="flex flex-wrap gap-1.5">
            {ENVIRONMENT_OPTIONS.map((opt) => {
              const active = value.environment === opt.value;
              const disabled = value.style === 'party' && opt.value === 'office' && !extraId;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onChange(coerceOutfitContext({ ...value, environment: opt.value as OutfitEnvironment }))
                  }
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-full text-xs font-extrabold border transition-all',
                    active
                      ? 'bg-foreground text-background border-transparent shadow-sm'
                      : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted',
                    disabled && 'opacity-30 pointer-events-none'
                  )}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-black text-muted-foreground mb-1.5">آب‌وهوا</p>
          <div className="flex flex-wrap gap-1.5">
            {WEATHER_OPTIONS.map((opt) => {
              const active = value.weather === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...value, weather: opt.value as OutfitWeather })}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-full text-xs font-extrabold border transition-all',
                    active
                      ? 'bg-foreground text-background border-transparent shadow-sm'
                      : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                  )}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selection summary — matches design mock */}
      <div className="pt-3 border-t border-border/40">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <p className="text-sm font-black text-foreground">انتخاب‌های شما</p>
            <p className="text-[11px] text-muted-foreground font-medium">
              با تکمیل این مرحله، بهترین ست برای شما ساخته می‌شود.
            </p>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={() => {
                setExtraId(null);
                onClear();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-extrabold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              پاک کردن
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectionChips.map((chip, i) => (
            <React.Fragment key={chip.key}>
              {i > 0 && <span className="text-muted-foreground/40 text-xs">|</span>}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs font-extrabold text-foreground">
                {chip.icon}
                {chip.label}
              </span>
            </React.Fragment>
          ))}
        </div>
        <p className="sr-only">{contextLabels(value)}</p>
      </div>
    </div>
  );
};
