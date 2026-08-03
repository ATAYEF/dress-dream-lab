import React, { useState } from 'react';
import { Sparkles, Heart, Share2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { OutfitSuggestion } from '@/types/wardrobe';
import { MannequinDisplay } from './MannequinDisplay';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface OutfitSuggestionCardProps {
  suggestion: OutfitSuggestion;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onFeedback?: (liked: boolean) => void;
  onDelete?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
  profileImageUrl?: string | null;
}

export const OutfitSuggestionCard: React.FC<OutfitSuggestionCardProps> = ({
  suggestion,
  onToggleFavorite,
  onFeedback,
  onDelete,
  className,
  style,
  profileImageUrl = null,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      setIsAnimating(true);
      onToggleFavorite(suggestion.id, !suggestion.isFavorite);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(suggestion.id);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = suggestion.suggestionText || 'ست پیشنهادی من از استایلر';
    const shareImage = suggestion.generatedImageUrl;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'ست پیشنهادی از استایلر ✨',
          text: shareText,
          url: shareImage && shareImage.startsWith('http') ? shareImage : undefined,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({ title: 'کپی شد', description: 'متن ست پیشنهادی در کلیپ‌بورد کپی شد 📋' });
      }
    } catch {
    }
  };

  const itemCount = suggestion.items?.length || 0;
  const longText = suggestion.suggestionText && suggestion.suggestionText.length > 140;

  return (
    <div
      className={cn(
        'group relative bg-gradient-card rounded-3xl overflow-hidden shadow-card transition-all duration-600',
        'hover:shadow-elevated hover:-translate-y-2 hover:scale-[1.015]',
        className
      )}
      style={style}
    >
      {/* Top frame accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-gold opacity-80" />

      {/* Image Area */}
      <div className="relative aspect-[3/4.2] overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)' }}
        />

        {/* Main content */}
        <div className="relative w-full h-full flex items-center justify-center p-3 md:p-4">
          {suggestion.generatedImageUrl ? (
            <img
              src={suggestion.generatedImageUrl}
              alt="ست پیشنهادی"
              className="w-full h-full object-cover rounded-2xl shadow-elevated transition-transform duration-700 group-hover:scale-[1.05]"
              loading="lazy"
            />
          ) : suggestion.items && suggestion.items.length > 0 ? (
            <MannequinDisplay
              items={suggestion.items}
              profileImageUrl={profileImageUrl}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <Sparkles className="w-10 h-10 mb-3 text-gold" />
              <span className="text-xs font-medium">تصویر ست</span>
            </div>
          )}
        </div>

        {/* Top badges row */}
        <div className="absolute top-3 right-3 left-3 flex items-start justify-between gap-2 z-10">
          {/* AI Badge + context */}
          <div className="flex flex-col gap-1.5 items-start max-w-[70%]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/85 backdrop-blur-md rounded-full shadow-md border border-white/70">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span className="text-[10px] md:text-xs font-extrabold text-foreground tracking-tight">پیشنهاد AI</span>
            </div>
            {suggestion.context && (
              <div className="flex flex-wrap gap-1">
                {suggestion.context.style === 'formal' && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/90 text-white text-[9px] font-bold shadow">رسمی</span>
                )}
                {suggestion.context.style === 'party' && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/90 text-white text-[9px] font-bold shadow">مهمانی</span>
                )}
                {suggestion.context.style === 'casual' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[9px] font-bold shadow">روزمره</span>
                )}
                {suggestion.context.environment === 'office' && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-700/90 text-white text-[9px] font-bold shadow">اداری</span>
                )}
                {suggestion.context.environment === 'gathering' && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/90 text-white text-[9px] font-bold shadow">دورهمی</span>
                )}
                {suggestion.context.weather === 'sunny' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[9px] font-bold shadow">آفتابی</span>
                )}
                {suggestion.context.weather === 'rainy' && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-600/90 text-white text-[9px] font-bold shadow">بارانی</span>
                )}
                {suggestion.context.weather === 'cold' && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-700/90 text-white text-[9px] font-bold shadow">سرد</span>
                )}
              </div>
            )}
          </div>

          {/* Items count */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-foreground/85 backdrop-blur-md rounded-full shadow-md">
            <span className="text-[10px] font-bold text-white">
              {itemCount.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] font-bold text-white/80">
              لباس
            </span>
          </div>
        </div>

        {/* Favorite badge (permanent if favorite) */}
        {suggestion.isFavorite && (
          <div className="absolute top-14 right-3 z-10">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-rose/95 backdrop-blur-md rounded-full shadow-lg animate-pulse">
              <Heart className="w-3 h-3 text-white fill-white" />
              <span className="text-[10px] font-bold text-white">علاقه‌مندی</span>
            </div>
          </div>
        )}

        {/* Action buttons (always visible now, beautifully styled) */}
        <div className="absolute bottom-3 right-3 flex gap-2 z-10">
          <button
            onClick={handleShareClick}
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-foreground/80 hover:text-gold hover:bg-white hover:scale-110 hover:shadow-lg transition-all duration-400 border border-white/60"
            title="اشتراک‌گذاری"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleDeleteClick}
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-foreground/80 hover:text-destructive hover:bg-destructive/95 hover:text-white hover:scale-110 hover:shadow-lg transition-all duration-400 border border-white/60"
            title="حذف ست"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Favorite button (left bottom) */}
        <button
          onClick={handleFavoriteClick}
          className={cn(
            'absolute bottom-3 left-3 w-11 h-11 rounded-full backdrop-blur-md shadow-lg flex items-center justify-center transition-all duration-500 z-10 border',
            suggestion.isFavorite
              ? 'bg-gradient-to-br from-rose to-pink-500 text-white border-rose-foreground/30 shadow-rose-500/25'
              : 'bg-white/90 text-foreground/80 hover:text-rose border-white/60 hover:bg-white hover:scale-110 hover:shadow-xl',
            isAnimating && 'animate-heart-pop'
          )}
          title={suggestion.isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-transform duration-300',
              suggestion.isFavorite && 'fill-white scale-110'
            )}
            strokeWidth={suggestion.isFavorite ? 0 : 2.25}
          />
        </button>

        {/* Hover shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 -skew-x-12 group-hover:translate-x-[200%] transition-all duration-[2000ms] ease-out pointer-events-none" />
      </div>

      {/* Text Content */}
      <div className="relative p-4 md:p-5">
        {/* Suggestion header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-gold/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold leading-tight">توضیح ست</h4>
              <p className="text-[10px] text-muted-foreground font-medium">
                {suggestion.createdAt && new Date(suggestion.createdAt).toLocaleDateString('fa-IR', {
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {longText && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="shrink-0 w-8 h-8 rounded-full bg-cream/70 hover:bg-gold/15 text-muted-foreground hover:text-gold flex items-center justify-center transition-all duration-300"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
              )}
            </button>
          )}
        </div>

        {/* Suggestion text */}
        {suggestion.suggestionText && (
          <div
            className={cn(
              'relative transition-all duration-500 ease-out overflow-hidden',
              !isExpanded && longText && 'max-h-20 mask-fade-before-end'
            )}
          >
            <p className="text-sm text-foreground/85 leading-[1.85] whitespace-pre-wrap font-medium">
              {suggestion.suggestionText}
            </p>
          </div>
        )}

        {/* Items preview (thumbnails) */}
        {suggestion.items && suggestion.items.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <div className="flex items-center gap-2 -space-x-2 rtl:space-x-reverse">
              {suggestion.items.slice(0, 5).map((item, idx) => (
                <div
                  key={item.id}
                  className="relative w-10 h-10 rounded-xl overflow-hidden ring-2 ring-card shadow-md transition-transform duration-300 hover:scale-110 hover:z-10"
                  style={{ zIndex: 10 - idx }}
                  title={item.name}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
              {suggestion.items.length > 5 && (
                <div
                  className="relative w-10 h-10 rounded-xl bg-foreground/85 flex items-center justify-center ring-2 ring-card shadow-md text-white font-extrabold text-[11px]"
                  style={{ zIndex: 5 }}
                >
                  +{(suggestion.items.length - 5).toLocaleString('fa-IR')}
                </div>
              )}
              <div className="mr-3 rtl:mr-3 text-[11px] font-bold text-muted-foreground">
                جزئیات ست
              </div>
            </div>
          </div>
        )}
      
      {onFeedback && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <span className="text-[10px] font-bold text-muted-foreground">این پیشنهاد؟</span>
          <button
            type="button"
            onClick={() => onFeedback(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
          >
            👍 پسندیدم
          </button>
          <button
            type="button"
            onClick={() => onFeedback(false)}
            className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            👎 نپسندیدم
          </button>
        </div>
      )}
</div>
    </div>
  );
};
