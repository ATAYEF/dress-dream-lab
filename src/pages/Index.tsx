import React, { useState } from 'react';
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
import { ProfileSection } from '@/components/ProfileSection';
import { AddClothingModal } from '@/components/AddClothingModal';
import { ClothingDetailsModal } from '@/components/ClothingDetailsModal';
import { OutfitSuggestionCard } from '@/components/OutfitSuggestionCard';
import { OutfitBuilder } from '@/components/OutfitBuilder';
import { MyWardrobeSection } from '@/components/MyWardrobeSection';
import { ScrollToTop } from '@/components/ScrollToTop';
import { MobileFab } from '@/components/MobileFab';
import { GeneratingBanner } from '@/components/GeneratingBanner';
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
    favoriteSuggestions,
    isLoading,
    isGenerating,
    userId,
    addClothing,
    removeClothing,
    updateClothing,
    generateSuggestion,
    toggleFavorite,
    deleteSuggestion,
    updateProfile,
  } = useWardrobe();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<ClothingItem | null>(null);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ClothingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const displayedSuggestions = showFavoritesOnly ? favoriteSuggestions : suggestions;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'خروج موفق',
      description: 'با موفقیت خارج شدید',
    });
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

  return (
    <div className="min-h-screen bg-background relative" dir="rtl">
      {/* Background decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30 animate-blob"
          style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 65%)' }}
        />
        <div
          className="absolute top-1/3 -left-40 w-[450px] h-[450px] rounded-full opacity-20 animate-blob animation-delay-2000"
          style={{ background: 'radial-gradient(circle, hsl(var(--rose)) 0%, transparent 65%)' }}
        />
      </div>

      {/* ========== Header ========== */}
      <header className="sticky top-0 z-50 safe-top">
        <div className="glass-strong">
          <div className="container max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2.5 md:py-4 flex items-center justify-between gap-2 md:gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5 md:gap-3 cursor-pointer group">
              <div className="relative">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-gold opacity-40 blur-md group-hover:opacity-70 transition-opacity duration-500 animate-glow-pulse" />
                <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-button-gold group-hover:scale-105 transition-transform duration-500">
                  <Sparkles className="w-5 h-5 md:w-[22px] md:h-[22px] text-white" />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xl md:text-2xl font-display font-black tracking-tight">
                  استایلر
                </span>
                <span className="text-[9px] md:text-[10px] text-muted-foreground font-bold -mt-0.5">
                  ✨ کمد هوشمند رویایی
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-2.5">
              <ThemeToggle />

              <Button
                onClick={() =>
                  document.getElementById('outfit-builder')?.scrollIntoView({ behavior: 'smooth' })
                }
                variant="soft"
                size="default"
                className="hidden md:inline-flex shrink-0 font-bold"
              >
                <Sparkles className="w-4 h-4 text-gold" />
                ست‌ساز
              </Button>

              <Button
                onClick={() =>
                  document.getElementById('my-wardrobe')?.scrollIntoView({ behavior: 'smooth' })
                }
                variant="soft"
                size="default"
                className="hidden md:inline-flex shrink-0 font-bold"
              >
                <Shirt className="w-4 h-4 text-indigo-500" />
                کمد من
              </Button>

              <Button
                onClick={handleOpenAdd}
                variant="gold"
                size="default"
                className="group relative overflow-hidden shrink-0"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                <Plus className="w-4.5 h-4.5 relative" strokeWidth={2.75} />
                <span className="hidden sm:inline relative font-extrabold">افزودن لباس</span>
              </Button>

              {userId ? (
                <Button
                  onClick={handleLogout}
                  variant="soft"
                  size="icon"
                  className="shrink-0"
                  title="خروج"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/auth')}
                  variant="soft"
                  size="default"
                  className="shrink-0"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline font-bold">ورود</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========== Main Content ========== */}
      <main className="container max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-7 space-y-5 md:space-y-8 mobile-content-pad">

        {/* ========== Welcome / Profile (top hero) ========== */}
        <section className="animate-fade-up stagger-1">
          <ProfileSection
            profile={profile}
            onProfileUpdate={updateProfile}
            clothes={clothes}
            suggestions={suggestions}
            favoriteSuggestions={favoriteSuggestions}
          />
        </section>

        {/* ========== CORE: Outfit Builder (Hero) ========== */}
        <section id="outfit-builder" className="animate-fade-up relative scroll-mt-20 md:scroll-mt-24">
          {/* Hero intro — centered, bold */}
          <div className="text-center mb-3 md:mb-7 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-gold/15 border border-gold/30 text-gold text-[11px] md:text-xs font-extrabold mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              هسته اصلی اپ · امتحان مجازی لباس
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-display font-black tracking-tight leading-tight mb-2">
              <span className="text-gradient-gold">ست‌ساز هوشمند</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              لباس‌های کمدتان را روی مانکن ببینید، ست بسازید و با هوش مصنوعی استایل حرفه‌ای بگیرید
            </p>
            {clothes.length >= 2 && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-muted-foreground">
                <Shirt className="w-4 h-4 text-gold" />
                <span>{clothes.length.toLocaleString('fa-IR')} لباس آماده برای ست‌سازی</span>
              </div>
            )}
          </div>

          {clothes.length >= 2 ? (
            <div className="relative">
              {/* Outer glow frame */}
              <div
                className="absolute -inset-[3px] rounded-[2.15rem] opacity-80 blur-[1px] pointer-events-none"
                style={{
                  background:
                    'linear-gradient(135deg, hsl(var(--gold) / 0.55), hsl(var(--rose) / 0.35), hsl(var(--gold) / 0.45))',
                }}
              />
              <div className="relative rounded-[2rem] shadow-elevated ring-1 ring-gold/20 overflow-hidden">
                <OutfitBuilder
                  clothes={clothes}
                  onGenerateSuggestion={generateSuggestion}
                  isGenerating={isGenerating}
                  profileImageUrl={profile.imageUrl}
                  onViewItem={setViewingItem}
                  onEditItem={handleOpenEdit}
                  onRemoveItem={handleRequestDelete}
                />
              </div>
            </div>
          ) : (
            /* Locked / onboarding state when wardrobe is too small */
            <div className="relative overflow-hidden rounded-[2rem] border border-gold/25 bg-gradient-card shadow-elevated">
              <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at 30% 20%, hsl(var(--gold) / 0.25), transparent 55%), radial-gradient(ellipse at 80% 80%, hsl(var(--rose) / 0.18), transparent 50%)',
                }}
              />
              <div className="relative px-6 py-12 md:py-16 text-center max-w-lg mx-auto">
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-gold opacity-30 blur-xl animate-glow-pulse" />
                  <div className="relative w-full h-full rounded-3xl bg-gradient-gold flex items-center justify-center shadow-button-gold">
                    <Sparkles className="w-9 h-9 text-white" />
                  </div>
                </div>
                <h2 className="text-xl md:text-2xl font-display font-black mb-2">
                  برای شروع ست‌سازی آماده شوید
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  حداقل{' '}
                  <span className="font-extrabold text-gold">۲ لباس</span> در کمد لازم است تا بتوانید
                  روی مانکن امتحان کنید و ست هوشمند بسازید.
                  {clothes.length > 0 && (
                    <>
                      {' '}
                      الان{' '}
                      <span className="font-bold text-foreground">
                        {clothes.length.toLocaleString('fa-IR')} لباس
                      </span>{' '}
                      دارید.
                    </>
                  )}
                </p>
                <Button onClick={handleOpenAdd} variant="gold" size="xl" className="shadow-lg">
                  <Plus className="w-5 h-5" />
                  افزودن لباس به کمد
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* ========== Suggestions Section ========== */}
        {suggestions.length > 0 && (
          <section className="animate-fade-up stagger-2">
            <div className="flex items-end justify-between mb-5 md:mb-6 flex-wrap gap-3 md:gap-4">
              <div className="flex items-end gap-3 md:gap-4">
                <div className="w-1.5 h-10 md:h-12 rounded-full bg-gradient-to-b from-rose to-pink-500" />
                <div>
                  <h2 className="text-2xl md:text-[28px] font-display font-black tracking-tight mb-1">
                    ست‌های پیشنهادی شما
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    ساخته شده با طعم تخصص و سلیقه شما
                  </p>
                </div>
              </div>

              {/* Favorites Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={cn(
                    'group flex items-center gap-2 pl-3 md:pl-4 pr-3 md:pr-4 py-2 md:py-2.5 rounded-2xl text-xs md:text-sm font-extrabold transition-all duration-400',
                    'shadow-sm hover:shadow-md',
                    showFavoritesOnly
                      ? 'bg-gradient-to-br from-rose to-pink-500 text-white shadow-rose-500/20'
                      : 'bg-gradient-card hairline-border text-foreground/75 hover:text-foreground hover:bg-white/80'
                  )}
                >
                  <Heart
                    className={cn(
                      'w-4 h-4 md:w-[18px] md:h-[18px] transition-all duration-400',
                      showFavoritesOnly && 'fill-white scale-110',
                      !showFavoritesOnly && 'group-hover:text-rose'
                    )}
                    strokeWidth={showFavoritesOnly ? 0 : 2.25}
                  />
                  <span>علاقه‌مندی‌ها</span>
                  {favoriteSuggestions.length > 0 && (
                    <span
                      className={cn(
                        'flex items-center justify-center min-w-[22px] md:min-w-[24px] h-[22px] md:h-6 px-1.5 rounded-full text-[10px] md:text-xs transition-all duration-400 font-black',
                        showFavoritesOnly
                          ? 'bg-white/25 text-white backdrop-blur-sm'
                          : 'bg-foreground/8 text-foreground/70 group-hover:bg-rose/15 group-hover:text-rose'
                      )}
                    >
                      {favoriteSuggestions.length.toLocaleString('fa-IR')}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {displayedSuggestions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {displayedSuggestions.map((suggestion, index) => (
                  <OutfitSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onToggleFavorite={toggleFavorite}
                    onDelete={deleteSuggestion}
                    profileImageUrl={profile.imageUrl}
                    className="animate-fade-up"
                    style={{ animationDelay: `${index * 0.06}s` }}
                  />
                ))}
              </div>
            ) : showFavoritesOnly ? (
              <div className="relative py-14 md:py-20 text-center rounded-[2rem] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-rose/8 via-transparent to-transparent" />
                <div className="relative">
                  <div className="relative w-20 h-20 mx-auto mb-5 animate-float">
                    <div className="absolute inset-0 rounded-full bg-rose/20 blur-xl animate-glow-pulse" />
                    <div className="relative w-full h-full rounded-3xl bg-gradient-card hairline-border shadow-card flex items-center justify-center">
                      <Heart className="w-10 h-10 text-rose" />
                    </div>
                  </div>
                  <h3 className="text-lg md:text-xl font-extrabold mb-2">هنوز علاقه‌مندی ثبت نشده</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    از میان ست‌های پیشنهادی، مورد علاقه‌هاتون رو با دکمه ❤️ ذخیره کنید
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* ========== My Wardrobe (full management) ========== */}
        <MyWardrobeSection
          clothes={clothes}
          isLoading={isLoading}
          onAdd={handleOpenAdd}
          onView={setViewingItem}
          onEdit={handleOpenEdit}
          onRemove={handleRequestDelete}
          onBulkRemove={handleBulkRemove}
        />

        {/* ========== Login CTA for anonymous users ========== */}
        {!userId && clothes.length > 0 && (
          <section className="animate-fade-up stagger-4">
            <div className="relative overflow-hidden rounded-[2rem] p-6 md:p-8 lg:p-10 text-center">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold/15 via-white/60 to-rose/12" />
              <div
                className="absolute -top-20 -right-16 w-64 h-64 rounded-full opacity-40 animate-blob pointer-events-none"
                style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)' }}
              />
              <div
                className="absolute -bottom-20 -left-16 w-64 h-64 rounded-full opacity-30 animate-blob animation-delay-2000 pointer-events-none"
                style={{ background: 'radial-gradient(circle, hsl(var(--rose)) 0%, transparent 70%)' }}
              />

              <div className="relative flex flex-col md:flex-row items-center justify-center gap-5 md:gap-8">
                <div className="relative shrink-0 animate-float">
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-gold/20 blur-xl" />
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-gradient-gold shadow-button-gold flex items-center justify-center text-3xl md:text-4xl">
                    🔒
                  </div>
                </div>

                <div className="max-w-xl">
                  <h3 className="text-xl md:text-2xl font-display font-black mb-2 md:mb-3 tracking-tight">
                    ذخیره‌سازی ابری و امن لباس‌ها و ست‌های شما
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-5 md:mb-6 leading-relaxed">
                    وارد حساب شوید تا همه چیز رو در ابر ذخیره بشه و از هر دستگاهی به کمد رویایی خود دسترسی داشته باشید.
                    دغدغه‌ای از دست دادن لباس‌ها و ست‌های مورد علاقه‌تون نداشته باشید! 🌤️
                  </p>
                  <Button
                    onClick={() => navigate('/auth')}
                    variant="gold"
                    size="xl"
                    className="group relative overflow-hidden shadow-lg"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    <LogIn className="w-5 h-5 relative" />
                    <span className="relative font-extrabold">ورود یا ثبت‌نام فوری</span>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========== Footer spacer (extra room for mobile FAB) ========== */}
        <div className="h-24 md:h-12" />
      </main>

      {/* Mobile FAB + Scroll to top + Generating banner */}
      <MobileFab onClick={handleOpenAdd} />
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
  );
};

export default Index;
