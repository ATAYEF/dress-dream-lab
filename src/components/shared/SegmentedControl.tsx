import React from 'react';
import { cn } from '@/lib/utils';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[] | SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
  activeClassName?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  size = 'sm',
  activeClassName = 'bg-foreground text-background shadow-sm',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn('flex items-center gap-2 min-w-0', className)}
      role="group"
      aria-label={label}
    >
      {label && (
        <span className="text-[10px] font-black text-muted-foreground w-12 shrink-0">
          {label}
        </span>
      )}
      <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
        <div className="inline-flex items-center gap-0.5 p-1 rounded-full bg-muted/70 border border-border/30">
          {options.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(opt.value)}
                className={cn(
                  'rounded-full font-extrabold whitespace-nowrap transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                  size === 'sm' ? 'px-3 py-1.5 text-[11px] min-h-[30px]' : 'px-4 py-2 text-xs min-h-[36px]',
                  active ? activeClassName : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
