import React, { useState } from 'react';
import { Sparkles, Heart, Share2, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { OutfitSuggestion, ClothingCategory } from '@/types/wardrobe';
import { MannequinDisplay } from './MannequinDisplay';
import { CATEGORY_CONFIG } from '@/lib/categoryConfig';
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

const CATEGORY_ORDER: ClothingCategory[] = [
  'tops',
  'outerwear',
  'dresses',
  'bottoms',
  'shoes',
  'accessories',
];

export const OutfitSuggestionCard: React.FC<OutfitSuggestionCardProps> = ({
  suggestion,
  onToggleFavorite,
  onFeedback,
  onDelete,
  className,
  style,
  profileImageUrl = null,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(
    suggestion.isFavorite ? 'liked' : null
  );

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      setIsAnimating(true);
      onToggleFavorite(suggestion.id, !suggestion.isFavorite);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleFeedback = (liked: boolean) => {
    setFeedback(liked ? 'liked' : 'disliked');
    onFeedback?.(liked);
    if (liked && onToggleFavorite && !suggestion.isFavorite) {
      onToggleFavorite(suggestion.id, true);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = suggestion.suggestionText || 'ست پیشنهادی من از استایلر';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ست پیشنهادی از استایلر', text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({ title: 'کپی شد', description: 'متن ست در کلیپ‌بورد کپی شد' });
      }
    } catch {
      /* ignore */
    }
  };

  const sortedItems = [...(suggestion.items || [])].sort((a, b) => {
    return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  });

  return (
    <div
      className={cn(
        'group relative rounded-2xl overflow-hidden shadow-card hairline-border bg-gradient-card',
        'transition-shadow duration-300 hover:shadow-elevated',
        feedback === 'liked' && 'ring-2 ring-emerald-400/60',
        feedback === 'disliked' && 'ring-2 ring-rose-300/50 opacity-90',
        className
      )}
      style={style}
      dir="rtl"
    >
      {/* Status strip */}
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-3 py-2 text-[11px] font-extrabold border-b border-border/40',
          feedback === 'liked' && 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
          feedback === 'disliked' && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
          !feedback && 'bg-muted/40 text-muted-foreground'
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          پیشنهاد ست
          {suggestion.context && (
            <span className="font-bold text-foreground/70">
              ·{' '}
              {suggestion.context.style === 'formal'
                ? 'رسمی'
                : suggestion.context.style === 'party'
                  ? 'مهمانی'
                  : 'روزمره'}
            </span>
          )}
        </span>
        <span className="inline-flex items-center gap-1">
          {feedback === 'liked' && (
            <>
              <ThumbsUp className="w-3.5 h-3.5" />
              پسندیدید
            </>
          )}
          {feedback === 'disliked' && (
            <>
              <ThumbsDown className="w-3.5 h-3.5" />
              نپسندیدید
            </>
          )}
          {!feedback && <span className="font-medium">هنوز نظر نداده‌اید</span>}
        </span>
      </div>

      {/* Main: details on the right (RTL), preview on the left */}
      <div className="flex flex-row items-stretch gap-0 min-h-0">
        {/* Items list — visible beside mannequin (right side in RTL) */}
        <aside className="w-[42%] sm:w-[38%] max-w-[160px] shrink-0 border-l border-border/40 bg-background/50 p-2 sm:p-2.5 overflow-y-auto max-h-[360px]">
          <p className="text-[10px] font-black text-muted-foreground mb-2 px-0.5">جزئیات ست</p>
          <ul className="space-y-1.5">
            {sortedItems.map((item) => {
              const cat = CATEGORY_CONFIG[item.category];
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-border/30"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-9 h-9 rounded-lg object-cover shrink-0 bg-muted"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold truncate leading-tight">{item.name}</p>
                    <p className="text-[9px] text-muted-foreground font-bold truncate">
                      {cat?.label || item.category}
                      {item.color ? ` · ${item.color}` : ''}
                    </p>
                  </div>
                </li>
              );
            })}
            {sortedItems.length === 0 && (
              <li className="text-[10px] text-muted-foreground text-center py-4">لباسی ثبت نشده</li>
            )}
          </ul>
        </aside>

        {/* Body preview — tight, minimal padding */}
        <div className="relative flex-1 min-w-0 bg-gradient-hero/40 p-1 sm:p-1.5">
          {suggestion.generatedImageUrl ? (
            <img
              src={suggestion.generatedImageUrl}
              alt="ست پیشنهادی"
              className="w-full h-full max-h-[340px] object-contain rounded-xl"
              loading="lazy"
            />
          ) : sortedItems.length > 0 ? (
            <MannequinDisplay
              items={sortedItems}
              profileImageUrl={profileImageUrl}
              compact
              className="!max-w-none w-full"
            />
          ) : (
            <div className="aspect-[3/4] flex items-center justify-center text-muted-foreground text-xs">
              بدون تصویر
            </div>
          )}
        </div>
      </div>

      {/* Explanation */}
      {suggestion.suggestionText && (
        <div className="px-3 py-2 border-t border-border/40">
          <p className="text-[11px] sm:text-xs leading-relaxed text-foreground/85 font-medium line-clamp-3">
            {suggestion.suggestionText}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-t border-border/40 bg-muted/20">
        {onFeedback && (
          <>
            <button
              type="button"
              onClick={() => handleFeedback(true)}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-1 min-h-[40px] rounded-xl text-[11px] font-extrabold transition-colors',
                feedback === 'liked'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
              )}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              پسندیدم
            </button>
            <button
              type="button"
              onClick={() => handleFeedback(false)}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-1 min-h-[40px] rounded-xl text-[11px] font-extrabold transition-colors',
                feedback === 'disliked'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
              )}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              نپسندیدم
            </button>
          </>
        )}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
            suggestion.isFavorite
              ? 'bg-rose text-white'
              : 'bg-background border border-border/50 text-muted-foreground hover:text-rose',
            isAnimating && 'animate-heart-pop'
          )}
          title="علاقه‌مندی"
        >
          <Heart className={cn('w-4 h-4', suggestion.isFavorite && 'fill-current')} />
        </button>
        <button
          type="button"
          onClick={handleShareClick}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-background border border-border/50 text-muted-foreground hover:text-foreground"
          title="اشتراک"
        >
          <Share2 className="w-4 h-4" />
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(suggestion.id)}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-background border border-border/50 text-muted-foreground hover:text-destructive"
            title="حذف"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
