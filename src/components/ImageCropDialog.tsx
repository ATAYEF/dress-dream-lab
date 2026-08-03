import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCroppedDataUrl } from '@/lib/cropImage';
import { cn } from '@/lib/utils';

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  /** Output aspect width/height — clothing cards use ~4/5 */
  aspect?: number;
  title?: string;
  description?: string;
  onCancel: () => void;
  onComplete: (croppedDataUrl: string) => void;
}

/**
 * Crop step before AI analysis / upload.
 * Pans & zooms inside a fixed aspect frame so busy backgrounds are removed.
 */
export const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  open,
  imageSrc,
  aspect = 4 / 5,
  title = 'برش تصویر لباس',
  description = 'لباس را داخل کادر قرار دهید تا پس‌زمینه شلوغ حذف شود و تشخیص دقیق‌تر شود',
  onCancel,
  onComplete,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [busy, setBusy] = useState(false);
  const [vpSize, setVpSize] = useState({ w: 280, h: 350 });

  useEffect(() => {
    if (!open) return;
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setVpSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setVpSize({ w: r.width, h: r.height });
    return () => ro.disconnect();
  }, [open, imageSrc]);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const layout = useMemo(() => {
    if (!natural.w || !vpSize.w) {
      return { imgW: 0, imgH: 0, cropW: 0, cropH: 0, cover: 1 };
    }
    let cropW = vpSize.w;
    let cropH = cropW / aspect;
    if (cropH > vpSize.h) {
      cropH = vpSize.h;
      cropW = cropH * aspect;
    }
    const cover = Math.max(cropW / natural.w, cropH / natural.h);
    return {
      imgW: natural.w * cover * zoom,
      imgH: natural.h * cover * zoom,
      cropW,
      cropH,
      cover,
    };
  }, [natural, vpSize, aspect, zoom]);

  const clampOffset = useCallback(
    (x: number, y: number, imgW: number, imgH: number, cropW: number, cropH: number) => {
      const maxX = Math.max(0, (imgW - cropW) / 2);
      const maxY = Math.max(0, (imgH - cropH) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    []
  );

  useEffect(() => {
    if (!layout.imgW || !layout.cropW) return;
    setOffset((prev) =>
      clampOffset(prev.x, prev.y, layout.imgW, layout.imgH, layout.cropW, layout.cropH)
    );
  }, [layout.imgW, layout.imgH, layout.cropW, layout.cropH, clampOffset]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !layout.cropW) return;
    setOffset(
      clampOffset(
        dragStart.current.ox + (e.clientX - dragStart.current.x),
        dragStart.current.oy + (e.clientY - dragStart.current.y),
        layout.imgW,
        layout.imgH,
        layout.cropW,
        layout.cropH
      )
    );
  };

  const onPointerUp = () => setDragging(false);

  const handleConfirm = async () => {
    if (!imageSrc || !layout.cropW || !natural.w) return;
    setBusy(true);
    try {
      const { imgW, imgH, cropW, cropH, cover } = layout;
      const imgLeftInCrop = (cropW - imgW) / 2 + offset.x;
      const imgTopInCrop = (cropH - imgH) / 2 + offset.y;
      const scale = 1 / (cover * zoom);
      const x = Math.max(0, -imgLeftInCrop * scale);
      const y = Math.max(0, -imgTopInCrop * scale);
      const width = Math.min(natural.w - x, cropW * scale);
      const height = Math.min(natural.h - y, cropH * scale);

      const dataUrl = await getCroppedDataUrl(imageSrc, {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height)),
      });
      onComplete(dataUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={() => !busy && onCancel()} />

      <div className="relative w-full max-w-lg rounded-3xl bg-background shadow-elevated border border-border/60 overflow-hidden animate-fade-up">
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-display text-lg font-black">{title}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">{description}</p>
        </div>

        <div className="px-4 pb-2">
          <div
            ref={viewportRef}
            className={cn(
              'relative mx-auto w-full max-w-[320px] aspect-[4/5] rounded-2xl overflow-hidden',
              'bg-neutral-900/90 touch-none select-none',
              dragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {imageSrc && layout.imgW > 0 && (
              <img
                src={imageSrc}
                alt="برای برش"
                draggable={false}
                className="absolute pointer-events-none max-w-none"
                style={{
                  width: layout.imgW,
                  height: layout.imgH,
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
            )}
            <div className="pointer-events-none absolute inset-3 border border-white/40 rounded-xl" />
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-white/20" />
            <div className="pointer-events-none absolute inset-y-8 left-1/2 w-px bg-white/20" />
            <p className="pointer-events-none absolute bottom-2 inset-x-0 text-center text-[10px] text-white/80 font-bold">
              بکشید تا جابه‌جا شود
            </p>
          </div>

          <div className="flex items-center gap-2 mt-3 max-w-[320px] mx-auto">
            <button
              type="button"
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 touch-manipulation min-h-[40px] min-w-[40px]"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.15).toFixed(2)))}
              aria-label="کوچک‌نمایی"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[hsl(var(--gold))]"
              aria-label="بزرگ‌نمایی"
            />
            <button
              type="button"
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 touch-manipulation min-h-[40px] min-w-[40px]"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))}
              aria-label="بزرگ‌نمایی"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 touch-manipulation min-h-[40px] min-w-[40px]"
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              aria-label="بازنشانی"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-row gap-2 p-4 border-t border-border/50">
          <Button
            type="button"
            variant="gold"
            className="flex-1 min-h-[44px] font-extrabold"
            disabled={busy || !imageSrc}
            onClick={() => void handleConfirm()}
          >
            <Check className="w-4 h-4" />
            {busy ? 'در حال برش...' : 'تأیید و ادامه'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-h-[44px] font-bold"
            disabled={busy}
            onClick={onCancel}
          >
            <X className="w-4 h-4" />
            انصراف
          </Button>
        </div>
      </div>
    </div>
  );
};
