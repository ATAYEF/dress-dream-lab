import { useRef, useCallback, useEffect } from 'react';

/**
 * Smooth horizontal drag-to-scroll.
 * Uses requestAnimationFrame + document-level mouse listeners
 * so dragging continues even when the cursor leaves the element.
 */
export function useSmoothDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const targetScroll = useRef(0);
  const moved = useRef(false);
  const raf = useRef<number | null>(null);

  const tick = useCallback(() => {
    if (ref.current) {
      ref.current.scrollLeft = targetScroll.current;
    }
    raf.current = null;
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    // Only primary button
    if (e.button !== 0) return;
    dragging.current = true;
    moved.current = false;
    startX.current = e.pageX;
    scrollStart.current = el.scrollLeft;
    targetScroll.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
    el.style.scrollBehavior = 'auto';
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !ref.current) return;
      e.preventDefault();
      const dx = e.pageX - startX.current;
      if (Math.abs(dx) > 4) moved.current = true;
      targetScroll.current = scrollStart.current - dx * 1.25;
      if (raf.current == null) {
        raf.current = requestAnimationFrame(tick);
      }
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      if (ref.current) {
        ref.current.style.cursor = 'grab';
        ref.current.style.userSelect = '';
        ref.current.style.scrollBehavior = 'smooth';
      }
      if (raf.current != null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };

    document.addEventListener('mousemove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [tick]);

  return { ref, onMouseDown, moved };
}
