import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, LogIn, LogOut, Heart, Shirt } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddClothingModal } from '@/components/AddClothingModal';
import { BulkAddClothingModal } from '@/components/BulkAddClothingModal';
import { ClothingDetailsModal } from '@/components/ClothingDetailsModal';
import { OutfitSuggestionCard } from '@/components/OutfitSuggestionCard';
import { OutfitBuilder } from '@/components/OutfitBuilder';
import { MyWardrobeSection } from '@/components/MyWardrobeSection';
import { ScrollToTop } from '@/components/ScrollToTop';
import { MobileFab } from '@/components/MobileFab';
import { GeneratingBanner } from '@/components/GeneratingBanner';
import { AppShell, type AppNavId } from '@/components/layout/AppShell';
import { StyleRecommendations } from '@/components/style/StyleRecommendations';
import { FilterChip, FilterChipGroup, SegmentedControl } from '@/components/shared';
import { ClothingItem } from '@/types/wardrobe';
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
    isLoading,
    isGenerating,
    userId,
    addClothing,
    removeClothing,
    updateClothing,
    generateSuggestion,
    saveFavoriteOutfit,
    feedbackOutfit,
    toggleFavorite,
    deleteSuggestion,
    updateProfile,
  } = useWardrobe();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<ClothingItem | null>(null);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ClothingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [outfitFilterLiked, setOutfitFilterLiked] = useState(false);
  const [outfitFilterStyle, setOutfitFilterStyle] = useState<'all' | 'casual' | 'formal' | 'party'>('all');
  const [outfitFilterEnv, setOutfitFilterEnv] = useState<'all' | 'office' | 'gathering'>('all');
  const [outfitFilterWeather, setOutfitFilterWeather] = useState<'all' | 'sunny' | 'rainy' | 'cold'>('all');

  const [mainTab, setMainTab] = useState<'start' | 'builder' | 'wardrobe' | 'outfits'>('start');

  const activeNav: AppNavId =
    mainTab === 'wardrobe'
      ? 'wardrobe'
      : mainTab === 'outfits'
        ? showFavoritesOnly
          ? 'favorites'
          : 'outfits'
        : mainTab === 'start'
          ? 'home'
          : 'builder';

  const handleAppNavigate = (id: AppNavId) => {
    if (id === 'home') {
      setMainTab(clothes.length >= 2 ? 'builder' : 'start');
      setShowFavoritesOnly(false);
      return;
    }
    if (id === 'builder') {
      setMainTab('builder');
      setShowFavoritesOnly(false);
      return;
    }
    if (id === 'wardrobe') {
      setMainTab('wardrobe');
      setShowFavoritesOnly(false);
      return;
    }
    if (id === 'outfits') {
      setMainTab('outfits');
      setShowFavoritesOnly(false);
      return;
    }
    if (id === 'favorites') {
      setMainTab('outfits');
      setShowFavoritesOnly(true);
      return;
    }
    if (id === 'settings') {
      setMainTab('wardrobe');
      setShowFavoritesOnly(false);
    }
  };


  useEffect(() => {
    if (clothes.length >= 2 && mainTab === 'start') {
      setMainTab('builder');
    }
  }, [clothes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters =
    showFavoritesOnly ||
    outfitFilterLiked ||
    outfitFilterStyle !== 'all' ||
    outfitFilterEnv !== 'all' ||
    outfitFilterWeather !== 'all';

  const clearOutfitFilters = () => {
    setShowFavoritesOnly(false);
    setOutfitFilterLiked(false);
    setOutfitFilterStyle('all');
    setOutfitFilterEnv('all');
    setOutfitFilterWeather('all');
  };

  const displayedSuggestions = suggestions.filter((s) => {
    if (showFavoritesOnly && !s.isFavorite) return false;
    if (outfitFilterLiked && s.userFeedback !== 'liked') return false;
    if (outfitFilterStyle !== 'all' && s.context?.style !== outfitFilterStyle) return false;
    if (outfitFilterEnv !== 'all' && s.context?.environment !== outfitFilterEnv) return false;
    if (outfitFilterWeather !== 'all' && s.context?.weather !== outfitFilterWeather) return false;
    return true;
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'خروج موفق', description: 'با موفقیت خارج شدید' });
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ClothingItem) => {
    setViewingItem(null);
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleRequestDelete = (item: ClothingItem) => {
    setViewingItem(null);
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem || isDeleting) return;
    setIsDeleting(true);
    const wasRemoved = await removeClothing(deletingItem.id);
    if (wasRemoved) setDeletingItem(null);
    setIsDeleting(false);
  };

  const handleCloseClothingModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleBulkRemove = async (ids: string[]) => {
    let ok = 0;
    for (const id of ids) {
      const removed = await removeClothing(id);
      if (removed) ok += 1;
    }
    toast({
      title: 'حذف گروهی انجام شد',
      description: `${ok.toLocaleString('fa-IR')} لباس از کمد حذف شد`,
    });
  };

  const mainTabs = [
    { id: 'builder' as const, label: 'پیشنهاد', icon: Sparkles },
    { id: 'wardrobe' as const, label: 'کمد من', icon: Shirt },
    { id: 'outfits' as const, label: 'ست‌ها', icon: Heart },
  ] as const;

  const renderTabButton = (
    tab: (typeof mainTabs)[number],
    opts?: { vertical?: boolean }
  ) => {
    const active = mainTab === tab.id || (mainTab === 'start' && tab.id === 'builder');
    const Icon = tab.icon;
    const disabled = tab.id === 'outfits' && suggestions.length === 0;
    return (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={active}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setMainTab(tab.id);
        }}
        className={cn(
          'flex items-center justify-center gap-1.5 rounded-xl font-extrabold transition-all touch-manipulation',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
          opts?.vertical
            ? 'flex-col py-2 px-1 min-h-[52px] text-[10px] gap-0.5'
            : 'flex-col sm:flex-row py-2.5 px-2 rounded-xl text-[11px] sm:text-sm min-h-[44px] gap-1 sm:gap-2',
          active
            ? opts?.vertical
              ? 'text-primary'
              : 'bg-gradient-gold text-white shadow-md'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          disabled && 'opacity-40 cursor-not-allowed'
        )}
      >
        <Icon
          className={cn(
            opts?.vertical ? 'w-5 h-5' : 'w-4 h-4',
            active && opts?.vertical && 'text-primary'
          )}
          aria-hidden="true"
          strokeWidth={active && opts?.vertical ? 2.5 : 2}
        />
        <span className={cn(active && opts?.vertical && 'text-primary font-black')}>
          {tab.label}
        </span>
        {tab.id === 'outfits' && suggestions.length > 0 && (
          <span
            className={cn(
              'text-[10px] tabular-nums',
              active
                ? opts?.vertical
                  ? 'text-primary/80'
                  : 'text-white/90'
                : 'text-muted-foreground'
            )}
            aria-label={`${suggestions.length} ست`}
          >
            {suggestions.length.toLocaleString('fa-IR')}
          </span>
        )}
      </button>
    );
  };

  return (
    <AppShell
      activeNav={activeNav}
      onNavigate={handleAppNavigate}
      userId={userId}
      profileImageUrl={profile.imageUrl}
      suggestionCount={suggestions.length}
      onAddClothing={handleOpenAdd}
      onLogin={() => navigate('/auth')}
      onLogout={handleLogout}
    >
    <div className="relative overflow-x-hidden" dir="rtl">
      {/* Decorative blobs — desktop */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden -z-10 hidden md:block"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30 animate-blob"
          style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 65%)' }}
        />
        <div
          className="absolute top-1/3 -left-40 w-[450px] h-[450px] rounded-full opacity-20 animate-blob animation-delay-2000"
          style={{ background: 'radial-gradient(circle, hsl(var(--rose)) 0%, transparent 65%)' }}
        />
      </div>

      <main
        id="main-content"
        className="container max-w-3xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-6 space-y-3 md:space-y-6"
        tabIndex={-1}
      >
        {/* Compact summary card */}
        <section className="animate-fade-up" aria-label="خلاصه کمد">
          <div className="flex items-center gap-2.5 md:gap-3 p-2.5 md:p-4 rounded-xl md:rounded-2xl bg-gradient-card hairline-border shadow-soft">
            <button
              type="button"
              onClick={() => document.getElementById('profile-photo-trigger')?.click()}
              className="relative w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden ring-2 ring-gold/30 shrink-0 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold touch-manipulation"
              title="تغییر عکس پروفایل"
              aria-label="تغییر عکس پروفایل"
            >
              {profile.imageUrl ? (
                <img src={profile.imageUrl} alt="عکس پروفایل شما" className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-base md:text-lg" aria-hidden="true">
                  👤
                </span>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm md:text-base font-black truncate">کمد رویایی شما</p>
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium leading-snug">
                {clothes.length < 2
                  ? '۱) لباس به کمد ۲) تولید ست ۳) پرو'
                  : `${clothes.length.toLocaleString('fa-IR')} لباس · یک کار را انتخاب کنید`}
              </p>
            </div>
            <Button
              onClick={handleOpenAdd}
              variant="gold"
              size="sm"
              className="shrink-0 font-extrabold h-8 md:h-9 px-2.5 md:px-3"
              aria-label="افزودن لباس"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">لباس</span>
            </Button>
          </div>
          <input
            id="profile-photo-trigger"
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onloadend = () => {
                updateProfile({ ...profile, imageUrl: reader.result as string });
              };
              reader.readAsDataURL(file);
              e.target.value = '';
            }}
          />
        </section>

        {/* Desktop / tablet sticky top tabs */}
        <nav
          className="hidden md:block sticky top-[4.2rem] z-30 -mx-1 px-1 py-1.5 rounded-2xl bg-background/90 backdrop-blur-md border border-border/40 shadow-sm"
          aria-label="بخش‌های اصلی"
        >
          <div className="grid grid-cols-3 gap-1" role="tablist">
            {mainTabs.map((tab) => renderTabButton(tab))}
          </div>
        </nav>

        {(mainTab === 'start' || (mainTab === 'builder' && clothes.length < 2)) && (
          <section
            className="animate-fade-up rounded-2xl md:rounded-3xl border border-gold/25 bg-gradient-card p-5 md:p-10 text-center shadow-soft"
            aria-labelledby="onboarding-title"
          >
            <div
              className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-button-gold"
              aria-hidden="true"
            >
              <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <h1 id="onboarding-title" className="text-lg md:text-2xl font-display font-black mb-2">
              ۳ قدم تا پیشنهاد امروز
            </h1>
            <ol className="text-sm text-muted-foreground space-y-2 max-w-sm mx-auto text-right mb-5 md:mb-6">
              <li className="flex gap-2 items-start">
                <span
                  className="w-6 h-6 rounded-full bg-gold/15 text-gold text-xs font-black flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  ۱
                </span>
                <span>چند لباس به کمد اضافه کنید (حداقل ۲ تا)</span>
              </li>
              <li className="flex gap-2 items-start">
                <span
                  className="w-6 h-6 rounded-full bg-gold/15 text-gold text-xs font-black flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  ۲
                </span>
                <span>شرایط را انتخاب کنید و لباس‌ها را ببینید</span>
              </li>
              <li className="flex gap-2 items-start">
                <span
                  className="w-6 h-6 rounded-full bg-gold/15 text-gold text-xs font-black flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  ۳
                </span>
                <span>تولید ست و در صورت تمایل پرو روی مانکن</span>
              </li>
            </ol>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={handleOpenAdd} variant="gold" size="lg" className="font-extrabold shadow-lg min-h-[48px]">
                <Plus className="w-5 h-5" aria-hidden="true" />
                افزودن اولین لباس
              </Button>
              <Button
                onClick={() => setIsBulkModalOpen(true)}
                variant="soft"
                size="lg"
                className="font-bold min-h-[48px]"
              >
                افزودن چندتایی
              </Button>
            </div>
            {clothes.length > 0 && (
              <p className="mt-4 text-xs font-bold text-muted-foreground">
                الان {clothes.length.toLocaleString('fa-IR')} لباس دارید — یکی دیگر اضافه کنید
              </p>
            )}
          </section>
        )}

        {mainTab === 'builder' && clothes.length >= 2 && (
          <section
            id="outfit-builder"
            className="animate-fade-up relative scroll-mt-20 md:scroll-mt-28"
            aria-labelledby="builder-title"
          >
            <div className="text-center mb-2 md:mb-3 max-w-xl mx-auto">
              <h1 id="builder-title" className="text-lg md:text-2xl font-display font-black tracking-tight">
                <span className="text-gradient-gold">ست‌ساز</span>
              </h1>
              <p className="text-[11px] md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                لباس انتخاب کنید، روی مانکن ببینید، ست بسازید
              </p>
            </div>
            <div className="relative rounded-[1.25rem] md:rounded-[1.75rem] shadow-elevated ring-1 ring-gold/15 overflow-hidden">
              <OutfitBuilder
                clothes={clothes}
                onGenerateSuggestion={generateSuggestion}
                onSaveFavorite={saveFavoriteOutfit}
                isGenerating={isGenerating}
                profileImageUrl={profile.imageUrl}
                onViewItem={setViewingItem}
                onEditItem={handleOpenEdit}
                onRemoveItem={handleRequestDelete}
              />
            </div>
          </section>
        )}

        {mainTab === 'wardrobe' && (
          <MyWardrobeSection
            clothes={clothes}
            isLoading={isLoading}
            onAdd={handleOpenAdd}
            onBulkAdd={() => setIsBulkModalOpen(true)}
            onView={setViewingItem}
            onEdit={handleOpenEdit}
            onRemove={handleRequestDelete}
            onBulkRemove={handleBulkRemove}
          />
        )}

        {(mainTab === 'outfits' || activeNav === 'favorites') && (
          <StyleRecommendations
            suggestions={suggestions}
            showFavoritesOnly={showFavoritesOnly}
            onShowFavoritesOnly={setShowFavoritesOnly}
            onToggleFavorite={toggleFavorite}
            onFeedback={(s, liked) => feedbackOutfit(s, liked)}
            onDelete={deleteSuggestion}
            onGenerateNew={() => setMainTab('builder')}
            profileImageUrl={profile.imageUrl}
          />
        )}

        {!userId && clothes.length > 0 && (
          <section className="animate-fade-up stagger-4" aria-labelledby="login-cta-title">
            <div className="relative overflow-hidden rounded-2xl md:rounded-[2rem] p-5 md:p-8 lg:p-10 text-center">
              <div
                className="absolute inset-0 bg-gradient-to-br from-gold/15 via-white/60 to-rose/12"
                aria-hidden="true"
              />
              <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                <div className="relative shrink-0 animate-float hidden sm:block" aria-hidden="true">
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-gold/20 blur-xl" />
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-gradient-gold shadow-button-gold flex items-center justify-center text-3xl md:text-4xl">
                    🔒
                  </div>
                </div>
                <div className="max-w-xl">
                  <h3
                    id="login-cta-title"
                    className="text-base md:text-2xl font-display font-black mb-2 md:mb-3 tracking-tight"
                  >
                    ذخیره‌سازی ابری و امن لباس‌ها و ست‌های شما
                  </h3>
                  <p className="text-xs md:text-base text-muted-foreground mb-4 md:mb-6 leading-relaxed">
                    با ورود، کمد و ست‌های شما در ابر می‌ماند و از هر دستگاهی در دسترس است.
                  </p>
                  <Button
                    onClick={() => navigate('/auth')}
                    variant="gold"
                    size="xl"
                    className="group relative overflow-hidden shadow-lg min-h-[48px]"
                  >
                    <LogIn className="w-5 h-5 relative" aria-hidden="true" />
                    <span className="relative font-extrabold">ورود یا ثبت‌نام فوری</span>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>


      {clothes.length < 2 ? (
        <MobileFab mode="add" onClick={handleOpenAdd} />
      ) : mainTab === 'start' ? (
        <MobileFab mode="generate" label="تولید ست" onClick={() => setMainTab('builder')} />
      ) : mainTab === 'wardrobe' ? (
        <MobileFab mode="add" onClick={handleOpenAdd} />
      ) : null}
      <ScrollToTop />
      <GeneratingBanner visible={isGenerating} />

      <ClothingDetailsModal
        item={viewingItem}
        onClose={() => setViewingItem(null)}
        onEdit={handleOpenEdit}
        onDelete={handleRequestDelete}
      />
      <AddClothingModal
        isOpen={isModalOpen}
        onClose={handleCloseClothingModal}
        onAdd={addClothing}
        editingItem={editingItem}
        onEdit={updateClothing}
      />
      <BulkAddClothingModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onAdd={addClothing}
      />

      <AlertDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && !isDeleting && setDeletingItem(null)}
      >
        <AlertDialogContent dir="rtl" className="sm:rounded-3xl">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle>حذف «{deletingItem?.name}»؟</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              این لباس و تصویر ذخیره‌شده آن از کمد شما حذف می‌شود. این کار قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-start">
            <AlertDialogCancel disabled={isDeleting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'در حال حذف...' : 'حذف لباس'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </AppShell>
  );
};

export default Index;
