import React from 'react';
import { User, Sparkles } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { UserProfile } from '@/types/wardrobe';

interface ProfileSectionProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  onProfileUpdate,
}) => {
  return (
    <div className="relative bg-gradient-hero rounded-3xl p-6 md:p-8 overflow-hidden" dir="rtl">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex flex-col md:flex-row items-center gap-6">
        {/* Profile image */}
        <div className="relative">
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
                className="absolute bottom-0 right-0 p-2.5 bg-background rounded-full shadow-card opacity-0 group-hover:opacity-100 transition-smooth hover:bg-cream"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <ImageUploader
                onImageUpload={(url) => onProfileUpdate({ ...profile, imageUrl: url })}
                label="عکس شما"
                className="w-28 h-28 md:w-36 md:h-36"
                aspectRatio="square"
              />
            </div>
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
