import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, Wand2, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileSection } from '@/components/ProfileSection';
import { CategoryTabs } from '@/components/CategoryTabs';
import { ClothingCard } from '@/components/ClothingCard';
import { AddClothingModal } from '@/components/AddClothingModal';
import { EmptyState } from '@/components/EmptyState';
import { OutfitSuggestionCard } from '@/components/OutfitSuggestionCard';
import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { useWardrobe } from '@/hooks/useWardrobe';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const {
    profile,
    clothes,
    suggestions,
    isLoading,
    isGenerating,
    userId,
    addClothing,
    removeClothing,
    generateSuggestion,
    updateProfile,
  } = useWardrobe();

  const [activeCategory, setActiveCategory] = useState<ClothingCategory | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);

  const filteredClothes = activeCategory === 'all'
    ? clothes
    : clothes.filter((item) => item.category === activeCategory);

  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItems((prev) => {
      const isSelected = prev.find((i) => i.id === item.id);
      if (isSelected) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handleGenerateSuggestion = async () => {
    await generateSuggestion(selectedItems);
    setSelectedItems([]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'خروج موفق',
      description: 'با موفقیت خارج شدید',
    });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-gold rounded-xl flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-semibold">استایلر</span>
          </div>
          
          <div className="flex items-center gap-3">
            {userId ? (
              <>
                <Button onClick={() => setIsModalOpen(true)} variant="gold" size="default">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">افزودن لباس</span>
                </Button>
                <Button onClick={handleLogout} variant="ghost" size="icon">
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')} variant="gold" size="default">
                <LogIn className="w-4 h-4" />
                <span>ورود / ثبت‌نام</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Profile Section */}
        <section className="animate-fade-up">
          <ProfileSection profile={profile} onProfileUpdate={updateProfile} />
        </section>

        {/* Login prompt for non-authenticated users */}
        {!userId && (
          <section className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-cream rounded-2xl p-6 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-gold" />
              <h3 className="font-display text-xl font-semibold mb-2">
                برای شروع وارد شوید
              </h3>
              <p className="text-muted-foreground mb-4">
                با ورود به حساب، لباس‌های خود را ذخیره کنید و ست‌های هوشمند دریافت کنید
              </p>
              <Button onClick={() => navigate('/auth')} variant="gold" size="lg">
                ورود یا ثبت‌نام
              </Button>
            </div>
          </section>
        )}

        {/* Generate Button - only for authenticated users */}
        {userId && clothes.length >= 2 && (
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
                    <span>ساخت ست با AI</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((suggestion, index) => (
                <OutfitSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Wardrobe Section - only for authenticated users */}
        {userId && (
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

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
              </div>
            ) : filteredClothes.length === 0 ? (
              <EmptyState onAddClick={() => setIsModalOpen(true)} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                {filteredClothes.map((item, index) => (
                  <ClothingCard
                    key={item.id}
                    item={item}
                    onRemove={removeClothing}
                    onSelect={handleSelectItem}
                    isSelected={selectedItems.some((i) => i.id === item.id)}
                    className="animate-scale-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Add Modal */}
      <AddClothingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addClothing}
      />
    </div>
  );
};

export default Index;
