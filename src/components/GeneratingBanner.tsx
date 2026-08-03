import React from 'react';
import { cn } from '@/lib/utils';
import { useStagedProgress, OUTFIT_SUGGESTION_STAGES } from '@/hooks/useStagedProgress';
import { StagedProgress } from '@/components/StagedProgress';

interface GeneratingBannerProps {
  visible: boolean;
}

export const GeneratingBanner: React.FC<GeneratingBannerProps> = ({ visible }) => {
  const { stageIndex, stage, progress } = useStagedProgress(visible, OUTFIT_SUGGESTION_STAGES);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed top-[4.5rem] md:top-[5rem] left-1/2 -translate-x-1/2 z-40',
        'px-4 py-2.5 rounded-2xl',
        'bg-gradient-to-r from-[hsl(42,85%,58%)] to-[hsl(35,78%,45%)]',
        'text-white text-xs md:text-sm font-extrabold shadow-lg shadow-gold/30',
        'animate-fade-up pointer-events-none max-w-[min(92vw,320px)]'
      )}
      role="status"
      aria-live="polite"
    >
      <StagedProgress
        stages={OUTFIT_SUGGESTION_STAGES}
        stageIndex={stageIndex}
        label={stage.label}
        progress={progress}
        variant="banner"
      />
    </div>
  );
};
