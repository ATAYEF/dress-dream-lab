import { ClothingCategory } from '@/types/wardrobe';

export interface AutoDetectResult {
  color: string;
  category: ClothingCategory;
  name: string;
  confidence: 'high' | 'medium' | 'low';
}

/* ========== RGB to Persian Color Name ========== */
interface ColorEntry {
  names: string[];
  r: number;
  g: number;
  b: number;
}

const COLOR_MAP: ColorEntry[] = [
  { names: ['مشکی', 'سیاه'], r: 17, g: 24, b: 39 },
  { names: ['سفید'], r: 255, g: 255, b: 255 },
  { names: ['خاکستری', 'طوسی'], r: 107, g: 114, b: 128 },
  { names: ['خاکستری روشن'], r: 156, g: 163, b: 175 },
  { names: ['قرمز', 'سرخ'], r: 220, g: 38, b: 38 },
  { names: ['شرابی', 'Burgundy'], r: 127, g: 29, b: 29 },
  { names: ['آبی', 'آبی تیره'], r: 37, g: 99, b: 235 },
  { names: ['آبی روشن', 'آبی آسمانی'], r: 14, g: 165, b: 233 },
  { names: ['سرمه', 'نیل'], r: 30, g: 64, b: 175 },
  { names: ['فیروزه‌ای', 'Cyan'], r: 6, g: 182, b: 212 },
  { names: ['سبز', 'سبز تیره'], r: 22, g: 163, b: 74 },
  { names: ['سبز روشن', 'سبز پسته‌ای'], r: 74, g: 222, b: 128 },
  { names: ['سبز زمردی'], r: 5, g: 150, b: 105 },
  { names: ['سبز نخل', 'Olive'], r: 132, g: 204, b: 22 },
  { names: ['زرد'], r: 234, g: 179, b: 8 },
  { names: ['طلایی', 'طلا'], r: 217, g: 119, b: 6 },
  { names: ['کرم'], r: 254, g: 243, b: 199 },
  { names: ['بژ'], r: 222, g: 184, b: 135 },
  { names: ['قهوه‌ای', 'قهوه'], r: 120, g: 53, b: 15 },
  { names: ['نارنجی'], r: 249, g: 115, b: 22 },
  { names: ['زرشکی'], r: 234, g: 88, b: 12 },
  { names: ['صورتی', 'Pink'], r: 236, g: 72, b: 153 },
  { names: ['صورتی روشن'], r: 249, g: 168, b: 212 },
  { names: ['رز', 'Rosa'], r: 244, g: 63, b: 94 },
  { names: ['بنفش', 'ارغوانی'], r: 124, g: 58, b: 237 },
  { names: ['بنفش روشن', 'لایلک'], r: 168, g: 85, b: 247 },
  { names: ['شاه‌بلو', 'Indigo'], r: 79, g: 70, b: 229 },
];

