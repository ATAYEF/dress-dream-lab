/**
 * Client-side clothing background removal for mannequin preview.
 * Strategy:
 *  1) Load image safely (blob fetch when possible → avoids canvas taint)
 *  2) Estimate BG from corners/edges
 *  3) Edge-connected flood + soft near-BG cleanup
 *  4) Soft fringe for cleaner edges
 */

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const MAX_EDGE = 640;

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

function loadFromElement(src: string, useCors: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (useCors && !src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

/** Prefer blob URL so canvas is always readable when fetch is allowed. */
async function resolveDrawableSrc(src: string): Promise<string> {
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;
  // Vite-bundled assets are same-origin paths
  if (src.startsWith('/') || src.startsWith('.')) return src;

  try {
    const res = await fetch(src, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    // Fall back to direct URL + crossOrigin
    return src;
  }
}

async function loadImage(src: string): Promise<{ img: HTMLImageElement; revoke?: string }> {
  const drawable = await resolveDrawableSrc(src);
  const revoke = drawable.startsWith('blob:') && drawable !== src ? drawable : undefined;

  try {
    const img = await loadFromElement(drawable, true);
    return { img, revoke };
  } catch {
    try {
      const img = await loadFromElement(drawable, false);
      return { img, revoke };
    } catch (e) {
      if (revoke) URL.revokeObjectURL(revoke);
      throw e;
    }
  }
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
}

/**
 * Remove near-uniform / studio background; returns PNG data URL with alpha.
 * Falls back to original src on failure.
 */
export async function removeClothingBackground(src: string): Promise<string> {
  if (!src || typeof document === 'undefined') return src;
  if (cache.has(src)) return cache.get(src)!;
  if (inflight.has(src)) return inflight.get(src)!;

  const job = (async () => {
    let revoke: string | undefined;
    try {
      const loaded = await loadImage(src);
      revoke = loaded.revoke;
      const img = loaded.img;

      const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
      const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
      const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return src;

      ctx.drawImage(img, 0, 0, w, h);

      let imageData: ImageData;
      try {
        imageData = ctx.getImageData(0, 0, w, h);
      } catch {
        // Tainted canvas — cannot process
        return src;
      }

      const d = imageData.data;

      // Sample BG from corners + edge midpoints + inset corners
      const samples: [number, number][] = [
        [2, 2],
        [w - 3, 2],
        [2, h - 3],
        [w - 3, h - 3],
        [Math.floor(w / 2), 2],
        [Math.floor(w / 2), h - 3],
        [2, Math.floor(h / 2)],
        [w - 3, Math.floor(h / 2)],
        [8, 8],
        [w - 9, 8],
        [8, h - 9],
        [w - 9, h - 9],
      ];

      const rs: number[] = [];
      const gs: number[] = [];
      const bs: number[] = [];
      for (const [x, y] of samples) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const i = (y * w + x) * 4;
        rs.push(d[i]);
        gs.push(d[i + 1]);
        bs.push(d[i + 2]);
      }
      const bgR = median(rs);
      const bgG = median(gs);
      const bgB = median(bs);
      const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

      // More aggressive thresholds — product photos usually have clear BG
      const hard = bgLum > 210 ? 52 : bgLum > 160 ? 44 : bgLum > 80 ? 36 : 28;
      const soft = hard + 28;

      // Edge flood-fill for connected background
      const isBg = new Uint8Array(w * h);
      const queue: number[] = [];
      const tryPush = (x: number, y: number) => {
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
        tryPush(x, 0);
        tryPush(x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        tryPush(0, y);
        tryPush(w - 1, y);
      }

      let qi = 0;
      while (qi < queue.length) {
        const idx = queue[qi++];
        const x = idx % w;
        const y = (idx / w) | 0;
        tryPush(x + 1, y);
        tryPush(x - 1, y);
        tryPush(x, y + 1);
        tryPush(x, y - 1);
      }

      // Also mark near-BG pixels that are very close to estimated BG (studio white/gray),
      // but only if sufficiently close AND not deep inside a colored region
      // (use a lighter second pass on remaining edge band).
      const band = Math.max(4, Math.round(Math.min(w, h) * 0.04));
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          if (isBg[idx]) continue;
          const nearEdge = x < band || y < band || x >= w - band || y >= h - band;
          if (!nearEdge) continue;
          const i = idx * 4;
          const dist = colorDist(d[i], d[i + 1], d[i + 2], bgR, bgG, bgB);
          if (dist <= hard * 0.9) isBg[idx] = 1;
        }
      }

      // Apply alpha
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const i = idx * 4;
          const dist = colorDist(d[i], d[i + 1], d[i + 2], bgR, bgG, bgB);

          if (isBg[idx]) {
            if (dist <= hard) {
              d[i + 3] = 0;
            } else {
              const t = Math.min(1, Math.max(0, (dist - hard) / (soft - hard)));
              d[i + 3] = Math.round(d[i + 3] * t);
            }
          } else if (dist <= hard * 0.55 && (x < 2 || y < 2 || x > w - 3 || y > h - 3)) {
            d[i + 3] = 0;
          }
        }
      }

      // For very light studio backgrounds: extra pass on remaining near-white edge pixels
      if (bgLum > 200) {
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            if (d[i + 3] === 0) continue;
            const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            const nearEdge = x < band || y < band || x >= w - band || y >= h - band;
            if (nearEdge && lum > 245 && colorDist(d[i], d[i + 1], d[i + 2], bgR, bgG, bgB) < hard) {
              d[i + 3] = 0;
            }
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
      if (revoke) {
        try {
          URL.revokeObjectURL(revoke);
        } catch {
          /* ignore */
        }
      }
      inflight.delete(src);
    }
  })();

  inflight.set(src, job);
  return job;
}

export function clearBackgroundCache(): void {
  cache.clear();
}
