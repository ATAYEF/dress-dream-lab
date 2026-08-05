/**
 * Background removal for mannequin preview.
 * Order:
 *  1) Online AI via @imgly (CDN / esm.sh — ISNet model)
 *  2) Optional remove.bg through Supabase edge (if configured)
 *  3) Local heuristic flood-fill (studio / solid BG)
 */

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const MAX_EDGE = 640;

function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}

async function srcToBlob(src: string): Promise<Blob> {
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    const res = await fetch(src);
    return res.blob();
  }
  const res = await fetch(src, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return res.blob();
}

/** AI removal via img.ly model downloaded from CDN (runs in-browser WASM). */
async function removeWithImgly(src: string): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import(
      /* @vite-ignore */
      'https://esm.sh/@imgly/background-removal@1.5.5'
    );
    const removeBackground = mod.removeBackground || mod.default?.removeBackground || mod.default;
    if (typeof removeBackground !== 'function') return null;

    const input = await srcToBlob(src);
    const result: Blob = await removeBackground(input, {
      model: 'small',
      output: { format: 'image/png', quality: 0.9 },
    });
    if (!result || !(result instanceof Blob)) return null;
    return await blobToDataUrl(result);
  } catch (err) {
    console.warn('[removeBg] imgly failed, falling back', err);
    return null;
  }
}

/** Optional online API via Supabase edge function `remove-bg`. */
async function removeWithEdgeFunction(src: string): Promise<string | null> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    let payloadSrc = src;
    if (!src.startsWith('data:')) {
      try {
        payloadSrc = await blobToDataUrl(await srcToBlob(src));
      } catch {
        payloadSrc = src;
      }
    }

    const { data, error } = await supabase.functions.invoke('remove-bg', {
      body: { imageUrl: payloadSrc },
    });
    if (error || !data?.imageUrl) return null;
    return data.imageUrl as string;
  } catch {
    return null;
  }
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
}

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  const tryLoad = (url: string, cors: boolean) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      if (cors && !url.startsWith('data:') && !url.startsWith('blob:')) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('load fail'));
      img.src = url;
    });

  try {
    const blob = await srcToBlob(src);
    const obj = URL.createObjectURL(blob);
    try {
      return await tryLoad(obj, true);
    } finally {
      URL.revokeObjectURL(obj);
    }
  } catch {
    try {
      return await tryLoad(src, true);
    } catch {
      return await tryLoad(src, false);
    }
  }
}

/** Local heuristic — solid/studio backgrounds */
async function heuristicRemove(src: string): Promise<string> {
  const img = await loadImageElement(src);
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
    return src;
  }
  const d = imageData.data;

  const samples: [number, number][] = [
    [2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3],
    [Math.floor(w / 2), 2], [Math.floor(w / 2), h - 3],
    [2, Math.floor(h / 2)], [w - 3, Math.floor(h / 2)],
  ];
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  for (const [x, y] of samples) {
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const i = (y * w + x) * 4;
    rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2]);
  }
  const bgR = median(rs);
  const bgG = median(gs);
  const bgB = median(bs);
  const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
  const hard = bgLum > 210 ? 52 : bgLum > 160 ? 44 : 36;
  const soft = hard + 28;

  const isBg = new Uint8Array(w * h);
  const queue: number[] = [];
  const tryPush = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (isBg[idx]) return;
    const i = idx * 4;
    if (colorDist(d[i], d[i + 1], d[i + 2], bgR, bgG, bgB) <= soft) {
      isBg[idx] = 1;
      queue.push(idx);
    }
  };
  for (let x = 0; x < w; x++) { tryPush(x, 0); tryPush(x, h - 1); }
  for (let y = 0; y < h; y++) { tryPush(0, y); tryPush(w - 1, y); }
  let qi = 0;
  while (qi < queue.length) {
    const idx = queue[qi++];
    const x = idx % w;
    const y = (idx / w) | 0;
    tryPush(x + 1, y); tryPush(x - 1, y); tryPush(x, y + 1); tryPush(x, y - 1);
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const i = idx * 4;
      const dist = colorDist(d[i], d[i + 1], d[i + 2], bgR, bgG, bgB);
      if (isBg[idx]) {
        if (dist <= hard) d[i + 3] = 0;
        else {
          const t = Math.min(1, Math.max(0, (dist - hard) / (soft - hard)));
          d[i + 3] = Math.round(d[i + 3] * t);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export async function removeClothingBackground(src: string): Promise<string> {
  if (!src || typeof document === 'undefined') return src;
  if (cache.has(src)) return cache.get(src)!;
  if (inflight.has(src)) return inflight.get(src)!;

  const job = (async () => {
    try {
      // Prefer online remove.bg via edge (when REMOVE_BG_API_KEY is set on Supabase)
      const edge = await removeWithEdgeFunction(src);
      if (edge) { cache.set(src, edge); return edge; }

      // AI model from CDN (img.ly)
      const ai = await removeWithImgly(src);
      if (ai) { cache.set(src, ai); return ai; }

      const local = await heuristicRemove(src);
      cache.set(src, local);
      return local;
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
