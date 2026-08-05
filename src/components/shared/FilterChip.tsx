import React from 'react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  pressed: boolean;
  onPressedChange: (next: boolean) => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  activeClassName?: string;
  className?: string;
  'aria-label'?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  pressed,
  onPressedChange,
  children,
  icon,
  activeClassName = 'bg-white text-rose shadow-sm dark:bg-rose dark:text-white',
  className,
  'aria-label': ariaLabel,
}) => {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold transition-all min-h-[32px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
        pressed ? activeClassName : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
};

interface FilterChipGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const FilterChipGroup: React.FC<FilterChipGroupProps> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'inline-flex items-center gap-1 p-1 rounded-full bg-muted/70 border border-border/30',
      className
    )}
  >
    {children}
  </div>
);
