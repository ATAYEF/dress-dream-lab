import React, { useMemo, useState } from 'react';
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
  Users,
  X,
  CloudSun,
} from 'lucide-react';

interface OutfitContextPickerProps {
  value: OutfitContext;
  onChange: (next: OutfitContext) => void;
  className?: string;
  onClear?: () => void;
}

type TabId = 'activity' | 'place' | 'weather';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'activity', label: 'نوع فعالیت', icon: Shirt },
  { id: 'place', label: 'مکان', icon: MapPin },
  { id: 'weather', label: 'آب‌وهوا', icon: CloudSun },
];

const ACTIVITY_CARDS: {
  value: OutfitStyle;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'casual', label: 'روزمره', hint: 'استایل راحت و روزانه', icon: Briefcase },
  { value: 'formal', label: 'رسمی', hint: 'مناسب محل کار و جلسات', icon: Building2 },
  { value: 'party', label: 'مهمانی', hint: 'مجلس و دورهمی‌ها', icon: PartyPopper },
];

const EXTRA_ACTIVITIES: {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  apply: (ctx: OutfitContext) => OutfitContext;
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
  },
];

const PLACE_CARDS: {
  value: OutfitEnvironment;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: 'office',
    label: 'محل کار',
    hint: 'اداره، جلسات و محیط رسمی',
    icon: Building2,
  },
  {
    value: 'gathering',
    label: 'دورهمی / مراسم',
    hint: 'جمع دوستانه یا مناسبت اجتماعی',
    icon: Users,
  },
];

const WEATHER_CARDS: {
  value: OutfitWeather;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'sunny', label: 'آفتابی', hint: 'هوای گرم و روشن', icon: Sun },
  { value: 'rainy', label: 'بارانی', hint: 'باران و رطوبت', icon: CloudRain },
  { value: 'cold', label: 'سرد', hint: 'هوای خنک یا زمستانی', icon: Snowflake },
];

function SelectionCard({
  active,
  label,
  hint,
  icon: Icon,
  onClick,
  disabled,
}: {
  active: boolean;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2 p-3 sm:p-4 min-h-[104px] rounded-2xl border-2 transition-all duration-300 touch-manipulation text-center',
        active
          ? 'border-amber-400 bg-amber-50/80 dark:bg-amber-500/10 shadow-md scale-[1.02]'
          : 'border-transparent bg-muted/40 hover:bg-muted/70 hover:border-border/50',
        disabled && 'opacity-35 pointer-events-none'
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
      <span className="text-sm font-extrabold text-foreground">{label}</span>
      <span className="text-[10px] text-muted-foreground font-medium leading-snug px-1">{hint}</span>
    </button>
  );
}

export const OutfitContextPicker: React.FC<OutfitContextPickerProps> = ({
  value,
  onChange,
  className,
  onClear,
}) => {
  const [tab, setTab] = useState<TabId>('activity');
  const [extraId, setExtraId] = useState<string | null>(null);

  const selectionChips = useMemo(() => {
    const styleLabel =
      extraId === 'sport'
        ? 'ورزشی'
        : extraId === 'travel'
          ? 'سفر'
          : ACTIVITY_CARDS.find((c) => c.value === value.style)?.label || 'روزمره';
    const envLabel = PLACE_CARDS.find((c) => c.value === value.environment)?.label || 'مکان';
    const weatherLabel = WEATHER_CARDS.find((c) => c.value === value.weather)?.label || 'هوا';
    return [
      { key: 'style', label: styleLabel, icon: <Shirt className="w-3.5 h-3.5" /> },
      { key: 'env', label: envLabel, icon: <MapPin className="w-3.5 h-3.5" /> },
      { key: 'weather', label: weatherLabel, icon: <CloudSun className="w-3.5 h-3.5" /> },
    ];
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

  return (
    <div
      className={cn(
        'rounded-3xl bg-white dark:bg-card border border-border/40 shadow-soft p-4 sm:p-5 space-y-4',
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
            نوع فعالیت، مکان و آب‌وهوا را برای پیشنهاد بهتر انتخاب کنید.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-2xl bg-muted/50"
        role="tablist"
        aria-label="بخش‌های شرایط"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-extrabold transition-all',
                active
                  ? 'bg-white dark:bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <div role="tabpanel">
        {tab === 'activity' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {ACTIVITY_CARDS.map((card) => (
              <SelectionCard
                key={card.value}
                active={!extraId && value.style === card.value}
                label={card.label}
                hint={card.hint}
                icon={card.icon}
                onClick={() => selectActivity(card.value)}
              />
            ))}
            {EXTRA_ACTIVITIES.map((card) => (
              <SelectionCard
                key={card.id}
                active={extraId === card.id}
                label={card.label}
                hint={card.hint}
                icon={card.icon}
                onClick={() => selectExtra(card.id)}
              />
            ))}
          </div>
        )}

        {tab === 'place' && (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 max-w-lg mx-auto">
            {PLACE_CARDS.map((card) => {
              const disabled = value.style === 'party' && card.value === 'office' && !extraId;
              return (
                <SelectionCard
                  key={card.value}
                  active={value.environment === card.value}
                  label={card.label}
                  hint={card.hint}
                  icon={card.icon}
                  disabled={disabled}
                  onClick={() =>
                    onChange(
                      coerceOutfitContext({
                        ...value,
                        environment: card.value,
                      })
                    )
                  }
                />
              );
            })}
          </div>
        )}

        {tab === 'weather' && (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {WEATHER_CARDS.map((card) => (
              <SelectionCard
                key={card.value}
                active={value.weather === card.value}
                label={card.label}
                hint={card.hint}
                icon={card.icon}
                onClick={() => onChange({ ...value, weather: card.value })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selection summary */}
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
                setTab('activity');
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
              <button
                type="button"
                onClick={() =>
                  setTab(chip.key === 'style' ? 'activity' : chip.key === 'env' ? 'place' : 'weather')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs font-extrabold text-foreground hover:bg-muted transition-colors"
              >
                {chip.icon}
                {chip.label}
              </button>
            </React.Fragment>
          ))}
        </div>
        <p className="sr-only">{contextLabels(value)}</p>
      </div>
    </div>
  );
};
