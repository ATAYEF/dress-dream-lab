import React, { useState } from 'react';
import {
  Home,
  Shirt,
  Sparkles,
  Heart,
  Settings,
  Search,
  Bell,
  Crown,
  Menu,
  X,
  Plus,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export type AppNavId = 'home' | 'builder' | 'wardrobe' | 'outfits' | 'favorites' | 'settings';

export interface AppShellNavItem {
  id: AppNavId;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: number;
  disabled?: boolean;
}

interface AppShellProps {
  children: React.ReactNode;
  activeNav: AppNavId;
  onNavigate: (id: AppNavId) => void;
  userId?: string | null;
  profileImageUrl?: string | null;
  suggestionCount?: number;
  onAddClothing?: () => void;
  onLogin?: () => void;
  onLogout?: () => void;
  searchSlot?: React.ReactNode;
}

const NAV_ITEMS: AppShellNavItem[] = [
  { id: 'home', label: 'خانه', icon: Home },
  { id: 'wardrobe', label: 'کمد لباس من', icon: Shirt },
  { id: 'builder', label: 'پیشنهاد هوش مصنوعی', icon: Sparkles },
  { id: 'outfits', label: 'ست‌ها', icon: Heart },
  { id: 'favorites', label: 'علاقه‌مندی‌ها', icon: Heart },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeNav,
  onNavigate,
  userId,
  profileImageUrl,
  suggestionCount = 0,
  onAddClothing,
  onLogin,
  onLogout,
  searchSlot,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV_ITEMS.map((item) => {
    if (item.id === 'outfits') {
      return {
        ...item,
        badge: suggestionCount > 0 ? suggestionCount : undefined,
        disabled: suggestionCount === 0 && activeNav !== 'outfits',
      };
    }
    return item;
  });

  const NavButton = ({
    item,
    compact = false,
  }: {
    item: AppShellNavItem;
    compact?: boolean;
  }) => {
    const active = activeNav === item.id;
    const Icon = item.icon;
    return (
      <button
        type="button"
        disabled={item.disabled}
        onClick={() => {
          if (item.disabled) return;
          onNavigate(item.id);
          setMobileOpen(false);
        }}
        className={cn(
          'w-full flex items-center gap-3 rounded-xl text-sm font-bold transition-all touch-manipulation',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
          compact ? 'px-3 py-2.5' : 'px-3.5 py-3',
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-soft'
            : 'text-sidebar-foreground/80 hover:bg-muted/60 hover:text-foreground',
          item.disabled && 'opacity-40 cursor-not-allowed'
        )}
        aria-current={active ? 'page' : undefined}
      >
        <span
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
            active ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-muted-foreground'
          )}
        >
          <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.4 : 2} />
        </span>
        <span className="flex-1 text-right truncate">{item.label}</span>
        {item.badge != null && item.badge > 0 && (
          <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center tabular-nums">
            {item.badge > 99 ? '۹۹+' : item.badge.toLocaleString('fa-IR')}
          </span>
        )}
      </button>
    );
  };

  const SidebarBody = ({ className }: { className?: string }) => (
    <div className={cn('flex flex-col h-full', className)} dir="rtl">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-gold opacity-40 blur-md" aria-hidden />
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-button-gold">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-base font-display font-black tracking-tight text-foreground">
              DRESS DREAM
            </p>
            <p className="text-[10px] font-bold text-muted-foreground tracking-[0.12em]">LAB</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="منوی اصلی">
        {items.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
      </nav>

      {/* Footer CTA */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="rounded-2xl bg-gradient-gold-soft border border-border/60 p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-foreground">هوش مصنوعی استایلیست شما</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-relaxed">
                استایل‌های منحصربه‌فرد بر اساس کمد و موقعیت شما
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onNavigate('builder');
              setMobileOpen(false);
            }}
            className="mt-3 w-full h-9 rounded-full bg-gradient-gold text-white text-[11px] font-extrabold shadow-button-gold hover:opacity-95 transition-opacity"
          >
            شروع پیشنهاد
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed inset-y-0 right-0 z-40 w-[260px] flex-col bg-sidebar border-l border-sidebar-border"
        aria-label="سایدبار"
      >
        <SidebarBody />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-espresso/40 backdrop-blur-sm"
            aria-label="بستن منو"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 w-[min(300px,88vw)] bg-sidebar border-l border-sidebar-border shadow-elevated animate-fade-up">
            <div className="absolute top-3 left-3 z-10">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarBody />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pr-[260px] min-h-screen flex flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-50 safe-top">
          <div className="glass-strong border-b border-border/60">
            <div className="px-3 sm:px-4 md:px-6 h-14 md:h-16 flex items-center gap-2 md:gap-3">
              <button
                type="button"
                className="lg:hidden w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0"
                onClick={() => setMobileOpen(true)}
                aria-label="باز کردن منو"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Search */}
              <div className="flex-1 min-w-0 max-w-xl">
                {searchSlot ?? (
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="search"
                      placeholder="جستجو در لباس‌ها، اکسسوری‌ها و استایل‌ها…"
                      className="w-full h-10 md:h-11 rounded-full bg-muted/50 border border-border/70 pr-10 pl-4 text-sm font-medium placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-shadow"
                      disabled
                      title="به‌زودی"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                <button
                  type="button"
                  className="hidden sm:inline-flex items-center gap-1.5 h-9 md:h-10 px-3 rounded-full border border-gold/40 bg-gradient-gold-soft text-xs font-extrabold text-gold-dark hover:border-gold/60 transition-colors"
                  title="ارتقا به پریمیوم — به‌زودی"
                >
                  <Crown className="w-3.5 h-3.5 text-primary" />
                  <span className="hidden md:inline">ارتقا به پریمیوم</span>
                </button>

                <ThemeToggle />

                <button
                  type="button"
                  className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="اعلان‌ها"
                  title="به‌زودی"
                >
                  <Bell className="w-4 h-4" />
                </button>

                {onAddClothing && (
                  <Button
                    onClick={onAddClothing}
                    variant="gold"
                    size="default"
                    className="hidden sm:inline-flex group relative overflow-hidden h-9 md:h-10 px-3 md:px-4 font-extrabold rounded-full"
                    aria-label="افزودن لباس جدید"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.75} />
                    <span className="hidden md:inline">افزودن لباس</span>
                  </Button>
                )}

                {userId ? (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden ring-2 ring-gold/25 bg-muted flex items-center justify-center shrink-0"
                    aria-label="خروج از حساب"
                    title="خروج"
                  >
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                ) : (
                  <Button
                    onClick={onLogin}
                    variant="soft"
                    size="default"
                    className="h-9 md:h-10 px-2.5 md:px-3 rounded-full font-bold"
                    aria-label="ورود یا ثبت‌نام"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">ورود</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 w-full" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
