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

  return (
    <div className="min-h-screen bg-background relative" dir="rtl">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30 animate-blob"
          style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 65%)' }}
        />
        <div
          className="absolute top-1/3 -left-40 w-[450px] h-[450px] rounded-full opacity-20 animate-blob animation-delay-2000"
          style={{ background: 'radial-gradient(circle, hsl(var(--rose)) 0%, transparent 65%)' }}
        />
      </div>

      <header className="sticky top-0 z-50 safe-top">
        <div className="glass-strong">
          <div className="container max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2.5 md:py-4 flex items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center gap-2.5 md:gap-3 cursor-pointer group" role="banner">
              <div className="relative" aria-hidden="true">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-gold opacity-40 blur-md group-hover:opacity-70 transition-opacity duration-500 animate-glow-pulse" />
                <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-button-gold group-hover:scale-105 transition-transform duration-500">
                  <Sparkles className="w-5 h-5 md:w-[22px] md:h-[22px] text-white" />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xl md:text-2xl font-display font-black tracking-tight">استایلر</span>
                <span className="text-[9px] md:text-[10px] text-muted-foreground font-bold -mt-0.5">✨ کمد هوشمند رویایی</span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-2.5">
              <ThemeToggle />
              <Button onClick={handleOpenAdd} variant="gold" size="default" className="group relative overflow-hidden shrink-0" aria-label="افزودن لباس جدید">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" aria-hidden="true" />
                <Plus className="w-4.5 h-4.5 relative" strokeWidth={2.75} aria-hidden="true" />
                <span className="hidden sm:inline relative font-extrabold">افزودن لباس</span>
              </Button>
              {userId ? (
                <Button onClick={handleLogout} variant="soft" size="icon" className="shrink-0" aria-label="خروج از حساب" title="خروج">
                  <LogOut className="w-5 h-5" aria-hidden="true" />
                </Button>
              ) : (
                <Button onClick={() => navigate('/auth')} variant="soft" size="default" className="shrink-0" aria-label="ورود یا ثبت‌نام">
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline font-bold">ورود</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container max-w-3xl md:max-w-5xl lg:max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6 mobile-content-pad pb-28 md:pb-12" tabIndex={-1}>
        <section className="animate-fade-up" aria-label="خلاصه کمد">
          <div className="flex items-center gap-3 p-3 md:p-4 rounded-2xl bg-gradient-card hairline-border shadow-soft">
            <button
              type="button"
              onClick={() => document.getElementById('profile-photo-trigger')?.click()}
              className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden ring-2 ring-gold/30 shrink-0 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              title="تغییر عکس پروفایل"
              aria-label="تغییر عکس پروفایل"
            >
              {profile.imageUrl ? (
                <img src={profile.imageUrl} alt="عکس پروفایل شما" className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-lg" aria-hidden="true">👤</span>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm md:text-base font-black truncate">کمد رویایی شما</p>
              <p className="text-[11px] md:text-xs text-muted-foreground font-medium">
                {clothes.length < 2
                  ? '۱) لباس به کمد ۲) تولید ست ۳) پرو روی مانکن'
                  : `${clothes.length.toLocaleString('fa-IR')} لباس در کمد · یک کار را انتخاب کنید`}
              </p>
            </div>
            <Button onClick={handleOpenAdd} variant="gold" size="sm" className="shrink-0 font-extrabold" aria-label="افزودن لباس">
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

        <nav className="sticky top-[3.6rem] md:top-[4.2rem] z-30 -mx-1 px-1 py-1.5 rounded-2xl bg-background/90 backdrop-blur-md border border-border/40 shadow-sm" aria-label="بخش‌های اصلی">
          <div className="grid grid-cols-3 gap-1" role="tablist">
            {(
              [
                { id: 'builder' as const, label: 'پیشنهاد امروز', icon: Sparkles },
                { id: 'wardrobe' as const, label: 'کمد من', icon: Shirt },
                { id: 'outfits' as const, label: 'ست‌های شما', icon: Heart },
              ] as const
            ).map((tab) => {
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
                  onClick={() => setMainTab(tab.id)}
                  className={cn(
                    'flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-xl text-[11px] sm:text-sm font-extrabold transition-all min-h-[44px]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
                    active ? 'bg-gradient-gold text-white shadow-md' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {tab.label}
                  {tab.id === 'outfits' && suggestions.length > 0 && (
                    <span className={cn('text-[10px] tabular-nums', active ? 'text-white/90' : 'text-muted-foreground')} aria-label={`${suggestions.length} ست`}>
                      {suggestions.length.toLocaleString('fa-IR')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {(mainTab === 'start' || (mainTab === 'builder' && clothes.length < 2)) && (
          <section className="animate-fade-up rounded-3xl border border-gold/25 bg-gradient-card p-6 md:p-10 text-center shadow-soft" aria-labelledby="onboarding-title">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-button-gold" aria-hidden="true">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 id="onboarding-title" className="text-xl md:text-2xl font-display font-black mb-2">۳ قدم تا پیشنهاد امروز</h1>
            <ol className="text-sm text-muted-foreground space-y-2 max-w-sm mx-auto text-right mb-6">
              <li className="flex gap-2 items-start">
                <span className="w-6 h-6 rounded-full bg-gold/15 text-gold text-xs font-black flex items-center justify-center shrink-0" aria-hidden="true">۱</span>
                <span>چند لباس به کمد اضافه کنید (حداقل ۲ تا)</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="w-6 h-6 rounded-full bg-gold/15 text-gold text-xs font-black flex items-center justify-center shrink-0" aria-hidden="true">۲</span>
                <span>شرایط را انتخاب کنید و لباس‌ها را ببینید</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="w-6 h-6 rounded-full bg-gold/15 text-gold text-xs font-black flex items-center justify-center shrink-0" aria-hidden="true">۳</span>
                <span>تولید ست و در صورت تمایل پرو روی مانکن</span>
              </li>
            </ol>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={handleOpenAdd} variant="gold" size="lg" className="font-extrabold shadow-lg">
                <Plus className="w-5 h-5" aria-hidden="true" />
                افزودن اولین لباس
              </Button>
              <Button onClick={() => setIsBulkModalOpen(true)} variant="soft" size="lg" className="font-bold">
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
          <section id="outfit-builder" className="animate-fade-up relative scroll-mt-28" aria-labelledby="builder-title">
            <div className="text-center mb-3 max-w-xl mx-auto">
              <h1 id="builder-title" className="text-xl md:text-2xl font-display font-black tracking-tight">
                <span className="text-gradient-gold">ست‌ساز</span>
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">لباس انتخاب کنید، روی مانکن ببینید، ست بسازید</p>
            </div>
            <div className="relative rounded-[1.75rem] shadow-elevated ring-1 ring-gold/15 overflow-hidden">
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

        {mainTab === 'outfits' && suggestions.length > 0 && (
          <section className="animate-fade-up space-y-4" aria-labelledby="outfits-title">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 id="outfits-title" className="text-lg md:text-xl font-display font-black">ست‌های شما</h2>
              <span className="text-xs font-bold text-muted-foreground">
                {displayedSuggestions.length.toLocaleString('fa-IR')} از {suggestions.length.toLocaleString('fa-IR')}
              </span>
            </div>

            <div className="space-y-2.5" dir="rtl" role="group" aria-label="فیلتر ست‌ها">
              <div className="flex items-center gap-2 flex-wrap">
                <FilterChipGroup>
                  <FilterChip
                    pressed={showFavoritesOnly}
                    onPressedChange={setShowFavoritesOnly}
                    icon={<span>♥</span>}
                    activeClassName="bg-white text-rose shadow-sm dark:bg-rose dark:text-white"
                  >
                    علاقه
                  </FilterChip>
                  <FilterChip
                    pressed={outfitFilterLiked}
                    onPressedChange={setOutfitFilterLiked}
                    icon={<span>👍</span>}
                    activeClassName="bg-white text-emerald-700 shadow-sm dark:bg-emerald-600 dark:text-white"
                  >
                    لایک‌شده
                  </FilterChip>
                </FilterChipGroup>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearOutfitFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-extrabold text-muted-foreground hover:text-rose hover:bg-rose/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    ✕ پاک کردن
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <SegmentedControl
                  label="مناسبت"
                  value={outfitFilterStyle}
                  onChange={setOutfitFilterStyle}
                  options={[
                    { value: 'all', label: 'همه' },
                    { value: 'casual', label: 'روزمره' },
                    { value: 'formal', label: 'رسمی' },
                    { value: 'party', label: 'مهمانی' },
                  ]}
                />
                <SegmentedControl
                  label="مکان"
                  value={outfitFilterEnv}
                  onChange={setOutfitFilterEnv}
                  options={[
                    { value: 'all', label: 'همه' },
                    { value: 'office', label: 'محل کار' },
                    { value: 'gathering', label: 'دورهمی' },
                  ]}
                />
                <SegmentedControl
                  label="هوا"
                  value={outfitFilterWeather}
                  onChange={setOutfitFilterWeather}
                  options={[
                    { value: 'all', label: 'همه' },
                    { value: 'sunny', label: 'آفتابی' },
                    { value: 'rainy', label: 'بارانی' },
                    { value: 'cold', label: 'سرد' },
                  ]}
                />
              </div>
            </div>

            {displayedSuggestions.length === 0 ? (
              <div className="text-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 space-y-3" role="status">
                <p className="text-sm font-extrabold text-foreground">ستی با این فیلتر نیست</p>
                <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                  فیلتر را ساده‌تر کنید یا یک ست جدید با شرایط دلخواه تولید کنید.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button type="button" onClick={clearOutfitFilters} className="px-4 py-2 rounded-full text-xs font-extrabold bg-foreground text-background min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                    پاک کردن فیلترها
                  </button>
                  <button type="button" onClick={() => setMainTab('builder')} className="px-4 py-2 rounded-full text-xs font-extrabold border border-border/60 bg-background min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                    تولید ست جدید
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {displayedSuggestions.map((suggestion) => (
                  <OutfitSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onToggleFavorite={toggleFavorite}
                    onFeedback={(liked) => feedbackOutfit(suggestion, liked)}
                    onDelete={deleteSuggestion}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {!userId && clothes.length > 0 && (
          <section className="animate-fade-up stagger-4" aria-labelledby="login-cta-title">
            <div className="relative overflow-hidden rounded-[2rem] p-6 md:p-8 lg:p-10 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/15 via-white/60 to-rose/12" aria-hidden="true" />
              <div className="relative flex flex-col md:flex-row items-center justify-center gap-5 md:gap-8">
                <div className="relative shrink-0 animate-float" aria-hidden="true">
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-gold/20 blur-xl" />
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-gradient-gold shadow-button-gold flex items-center justify-center text-3xl md:text-4xl">🔒</div>
                </div>
                <div className="max-w-xl">
                  <h3 id="login-cta-title" className="text-xl md:text-2xl font-display font-black mb-2 md:mb-3 tracking-tight">ذخیره‌سازی ابری و امن لباس‌ها و ست‌های شما</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-5 md:mb-6 leading-relaxed">
                    با ورود، کمد و ست‌های شما در ابر می‌ماند و از هر دستگاهی در دسترس است.
                  </p>
                  <Button onClick={() => navigate('/auth')} variant="gold" size="xl" className="group relative overflow-hidden shadow-lg">
                    <LogIn className="w-5 h-5 relative" aria-hidden="true" />
                    <span className="relative font-extrabold">ورود یا ثبت‌نام فوری</span>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="h-24 md:h-12" aria-hidden="true" />
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

      <ClothingDetailsModal item={viewingItem} onClose={() => setViewingItem(null)} onEdit={handleOpenEdit} onDelete={handleRequestDelete} />
      <AddClothingModal isOpen={isModalOpen} onClose={handleCloseClothingModal} onAdd={addClothing} editingItem={editingItem} onEdit={updateClothing} />
      <BulkAddClothingModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onAdd={addClothing} />

      <AlertDialog open={Boolean(deletingItem)} onOpenChange={(open) => !open && !isDeleting && setDeletingItem(null)}>
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
