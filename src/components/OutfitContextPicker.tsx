import React from 'react';
import {
  OutfitContext,
  STYLE_OPTIONS,
  ENVIRONMENT_OPTIONS,
  WEATHER_OPTIONS,
  OutfitStyle,
  OutfitEnvironment,
  OutfitWeather,
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
}: {
  label: string;
  icon: React.ReactNode;
  options: { value: T; label: string; emoji: string; hint: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] md:text-xs font-extrabold text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="grid grid-cols-3 gap-1.5 md:flex md:flex-wrap md:gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.hint}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-2 min-h-[40px] rounded-xl text-xs md:text-sm font-extrabold transition-all duration-300 border touch-manipulation',
                active
                  ? 'bg-gradient-gold text-white border-transparent shadow-md scale-[1.02]'
                  : 'bg-white/60 dark:bg-white/5 text-foreground/75 border-border/50 hover:border-gold/35 hover:bg-gold/5'
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
  return (
    <div
      className={cn(
        'rounded-2xl md:rounded-3xl bg-white/55 dark:bg-white/5 backdrop-blur-md border border-white/70 hairline-border shadow-soft p-3 md:p-5 space-y-3 md:space-y-4',
        className
      )}
      dir="rtl"
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-xl bg-gradient-gold/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-gold" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold">شرایط پیشنهاد ست</h3>
          <p className="text-[11px] text-muted-foreground font-medium">
            نوع لباس، محیط و آب‌وهوا را انتخاب کنید تا از کمد شما ست مناسب پیشنهاد شود
          </p>
        </div>
      </div>

      <SegmentRow<OutfitStyle>
        label="نوع لباس / مناسبت"
        icon={<Sparkles className="w-3.5 h-3.5 text-gold" />}
        options={STYLE_OPTIONS}
        value={value.style}
        onChange={(style) => onChange({ ...value, style })}
      />

      <SegmentRow<OutfitEnvironment>
        label="محیط"
        icon={<Briefcase className="w-3.5 h-3.5 text-indigo-500" />}
        options={ENVIRONMENT_OPTIONS}
        value={value.environment}
        onChange={(environment) => onChange({ ...value, environment })}
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
