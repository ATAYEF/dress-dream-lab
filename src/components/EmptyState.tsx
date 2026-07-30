import React from 'react';
import { Shirt, Plus, Sparkles, Camera, Wand2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddClick }) => {
  return (
    <div className="relative py-16 md:py-24 px-4">
      {/* Decorative blobs */}
      <div
        className="absolute top-10 right-1/4 w-64 h-64 rounded-full opacity-40 animate-blob pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-10 left-1/4 w-56 h-56 rounded-full opacity-30 animate-blob animation-delay-2000 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--rose)) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-2xl mx-auto text-center">
        {/* Illustration */}
        <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto mb-8 md:mb-10 animate-float">
          {/* Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-gold opacity-20 blur-3xl animate-glow-pulse" />

          {/* Main icon container */}
          <div className="relative w-full h-full rounded-[2.5rem] bg-gradient-card hairline-border shadow-elevated flex items-center justify-center overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-40" style={{
              backgroundImage: 'radial-gradient(circle at 20% 30%, hsl(var(--gold) / 0.25) 0%, transparent 50%), radial-gradient(circle at 80% 70%, hsl(var(--rose) / 0.2) 0%, transparent 50%)',
            }} />

            {/* Stack of icons */}
            <div className="relative w-24 h-28 md:w-28 md:h-32">
              {/* Back card */}
              <div className="absolute top-0 left-0 w-full h-full -rotate-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg opacity-60">
                <div className="absolute inset-2 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white drop-shadow" />
                </div>
              </div>

              {/* Middle card */}
              <div className="absolute top-2 left-2 w-full h-full rotate-6 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg opacity-80">
                <div className="absolute inset-2 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white drop-shadow" />
                </div>
              </div>

              {/* Front card - main */}
              <div className="absolute top-4 left-4 w-full h-full rounded-2xl bg-gradient-gold shadow-elevated animate-scale-in">
                <div className="absolute inset-2 rounded-xl bg-white/25 backdrop-blur-md flex flex-col items-center justify-center gap-1.5">
                  <Shirt className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-md" />
                  <span className="text-[10px] md:text-xs font-bold text-white/95 drop-shadow">کمد لباس</span>
                </div>

                {/* Plus badge */}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-card">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                    <Plus className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={3} />
                  </div>
                </div>

                {/* Sparkle */}
                <div className="absolute -top-2 -left-2 animate-pulse">
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-gold drop-shadow-md" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-gold/10 rounded-full text-sm text-foreground mb-4 backdrop-blur-sm border border-gold/20 animate-fade-up">
          <div className="relative">
            <Sparkles className="w-4 h-4 text-gold" />
          </div>
          <span className="font-semibold">کمد لباس شما آماده شروع است</span>
        </div>

        {/* Heading */}
        <h3 className="text-2xl md:text-4xl font-display font-bold mb-3 md:mb-4 leading-tight animate-fade-up stagger-1">
          کمد لباس شما <span className="text-gradient-gold">هنوز خالی</span> است
        </h3>

        {/* Subtitle */}
        <p className="text-muted-foreground mb-8 md:mb-10 max-w-lg mx-auto text-sm md:text-base leading-relaxed animate-fade-up stagger-2">
          اولین قدم را بردارید و لباس‌های خود را به کمد اضافه کنید.
          ما به کمک هوش مصنوعی بهترین ست‌های لباس را برای مناسبت‌های مختلف برای شما می‌سازیم. 💫
        </p>

        {/* CTA Button */}
        <div className="animate-fade-up stagger-3 inline-block">
          <Button onClick={onAddClick} variant="gold" size="xl" className="group relative overflow-hidden">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            <Plus className="w-5 h-5 md:w-6 md:h-6 relative" strokeWidth={2.75} />
            <span className="relative">افزودن اولین لباس</span>
          </Button>
        </div>

        {/* Feature hints */}
        <div className="mt-10 md:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 animate-fade-up stagger-4">
          {[
            { icon: <Camera className="w-5 h-5 text-indigo-500" />, title: 'افزودن آسان', desc: 'عکس بگیرید یا آپلود کنید', color: 'from-indigo-400/20 to-purple-400/10' },
            { icon: <Wand2 className="w-5 h-5 text-rose-500" />, title: 'ست‌سازی هوشمند', desc: 'بهترین ست‌ها با هوش مصنوعی', color: 'from-rose-400/20 to-pink-400/10' },
            { icon: <Heart className="w-5 h-5 text-emerald-500" />, title: 'علاقه‌مندی‌ها', desc: 'ست‌های مورد علاقه‌تان را حفظ کنید', color: 'from-emerald-400/20 to-teal-400/10' },
          ].map((f, i) => (
            <div
              key={i}
              className={`group relative p-4 md:p-5 rounded-2xl bg-gradient-to-br ${f.color} backdrop-blur-sm border border-white/60 hover:border-gold/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-card text-right`}
            >
              <div className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-500 mx-auto sm:mx-0">
                {f.icon}
              </div>
              <h4 className="font-bold text-sm mb-1">{f.title}</h4>
              <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