function colorDistance(c1: { r: number; g: number; b: number }, c2: ColorEntry): number {
  const rmean = (c1.r + c2.r) / 2;
  const r = c1.r - c2.r;
  const g = c1.g - c2.g;
  const b = c1.b - c2.b;
  return Math.sqrt(
    (((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8)
  );
}

export function rgbToColorName(r: number, g: number, b: number): string {
  let bestEntry = COLOR_MAP[0];
  let bestDistance = Infinity;

  for (const entry of COLOR_MAP) {
    const d = colorDistance({ r, g, b }, entry);
    if (d < bestDistance) {
      bestDistance = d;
      bestEntry = entry;
    }
  }

  return bestEntry.names[0];
}

/* ========== Dominant Color Extraction ========== */
export async function extractDominantColor(dataUrl: string): Promise<{ r: number; g: number; b: number; colorName: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ r: 100, g: 100, b: 100, colorName: 'خاکستری' });
          return;
        }

        // Downscale for performance
        const maxDim = 120;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        canvas.width = Math.max(1, Math.floor(img.width * scale));
        canvas.height = Math.max(1, Math.floor(img.height * scale));

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        // Bucket quantization (reduce colors by dividing RGB by bucket size)
        const BUCKET = 40;
        const buckets = new Map<string, { count: number; rSum: number; gSum: number; bSum: number }>();

        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          // Skip transparent / near-white / near-black edges - typical background
          if (a < 80) continue;
          // Skip very white or very dark pixels (likely background)
          const brightness = (r + g + b) / 3;
          if (brightness > 248 || brightness < 18) continue;
          // Skip near-grays to get actual clothing color
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          if (maxC - minC < 18 && brightness > 60 && brightness < 220) {
            // Soft gray skip with moderate brightness
          }

          const key = `${Math.floor(r / BUCKET)}-${Math.floor(g / BUCKET)}-${Math.floor(b / BUCKET)}`;
          const existing = buckets.get(key);
          if (existing) {
            existing.count++;
            existing.rSum += r;
            existing.gSum += g;
            existing.bSum += b;
          } else {
            buckets.set(key, { count: 1, rSum: r, gSum: g, bSum: b });
          }
        }

        // Get top 3 buckets and pick the most saturated
        const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count).slice(0, 5);

        let best = sorted[0];
        if (!best) {
          // Fallback if everything was filtered
          resolve({ r: 100, g: 100, b: 100, colorName: 'خاکستری' });
          return;
        }

        let bestScore = -Infinity;
        for (const bucket of sorted) {
          const R = bucket.rSum / bucket.count;
          const G = bucket.gSum / bucket.count;
          const B = bucket.bSum / bucket.count;
          const maxC = Math.max(R, G, B);
          const minC = Math.min(R, G, B);
          const luma = 0.299 * R + 0.587 * G + 0.114 * B;
          const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;
          const score = bucket.count * (0.6 + saturation * 0.8) * (1 - Math.abs(luma - 128) / 255 * 0.4);
          if (score > bestScore) {
            bestScore = score;
            best = bucket;
          }
        }

        const R = Math.round(best.rSum / best.count);
        const G = Math.round(best.gSum / best.count);
        const B = Math.round(best.bSum / best.count);

        resolve({
          r: R,
          g: G,
          b: B,
          colorName: rgbToColorName(R, G, B),
        });
      } catch {
        resolve({ r: 100, g: 100, b: 100, colorName: 'خاکستری' });
      }
    };
    img.onerror = () => resolve({ r: 100, g: 100, b: 100, colorName: 'خاکستری' });
    img.src = dataUrl;
  });
}

/* ========== Category Guesser ========== */
interface CategoryPattern {
  category: ClothingCategory;
  patterns: RegExp[];
}

const CATEGORY_PATTERNS: CategoryPattern[] = [
  {
    category: 'tops',
    patterns: [
      /(t[-.\s]?shirt|ti[-\s]?shirt|ti\s?shirt|پیراهن|تی\s?شرت|تیشرت|شومیز|بلوز|سوئیشرت|سویشرت|شرت|کلاه|همتایی|کاپشن|poloshirt|polo|ساردستی|بادی|sweater|سوئت|جوراب|longsleeve|تنه|کمربند|hoddie|hoodie|هودى|هدی|کلافی|سلیپ|شومیز|نیم|نیم تن|کش میوه|قفتی|کشتی|shirt|blouse|top|tee|tank|camisole|crop|sweat)/i,
    ],
  },
  {
    category: 'bottoms',
    patterns: [
      /(شلوار|پارچه|دامن|جین|کتان|skirt|pants|trouser|jeans|short|شلوارک|لوئیز|لویز|کمربند|بند|cargo|chino|کلاک|شرتی|شلوار جین|capri|shorts|suitpant|پیراهن|tights|legging|لگینگ|لباس زیر)/i,
    ],
  },
  {
    category: 'dresses',
    patterns: [
      /(لباس|لباس یکپارچه|ساری|عروس|مجلسی|لباس مجلسی|روی|robe|dress|گاون|gown|frock|مانتو|مانتو|رسمی)/i,
    ],
  },
  {
    category: 'outerwear',
    patterns: [
      /(کت|کاپشن|پالتو|بافتنی|ژاکت|کوهی|بدنه|کت و شلوار|سuit|coat|jacket|blazer|کاپشن بارانی|parka|پارکا|پشمی|پشمینه|کتانی|پلیور|bomber|biker|چرم|لباس|شومیز لباس|قاپشن|پلیور)/i,
    ],
  },
  {
    category: 'shoes',
    patterns: [
      /(کفش|پیراهن|صندل|بوت|کفش ورزشی|اسنیکرز|snicker|sneaker|running|sport|آسفالت|کفش راحتی|تاکونی|دم‌پایی|پالتو|کیف|چکمه|کفش کوهنوردی|کفش دویدن|heels|pump|heel|flat|کفش چرم|bota|boot|shoes|loafer|mokاسن|moccasin|flip|sandals|کفش بچه|کفش مردانه|کفش زنانه| کفش مجلسی|کفش عروس|ورزشی|کفش ورزشی|اسپرت|کفش کتانی)/i,
    ],
  },
  {
    category: 'accessories',
    patterns: [
      /(کیف|کوله|بار|کیف پول|ساعت|شانه|ستاره|گردنبند|انگشتر|دستبند|نیم‌ست|نیم ست|کلاه|عینک|کمربند|روسری|شال|حجاب|دستکش|عروسکی|زر|آویز|چسب|pin|سکه|آینه|کادو|کاملا|طاقنعم|اکسسوری|چراغ|clutch|wallet|bag|purse|hat|cap|scarf|sunglass|glasses|watch|belts|tie|کروات|buckle|strap|bracelet|necklace|ring|earring|گوشواره|bangle|گوشواره|پیراهن نوزادی|حوله|گل|موبایل|آرایشی)/i,
    ],
  },
];

