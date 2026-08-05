import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFabProps {
  onClick: () => void;
  className?: string;
  /** add = افزودن لباس | generate = تولید ست */
  mode?: 'add' | 'generate';
  disabled?: boolean;
  label?: string;
}

export const MobileFab: React.FC<MobileFabProps> = ({
  onClick,
  className,
  mode = 'add',
  disabled = false,
  label,
}) => {
  const isGenerate = mode === 'generate';
  const resolvedLabel = label || (isGenerate ? 'تولید ست' : 'افزودن لباس');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={resolvedLabel}
      aria-disabled={disabled}
      className={cn(
        'md:hidden fixed z-40 safe-bottom touch-manipulation touch-target',
        'flex items-center gap-2 px-5 py-3.5 rounded-full min-h-[48px]',
        'text-white font-extrabold text-sm',
        'active:scale-95 transition-all duration-300 animate-fade-up',
        'disabled:opacity-50 disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gold',
        isGenerate
          ? 'bottom-4 right-4 left-auto translate-x-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 shadow-lg shadow-fuchsia-500/30'
          : 'bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[hsl(42,85%,58%)] via-[hsl(38,85%,52%)] to-[hsl(35,78%,45%)] shadow-lg shadow-[hsl(42,85%,45%)/0.4]',
        className
      )}
    >
      <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/20" aria-hidden="true">
        {isGenerate ? (
          <Sparkles className="w-4.5 h-4.5" strokeWidth={2.5} />
        ) : (
          <Plus className="w-5 h-5" strokeWidth={2.75} />
        )}
      </span>
      <span>{resolvedLabel}</span>
    </button>
  );
};
