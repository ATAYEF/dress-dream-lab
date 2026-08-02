import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface AiImageViewerProps {
  src: string;
  alt?: string;
  onClose?: () => void;
  className?: string;
}

/**
 * Zoomable / rotatable viewer for the AI generated try-on image.
 * Supports wheel + trackpad pinch zoom (anchored at the cursor), drag pan
 * and 90° rotation steps.
 */
const AiImageViewer = ({ src, alt = '', onClose, className }: AiImageViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const reset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  }, []);

  // reset when a new image arrives
  useEffect(() => {
    reset();
  }, [src, reset]);

  // zoom anchored at a point inside the container
  const zoomAt = useCallback((next: number, px: number, py: number) => {
    setZoom((prevZoom) => {
      const clamped = clamp(next, MIN_ZOOM, MAX_ZOOM);
      const k = clamped / prevZoom;
      setOffset((prev) => ({
        x: px - (px - prev.x) * k,
        y: py - (py - prev.y) * k,
      }));
      return clamped;
    });
  }, []);

  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // native non-passive wheel listener (React onWheel is passive)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = el.getBoundingClientRect();
      zoomAtRef.current(
        zoomRef.current * Math.exp(-dy * 0.0018),
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomFromCenter = (factor: number) => {
    const el = containerRef.current;
    const rect = el?.getBoundingClientRect();
    zoomAt(zoom * factor, (rect?.width ?? 0) / 2, (rect?.height ?? 0) / 2);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };

  const endDrag = () => setIsDragging(false);

  return (
    <div className={cn('absolute inset-0 z-40 animate-fade-in bg-background', className)}>
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onDoubleClick={() => (zoom > 1 ? reset() : zoomFromCenter(2))}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="w-full h-full object-cover select-none will-change-transform"
          style={{
            transformOrigin: '0 0',
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
          }}
        />
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 left-2 z-50 inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur px-2.5 py-1 text-[10px] font-black shadow-lg hairline-border"
        >
          <X className="w-3 h-3" />
          بازگشت به مانکن
        </button>
      )}

      <div className="absolute bottom-2 right-2 z-50 flex items-center gap-0.5 rounded-full bg-background/90 backdrop-blur px-1.5 py-1 shadow-lg hairline-border">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomFromCenter(1 / 1.25)} disabled={zoom <= MIN_ZOOM} aria-label="کوچک‌نمایی">
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <span className="text-[10px] font-black min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomFromCenter(1.25)} disabled={zoom >= MAX_ZOOM} aria-label="بزرگ‌نمایی">
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <span className="w-px h-4 bg-border mx-0.5" />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRotation((r) => r - 90)} aria-label="چرخش به چپ">
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRotation((r) => r + 90)} aria-label="چرخش به راست">
          <RotateCw className="w-3.5 h-3.5" />
        </Button>
        {(zoom !== 1 || rotation !== 0 || offset.x !== 0 || offset.y !== 0) && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset} aria-label="بازنشانی">
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default AiImageViewer;
