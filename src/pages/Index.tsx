import React, { useState } from 'react';
import { Plus, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileSection } from '@/components/ProfileSection';
import { CategoryTabs } from '@/components/CategoryTabs';
import { ClothingCard } from '@/components/ClothingCard';
import { AddClothingModal } from '@/components/AddClothingModal';
import { EmptyState } from '@/components/EmptyState';
import { OutfitSuggestionCard } from '@/components/OutfitSuggestionCard';
import { ClothingItem, ClothingCategory, UserProfile, OutfitSuggestion } from '@/types/wardrobe';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [profile, setProfile] = useState<UserProfile>({ imageUrl: null });
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<ClothingCategory | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredClothes = activeCategory === 'all'
    ? clothes
    : clothes.filter((item) => item.category === activeCategory);

  const handleAddClothing = (item: Omit<ClothingItem, 'id' | 'createdAt'>) => {
    const newItem: ClothingItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setClothes((prev) => [newItem, ...prev]);
    toast({
      title: 'لباس اضافه شد',
      description: `${item.name} به کمد شما اضافه شد`,
    });
  };

  const handleRemoveClothing = (id: string) => {
    setClothes((prev) => prev.filter((item) => item.id !== id));
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: 'لباس حذف شد',
      description: 'لباس از کمد شما حذف شد',
    });
  };

  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItems((prev) => {
      const isSelected = prev.find((i) => i.id === item.id);
      if (isSelected) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handleGenerateSuggestion = () => {
    if (clothes.length < 2) {
      toast({
        title: 'لباس کافی نیست',
        description: 'برای ایجاد ست، حداقل ۲ لباس اضافه کنید',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const itemsForSuggestion = selectedItems.length >= 2 
        ? selectedItems 
        : clothes.slice(0, Math.min(4, clothes.length));

      const newSuggestion: OutfitSuggestion = {
        id: Date.now().toString(),
        items: itemsForSuggestion,
        createdAt: new Date(),
      };

      setSuggestions((prev) => [newSuggestion, ...prev]);
      setSelectedItems([]);
      setIsGenerating(false);
      
      toast({
        title: 'ست جدید ایجاد شد!',
        description: 'پیشنهاد هوش مصنوعی برای شما آماده است',
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-gold rounded-xl flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-semibold">استایلر</span>
          </div>
          
          <Button onClick={() => setIsModalOpen(true)} variant="gold" size="default">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">افزودن لباس</span>
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Profile Section */}
        <section className="animate-fade-up">
          <ProfileSection profile={profile} onProfileUpdate={setProfile} />
        </section>

        {/* Generate Button */}
        {clothes.length >= 2 && (
          <section className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-cream rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-right">
                <h3 className="font-display text-lg font-semibold mb-1">
                  {selectedItems.length >= 2 
                    ? `${selectedItems.length} لباس انتخاب شده`
                    : 'ست پیشنهادی بسازید'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedItems.length >= 2 
                    ? 'روی دکمه کلیک کنید تا ست ایجاد شود'
                    : 'لباس‌ها را انتخاب کنید یا اجازه دهید AI پیشنهاد دهد'}
                </p>
              </div>
              <Button 
                onClick={handleGenerateSuggestion} 
                variant="elegant" 
                size="lg"
                disabled={isGenerating}
                className="min-w-[160px]"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    <span>در حال ایجاد...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>ساخت ست</span>
                  </>
                )}
              </Button>
            </div>
          </section>
        )}

        {/* Suggestions Section */}
        {suggestions.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <h2 className="text-2xl font-display font-semibold mb-4">ست‌های پیشنهادی</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {suggestions.map((suggestion, index) => (
                <OutfitSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}
                />
              ))}
            </div>
          </section>
        )}

        {/* Wardrobe Section */}
        <section className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl font-display font-semibold">کمد لباس شما</h2>
            <span className="text-sm text-muted-foreground">
              {clothes.length} لباس
            </span>
          </div>

          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {filteredClothes.length === 0 ? (
            <EmptyState onAddClick={() => setIsModalOpen(true)} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
              {filteredClothes.map((item, index) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  onRemove={handleRemoveClothing}
                  onSelect={handleSelectItem}
                  isSelected={selectedItems.some((i) => i.id === item.id)}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Add Modal */}
      <AddClothingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddClothing}
      />
    </div>
  );
};

export default Index;
