import { ClothingItem, ClothingCategory } from '@/types/wardrobe';

/* ============================================================================
 * Smart Color Matching Algorithm
 * - Maps Persian color names → HSL
 * - Harmony rules: neutral, monochromatic, analogous, complementary, triadic
 * - Outfit scoring + per-item match suggestions
 * ============================================================================ */

export type HarmonyType =
  | 'neutral'
  | 'monochrome'
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'contrast'
  | 'unknown';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

export interface ColorMatchResult {
  score: number; // 0–100
  harmony: HarmonyType;
  label: string; // short Persian label
  explanation: string; // longer Persian tip
  colors: string[];
}

export interface ItemMatchSuggestion {
  item: ClothingItem;
  score: number;
  reason: string;
}

/* ---------- Canonical color dictionary (Persian → RGB) ---------- */
const COLOR_RGB: Record<string, Rgb> = {
  مشکی: { r: 17, g: 24, b: 39 },
  سیاه: { r: 17, g: 24, b: 39 },
  سفید: { r: 250, g: 250, b: 250 },
  خاکستری: { r: 107, g: 114, b: 128 },
  طوسی: { r: 107, g: 114, b: 128 },
  'خاکستری روشن': { r: 156, g: 163, b: 175 },
  قرمز: { r: 220, g: 38, b: 38 },
  سرخ: { r: 220, g: 38, b: 38 },
  شرابی: { r: 127, g: 29, b: 29 },
  آبی: { r: 37, g: 99, b: 235 },
  'آبی تیره': { r: 30, g: 64, b: 175 },
  'آبی روشن': { r: 56, g: 189, b: 248 },
  'آبی آسمانی': { r: 14, g: 165, b: 233 },
  سرمه: { r: 30, g: 58, b: 138 },
  نیل: { r: 30, g: 64, b: 175 },
  فیروزه‌ای: { r: 6, g: 182, b: 212 },
  سبز: { r: 22, g: 163, b: 74 },
  'سبز تیره': { r: 21, g: 128, b: 61 },
  'سبز روشن': { r: 74, g: 222, b: 128 },
  'سبز پسته‌ای': { r: 132, g: 204, b: 22 },
  'سبز زمردی': { r: 5, g: 150, b: 105 },
  زرد: { r: 234, g: 179, b: 8 },
  طلایی: { r: 217, g: 119, b: 6 },
  طلا: { r: 217, g: 119, b: 6 },
  کرم: { r: 254, g: 243, b: 199 },
  بژ: { r: 222, g: 184, b: 135 },
  قهوه‌ای: { r: 120, g: 53, b: 15 },
  قهوه: { r: 120, g: 53, b: 15 },
  نارنجی: { r: 249, g: 115, b: 22 },
  زرشکی: { r: 190, g: 18, b: 60 },
  صورتی: { r: 236, g: 72, b: 153 },
  'صورتی روشن': { r: 249, g: 168, b: 212 },
  رز: { r: 244, g: 63, b: 94 },
  بنفش: { r: 124, g: 58, b: 237 },
  ارغوانی: { r: 124, g: 58, b: 237 },
  'بنفش روشن': { r: 168, g: 85, b: 247 },
  لایلک: { r: 196, g: 181, b: 253 },
  شاه‌بلو: { r: 79, g: 70, b: 229 },
  سرمه‌ای: { r: 30, g: 58, b: 138 },
  نوک‌مدادی: { r: 55, g: 65, b: 81 },
  زیتونی: { r: 113, g: 128, b: 45 },
  خردلی: { r: 202, g: 138, b: 4 },
  مسی: { r: 194, g: 65, b: 12 },
  یاسی: { r: 192, g: 132, b: 252 },
};

const NEUTRAL_HUES = new Set([
  'مشکی',
  'سیاه',
  'سفید',
  'خاکستری',
  'طوسی',
  'خاکستری روشن',
  'کرم',
  'بژ',
  'قهوه‌ای',
  'قهوه',
  'نوک‌مدادی',
]);

