import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Upload,
  Loader2,
  Check,
  AlertCircle,
  Trash2,
  Sparkles,
  Images,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClothingCategory, ClothingItem } from '@/types/wardrobe';
import { CATEGORY_CONFIG, CATEGORY_CLOTHING_ORDER } from '@/lib/categoryConfig';
import { analyzeClothingImage } from '@/lib/analyzeClothingImage';
import { autoCenterCropDataUrl } from '@/lib/cropImage';
import { uploadClothingImage, compressImage } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ItemStatus = 'queued' | 'processing' | 'ready' | 'error' | 'saving' | 'saved';

interface BulkItem {
  id: string;
  fileName: string;
  preview: string;
  status: ItemStatus;
  error?: string;
  name: string;
  category: ClothingCategory;
  color: string;
}

interface BulkAddClothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<ClothingItem, 'id' | 'createdAt'>) => void | Promise<void>;
}

const MAX_FILES = 20;
const MAX_SIZE = 10 * 1024 * 1024;
const CONCURRENCY = 2;

function uid() {
  return `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export const BulkAddClothingModal: React.FC<BulkAddClothingModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<BulkItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
  }, [isOpen]);

  const updateItem = useCallback((id: string, patch: Partial<BulkItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const itemsRef = useRef<BulkItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    const runBatch = async () => {
      const snapshot = itemsRef.current;
      const ids = snapshot.filter((i) => i.status === 'queued').map((i) => i.id);
      if (ids.length === 0) return false;

      let cursor = 0;
      const workers = Array.from({ length: CONCURRENCY }, async () => {
        while (cursor < ids.length) {
          const idx = cursor++;
          const id = ids[idx];
          const current = itemsRef.current.find((x) => x.id === id);
          if (!current || current.status !== 'queued') continue;

          updateItem(id, { status: 'processing', error: undefined });
          try {
            const cropped = await autoCenterCropDataUrl(current.preview, 4 / 5, 1024);
            const result = await analyzeClothingImage(cropped, current.fileName);
            updateItem(id, {
              status: 'ready',
              preview: cropped,
              name: result.name || current.name || 'لباس',
              category: result.category || 'tops',
              color: result.color || '',
            });
          } catch (e) {
            updateItem(id, {
              status: 'error',
              error: e instanceof Error ? e.message : 'خطا در تحلیل',
            });
          }
        }
      });
      await Promise.all(workers);
      return itemsRef.current.some((i) => i.status === 'queued');
    };

    try {
      // Drain queue; new files may arrive while processing
      while (await runBatch()) {
        /* continue */
      }
    } finally {
      processingRef.current = false;
      // If something was queued after we released the lock, run again
      if (itemsRef.current.some((i) => i.status === 'queued')) {
        queueMicrotask(() => void processQueue());
      }
    }
  }, [updateItem]);

  const addFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length === 0) {
      toast({ title: 'فایل تصویری انتخاب نشد', variant: 'destructive' });
      return;
    }

    const room = MAX_FILES - items.length;
    if (room <= 0) {
      toast({
        title: 'سقف تعداد',
        description: `حداکثر ${MAX_FILES.toLocaleString('fa-IR')} عکس در هر بار`,
        variant: 'destructive',
      });
      return;
    }

    const slice = arr.slice(0, room);
    const oversized = slice.filter((f) => f.size > MAX_SIZE);
    if (oversized.length) {
      toast({
        title: 'حجم زیاد',
        description: `${oversized.length.toLocaleString('fa-IR')} فایل بیشتر از ۱۰MB نادیده گرفته شد`,
      });
    }

    const valid = slice.filter((f) => f.size <= MAX_SIZE);
    const next: BulkItem[] = [];
    for (const file of valid) {
      try {
        const preview = await readFileAsDataUrl(file);
        next.push({
          id: uid(),
          fileName: file.name,
          preview,
          status: 'queued',
          name: '',
          category: 'tops',
          color: '',
        });
      } catch {
        /* skip unreadable */
      }
    }

    if (next.length === 0) return;

    setItems((prev) => [...prev, ...next]);
    queueMicrotask(() => void processQueue());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) void addFiles(e.target.files);
    e.target.value = '';
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const retryItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    updateItem(id, { status: 'queued', error: undefined });
    const refreshed = items.map((i) =>
      i.id === id ? { ...i, status: 'queued' as const, error: undefined } : i
    );
    setItems(refreshed);
    processingRef.current = false;
    queueMicrotask(() => void processQueue());
  };

  const readyItems = items.filter((i) => i.status === 'ready');
  const busyCount = items.filter((i) => i.status === 'queued' || i.status === 'processing').length;

  const saveOne = async (item: BulkItem): Promise<boolean> => {
    updateItem(item.id, { status: 'saving' });
    try {
      let imageUrl = item.preview;
      if (userId) {
        const res = await fetch(item.preview);
        const blob = await res.blob();
        const file = new File([blob], `${item.name || 'clothing'}.jpg`, { type: 'image/jpeg' });
        const compressed = await compressImage(file);
        const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' });
        imageUrl = await uploadClothingImage(compressedFile, userId);
      }
      await onAdd({
        name: item.name.trim() || 'لباس',
        category: item.category,
        imageUrl,
        color: item.color.trim() || undefined,
      });
      updateItem(item.id, { status: 'saved' });
      return true;
    } catch (e) {
      updateItem(item.id, {
        status: 'error',
        error: e instanceof Error ? e.message : 'خطا در ذخیره',
      });
      return false;
    }
  };

  const handleSaveAll = async () => {
    if (readyItems.length === 0 || savingAll) return;
    setSavingAll(true);
    let ok = 0;
    for (const item of readyItems) {
      // re-read from state status via saveOne using current item snapshot
      const success = await saveOne(item);
      if (success) ok += 1;
    }
    setSavingAll(false);
    toast({
      title: 'افزودن دسته‌جمعی',
      description: `${ok.toLocaleString('fa-IR')} لباس به کمد اضافه شد`,
    });
    if (ok > 0) {
      setItems((prev) => prev.filter((i) => i.status !== 'saved'));
    }
  };

  const handleClose = () => {
    if (savingAll || busyCount > 0) {
      if (!window.confirm('پردازش هنوز تمام نشده. بستن مودال؟')) return;
    }
    setItems([]);
    processingRef.current = false;
    onClose();
  };

  if (!isOpen) return null;

  const statusLabel: Record<ItemStatus, string> = {
    queued: 'در صف',
    processing: 'در حال آنالیز…',
    ready: 'آماده',
    error: 'خطا',
    saving: 'در حال ذخیره…',
    saved: 'ذخیره شد',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" onClick={handleClose} />

      <div className="relative w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-gradient-card hairline-border shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-border/50 shrink-0">
          <div>
            <h2 className="font-display text-lg font-black flex items-center gap-2">
              <Images className="w-5 h-5 text-gold" />
              افزودن دسته‌جمعی
            </h2>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              چند عکس را یکجا انتخاب کنید — هر کدام جدا آنالیز و آماده ذخیره می‌شود
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-muted touch-manipulation"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pick files */}
        <div className="px-4 pt-3 shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={items.length >= MAX_FILES || savingAll}
            className={cn(
              'w-full flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 border-dashed transition-colors',
              'border-gold/40 bg-gold/5 hover:bg-gold/10 hover:border-gold/60',
              'disabled:opacity-50'
            )}
          >
            <Upload className="w-7 h-7 text-gold" />
            <span className="text-sm font-extrabold">انتخاب چند عکس از گالری</span>
            <span className="text-[11px] text-muted-foreground">
              حداکثر {MAX_FILES.toLocaleString('fa-IR')} فایل · هر فایل تا ۱۰MB
            </span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-[120px]">
          {items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              هنوز عکسی اضافه نشده است
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex gap-3 p-2.5 rounded-2xl border bg-white/70 dark:bg-white/5 shadow-sm',
                  item.status === 'error' && 'border-destructive/40',
                  item.status === 'ready' && 'border-emerald-500/30',
                  item.status === 'saved' && 'border-emerald-500/50 opacity-70'
                )}
              >
                <img
                  src={item.preview}
                  alt=""
                  className="w-16 h-20 rounded-xl object-cover shrink-0 bg-muted"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'text-[10px] font-black px-2 py-0.5 rounded-full',
                        item.status === 'processing' && 'bg-gold/15 text-gold',
                        item.status === 'ready' && 'bg-emerald-500/15 text-emerald-700',
                        item.status === 'error' && 'bg-destructive/10 text-destructive',
                        item.status === 'queued' && 'bg-muted text-muted-foreground',
                        item.status === 'saving' && 'bg-indigo-500/10 text-indigo-600',
                        item.status === 'saved' && 'bg-emerald-500/20 text-emerald-700'
                      )}
                    >
                      {item.status === 'processing' || item.status === 'saving' ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {statusLabel[item.status]}
                        </span>
                      ) : item.status === 'ready' || item.status === 'saved' ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {statusLabel[item.status]}
                        </span>
                      ) : item.status === 'error' ? (
                        <span className="inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {statusLabel[item.status]}
                        </span>
                      ) : (
                        statusLabel[item.status]
                      )}
                    </span>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                      disabled={item.status === 'saving'}
                      aria-label="حذف از لیست"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(item.status === 'ready' || item.status === 'error') && (
                    <>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value, status: item.status === 'error' ? 'ready' : item.status })}
                        placeholder="نام لباس"
                        className="w-full text-sm font-bold rounded-xl px-2.5 py-1.5 bg-background/80 border border-border/50 outline-none focus:ring-2 focus:ring-gold/30"
                        disabled={item.status === 'saving' || item.status === 'saved'}
                      />
                      <div className="flex gap-2">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateItem(item.id, {
                              category: e.target.value as ClothingCategory,
                            })
                          }
                          className="flex-1 text-xs font-bold rounded-xl px-2 py-1.5 bg-background/80 border border-border/50"
                          disabled={item.status === 'saving' || item.status === 'saved'}
                        >
                          {CATEGORY_CLOTHING_ORDER.map((k) => (
                            <option key={k} value={k}>
                              {CATEGORY_CONFIG[k].label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.color}
                          onChange={(e) => updateItem(item.id, { color: e.target.value })}
                          placeholder="رنگ"
                          className="w-24 text-xs font-bold rounded-xl px-2 py-1.5 bg-background/80 border border-border/50 outline-none"
                          disabled={item.status === 'saving' || item.status === 'saved'}
                        />
                      </div>
                    </>
                  )}

                  {item.status === 'error' && item.error && (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-destructive font-medium truncate">{item.error}</p>
                      <button
                        type="button"
                        className="text-[10px] font-extrabold text-gold underline shrink-0"
                        onClick={() => void retryItem(item.id)}
                      >
                        تلاش مجدد
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border/50 p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-bold">
            <span>
              {items.length.toLocaleString('fa-IR')} عکس ·{' '}
              {readyItems.length.toLocaleString('fa-IR')} آماده
            </span>
            {busyCount > 0 && (
              <span className="inline-flex items-center gap-1 text-gold">
                <Loader2 className="w-3 h-3 animate-spin" />
                {busyCount.toLocaleString('fa-IR')} در حال پردازش
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="gold"
              className="flex-1 min-h-[44px] font-extrabold"
              disabled={readyItems.length === 0 || savingAll || busyCount > 0}
              onClick={() => void handleSaveAll()}
            >
              {savingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ذخیره…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  ذخیره {readyItems.length > 0 ? readyItems.length.toLocaleString('fa-IR') : ''} لباس
                </>
              )}
            </Button>
            <Button variant="outline" className="min-h-[44px] font-bold" onClick={handleClose}>
              بستن
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
