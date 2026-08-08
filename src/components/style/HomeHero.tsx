import React, { memo } from 'react';
import {
  Sparkles,
  Shirt,
  Wand2,
  Heart,
  ArrowLeft,
  Plus,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import heroFashion from '@/assets/hero-fashion.jpg';

interface HomeHeroProps {
  clothesCount: number;
  suggestionCount: number;
  favoriteCount?: number;
  userName?: string | null;
  onAddClothing: () => void;
  onBulkAdd?: () => void;
  onOpenBuilder: () => void;
  onOpenWardrobe: () => void;
  onOpenStyles: () => void;
  className?: string;
}

function HomeHeroInner({
  clothesCount,
  suggestionCount,
  favoriteCount = 0,
  userName,
  onAddClothing,
  onBulkAdd,
  onOpenBuilder,
  onOpenWardrobe,
  onOpenStyles,
  className,
}: HomeHeroProps) {
  const hasWardrobe = clothesCount >= 2;
  const greeting = userName?.trim() ? `سلام ${userName}` : 'به Dress Dream Lab خوش آمدید';

  return (
    <section
      className={cn('space-y-5 md:space-y-6 animate-fade-up', className)}
      dir="rtl"
      aria-labelledby="home-hero-title"
    >
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2rem] border border-border/60 shadow-card min-h-[320px] md:min-h-[380px]">
        {/* Background layers */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#1a1510] via-[#2a2118] to-[#3d2e1a]"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 70% 40%, hsl(40 100% 48% / 0.35), transparent 55%), radial-gradient(ellipse 50% 40% at 20% 80%, hsl(350 40% 50% / 0.2), transparent 50%)',
          }}
          aria-hidden
        />
        {/* Soft grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(0 0% 100% / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.15) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden
        />
        {/* Decorative orbs */}
        <div
          className="pointer-events-none absolute -top-16 -left-16 w-56 h-56 rounded-full bg-primary/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-rose/20 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 p-6 sm:p-8 md:p-10 lg:p-12 items-center">
          {/* Copy */}
          <div className="text-right space-y-4 md:space-y-5 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-extrabold text-amber-200/95 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              هوش مصنوعی استایلیست شخصی شما
            </span>

            <div className="space-y-2">
              <p className="text-sm font-bold text-white/60">{greeting}</p>
              <h1
                id="home-hero-title"
                className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-[1.25]"
              >
                کمد دیجیتال خود را بسازید،
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-200 via-primary to-amber-400">
                  استایل هوشمند بپوشید
                </span>
              </h1>
              <p className="text-sm md:text-[15px] text-white/65 font-medium leading-relaxed max-w-md">
                لباس‌هایتان را آپلود کنید؛ بر اساس موقعیت، آب‌وهوا و سلیقه، ست‌های هماهنگ
                پیشنهاد می‌شود و روی مانکن پیش‌نمایش می‌گیرید.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {hasWardrobe ? (
                <>
                  <Button
                    type="button"
                    variant="gold"
                    size="lg"
                    onClick={onOpenBuilder}
                    className="rounded-full font-extrabold h-12 px-5 shadow-button-gold"
                  >
                    <Wand2 className="w-4 h-4" />
                    شروع اتاق پرو
                    <ArrowLeft className="w-4 h-4 opacity-80" />
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    onClick={onOpenStyles}
                    className="rounded-full font-extrabold h-12 px-5 bg-white/10 text-white border border-white/20 hover:bg-white/15"
                  >
                    <Heart className="w-4 h-4" />
                    مشاهده استایل‌ها
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="gold"
                    size="lg"
                    onClick={onAddClothing}
                    className="rounded-full font-extrabold h-12 px-5 shadow-button-gold"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن اولین لباس
                  </Button>
                  {onBulkAdd && (
                    <Button
                      type="button"
                      size="lg"
                      onClick={onBulkAdd}
                      className="rounded-full font-extrabold h-12 px-5 bg-white/10 text-white border border-white/20 hover:bg-white/15"
                    >
                      <Layers className="w-4 h-4" />
                      افزودن چندتایی
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { label: 'لباس در کمد', value: clothesCount },
                { label: 'ست ساخته‌شده', value: suggestionCount },
                { label: 'علاقه‌مندی', value: favoriteCount },
              ].map((s) => (
                <div
                  key={s.label}
                  className="px-3.5 py-2 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm min-w-[96px]"
                >
                  <p className="text-lg font-black text-white tabular-nums leading-none">
                    {s.value.toLocaleString('fa-IR')}
                  </p>
                  <p className="text-[10px] font-bold text-white/50 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visual panel — editorial fashion photo */}
          <div className="relative hidden sm:block">
            <div className="relative mx-auto max-w-[340px] aspect-[3/4] rounded-[1.5rem] overflow-hidden border border-white/20 shadow-elevated ring-1 ring-white/10">
              <img
                src={heroFashion}
                alt="استایل مد و فشن"
                className="absolute inset-0 w-full h-full object-cover object-center scale-105"
                width={680}
                height={900}
                decoding="async"
                fetchPriority="high"
              />
              {/* Gradient overlay for depth */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
                aria-hidden
              />
              <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-extrabold text-white mb-2">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  اتاق پرو مجازی
                </span>
                <p className="text-white font-black text-sm leading-snug drop-shadow-md">
                  پیش‌نمایش ست روی مانکن
                </p>
                <p className="text-white/70 text-[11px] font-medium mt-0.5">
                  با هوش مصنوعی و کمد شما
                </p>
              </div>
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-primary/60 rounded-tr-lg" aria-hidden />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-primary/40 rounded-bl-lg" aria-hidden />
            </div>
            {/* Soft glow behind frame */}
            <div
              className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-primary/20 blur-2xl opacity-60"
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {[
          {
            icon: Shirt,
            title: 'کمد دیجیتال',
            desc: 'لباس‌ها را دسته‌بندی، جستجو و ویرایش کنید',
            action: onOpenWardrobe,
            cta: 'رفتن به کمد',
          },
          {
            icon: Wand2,
            title: 'ست‌ساز هوشمند',
            desc: 'با شرایط موقعیت و آب‌وهوا ست بسازید و روی مانکن ببینید',
            action: onOpenBuilder,
            cta: 'اتاق پرو',
          },
          {
            icon: Heart,
            title: 'استایل‌های شما',
            desc: 'پیشنهادهای ذخیره‌شده و علاقه‌مندی‌ها را مرور کنید',
            action: onOpenStyles,
            cta: 'مشاهده استایل‌ها',
          },
        ].map((f) => (
          <button
            key={f.title}
            type="button"
            onClick={f.action}
            className="group text-right rounded-2xl border border-border/70 bg-card p-4 md:p-5 shadow-soft hover:shadow-card hover:border-gold/35 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
              <f.icon className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <h3 className="text-sm font-extrabold text-foreground mb-1">{f.title}</h3>
            <p className="text-[12px] text-muted-foreground font-medium leading-relaxed mb-3">
              {f.desc}
            </p>
            <span className="text-[11px] font-extrabold text-primary inline-flex items-center gap-1">
              {f.cta}
              <ArrowLeft className="w-3.5 h-3.5 opacity-70" />
            </span>
          </button>
        ))}
      </div>

      {/* Steps */}
      {!hasWardrobe && (
        <div className="rounded-2xl border border-border/60 bg-gradient-card p-5 md:p-6 shadow-soft">
          <h2 className="text-base font-black mb-4">۳ قدم تا اولین استایل</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {[
              { n: '۱', t: 'آپلود لباس', d: 'حداقل ۲ لباس به کمد اضافه کنید' },
              { n: '۲', t: 'انتخاب شرایط', d: 'موقعیت، مکان و آب‌وهوا را مشخص کنید' },
              { n: '۳', t: 'تولید و پرو', d: 'ست بسازید و روی مانکن ببینید' },
            ].map((step) => (
              <li
                key={step.n}
                className="flex sm:flex-col items-start gap-3 sm:gap-2 p-3 rounded-xl bg-background/80 border border-border/40"
              >
                <span className="w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-black flex items-center justify-center shrink-0">
                  {step.n}
                </span>
                <div>
                  <p className="text-sm font-extrabold">{step.t}</p>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

export const HomeHero = memo(HomeHeroInner);
