import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="transition-smooth"
      aria-label={theme === 'dark' ? 'فعال کردن حالت روشن' : 'فعال کردن حالت تاریک'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-gold" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </Button>
  );
};
