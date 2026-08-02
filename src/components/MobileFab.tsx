import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFabProps {
  onClick: () => void;
  className?: string;
}

export const MobileFab: React.FC<MobileFabProps> = ({ onClick, className }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="افزودن لباس"
      className={cn(
        'md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 safe-bottom',
        'flex items-center gap-2.5 px-6 py-3.5 rounded-full',
        'bg-gradient-to-r from-[hsl(42,85%,58%)] via-[hsl(38,85%,52%)] to-[hsl(35,78%,45%)]',
        'text-white font-extrabold text-sm shadow-lg shadow-[hsl(42,85%,45%)/0.4]',
        'hover:shadow-xl hover:brightness-105 active:scale-95',
        'transition-all duration-300',
        'animate-fade-up',
        className
      )}
    >
      <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
        <Plus className="w-5 h-5" strokeWidth={2.75} />
      </span>
      <span>افزودن لباس</span>
    </button>
  );
};
