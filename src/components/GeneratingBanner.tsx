import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeneratingBannerProps {
  visible: boolean;
}

export const GeneratingBanner: React.FC<GeneratingBannerProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed top-[4.5rem] md:top-[5rem] left-1/2 -translate-x-1/2 z-40',
        'flex items-center gap-2.5 px-4 py-2.5 rounded-2xl',
        'bg-gradient-to-r from-[hsl(42,85%,58%)] to-[hsl(35,78%,45%)]',
        'text-white text-xs md:text-sm font-extrabold shadow-lg shadow-gold/30',
        'animate-fade-up pointer-events-none'
      )}
      role="status"
      aria-live="polite"
    >
      <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '2s' }} />
      <span>در حال ساخت ست هوشمند...</span>
      <span className="inline-flex gap-0.5 ml-1">
        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
    </div>
  );
};
