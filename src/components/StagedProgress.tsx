import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressStage } from '@/hooks/useStagedProgress';

interface StagedProgressProps {
  stages: ProgressStage[];
  stageIndex: number;
  label: string;
  progress: number;
  /** compact = one line; full = steps + bar */
  variant?: 'compact' | 'full' | 'banner';
  className?: string;
}

export const StagedProgress: React.FC<StagedProgressProps> = ({
  stages,
  stageIndex,
  label,
  progress,
  variant = 'full',
  className,
}) => {
  if (variant === 'banner') {
    return (
      <div className={cn('flex flex-col gap-1.5 min-w-[200px]', className)}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin shrink-0" style={{ animationDuration: '2s' }} />
          <span className="truncate">{label}</span>
        </div>
        <div className="h-1 rounded-full bg-white/25 overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-all duration-700 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div className="flex gap-1 justify-center">
          {stages.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                'h-1 w-6 rounded-full transition-all duration-500',
                i <= stageIndex ? 'bg-white' : 'bg-white/30'
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-3 w-full max-w-[260px] px-4', className)}>
      <Loader2 className="w-8 h-8 animate-spin text-gold" />
      <p className="text-xs font-black text-foreground text-center leading-relaxed">{label}</p>
      <div className="w-full h-1.5 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-gold transition-all duration-700 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <ol className="w-full space-y-1.5">
        {stages.map((s, i) => {
          const done = i < stageIndex;
          const current = i === stageIndex;
          return (
            <li
              key={s.id}
              className={cn(
                'flex items-center gap-2 text-[10px] font-bold transition-opacity duration-300',
                current ? 'text-foreground opacity-100' : done ? 'text-emerald-600 opacity-90' : 'text-muted-foreground opacity-50'
              )}
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 border',
                  current && 'border-gold bg-gold/20 text-gold',
                  done && 'border-emerald-500 bg-emerald-500/15 text-emerald-600',
                  !current && !done && 'border-border'
                )}
              >
                {done ? '✓' : i + 1}
              </span>
              <span>{s.label.replace('…', '').replace('...', '')}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
