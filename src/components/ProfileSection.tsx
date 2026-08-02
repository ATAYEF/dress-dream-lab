import React, { useRef, useMemo } from 'react';
import { User, Sparkles, Upload, Shirt, Palette, Heart, Wand2, Camera } from 'lucide-react';
import { UserProfile, ClothingItem, OutfitSuggestion } from '@/types/wardrobe';
import { cn } from '@/lib/utils';

interface ProfileSectionProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  clothes: ClothingItem[];
  suggestions: OutfitSuggestion[];
  favoriteSuggestions: OutfitSuggestion[];
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  delay: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  color,
  gradientFrom,
  gradientTo,
  delay,
}) => (
  <div
    className={cn(
      'stat-card group animate-fade-up relative overflow-hidden'
    )}
    style={{ animationDelay: delay }}
  >
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{
        background: `linear-gradient(135deg, ${gradientFrom}15 0%, ${gradientTo}10 100%)`,
      }}
    />
    <div className="relative flex items-center gap-4">
      <div
        className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3',
          color
        )}
        style={{
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
          boxShadow: `0 6px 20px -6px ${gradientFrom}66`,
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-display font-bold leading-none tracking-tight">
          {value.toLocaleString('fa-IR')}
        </div>
        <div className="text-xs text-muted-foreground mt-1 font-medium">
          {label}
        </div>
      </div>
    </div>
  </div>
);

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  onProfileUpdate,
  clothes,
  suggestions,
  favoriteSuggestions,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const uniqueColors = useMemo(() => {
    return new Set(clothes.map(c => c.color).filter(Boolean)).size;
  }, [clothes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onProfileUpdate({ ...profile, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 bg-gradient-hero rounded-[2rem]" />

      {/* Decorative blobs */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-40 animate-blob pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full opacity-30 animate-blob animation-delay-2000 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--rose)) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/2 right-1/3 w-56 h-56 rounded-full opacity-20 animate-blob animation-delay-4000 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(270, 40%, 70%) 0%, transparent 70%)' }}
      />

      <div className="relative p-4 md:p-6">
        {/* Main hero content */}
        <div className="flex flex-col lg:flex-row items-center gap-8 mb-8 md:mb-10">
          {/* Profile image */}
          <div className="relative shrink-0">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {profile.imageUrl ? (
              <div className="relative group">
                {/* Glow ring */}
                <div className="absolute -inset-2 rounded-full bg-gradient-gold opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-700" />

                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden ring-4 ring-white/80 shadow-elevated">
                  <img
                    src={profile.imageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Remove button */}
                <button
                  onClick={() => onProfileUpdate({ ...profile, imageUrl: null })}
                  className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:scale-110 transition-all duration-300 border border-border/60"
                  title="حذف عکس"
                >
                  <User className="w-4 h-4" />
                </button>

                {/* Change photo hover overlay */}
                <button
                  onClick={() => inputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-foreground/50 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-400 text-white"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs font-medium">تغییر عکس</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute -inset-1.5 rounded-full bg-gradient-gold opacity-25 blur-lg animate-glow-pulse" />
                <button
                  onClick={() => inputRef.current?.click()}
                  className="relative w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-dashed border-gold/50 flex flex-col items-center justify-center gap-2.5 bg-white/40 backdrop-blur-sm hover:bg-white/70 hover:border-gold hover:scale-[1.02] transition-all duration-500 cursor-pointer group shadow-soft"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-gold flex items-center justify-center shadow-button-gold group-hover:scale-110 transition-transform duration-500">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">عکس شما</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">برای پرو مجازی کلیک کنید</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Welcome text & CTA */}
          <div className="text-center lg:text-right flex-1 w-full">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur-sm rounded-full text-sm text-foreground mb-4 shadow-soft border border-white/80 animate-fade-up stagger-1">
              <div className="relative">
                <Sparkles className="w-4 h-4 text-gold" />
                <div className="absolute inset-0 w-4 h-4 text-gold animate-ping opacity-40" />
              </div>
              <span className="font-medium">استایلیست هوشمند شخصی شما</span>
            </div>

            {/* Heading */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-2 leading-[1.15] animate-fade-up stagger-2">
              به <span className="text-gradient-gold">کمد رویایی</span> خود خوش آمدید
            </h1>

            {/* Subtitle */}
            <p className="text-muted-foreground max-w-lg mx-auto lg:mx-0 text-sm leading-relaxed animate-fade-up stagger-3">
              لباس‌ها را مدیریت کنید و با هوش مصنوعی ست بسازید
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 relative z-10">
          <StatCard
            icon={<Shirt className="w-5 h-5 text-white drop-shadow-sm" />}
            value={clothes.length}
            label="لباس در کمد"
            color=""
            gradientFrom="hsl(42, 85%, 60%)"
            gradientTo="hsl(35, 78%, 48%)"
            delay="0.1s"
          />
          <StatCard
            icon={<Wand2 className="w-5 h-5 text-white drop-shadow-sm" />}
            value={suggestions.length}
            label="ست ساخته شده"
            color=""
            gradientFrom="hsl(270, 50%, 70%)"
            gradientTo="hsl(250, 45%, 58%)"
            delay="0.15s"
          />
          <StatCard
            icon={<Palette className="w-5 h-5 text-white drop-shadow-sm" />}
            value={uniqueColors}
            label="رنگ متنوع"
            color=""
            gradientFrom="hsl(350, 60%, 72%)"
            gradientTo="hsl(330, 50%, 60%)"
            delay="0.2s"
          />
          <StatCard
            icon={<Heart className="w-5 h-5 text-white drop-shadow-sm" />}
            value={favoriteSuggestions.length}
            label="ست مورد علاقه"
            color=""
            gradientFrom="hsl(150, 35%, 65%)"
            gradientTo="hsl(170, 30%, 50%)"
            delay="0.25s"
          />
        </div>

      </div>
    </div>
  );
};
