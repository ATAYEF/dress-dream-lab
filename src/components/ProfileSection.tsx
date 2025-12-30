import React, { useRef } from 'react';
import { User, Sparkles, Upload } from 'lucide-react';
import { UserProfile } from '@/types/wardrobe';

interface ProfileSectionProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  onProfileUpdate,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div className="relative bg-gradient-hero rounded-3xl p-6 md:p-8 overflow-hidden" dir="rtl">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex flex-col md:flex-row items-center gap-6">
        {/* Profile image */}
        <div className="relative">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {profile.imageUrl ? (
            <div className="relative group">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden ring-4 ring-gold/30 shadow-elevated">
                <img
                  src={profile.imageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => onProfileUpdate({ ...profile, imageUrl: null })}
                className="absolute bottom-0 right-0 p-2.5 bg-background rounded-full shadow-card opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-cream"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-cream/50 hover:bg-cream hover:border-gold transition-all duration-300 cursor-pointer"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">عکس شما</span>
            </button>
          )}
        </div>

        {/* Welcome text */}
        <div className="text-center md:text-right flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/20 rounded-full text-sm text-foreground mb-3">
            <Sparkles className="w-4 h-4 text-gold" />
            <span>استایلیست هوشمند شما</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold mb-2">
            به <span className="text-gradient-gold">کمد هوشمند</span> خوش آمدید
          </h1>
          <p className="text-muted-foreground max-w-md">
            لباس‌های خود را اضافه کنید و بگذارید هوش مصنوعی بهترین ست‌ها را برایتان پیشنهاد دهد
          </p>
        </div>
      </div>
    </div>
  );
};
