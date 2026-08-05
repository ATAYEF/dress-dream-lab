/**
 * Client-side clothing background removal for outfit preview.
 * Tuned for product-style photos (light / studio / near-uniform BG).
 * Results are cached in-memory by source URL.
 */

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const MAX_EDGE = 512;

function colorDist(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Needed for canvas when src is cross-origin (may fail → caller falls back)
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

/**
 * Remove near-uniform background; returns PNG data URL with alpha.
 * Falls back to original src on failure.
 */
export async function removeClothingBackground(src: string): Promise<string> {
  if (!src) return src;
  if (cache.has(src)) return cache.get(src)!;
  if (inflight.has(src)) return inflight.get(src)!;

  const job = (async () => {
    try {
      const img = await loadImage(src);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return src;

      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;

      // Sample background from corners + edge midpoints
      const samples: [number, number][] = [
        [2, 2],
        [w - 3, 2],
        [2, h - 3],
        [w - 3, h - 3],
        [Math.floor(w / 2), 2],
        [Math.floor(w / 2), h - 3],
        [2, Math.floor(h / 2)],
        [w - 3, Math.floor(h / 2)],
      ];

      const rs: number[] = [];
      const gs: number[] = [];
      const bs: number[] = [];
      for (const [x, y] of samples) {
        const i = (y * w + x) * 4;
        rs.push(d[i]);
        gs.push(d[i + 1]);
        bs.push(d[i + 2]);
      }
      const mid = (arr: number[]) => {
        const s = [...arr].sort((a, b) => a - b);
        return s[Math.floor(s.length / 2)];
      };
      const bgR = mid(rs);
      const bgG = mid(gs);
      const bgB = mid(bs);

      // Adaptive threshold: lighter BG → slightly higher tolerance
      const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
      const hard = bgLum > 200 ? 42 : bgLum > 140 ? 36 : 28;
      const soft = hard + 22;

      // Mark edge-connected background via BFS flood from borders
      const isBg = new Uint8Array(w * h);
      const queue: number[] = [];
      const pushIfBg = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const idx = y * w + x;
        if (isBg[idx]) return;
        const i = idx * 4;
        const dist = colorDist(d[i], d[i + 1], d[i + 2], bgR, bgG, bgB);
        if (dist <= soft) {
          isBg[idx] = 1;
          queue.push(idx);
        }
      };

      for (let x = 0; x < w; x++) {
        pushIfBg(x, 0);
        pushIfBg(x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        pushIfBg(0, y);
        pushIfBg(w - 1, y);
      }

      let qi = 0;
      while (qi < queue.length) {
        const idx = queue[qi++];
        const x = idx % w;
        const y = (idx / w) | 0;
        pushIfBg(x + 1, y);
        pushIfBg(x - 1, y);
        pushIfBg(x, y + 1);
        pushIfBg(x, y - 1);
      }

      // Apply alpha; soft edge for near-threshold pixels
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const i = idx * 4;
          const dist = colorDist(d[i], d[i + 1], d[i + 2], bgR, bgG, bgB);

          if (isBg[idx]) {
            if (dist <= hard) {
              d[i + 3] = 0;
            } else {
              // soft fringe
              const t = (dist - hard) / (soft - hard);
              d[i + 3] = Math.round(Math.min(255, d[i + 3] * t));
            }
          } else if (dist <= hard * 0.85 && (x < 3 || y < 3 || x > w - 4 || y > h - 4)) {
            // leftover edge pixels similar to BG
            d[i + 3] = 0;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const out = canvas.toDataURL('image/png');
      cache.set(src, out);
      return out;
    } catch {
      return src;
    } finally {
      inflight.delete(src);
    }
  })();

  inflight.set(src, job);
  return job;
}

export function clearBackgroundCache(): void {
  cache.clear();
}
