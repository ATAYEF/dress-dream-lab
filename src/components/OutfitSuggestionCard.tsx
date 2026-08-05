import React, { useState, useRef, useLayoutEffect } from 'react';
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
    suggestion.userFeedback ?? (suggestion.isFavorite ? 'liked' : null)
  );
  const [textExpanded, setTextExpanded] = useState(false);
  const [textOverflows, setTextOverflows] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

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

  const text = suggestion.suggestionText?.trim() || '';

  // Only show بیشتر/کمتر when text is actually truncated (2-line clamp)
  useLayoutEffect(() => {
    setTextExpanded(false);
  }, [text]);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || !text) {
      setTextOverflows(false);
      return;
    }
    if (textExpanded) {
      // keep overflows true so "کمتر" stays available
      return;
    }
    // With line-clamp-2 applied, compare full scroll height vs visible
    setTextOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text, textExpanded]);

  return (
    <div
      data-feedback={feedback ?? 'none'}
      className={cn(
        'group relative rounded-2xl overflow-hidden shadow-card bg-gradient-card',
        'transition-all duration-300 hover:shadow-elevated',
        feedback === 'liked' && 'ring-2 ring-emerald-500 border border-emerald-400/50',
        feedback === 'disliked' && 'ring-2 ring-red-500 border border-red-500 bg-red-50/40 dark:bg-red-950/20',
        feedback !== 'liked' && feedback !== 'disliked' && 'hairline-border',
        className
      )}
      style={style}
      dir="rtl"
    >
      {/* Status strip — states via data-feedback + Tailwind */}
      <div
        data-feedback={feedback ?? 'none'}
        className={cn(
          'flex items-center justify-between gap-2 px-3 py-2 text-[11px] font-extrabold border-b',
          feedback === 'liked' && 'bg-emerald-500/20 text-emerald-900 border-emerald-200 dark:text-emerald-200 dark:border-emerald-800',
          feedback === 'disliked' && 'bg-red-600 text-white border-red-700',
          !feedback && 'bg-muted/40 text-muted-foreground border-border/40'
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
              خوشم اومد
            </>
          )}
          {feedback === 'disliked' && (
            <>
              <ThumbsDown className="w-3.5 h-3.5" />
              حال نکردم
            </>
          )}
          {!feedback && <span className="font-medium">هنوز نظر نداده‌اید</span>}
        </span>
      </div>

      {/* Main: details (RTL right) + preview with zoom */}
      <div className="flex flex-row items-stretch gap-0 min-h-0">
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

      {/* Explanation — max 2 lines + بیشتر */}
      {text && (
        <div className="px-3 py-2 border-t border-border/40">
          <p
            ref={textRef}
            className={cn(
              'text-[11px] sm:text-xs leading-relaxed text-foreground/85 font-medium',
              !textExpanded && 'line-clamp-2'
            )}
          >
            {text}
          </p>
          {textOverflows && (
            <button
              type="button"
              onClick={() => setTextExpanded((v) => !v)}
              className="mt-1 text-[11px] font-extrabold text-gold hover:underline"
            >
              {textExpanded ? 'کمتر' : 'بیشتر'}
            </button>
          )}
        </div>
      )}

      {/* Actions — dislike stays full color when selected */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-t border-border/40 bg-muted/20">
        {onFeedback && (
          <>
            <button
              type="button"
              aria-pressed={feedback === 'liked'}
              data-state={feedback === 'liked' ? 'on' : 'off'}
              onClick={() => handleFeedback(true)}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl text-[12px] font-extrabold transition-colors',
                feedback === 'liked'
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50 hover:bg-emerald-600'
                  : 'bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/25'
              )}
            >
              <ThumbsUp className="w-4 h-4 shrink-0" />
              خوشم اومد
            </button>
            <button
              type="button"
              aria-pressed={feedback === 'disliked'}
              data-state={feedback === 'disliked' ? 'on' : 'off'}
              onClick={() => handleFeedback(false)}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl text-[12px] font-extrabold transition-colors',
                /* Exclusive classes — avoid data-[state] fighting base bg-* in compiled CSS */
                feedback === 'disliked'
                  ? 'bg-red-600 text-white shadow-md ring-2 ring-red-400/60 hover:bg-red-600'
                  : 'bg-red-500/15 text-red-800 hover:bg-red-500/25'
              )}
            >
              <ThumbsDown className="w-4 h-4 shrink-0" />
              حال نکردم
            </button>
          </>
        )}
        <button
          type="button"
          aria-pressed={Boolean(suggestion.isFavorite)}
          data-state={suggestion.isFavorite ? 'on' : 'off'}
          onClick={handleFavoriteClick}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors group/fav',
            'bg-background border border-border/50 text-muted-foreground hover:text-rose',
            'data-[state=on]:bg-rose data-[state=on]:text-white data-[state=on]:border-transparent',
            isAnimating && 'animate-heart-pop'
          )}
          title="علاقه‌مندی"
        >
          <Heart className="w-4 h-4 group-data-[state=on]/fav:fill-current" />
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
