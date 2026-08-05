import React from 'react';
import { Shirt, Plus, Sparkles, Camera, Wand2, Heart, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddClick: () => void;
  onBulkAddClick?: () => void;
  clothingCount?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onAddClick,
  onBulkAddClick,
  clothingCount = 0,
}) => {
  const steps = [
    { n: 1, title: 'افزودن لباس', desc: 'حداقل ۲ لباس به کمد اضافه کنید', done: clothingCount >= 1 },
    { n: 2, title: 'انتخاب شرایط', desc: 'مناسبت، مکان و آب‌وهوا را مشخص کنید', done: clothingCount >= 2 },
    { n: 3, title: 'تولید و پرو', desc: 'ست بسازید و روی مانکن ببینید', done: false },
  ];

  return (
    <div className="relative py-12 md:py-20 px-4" role="status" aria-live="polite">
      <div
        className="absolute top-10 right-1/4 w-64 h-64 rounded-full opacity-40 animate-blob pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-1/4 w-56 h-56 rounded-full opacity-30 animate-blob animation-delay-2000 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--rose)) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-2xl mx-auto text-center">
        <div className="relative w-36 h-36 md:w-44 md:h-44 mx-auto mb-6 md:mb-8 animate-float" aria-hidden="true">
          <div className="absolute inset-0 rounded-full bg-gradient-gold opacity-20 blur-3xl animate-glow-pulse" />
          <div className="relative w-full h-full rounded-[2.25rem] bg-gradient-card hairline-border shadow-elevated flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-40" style={{
              backgroundImage: 'radial-gradient(circle at 20% 30%, hsl(var(--gold) / 0.25) 0%, transparent 50%), radial-gradient(circle at 80% 70%, hsl(var(--rose) / 0.2) 0%, transparent 50%)',
            }} />
            <div className="relative flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-button-gold">
                <Shirt className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-bold text-muted-foreground">کمد لباس</span>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-gold/10 rounded-full text-sm text-foreground mb-4 border border-gold/20 animate-fade-up">
          <Sparkles className="w-4 h-4 text-gold" aria-hidden="true" />
          <span className="font-semibold">
            {clothingCount === 0
              ? 'کمد لباس شما آماده شروع است'
              : `${clothingCount.toLocaleString('fa-IR')} لباس دارید — یکی دیگر اضافه کنید`}
          </span>
        </div>

        <h3 className="text-2xl md:text-3xl font-display font-bold mb-3 leading-tight animate-fade-up stagger-1">
          {clothingCount === 0 ? (
            <>
              کمد لباس شما <span className="text-gradient-gold">هنوز خالی</span> است
            </>
          ) : (
            <>
              یک قدم تا <span className="text-gradient-gold">پیشنهاد امروز</span>
            </>
          )}
        </h3>

        <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-sm md:text-base leading-relaxed animate-fade-up stagger-2">
          با افزودن لباس‌ها، هوش مصنوعی بهترین ست‌ها را برای مناسبت‌های مختلف می‌سازد.
        </p>

        {/* Progress steps */}
        <ol className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-8 animate-fade-up stagger-2" aria-label="مراحل شروع">
          {steps.map((s) => (
            <li
              key={s.n}
              className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-right border transition-colors ${
                s.done
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-muted/40 border-border/50'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  s.done ? 'bg-emerald-500 text-white' : 'bg-gold/15 text-gold'
                }`}
                aria-hidden="true"
              >
                {s.done ? '✓' : s.n}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold leading-tight">{s.title}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-col sm:flex-row gap-2 justify-center animate-fade-up stagger-3">
          <Button onClick={onAddClick} variant="gold" size="xl" className="group relative overflow-hidden font-extrabold">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" aria-hidden="true" />
            <Plus className="w-5 h-5 relative" strokeWidth={2.75} aria-hidden="true" />
            <span className="relative">
              {clothingCount === 0 ? 'افزودن اولین لباس' : 'افزودن لباس بعدی'}
            </span>
          </Button>
          {onBulkAddClick && (
            <Button onClick={onBulkAddClick} variant="soft" size="xl" className="font-bold">
              <Layers className="w-5 h-5" aria-hidden="true" />
              افزودن چندتایی
            </Button>
          )}
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up stagger-4">
          {[
            { icon: <Camera className="w-5 h-5 text-indigo-500" />, title: 'افزودن آسان', desc: 'عکس بگیرید یا آپلود کنید', color: 'from-indigo-400/20 to-purple-400/10' },
            { icon: <Wand2 className="w-5 h-5 text-rose-500" />, title: 'ست‌سازی هوشمند', desc: 'بهترین ست‌ها با هوش مصنوعی', color: 'from-rose-400/20 to-pink-400/10' },
            { icon: <Heart className="w-5 h-5 text-emerald-500" />, title: 'علاقه‌مندی‌ها', desc: 'ست‌های مورد علاقه‌تان را حفظ کنید', color: 'from-emerald-400/20 to-teal-400/10' },
          ].map((f) => (
            <div
              key={f.title}
              className={`group relative p-4 rounded-2xl bg-gradient-to-br ${f.color} border border-white/60 hover:border-gold/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-card text-right`}
            >
              <div className="w-11 h-11 rounded-2xl bg-white/80 flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-500 mx-auto sm:mx-0" aria-hidden="true">
                {f.icon}
              </div>
              <h4 className="font-bold text-sm mb-1">{f.title}</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
