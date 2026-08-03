import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Sparkles, Wand2, RefreshCw, Image as ImageIcon, Save, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from './ImageUploader';
import { ImageCropDialog } from './ImageCropDialog';
import { ClothingCategory, ClothingItem } from '@/types/wardrobe';
import { uploadClothingImage, compressImage } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { autoDetectClothing, extractDominantColor, guessCategoryFromText, generateClothingName } from '@/lib/clothingAutoDetect';
import { CATEGORY_CONFIG, CATEGORY_CLOTHING_ORDER } from '@/lib/categoryConfig';

interface AddClothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<ClothingItem, 'id' | 'createdAt'>) => void;
  /** When provided, the modal runs in "edit mode" and pre-fills all the item's data. */
  editingItem?: ClothingItem | null;
  /** Called when the user saves changes while editing. Receives the id + patch object. */
  onEdit?: (id: string, updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>) => Promise<void> | void;
}

export const AddClothingModal: React.FC<AddClothingModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  editingItem = null,
  onEdit,
}) => {
  const isEditMode = Boolean(editingItem);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageChangedByUser, setImageChangedByUser] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('tops');
  const [color, setColor] = useState('');
  const [colorSwatch, setColorSwatch] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nameWasAutoFilled, setNameWasAutoFilled] = useState(false);
  const [categoryWasAutoFilled, setCategoryWasAutoFilled] = useState(false);
  const [colorWasAutoFilled, setColorWasAutoFilled] = useState(false);
  const [analyzeMethod, setAnalyzeMethod] = useState<'cloud' | 'local' | null>(null);
  const imageFileNameRef = useRef<string>('');
  /** Raw image before crop — shown in crop dialog */
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const pendingFileNameRef = useRef<string>('');

  // ============ Prefill for Edit mode ============
  useEffect(() => {
    if (!isOpen) return;

    // Reset transient UI state every time the modal is re-opened
    setIsUploading(false);
    setIsAnalyzing(false);
    setAnalyzeMethod(null);
    setNameWasAutoFilled(false);
    setCategoryWasAutoFilled(false);
    setColorWasAutoFilled(false);

    if (editingItem) {
      setImageFile(null);
      setImagePreview(editingItem.imageUrl || '');
      setImageChangedByUser(false);
      setName(editingItem.name || '');
      setCategory(editingItem.category || 'tops');
      setColor(editingItem.color || '');
      setColorSwatch(null);
      imageFileNameRef.current = editingItem.name || '';
    } else {
      // Clean Add mode
      setImageFile(null);
      setImagePreview('');
      setImageChangedByUser(false);
      setName('');
      setCategory('tops');
      setColor('');
      setColorSwatch(null);
      imageFileNameRef.current = '';
    }
  }, [isOpen, editingItem]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const applyAutoDetect = (result: { color?: string; category?: ClothingCategory; name?: string; swatch?: string | null; method: 'cloud' | 'local' }) => {
    let anyApplied = false;
    if (result.color && !colorWasAutoFilled && !color) {
      setColor(result.color);
      setColorWasAutoFilled(true);
      anyApplied = true;
    }
    if (result.swatch) {
      setColorSwatch(result.swatch);
    }
    if (result.category && !categoryWasAutoFilled) {
      setCategory(result.category);
      setCategoryWasAutoFilled(true);
      anyApplied = true;
    }
    if (result.name && !name) {
      setName(result.name);
      setNameWasAutoFilled(true);
      anyApplied = true;
    }
    if (anyApplied) {
      setAnalyzeMethod(result.method);
    }
  };

  const analyzeImage = async (dataUrl: string, fileName = '') => {
    setIsAnalyzing(true);
    setAnalyzeMethod(null);

    const cloudTimeoutMs = 2200;
    const cloudPromise = (async () => {
      try {
        const timeout = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), cloudTimeoutMs)
        );
        const invoke = supabase.functions.invoke('analyze-clothing', {
          body: { imageUrl: dataUrl },
        });
        const result = await Promise.race([invoke, timeout]);
        if (!result) return null;
        const { data, error } = result as any;
        if (error || data?.error || !data) return null;
        return {
          type: 'cloud' as const,
          category: data.category as ClothingCategory | undefined,
          color: data.color as string | undefined,
          name: data.name as string | undefined,
        };
      } catch {
        return null;
      }
    })();

    const localPromise = (async () => {
      try {
        const result = await autoDetectClothing(dataUrl, fileName);
        return {
          type: 'local' as const,
          category: result.category,
          color: result.color || undefined,
          name: result.name,
        };
      } catch {
        return null;
      }
    })();

    const cloudRes = await Promise.race([
      cloudPromise,
      new Promise<undefined>((r) => setTimeout(() => r(undefined), 1800)),
    ]);

    if (cloudRes && cloudRes.type === 'cloud') {
      let swatch: string | null = null;
      if (!cloudRes.color) {
        const colorRes = await extractDominantColor(dataUrl).catch(() => null);
        if (colorRes) {
          cloudRes.color = colorRes.colorName;
          swatch = `rgb(${colorRes.r}, ${colorRes.g}, ${colorRes.b})`;
        }
      }
      applyAutoDetect({
        color: cloudRes.color,
        category: cloudRes.category,
        name: cloudRes.name,
        swatch,
        method: 'cloud',
      });
      setTimeout(() => setIsAnalyzing(false), 400);
      return;
    }

    const localRes = await localPromise;
    if (localRes && localRes.type === 'local') {
      let swatch: string | null = null;
      try {
        const colorDetails = await extractDominantColor(dataUrl);
        swatch = `rgb(${colorDetails.r}, ${colorDetails.g}, ${colorDetails.b})`;
        if (!localRes.color) localRes.color = colorDetails.colorName;
      } catch {
        // ignore
      }
      applyAutoDetect({
        color: localRes.color,
        category: localRes.category,
        name: localRes.name,
        swatch,
        method: 'local',
      });
    }

    setTimeout(() => setIsAnalyzing(false), 400);
  };

  const handleImageSelect = (file: File) => {
    setImageChangedByUser(true);
    pendingFileNameRef.current = file.name || '';
    imageFileNameRef.current = file.name || '';

    // Lightweight category guess from filename only (before crop / AI)
    if (!editingItem) {
      const guessFromFile = guessCategoryFromText(file.name || '');
      if (!name) {
        const generatedName = generateClothingName(guessFromFile.category, '');
        if (generatedName) {
          setName(generatedName);
          setNameWasAutoFilled(true);
        }
      }
      if (!categoryWasAutoFilled) {
        setCategory(guessFromFile.category);
        setCategoryWasAutoFilled(true);
      }
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Crop BEFORE AI analysis so busy backgrounds don't reduce accuracy
      setCropSource(dataUrl);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropCancel = () => {
    setCropOpen(false);
    setCropSource(null);
    // Keep previous preview if user already had one; otherwise clear pending
    if (!imagePreview) {
      setImageFile(null);
    }
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropOpen(false);
    setCropSource(null);
    setImagePreview(croppedDataUrl);
    setImageChangedByUser(true);

    // Build a File from cropped JPEG for upload pipeline
    try {
      const res = await fetch(croppedDataUrl);
      const blob = await res.blob();
      const file = new File(
        [blob],
        (pendingFileNameRef.current || 'clothing').replace(/\.[^.]+$/, '') + '-cropped.jpg',
        { type: 'image/jpeg' }
      );
      setImageFile(file);
      imageFileNameRef.current = file.name;
      await analyzeImage(croppedDataUrl, file.name);
    } catch (e) {
      console.error(e);
      // Still analyze with data URL even if File build fails
      await analyzeImage(croppedDataUrl, pendingFileNameRef.current);
    }
  };

  const handleReanalyze = async () => {
    if (!imagePreview) return;
    setColorWasAutoFilled(false);
    setCategoryWasAutoFilled(false);
    setNameWasAutoFilled(false);
    await analyzeImage(imagePreview, imageFileNameRef.current);
    toast({
      title: 'تحلیل مجدد انجام شد',
      description: 'اطلاعات لباس با هوش مصنوعی به‌روز شد',
    });
  };

  const handleSubmit = async () => {
    if (!name) {
      toast({
        title: 'خطا',
        description: 'لطفا نام لباس را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    if (!isEditMode && !imageFile) {
      toast({
        title: 'خطا',
        description: 'لطفا تصویر لباس را انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    if (isEditMode && !imagePreview) {
      toast({
        title: 'خطا',
        description: 'لباس باید تصویر داشته باشد',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      let finalImageUrl = imagePreview;

      // Upload a new image ONLY when user actually selected a new file
      if (imageChangedByUser && imageFile && userId) {
        const compressedBlob = await compressImage(imageFile);
        const compressedFile = new File([compressedBlob], imageFile.name, {
          type: 'image/jpeg',
        });
        finalImageUrl = await uploadClothingImage(compressedFile, userId);
      }

      if (isEditMode && editingItem && onEdit) {
        await onEdit(editingItem.id, {
          name,
          category,
          color: color || undefined,
          ...(imageChangedByUser ? { imageUrl: finalImageUrl } : {}),
        });
      } else if (!isEditMode) {
        onAdd({
          name,
          category,
          imageUrl: finalImageUrl,
          color: color || undefined,
        });
      }

      // Reset form & close
      setImageFile(null);
      setImagePreview('');
      setImageChangedByUser(false);
      setName('');
      setCategory('tops');
      setColor('');
      setColorSwatch(null);
      setNameWasAutoFilled(false);
      setCategoryWasAutoFilled(false);
      setColorWasAutoFilled(false);
      setAnalyzeMethod(null);
      imageFileNameRef.current = '';
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'مشکلی پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading && !cropOpen) {
      setImageFile(null);
      setImagePreview('');
      setImageChangedByUser(false);
      setName('');
      setCategory('tops');
      setColor('');
      setColorSwatch(null);
      setNameWasAutoFilled(false);
      setCategoryWasAutoFilled(false);
      setColorWasAutoFilled(false);
      setAnalyzeMethod(null);
      imageFileNameRef.current = '';
      setCropOpen(false);
      setCropSource(null);
      onClose();
    }
  };

  // Crop dialog can stay mounted while main modal is open
  const cropDialog = (
    <ImageCropDialog
      open={cropOpen}
      imageSrc={cropSource}
      aspect={4 / 5}
      onCancel={handleCropCancel}
      onComplete={(url) => void handleCropComplete(url)}
    />
  );

  if (!isOpen) {
    return cropOpen ? cropDialog : null;
  }

  return (
    <>


    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/60 backdrop-blur-md animate-fade-in"
        onClick={handleClose}
      />

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-20 left-1/4 w-80 h-80 rounded-full opacity-25 animate-blob"
          style={{ background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-20 right-1/4 w-72 h-72 rounded-full opacity-20 animate-blob animation-delay-2000"
          style={{ background: 'radial-gradient(circle, hsl(var(--rose)) 0%, transparent 70%)' }}
        />
      </div>

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto animate-scale-in">
        <div className="relative bg-gradient-card hairline-border rounded-3xl shadow-elevated overflow-hidden backdrop-blur-xl">
          {/* Top accent strip (different for edit mode) */}
          <div className={`h-1.5 w-full ${isEditMode ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500' : 'bg-gradient-gold'}`} />

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div
                    className={`absolute -inset-1 rounded-2xl blur-lg animate-glow-pulse ${
                      isEditMode
                        ? 'bg-gradient-to-br from-indigo-500/40 via-purple-500/30 to-rose-500/40'
                        : 'bg-gradient-gold/30'
                    }`}
                  />
                  <div
                    className={`relative w-12 h-12 rounded-2xl shadow-button-gold flex items-center justify-center ${
                      isEditMode
                        ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 shadow-purple-500/25'
                        : 'bg-gradient-gold'
                    }`}
                  >
                    {isEditMode ? (
                      <Pencil className="w-6 h-6 text-white" strokeWidth={2.2} />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-white" strokeWidth={2.2} />
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-[26px] font-display font-black tracking-tight">
                    {isEditMode ? 'ویرایش لباس' : 'افزودن لباس جدید'}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {isEditMode
                      ? 'اطلاعات لباس را به دلخواه تغییر دهید و ذخیره کنید'
                      : 'هوش مصنوعی به شما کمک می‌کند تا فرم را سریع تکمیل کنید ✨'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                disabled={isUploading}
                className="shrink-0 p-2 rounded-xl hover:bg-rose/10 hover:text-rose transition-all duration-300 disabled:opacity-50 hover:scale-110"
              >
                <X className="w-5 h-5" strokeWidth={2.4} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Image Uploader */}
              <div>
                <ImageUploader
                  onFileSelect={handleImageSelect}
                  currentImage={imagePreview}
                  onRemove={() => {
                    setImageFile(null);
                    setImageChangedByUser(true);
                    if (!isEditMode) {
                      setImagePreview('');
                    }
                    setNameWasAutoFilled(false);
                    setCategoryWasAutoFilled(false);
                    setColorWasAutoFilled(false);
                    setColorSwatch(null);
                    setAnalyzeMethod(null);
                  }}
                  label={isEditMode ? 'تصویر لباس (برای تغییر روی تصویر ضربه بزنید)' : 'عکس لباس'}
                  aspectRatio="square"
                  disabled={isUploading}
                />
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  پس از انتخاب عکس، مرحله{' '}
                  <span className="font-extrabold text-foreground/80">برش</span> باز می‌شود تا لباس در
                  کادر باشد و پس‌زمینه شلوغ دقت تشخیص AI را کم نکند.
                </p>

                {/* Analyzing status bar */}
                <div className="mt-3 min-h-[44px]">
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-br from-gold/12 via-white/70 to-amber-50/80 border border-gold/30 animate-pulse">
                      <div className="relative">
                        <Loader2 className="w-5 h-5 text-gold animate-spin" />
                        <div className="absolute inset-0 blur-md bg-gold/40 rounded-full animate-ping" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="text-xs sm:text-sm font-extrabold text-gold">
                          در حال تحلیل تصویر با هوش مصنوعی...
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                          تشخیص رنگ، دسته و پیشنهاد نام
                        </span>
                      </div>
                    </div>
                  ) : imagePreview && analyzeMethod ? (
                    <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-white/80 to-teal-50/90 border border-emerald-500/20">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
                          {analyzeMethod === 'cloud' ? (
                            <Sparkles className="w-4 h-4" strokeWidth={2.6} />
                          ) : (
                            <Wand2 className="w-4 h-4" strokeWidth={2.6} />
                          )}
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="text-xs sm:text-sm font-extrabold text-emerald-700">
                            تشخیص خودکار انجام شد
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {analyzeMethod === 'cloud'
                              ? 'با سرور ابری ☁️'
                              : 'به صورت محلی روی دستگاه شما 🪄'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleReanalyze}
                        disabled={isUploading}
                        className="shrink-0 inline-flex items-center gap-1 pl-2.5 pr-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-black text-emerald-700 hover:bg-emerald-500/15 hover:text-emerald-800 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                        title="تحلیل مجدد تصویر"
                      >
                        <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.4} />
                        بازتحلیل
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold mb-2">
                  <span>نام لباس</span>
                  {nameWasAutoFilled && !isEditMode && (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gold font-black">
                      <Sparkles className="w-3 h-3" />
                      پیشنهاد AI
                    </span>
                  )}
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-gold opacity-0 blur-md group-focus-within:opacity-40 transition-opacity duration-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameWasAutoFilled(false);
                    }}
                    placeholder="مثال: پیراهن آبی نخی"
                    maxLength={60}
                    disabled={isUploading}
                    className={cn(
                      'relative w-full px-4 py-3 rounded-2xl outline-none transition-all duration-400 font-medium text-sm sm:text-[15px]',
                      'bg-gradient-card hairline-border shadow-soft',
                      'placeholder:text-muted-foreground/60',
                      'hover:shadow-card hover:border-gold/30',
                      'focus:shadow-[hsl(42,85%,45%)/0.18] focus:border-gold/50 focus:bg-white/90',
                      'disabled:opacity-50'
                    )}
                  />
                </div>
              </div>

              {/* Color Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold mb-2">
                  <span>رنگ</span>
                  {colorWasAutoFilled && !isEditMode && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs bg-gradient-to-br from-gold/15 to-amber-100/50 border border-gold/30 text-gold font-black">
                      <Sparkles className="w-3 h-3" />
                      پیشنهاد AI
                    </span>
                  )}
                </label>
                <div className="relative group">
                  {colorSwatch && (
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full shadow-lg ring-2 ring-white shrink-0"
                        style={{ background: colorSwatch }}
                        title="رنگ تشخیص داده شده"
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => {
                      setColor(e.target.value);
                      setColorWasAutoFilled(false);
                    }}
                    placeholder="مثال: آبی نفتی، مشکی، طلایی..."
                    maxLength={30}
                    disabled={isUploading}
                    className={cn(
                      'relative w-full rounded-2xl px-4 py-3 outline-none transition-all duration-400 font-medium text-sm sm:text-[15px]',
                      colorSwatch ? 'pr-16 sm:pr-20' : '',
                      'bg-gradient-card hairline-border shadow-soft',
                      'placeholder:text-muted-foreground/60',
                      'hover:shadow-card hover:border-gold/30',
                      'focus:shadow-[hsl(42,85%,45%)/0.18] focus:border-gold/50 focus:bg-white/90',
                      'disabled:opacity-50'
                    )}
                  />
                </div>
              </div>

              {/* Category Picker */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold mb-2.5">
                  <span>دسته‌بندی</span>
                  {categoryWasAutoFilled && !isEditMode && (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gold font-black">
                      <Sparkles className="w-3 h-3" />
                      پیشنهاد AI
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORY_CLOTHING_ORDER.map((catKey) => {
                    const cat = CATEGORY_CONFIG[catKey];
                    const Icon = cat.icon;
                    const active = category === catKey;
                    return (
                      <button
                        key={catKey}
                        onClick={() => {
                          setCategory(catKey);
                          setCategoryWasAutoFilled(false);
                        }}
                        disabled={isUploading}
                        className={cn(
                          'group relative overflow-hidden flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm sm:text-[15px] font-extrabold transition-all duration-400 disabled:opacity-50',
                          active
                            ? 'text-white shadow-card scale-[1.02]'
                            : 'text-foreground/80 bg-gradient-card hairline-border hover:border-gold/40 hover:shadow-soft hover:text-foreground hover:-translate-y-0.5'
                        )}
                      >
                        {active && (
                          <div
                            className={
                              isEditMode
                                ? 'absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500'
                                : 'absolute inset-0'
                            }
                            style={
                              isEditMode
                                ? undefined
                                : { background: `linear-gradient(135deg, ${cat.hexFrom} 0%, ${cat.hexTo} 100%)` }
                            }
                          />
                        )}
                        <span
                          className={cn(
                            'relative w-5 h-5 transition-transform duration-400',
                            active ? 'scale-110 drop-shadow' : 'group-hover:scale-110'
                          )}
                        >
                          <Icon className="w-full h-full" />
                        </span>
                        <span className="relative">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={
                  (isEditMode ? !name : !imageFile || !name) || isUploading
                }
                variant={isEditMode ? 'elegant' : 'gold'}
                size="xl"
                className="w-full mt-2 group relative overflow-hidden shadow-lg"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin relative" />
                    <span className="relative font-extrabold">
                      {isEditMode ? 'در حال ذخیره تغییرات...' : 'در حال ذخیره در کمد...'}
                    </span>
                  </>
                ) : (
                  <>
                    {isEditMode ? (
                      <Save className="w-5 h-5 relative" />
                    ) : (
                      <Sparkles className="w-5 h-5 relative" />
                    )}
                    <span className="relative font-extrabold">
                      {isEditMode ? 'ذخیره تغییرات لباس' : 'افزودن به کمد رویایی'}
                    </span>
                  </>
                )}
              </Button>

              {!userId && (
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-2xl bg-rose/5 border border-rose/20">
                  <div className="w-8 h-8 rounded-xl bg-rose/10 flex items-center justify-center text-base shrink-0">
                    🔒
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    برای ذخیره دائمی لباس‌ها در ابر و دسترسی از هر دستگاه،
                    <span className="mx-1 text-rose font-black">وارد حساب خود شوید</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    {cropDialog}
    </>
    );
};
