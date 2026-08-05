import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      onClick={toggleTheme}
      variant="soft"
      size="icon"
      className="relative shrink-0 overflow-hidden group touch-target"
      aria-label={isDark ? 'فعال کردن حالت روشن' : 'فعال کردن حالت تاریک'}
      aria-pressed={isDark}
      title={isDark ? 'حالت روشن' : 'حالت تاریک'}
    >
      <div
        className={`absolute inset-0 transition-all duration-700 ease-out ${
          isDark
            ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900/20 to-slate-800/40'
            : 'bg-gradient-to-br from-amber-100/0 via-amber-50/0 to-amber-100/0 group-hover:from-amber-100/50 group-hover:via-amber-50/30 group-hover:to-amber-100/50'
        }`}
        aria-hidden="true"
      />
      <div className="relative transition-all duration-500" aria-hidden="true">
        {isDark ? (
          <Sun className="w-5 h-5 text-gold drop-shadow-[0_0_8px_hsl(42_85%_55%_/_0.6)] animate-pulse" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700 group-hover:rotate-12 transition-transform duration-500" />
        )}
      </div>
    </Button>
  );
};
