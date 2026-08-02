import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ScrollToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 420);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollUp}
      aria-label="بازگشت به بالا"
      className={cn(
        'fixed bottom-24 left-4 md:bottom-8 md:left-6 z-40',
        'flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl',
        'bg-gradient-card hairline-border shadow-elevated backdrop-blur-md',
        'text-foreground/80 hover:text-gold hover:border-gold/40 hover:shadow-glow',
        'transition-all duration-400 active:scale-95',
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      )}
    >
      <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
    </button>
  );
};
