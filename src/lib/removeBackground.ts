/**
 * Background removal for mannequin preview.
 * Priority: cache → remove.bg edge → img.ly AI → local heuristic
 *
 * Cache layers:
 *  1) in-memory Map (same session, instant)
 *  2) IndexedDB (persists across reloads — second open skips processing)
 *  3) sessionStorage fallback if IDB unavailable
 */

const CACHE_VERSION = 'rb-v4';
const IDB_NAME = 'dress-dream-bgcut';
const IDB_STORE = 'cuts';
const memoryCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const MAX_EDGE = 720;
const EDGE_SEND_MAX = 768;

/** Stable key: strip signed-URL query noise so same garment hits cache again */
export function cacheKey(src: string): string {
  if (!src) return `${CACHE_VERSION}:empty`;
  if (src.startsWith('data:')) {
    return `${CACHE_VERSION}:data:${src.length}:${src.slice(21, 80)}:${src.slice(-40)}`;
  }
  if (src.startsWith('blob:')) {
    return `${CACHE_VERSION}:blob:${src}`;
  }
  try {
    const u = new URL(src, typeof window !== 'undefined' ? window.location.origin : 'https://local');
    const drop = [
      'token',
      'X-Amz-Algorithm',
      'X-Amz-Credential',
      'X-Amz-Date',
      'X-Amz-Expires',
      'X-Amz-SignedHeaders',
      'X-Amz-Signature',
      'X-Amz-Security-Token',
      'Signature',
      'Expires',
      'AWSAccessKeyId',
    ];
    drop.forEach((p) => u.searchParams.delete(p));
    // Supabase storage path is enough
    return `${CACHE_VERSION}:${u.origin}${u.pathname}`;
  } catch {
    return `${CACHE_VERSION}:${src.slice(0, 160)}:${src.length}`;
  }
}

function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2,
    dg = g1 - g2,
    db = b1 - b2;
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

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

async function srcToBlob(src: string): Promise<Blob> {
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return (await fetch(src)).blob();
  }
  const res = await fetch(src, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return res.blob();
}

/* ---------- IndexedDB persistence ---------- */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('no idb'));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('idb open fail'));
  });
}

async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        const v = req.result;
        if (!v) {
          resolve(null);
          return;
        }
        if (typeof v === 'string') {
          resolve(v);
          return;
        }
        // Blob stored
        if (v instanceof Blob) {
          blobToDataUrl(v).then(resolve).catch(() => resolve(null));
          return;
        }
        resolve(null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, dataUrl: string): Promise<void> {
  try {
    const db = await openDb();
    const blob = await dataUrlToBlob(dataUrl);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // fallback sessionStorage for small results
    try {
      if (dataUrl.length < 1_500_000) {
        sessionStorage.setItem(`bgcut:${key}`, dataUrl);
      }
    } catch {
      /* quota */
    }
  }
}

function sessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(`bgcut:${key}`);
  } catch {
    return null;
  }
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

async function downscaleDataUrl(
  src: string,
  maxEdge: number,
  mime = 'image/jpeg',
  quality = 0.85
): Promise<string> {
  const img = await loadImageElement(src);
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  const scale = Math.min(1, maxEdge / Math.max(nw, nh));
  const w = Math.max(1, Math.round(nw * scale));
  const h = Math.max(1, Math.round(nh * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL(mime, quality);
}

async function removeWithEdgeFunction(src: string): Promise<string | null> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const payloadSrc = await downscaleDataUrl(src, EDGE_SEND_MAX, 'image/jpeg', 0.88);
    const { data, error } = await supabase.functions.invoke('remove-bg', {
      body: { imageUrl: payloadSrc },
    });
    if (error) {
      console.warn('[removeBg] edge error', error.message);
      return null;
    }
    if (data?.error) {
      console.warn('[removeBg] edge response error', data.error);
      return null;
    }
    if (!data?.imageUrl || typeof data.imageUrl !== 'string') return null;
    return data.imageUrl as string;
  } catch (err) {
    console.warn('[removeBg] edge invoke failed', err);
    return null;
  }
}

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
    console.warn('[removeBg] imgly failed', err);
    return null;
  }
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
}

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
    [2, 2],
    [w - 3, 2],
    [2, h - 3],
    [w - 3, h - 3],
    [Math.floor(w / 2), 2],
    [Math.floor(w / 2), h - 3],
    [2, Math.floor(h / 2)],
    [w - 3, Math.floor(h / 2)],
  ];
  const rs: number[] = [],
    gs: number[] = [],
    bs: number[] = [];
  for (const [x, y] of samples) {
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const i = (y * w + x) * 4;
    rs.push(d[i]);
    gs.push(d[i + 1]);
    bs.push(d[i + 2]);
  }
  const bgR = median(rs),
    bgG = median(gs),
    bgB = median(bs);
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
    const x = idx % w,
      y = (idx / w) | 0;
    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
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

async function readCache(key: string): Promise<string | null> {
  if (memoryCache.has(key)) return memoryCache.get(key)!;
  const idb = await idbGet(key);
  if (idb) {
    memoryCache.set(key, idb);
    return idb;
  }
  const sess = sessionGet(key);
  if (sess) {
    memoryCache.set(key, sess);
    return sess;
  }
  return null;
}

async function writeCache(key: string, value: string): Promise<void> {
  memoryCache.set(key, value);
  await idbSet(key, value);
}

/** True if we already have a cutout for this src (sync memory only — for UI). */
export function hasBackgroundCache(src: string): boolean {
  return memoryCache.has(cacheKey(src));
}

export async function removeClothingBackground(src: string): Promise<string> {
  if (!src || typeof document === 'undefined') return src;

  const key = cacheKey(src);
  const cached = await readCache(key);
  if (cached) {
    console.info('[removeBg] cache hit');
    return cached;
  }
  if (inflight.has(key)) return inflight.get(key)!;

  const job = (async () => {
    try {
      const edge = await removeWithEdgeFunction(src);
      if (edge) {
        await writeCache(key, edge);
        console.info('[removeBg] used remove.bg edge + cached');
        return edge;
      }

      const ai = await removeWithImgly(src);
      if (ai) {
        await writeCache(key, ai);
        console.info('[removeBg] used imgly + cached');
        return ai;
      }

      const local = await heuristicRemove(src);
      await writeCache(key, local);
      console.info('[removeBg] used heuristic + cached');
      return local;
    } catch (err) {
      console.warn('[removeBg] all methods failed', err);
      return src;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, job);
  return job;
}

export async function clearBackgroundCache(): Promise<void> {
  memoryCache.clear();
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith('bgcut:')) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}