/* ---------- Color space helpers ---------- */
export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** Circular distance between two hues (0–180). */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Normalize Persian color string and resolve RGB. */
export function resolveColorName(raw?: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!cleaned) return null;

  // Exact / partial match against dictionary keys
  for (const key of Object.keys(COLOR_RGB)) {
    if (cleaned === key || cleaned.includes(key) || key.includes(cleaned)) {
      return key;
    }
  }

  // Common compound patterns
  const patterns: [RegExp, string][] = [
    [/مشک|سیاه|black/i, 'مشکی'],
    [/سفید|white/i, 'سفید'],
    [/خاکست|طوسی|gray|grey/i, 'خاکستری'],
    [/سرمه|navy/i, 'سرمه'],
    [/آبی|blue/i, 'آبی'],
    [/سبز|green/i, 'سبز'],
    [/قرمز|سرخ|red/i, 'قرمز'],
    [/صورتی|pink/i, 'صورتی'],
    [/بنفش|ارغوان|purple|violet/i, 'بنفش'],
    [/زرد|yellow/i, 'زرد'],
    [/نارنج|orange/i, 'نارنجی'],
    [/قهو|brown/i, 'قهوه‌ای'],
    [/بژ|beige/i, 'بژ'],
    [/کرم|cream/i, 'کرم'],
    [/طلا|gold/i, 'طلایی'],
    [/زیتون|olive/i, 'زیتونی'],
    [/خردل|mustard/i, 'خردلی'],
  ];

  for (const [re, name] of patterns) {
    if (re.test(cleaned)) return name;
  }

  return cleaned;
}

export function colorNameToRgb(name?: string | null): Rgb | null {
  const key = resolveColorName(name);
  if (!key) return null;
  if (COLOR_RGB[key]) return COLOR_RGB[key];
  // fallback: try first matching substring key
  for (const [k, rgb] of Object.entries(COLOR_RGB)) {
    if (key.includes(k) || k.includes(key)) return rgb;
  }
  return null;
}

export function colorNameToHsl(name?: string | null): Hsl | null {
  const rgb = colorNameToRgb(name);
  return rgb ? rgbToHsl(rgb) : null;
}

export function isNeutralColor(name?: string | null): boolean {
  const key = resolveColorName(name);
  if (!key) return false;
  if (NEUTRAL_HUES.has(key)) return true;
  const hsl = colorNameToHsl(key);
  // Low saturation ≈ neutral
  return Boolean(hsl && hsl.s < 18);
}

/* ---------- Pairwise harmony score (0–100) ---------- */
export function scoreColorPair(
  colorA?: string | null,
  colorB?: string | null
): { score: number; harmony: HarmonyType } {
  if (!colorA || !colorB) {
    return { score: 55, harmony: 'unknown' };
  }

  const a = resolveColorName(colorA);
  const b = resolveColorName(colorB);
  if (!a || !b) return { score: 50, harmony: 'unknown' };

  // Same color family
  if (a === b || a.includes(b) || b.includes(a)) {
    return { score: 92, harmony: 'monochrome' };
  }

  const neutralA = isNeutralColor(a);
  const neutralB = isNeutralColor(b);

  // Neutrals pair with everything
  if (neutralA && neutralB) return { score: 95, harmony: 'neutral' };
  if (neutralA || neutralB) return { score: 88, harmony: 'neutral' };

  const hslA = colorNameToHsl(a);
  const hslB = colorNameToHsl(b);
  if (!hslA || !hslB) return { score: 50, harmony: 'unknown' };

  const hd = hueDistance(hslA.h, hslB.h);
  const satAvg = (hslA.s + hslB.s) / 2;
  const lightDiff = Math.abs(hslA.l - hslB.l);

  // Monochrome-ish (very close hue)
  if (hd <= 18) {
    // Prefer some lightness contrast so it doesn't look flat
    const boost = lightDiff > 15 ? 8 : 0;
    return { score: Math.min(96, 78 + boost + (30 - hd)), harmony: 'monochrome' };
  }

  // Analogous (neighbor hues)
  if (hd <= 45) {
    return { score: Math.min(94, 72 + (45 - hd) * 0.4), harmony: 'analogous' };
  }

  // Complementary (~180°)
  if (hd >= 150 && hd <= 210) {
    // Soften if both are very saturated (can clash)
    const satPenalty = satAvg > 70 ? 8 : 0;
    return { score: Math.max(70, 90 - satPenalty - Math.abs(hd - 180) * 0.15), harmony: 'complementary' };
  }

  // Triadic (~120°)
  if (hd >= 100 && hd <= 140) {
    return { score: Math.max(68, 82 - Math.abs(hd - 120) * 0.2), harmony: 'triadic' };
  }

  // Strong contrast without classic harmony
  if (hd > 90 && lightDiff > 25) {
    return { score: 62, harmony: 'contrast' };
  }

  // Distant hues, muted
  if (satAvg < 35) {
    return { score: 70, harmony: 'analogous' };
  }

  return { score: Math.max(40, 58 - (hd - 45) * 0.12), harmony: 'contrast' };
}

