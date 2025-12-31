import React, { useState } from 'react';
import { Sparkles, MessageSquare, Heart, Share2, Trash2 } from 'lucide-react';
import { OutfitSuggestion } from '@/types/wardrobe';
import { MannequinDisplay } from './MannequinDisplay';
import { cn } from '@/lib/utils';

interface OutfitSuggestionCardProps {
  suggestion: OutfitSuggestion;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onDelete?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const OutfitSuggestionCard: React.FC<OutfitSuggestionCardProps> = ({
  suggestion,
  onToggleFavorite,
  onDelete,
  className,
  style,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      setIsAnimating(true);
      onToggleFavorite(suggestion.id, !suggestion.isFavorite);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(suggestion.id);
    }
  };

  return (
    <div
      className={cn(
        'group relative bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300',
        className
      )}
      style={style}
    >
      {/* Main content area - Mannequin Display */}
      {suggestion.generatedImageUrl ? (
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={suggestion.generatedImageUrl}
            alt="Outfit suggestion"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : suggestion.items && suggestion.items.length > 0 ? (
        <div className="aspect-[3/4] bg-gradient-to-b from-cream to-cream-dark/30 p-4 flex items-center justify-center">
          <MannequinDisplay items={suggestion.items} />
        </div>
      ) : (
        <div className="aspect-[3/4] bg-cream flex items-center justify-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground" />
        </div>
      )}

      {/* Badges */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-full text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[hsl(42,85%,55%)]" />
          <span>پیشنهاد AI</span>
        </div>
        {suggestion.isFavorite && (
          <div className="p-1.5 bg-rose/20 rounded-full">
            <Heart className="w-3.5 h-3.5 text-rose fill-rose" />
          </div>
        )}
      </div>

      {/* Suggestion text */}
      {suggestion.suggestionText && (
        <div 
          className={cn(
            'p-4 bg-card cursor-pointer',
            !isExpanded && 'max-h-24 overflow-hidden'
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <p className={cn(
            'text-sm text-foreground leading-relaxed whitespace-pre-wrap',
            !isExpanded && 'line-clamp-3'
          )}>
            {suggestion.suggestionText}
          </p>
          {!isExpanded && suggestion.suggestionText.length > 150 && (
            <button className="text-xs text-gold mt-2 hover:underline">
              بیشتر بخوانید...
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={handleFavoriteClick}
          className={cn(
            'p-2.5 backdrop-blur-sm rounded-full transition-all duration-300',
            suggestion.isFavorite 
              ? 'bg-rose/20 text-rose' 
              : 'bg-background/90 hover:bg-rose/20 hover:text-rose',
            isAnimating && 'scale-125'
          )}
        >
          <Heart className={cn('w-4 h-4', suggestion.isFavorite && 'fill-current')} />
        </button>
        <button 
          onClick={handleDeleteClick}
          className="p-2.5 bg-background/90 backdrop-blur-sm rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors duration-300"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