const CATEGORY_DEFAULT_NAMES: Record<ClothingCategory, string> = {
  tops: 'تیشرت',
  bottoms: 'شلوار',
  dresses: 'لباس مجلسی',
  outerwear: 'ژاکت',
  shoes: 'کفش',
  accessories: 'اکسسوری',
};

export function guessCategoryFromText(text: string): { category: ClothingCategory; confidence: 'high' | 'medium' | 'low' } {
  const t = (text || '').toLowerCase();
  if (!t) return { category: 'tops', confidence: 'low' };

  let best: { category: ClothingCategory; confidence: 'high' | 'medium' | 'low' } = {
    category: 'tops',
    confidence: 'low',
  };

  let highMatches: ClothingCategory[] = [];
  let mediumMatches: ClothingCategory[] = [];

  for (const rule of CATEGORY_PATTERNS) {
    for (const pattern of rule.patterns) {
      if (pattern.test(t)) {
        highMatches.push(rule.category);
      }
    }
  }

  // Heuristic: if only one category matches high confidence, use that
  if (highMatches.length > 0) {
    const unique = Array.from(new Set(highMatches));
    if (unique.length === 1) {
      return { category: unique[0], confidence: 'high' };
    }
    return { category: unique[0], confidence: 'medium' };
  }

  return best;
}

/* ========== Name Generator ========== */
export function generateClothingName(category: ClothingCategory, colorName: string): string {
  const base = CATEGORY_DEFAULT_NAMES[category] || 'لباس';
  return colorName ? `${base} ${colorName}` : base;
}

/* ========== Top-Level Auto Detect ========== */
export async function autoDetectClothing(
  dataUrl: string,
  fileName?: string
): Promise<AutoDetectResult> {
  const promises: Promise<any>[] = [];

  // 1. Extract dominant color
  promises.push(
    extractDominantColor(dataUrl)
      .then((res) => ({ color: res.colorName, r: res.r, g: res.g, b: res.b }))
      .catch(() => ({ color: '', r: 0, g: 0, b: 0 }))
  );

  // 2. Guess category from filename (immediate)
  const { category: categoryFromFile, confidence } = guessCategoryFromText(fileName || '');

  // Wait for color
  const results = await Promise.all(promises);
  const colorResult = results[0];

  const category: ClothingCategory = categoryFromFile;
  const color = colorResult.color || '';
  const name = generateClothingName(category, color);

  const overallConfidence: AutoDetectResult['confidence'] =
    color && confidence === 'high' ? 'high' :
    color || confidence === 'high' ? 'medium' : 'low';

  return {
    color,
    category,
    name,
    confidence: overallConfidence,
  };
}
