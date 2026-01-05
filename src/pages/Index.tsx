import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, LogIn, LogOut, Heart } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ProfileSection } from '@/components/ProfileSection';
import { CategoryTabs } from '@/components/CategoryTabs';
import { ClothingCard } from '@/components/ClothingCard';
import { AddClothingModal } from '@/components/AddClothingModal';
import { EmptyState } from '@/components/EmptyState';
import { OutfitSuggestionCard } from '@/components/OutfitSuggestionCard';
import { OutfitBuilder } from '@/components/OutfitBuilder';
import { SearchFilter } from '@/components/SearchFilter';
import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { useWardrobe } from '@/hooks/useWardrobe';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const {
    profile,
    clothes,
    suggestions,
    favoriteSuggestions,
    isLoading,
    isGenerating,
    userId,
    addClothing,
    removeClothing,
    generateSuggestion,
    toggleFavorite,
    deleteSuggestion,
    updateProfile,
  } = useWardrobe();

  const [activeCategory, setActiveCategory] = useState<ClothingCategory | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [colorFilter, setColorFilter] = useState('');

  // Get unique colors from clothes
  const availableColors = useMemo(() => {
    const colors = clothes
      .map(item => item.color)
      .filter((color): color is string => !!color && color.trim() !== '');
    return [...new Set(colors)];
  }, [clothes]);

  // Filter clothes based on category, search, and color
  const filteredClothes = useMemo(() => {
    let result = clothes;

    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter(item => item.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.color && item.color.toLowerCase().includes(query))
      );
    }

    // Filter by color
    if (colorFilter) {
      result = result.filter(item => 
        item.color && item.color.toLowerCase() === colorFilter.toLowerCase()
      );
    }

    return result;
  }, [clothes, activeCategory, searchQuery, colorFilter]);

  const displayedSuggestions = showFavoritesOnly ? favoriteSuggestions : suggestions;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'خروج موفق',
      description: 'با موفقیت خارج شدید',
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setColorFilter('');
    setActiveCategory('all');
  };

  const hasActiveFilters = searchQuery || colorFilter || activeCategory !== 'all';

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
            <ThemeToggle />
            <Button onClick={() => setIsModalOpen(true)} variant="gold" size="default">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">افزودن لباس</span>
            </Button>
            {userId ? (
              <Button onClick={handleLogout} variant="ghost" size="icon">
                <LogOut className="w-5 h-5" />
              </Button>
            ) : (
              <Button onClick={() => navigate('/auth')} variant="ghost" size="default">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">ورود</span>
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

        {/* Outfit Builder with Drag & Drop */}
        {clothes.length >= 2 && (
          <section className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-display font-semibold mb-4">ست‌ساز هوشمند</h2>
            <OutfitBuilder
              clothes={clothes}
              onGenerateSuggestion={generateSuggestion}
              isGenerating={isGenerating}
            />
          </section>
        )}

        {/* Suggestions Section */}
        {suggestions.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-display font-semibold">ست‌های پیشنهادی</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
                    showFavoritesOnly
                      ? 'bg-rose/20 text-rose'
                      : 'bg-cream text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Heart className={cn('w-4 h-4', showFavoritesOnly && 'fill-current')} />
                  <span>علاقه‌مندی‌ها</span>
                  {favoriteSuggestions.length > 0 && (
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs',
                      showFavoritesOnly ? 'bg-rose/30' : 'bg-foreground/10'
                    )}>
                      {favoriteSuggestions.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {displayedSuggestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedSuggestions.map((suggestion, index) => (
                  <OutfitSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onToggleFavorite={toggleFavorite}
                    onDelete={deleteSuggestion}
                    className="animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  />
                ))}
              </div>
            ) : showFavoritesOnly ? (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>هنوز ستی به علاقه‌مندی‌ها اضافه نکرده‌اید</p>
              </div>
            ) : null}
          </section>
        )}

        {/* Wardrobe Section */}
        <section className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl font-display font-semibold">کمد لباس شما</h2>
            <span className="text-sm text-muted-foreground">
              {filteredClothes.length} از {clothes.length} لباس
            </span>
          </div>

          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Search and Filter */}
          {clothes.length > 0 && (
            <div className="mt-4">
              <SearchFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                colorFilter={colorFilter}
                onColorFilterChange={setColorFilter}
                availableColors={availableColors}
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : clothes.length === 0 ? (
            <EmptyState onAddClick={() => setIsModalOpen(true)} />
          ) : filteredClothes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">هیچ لباسی با این فیلترها یافت نشد</p>
              <Button onClick={handleClearFilters} variant="soft" size="default">
                پاک کردن فیلترها
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
              {filteredClothes.map((item, index) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  onRemove={removeClothing}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Login hint for anonymous users */}
        {!userId && clothes.length > 0 && (
          <section className="animate-fade-up">
            <div className="bg-cream-dark/50 rounded-2xl p-4 text-center">
              <p className="text-sm text-muted-foreground">
                برای ذخیره دائمی لباس‌ها و ست‌ها،{' '}
                <button 
                  onClick={() => navigate('/auth')}
                  className="text-gold hover:underline font-medium"
                >
                  وارد شوید یا ثبت‌نام کنید
                </button>
              </p>
            </div>
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
