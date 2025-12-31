import React, { useState } from 'react';
import { Wand2, Trash2, GripVertical } from 'lucide-react';
import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { MannequinDisplay } from './MannequinDisplay';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface OutfitBuilderProps {
  clothes: ClothingItem[];
  onGenerateSuggestion: (items: ClothingItem[]) => void;
  isGenerating: boolean;
}

export const OutfitBuilder: React.FC<OutfitBuilderProps> = ({
  clothes,
  onGenerateSuggestion,
  isGenerating,
}) => {
  const [outfitItems, setOutfitItems] = useState<ClothingItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<ClothingItem | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent, item: ClothingItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (draggedItem) {
      // Replace item of same category or add new
      setOutfitItems(prev => {
        const existingIndex = prev.findIndex(i => i.category === draggedItem.category);
        if (existingIndex !== -1) {
          const newItems = [...prev];
          newItems[existingIndex] = draggedItem;
          return newItems;
        }
        return [...prev, draggedItem];
      });
    }
  };

  const removeFromOutfit = (itemId: string) => {
    setOutfitItems(prev => prev.filter(i => i.id !== itemId));
  };

  const clearOutfit = () => {
    setOutfitItems([]);
  };

  const handleGenerate = () => {
    if (outfitItems.length >= 2) {
      onGenerateSuggestion(outfitItems);
      setOutfitItems([]);
    }
  };

  // Group clothes by category for the palette
  const categories: { key: ClothingCategory; label: string }[] = [
    { key: 'tops', label: 'بالاتنه' },
    { key: 'bottoms', label: 'پایین‌تنه' },
    { key: 'dresses', label: 'پیراهن' },
    { key: 'outerwear', label: 'کت و ژاکت' },
    { key: 'shoes', label: 'کفش' },
    { key: 'accessories', label: 'اکسسوری' },
  ];

  return (
    <div className="bg-gradient-to-br from-cream to-cream-dark/30 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mannequin Drop Zone */}
        <div className="flex-shrink-0">
          <h3 className="text-lg font-display font-semibold mb-3 text-center">مانکن شما</h3>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative bg-background/50 rounded-2xl p-4 transition-all duration-300 min-h-[400px] flex items-center justify-center',
              isDragOver && 'ring-2 ring-gold ring-offset-2 bg-gold/5 scale-[1.02]',
              draggedItem && 'ring-2 ring-dashed ring-gold/50'
            )}
          >
            <MannequinDisplay items={outfitItems} className="w-full max-w-[220px]" />
            
            {/* Drop hint */}
            {clothes.length > 0 && outfitItems.length === 0 && !isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-muted-foreground text-sm bg-background/80 px-4 py-2 rounded-full">
                  لباس را اینجا بکشید
                </p>
              </div>
            )}

            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-gold/10 rounded-2xl pointer-events-none animate-pulse">
                <p className="text-gold font-medium">رها کنید!</p>
              </div>
            )}
          </div>

          {/* Outfit Actions */}
          <div className="flex gap-2 mt-4 justify-center">
            <Button
              onClick={handleGenerate}
              variant="elegant"
              size="default"
              disabled={outfitItems.length < 2 || isGenerating}
              className="flex-1 max-w-[200px]"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  <span>در حال ایجاد...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>ساخت ست</span>
                </>
              )}
            </Button>
            {outfitItems.length > 0 && (
              <Button onClick={clearOutfit} variant="ghost" size="icon">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Selected items list */}
          {outfitItems.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {outfitItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 bg-background/80 rounded-full px-3 py-1.5 text-xs"
                >
                  <img src={item.imageUrl} alt={item.name} className="w-5 h-5 rounded-full object-cover" />
                  <span className="truncate max-w-[80px]">{item.name}</span>
                  <button
                    onClick={() => removeFromOutfit(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clothing Palette */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-display font-semibold mb-3">لباس‌های شما</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {categories.map(({ key, label }) => {
              const categoryItems = clothes.filter(c => c.category === key);
              if (categoryItems.length === 0) return null;

              return (
                <div key={key}>
                  <h4 className="text-sm text-muted-foreground mb-2">{label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {categoryItems.map(item => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'relative group w-16 h-16 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200',
                          'hover:ring-2 hover:ring-gold hover:scale-105',
                          'shadow-sm hover:shadow-md',
                          draggedItem?.id === item.id && 'opacity-50 scale-95',
                          outfitItems.some(i => i.id === item.id) && 'ring-2 ring-gold'
                        )}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                          <GripVertical className="w-4 h-4 text-white opacity-0 group-hover:opacity-80 drop-shadow-lg" />
                        </div>
                        {outfitItems.some(i => i.id === item.id) && (
                          <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                            <span className="text-xs text-gold font-bold">✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {clothes.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">
                ابتدا لباس اضافه کنید
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
