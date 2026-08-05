import React, { useMemo } from 'react';
import {
  OutfitContext,
  STYLE_OPTIONS,
  ENVIRONMENT_OPTIONS,
  WEATHER_OPTIONS,
  OutfitStyle,
  OutfitEnvironment,
  OutfitWeather,
  withStyle,
  coerceOutfitContext,
} from '@/lib/outfitContext';
import { cn } from '@/lib/utils';
import { Briefcase, CloudSun, Sparkles } from 'lucide-react';

interface OutfitContextPickerProps {
  value: OutfitContext;
  onChange: (next: OutfitContext) => void;
  className?: string;
}

function SegmentRow<T extends string>({
  label,
  icon,
  options,
  value,
  onChange,
  disabledValues,
}: {
  label: string;
  icon: React.ReactNode;
  options: { value: T; label: string; emoji: string; hint: string }[];
  value: T;
  onChange: (v: T) => void;
  disabledValues?: T[];
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value === opt.value;
          const disabled = disabledValues?.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              title={disabled ? 'با مناسبت انتخاب‌شده سازگار نیست' : opt.hint}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-extrabold transition-all border touch-manipulation',
                active
                  ? 'bg-gradient-gold text-white border-transparent shadow-md'
                  : 'bg-white/70 dark:bg-white/5 text-foreground/80 border-border/50 hover:border-gold/35 hover:bg-gold/5',
                disabled && 'opacity-35 cursor-not-allowed hover:bg-white/70 hover:border-border/50'
              )}
            >
              <span className="text-sm leading-none">{opt.emoji}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const OutfitContextPicker: React.FC<OutfitContextPickerProps> = ({
  value,
  onChange,
  className,
}) => {
  const disabledEnv = useMemo(() => {
    // مهمانی ≠ محل کار
    if (value.style === 'party') return ['office'] as OutfitEnvironment[];
    return [] as OutfitEnvironment[];
  }, [value.style]);

  return (
    <div
      className={cn(
        'rounded-2xl bg-white/70 dark:bg-white/5 border border-border/40 shadow-soft p-3 space-y-2.5',
        className
      )}
      dir="rtl"
    >
      <p className="text-[11px] text-muted-foreground font-medium leading-snug">
        مناسبت و مکان را هم‌خوان انتخاب کنید؛ آب‌وهوا لایه و کفش را تنظیم می‌کند.
      </p>

      <SegmentRow<OutfitStyle>
        label="مناسبت"
        icon={<Sparkles className="w-3.5 h-3.5 text-gold" />}
        options={STYLE_OPTIONS}
        value={value.style}
        onChange={(style) => onChange(withStyle(value, style))}
      />

      <SegmentRow<OutfitEnvironment>
        label="مکان"
        icon={<Briefcase className="w-3.5 h-3.5 text-indigo-500" />}
        options={ENVIRONMENT_OPTIONS}
        value={value.environment}
        disabledValues={disabledEnv}
        onChange={(environment) =>
          onChange(coerceOutfitContext({ ...value, environment }))
        }
      />

      <SegmentRow<OutfitWeather>
        label="آب‌وهوا"
        icon={<CloudSun className="w-3.5 h-3.5 text-sky-500" />}
        options={WEATHER_OPTIONS}
        value={value.weather}
        onChange={(weather) => onChange({ ...value, weather })}
      />
    </div>
  );
};