const HARMONY_LABELS: Record<HarmonyType, string> = {
  neutral: 'خنثی و همه‌پسند',
  monochrome: 'تک‌رنگ هماهنگ',
  analogous: 'رنگ‌های هم‌خانواده',
  complementary: 'مکمل و چشم‌نواز',
  triadic: 'سه‌گانه پویا',
  contrast: 'کنتراست جسورانه',
  unknown: 'ترکیب آزاد',
};

const HARMONY_TIPS: Record<HarmonyType, string> = {
  neutral: 'رنگ‌های خنثی با هر چیزی ست می‌شوند و استایلی تمیز و شیک می‌سازند.',
  monochrome: 'تنالیته‌های نزدیک یک رنگ، ظاهری یکدست و لوکس ایجاد می‌کنند.',
  analogous: 'رنگ‌های مجاور روی چرخه رنگ حس هماهنگی طبیعی می‌دهند.',
  complementary: 'رنگ‌های روبه‌رو در چرخه رنگ، کنتراست جذاب و حرفه‌ای می‌سازند.',
  triadic: 'فاصله حدود ۱۲۰ درجه روی چرخه رنگ، انرژی و تعادل می‌آورد.',
  contrast: 'تفاوت زیاد رنگ‌ها استایل را برجسته می‌کند؛ یک رنگ خنثی تعادل می‌دهد.',
  unknown: 'این ترکیب را می‌توانید با یک اکسسوری خنثی نرم‌تر کنید.',
};

/** Score a full outfit (average of pairwise + bonus for neutrals). */
export function scoreOutfitColors(items: ClothingItem[]): ColorMatchResult {
  const colors = items
    .map((i) => resolveColorName(i.color))
    .filter((c): c is string => Boolean(c));

  if (colors.length === 0) {
    return {
      score: 50,
      harmony: 'unknown',
      label: HARMONY_LABELS.unknown,
      explanation: 'رنگ لباس‌ها مشخص نیست؛ با افزودن رنگ، تطبیق دقیق‌تر می‌شود.',
      colors: [],
    };
  }

  if (colors.length === 1) {
    return {
      score: 80,
      harmony: isNeutralColor(colors[0]) ? 'neutral' : 'monochrome',
      label: isNeutralColor(colors[0]) ? HARMONY_LABELS.neutral : HARMONY_LABELS.monochrome,
      explanation: 'یک رنگ غالب؛ با افزودن قطعه دوم می‌توان هارمونی را سنجید.',
      colors,
    };
  }

  let total = 0;
  let pairs = 0;
  const harmonyCounts: Partial<Record<HarmonyType, number>> = {};

  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const { score, harmony } = scoreColorPair(colors[i], colors[j]);
      total += score;
      pairs += 1;
      harmonyCounts[harmony] = (harmonyCounts[harmony] || 0) + 1;
    }
  }

  let avg = pairs > 0 ? total / pairs : 50;

  // Bonus: presence of neutrals stabilizes bold combos
  const neutralCount = colors.filter((c) => isNeutralColor(c)).length;
  if (neutralCount > 0 && colors.length > neutralCount) {
    avg = Math.min(100, avg + 4 * Math.min(neutralCount, 2));
  }

  // Penalty: too many high-saturation competing hues
  const uniqueHues = new Set(
    colors
      .filter((c) => !isNeutralColor(c))
      .map((c) => {
        const h = colorNameToHsl(c)?.h ?? 0;
        return Math.round(h / 30);
      })
  );
  if (uniqueHues.size >= 4) {
    avg = Math.max(35, avg - 12);
  }

  const dominantHarmony =
    (Object.entries(harmonyCounts).sort((a, b) => (b[1] || 0) - (a[1] || 0) )[0]?.[0] as
      | HarmonyType
      | undefined) || 'unknown';

  const score = Math.round(Math.min(100, Math.max(0, avg)));

  return {
    score,
    harmony: dominantHarmony,
    label: HARMONY_LABELS[dominantHarmony],
    explanation: HARMONY_TIPS[dominantHarmony],
    colors: [...new Set(colors)],
  };
}

