import React from 'react';
import { Sparkles, Heart, Share2 } from 'lucide-react';
import { OutfitSuggestion } from '@/types/wardrobe';
import { cn } from '@/lib/utils';

interface OutfitSuggestionCardProps {
  suggestion: OutfitSuggestion;
  className?: string;
  style?: React.CSSProperties;
}

export const OutfitSuggestionCard: React.FC<OutfitSuggestionCardProps> = ({
  suggestion,
  className,
  style,
}) => {
  return (
    <div
      className={cn(
        'group relative bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300',
        className
      )}
      style={style}
    >
      {/* Main image or grid */}
      {suggestion.generatedImageUrl ? (
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={suggestion.generatedImageUrl}
            alt="Outfit suggestion"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1 p-1">
          {suggestion.items.slice(0, 4).map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'aspect-square overflow-hidden rounded-lg',
                suggestion.items.length === 3 && index === 2 && 'col-span-2 aspect-[2/1]'
              )}
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* AI badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-full text-xs font-medium">
        <Sparkles className="w-3.5 h-3.5 text-[hsl(42,85%,55%)]" />
        <span>پیشنهاد AI</span>
      </div>

      {/* Actions */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button className="p-2.5 bg-background/90 backdrop-blur-sm rounded-full hover:bg-rose/20 hover:text-rose transition-colors duration-300">
          <Heart className="w-4 h-4" />
        </button>
        <button className="p-2.5 bg-background/90 backdrop-blur-sm rounded-full hover:bg-[hsl(42,85%,55%)]/20 transition-colors duration-300">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