/**
 * Rank wardrobe items by how well they match the currently selected outfit colors.
 * Prefer different categories from what's already selected.
 */
export function suggestMatchingItems(
  selected: ClothingItem[],
  wardrobe: ClothingItem[],
  options?: { limit?: number; preferCategories?: ClothingCategory[] }
): ItemMatchSuggestion[] {
  const limit = options?.limit ?? 6;
  const selectedIds = new Set(selected.map((s) => s.id));
  const selectedCategories = new Set(selected.map((s) => s.category));
  const selectedColors = selected
    .map((s) => s.color)
    .filter(Boolean) as string[];

  if (selectedColors.length === 0) {
    // No color info — suggest underrepresented categories
    return wardrobe
      .filter((item) => !selectedIds.has(item.id) && !selectedCategories.has(item.category))
      .slice(0, limit)
      .map((item) => ({
        item,
        score: 60,
        reason: 'تکمیل دسته‌بندی ست',
      }));
  }

  const candidates = wardrobe.filter((item) => !selectedIds.has(item.id));

  const ranked: ItemMatchSuggestion[] = candidates.map((item) => {
    let best = 0;
    let bestHarmony: HarmonyType = 'unknown';

    if (!item.color) {
      best = 48;
    } else {
      for (const c of selectedColors) {
        const { score, harmony } = scoreColorPair(c, item.color);
        if (score > best) {
          best = score;
          bestHarmony = harmony;
        }
      }
    }

    // Prefer filling missing categories
    if (!selectedCategories.has(item.category)) {
      best = Math.min(100, best + 6);
    } else {
      best = Math.max(0, best - 8); // already have this category
    }

    // Prefer preferred categories if provided
    if (options?.preferCategories?.includes(item.category)) {
      best = Math.min(100, best + 5);
    }

    return {
      item,
      score: Math.round(best),
      reason: HARMONY_LABELS[bestHarmony],
    };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit);
}

/** Persian sentence for local outfit description based on color harmony. */
export function describeColorHarmony(items: ClothingItem[]): string {
  const result = scoreOutfitColors(items);
  if (result.colors.length === 0) return '';

  const colorList = result.colors.join('، ');
  if (result.score >= 85) {
    return `از نظر رنگ، ترکیب ${colorList} بسیار هماهنگ است (${result.label}). ${result.explanation}`;
  }
  if (result.score >= 70) {
    return `رنگ‌های ${colorList} با هم خوب کار می‌کنند (${result.label}). ${result.explanation}`;
  }
  if (result.score >= 55) {
    return `ترکیب ${colorList} قابل قبول است؛ افزودن یک رنگ خنثی می‌تواند تعادل را بهتر کند.`;
  }
  return `ترکیب ${colorList} کنتراست بالایی دارد؛ یک قطعه مشکی، سفید یا بژ می‌تواند ست را آرام‌تر کند.`;
}

/** Hex swatch for UI from Persian color name. */
export function colorNameToHex(name?: string | null): string {
  const rgb = colorNameToRgb(name);
  if (!rgb) return '#94a3b8';
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/** Score label for UI badge. */
export function scoreLabel(score: number): { text: string; tone: 'great' | 'good' | 'ok' | 'weak' } {
  if (score >= 85) return { text: 'عالی', tone: 'great' };
  if (score >= 70) return { text: 'خوب', tone: 'good' };
  if (score >= 55) return { text: 'قابل قبول', tone: 'ok' };
  return { text: 'نیاز به تعادل', tone: 'weak' };
}
