import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { scoreColorPair, isNeutralColor } from '@/lib/colorHarmony';

/** Occasion / style of the outfit */
export type OutfitStyle = 'formal' | 'party' | 'casual';

/** Where the user is going */
export type OutfitEnvironment = 'office' | 'gathering';

/** Weather condition */
export type OutfitWeather = 'sunny' | 'rainy' | 'cold';

export interface OutfitContext {
  style: OutfitStyle;
  environment: OutfitEnvironment;
  weather: OutfitWeather;
}

export const DEFAULT_OUTFIT_CONTEXT: OutfitContext = {
  style: 'casual',
  environment: 'gathering',
  weather: 'sunny',
};

export const STYLE_OPTIONS: {
  value: OutfitStyle;
  label: string;
  emoji: string;
  hint: string;
}[] = [
  { value: 'casual', label: 'روزمره', emoji: '☀️', hint: 'راحت و کاربردی' },
  { value: 'formal', label: 'رسمی', emoji: '👔', hint: 'اداری و رسمی' },
  { value: 'party', label: 'مهمانی', emoji: '✨', hint: 'جذاب و خاص' },
];

export const ENVIRONMENT_OPTIONS: {
  value: OutfitEnvironment;
  label: string;
  emoji: string;
  hint: string;
}[] = [
  { value: 'office', label: 'اداری', emoji: '🏢', hint: 'محیط کار' },
  { value: 'gathering', label: 'دورهمی', emoji: '🎉', hint: 'دوستانه و اجتماعی' },
];

export const WEATHER_OPTIONS: {
  value: OutfitWeather;
  label: string;
  emoji: string;
  hint: string;
}[] = [
  { value: 'sunny', label: 'آفتابی', emoji: '🌤️', hint: 'سبک و خنک' },
  { value: 'rainy', label: 'بارانی', emoji: '🌧️', hint: 'ضدآب و لایه' },
  { value: 'cold', label: 'سرد', emoji: '❄️', hint: 'گرم و لایه‌لایه' },
];

export function contextLabels(ctx: OutfitContext): string {
  const s = STYLE_OPTIONS.find((o) => o.value === ctx.style)?.label ?? ctx.style;
  const e = ENVIRONMENT_OPTIONS.find((o) => o.value === ctx.environment)?.label ?? ctx.environment;
  const w = WEATHER_OPTIONS.find((o) => o.value === ctx.weather)?.label ?? ctx.weather;
  return `${s} · ${e} · ${w}`;
}

/* ---------- Keyword heuristics (Persian + English) ---------- */
const STYLE_KEYWORDS: Record<OutfitStyle, string[]> = {
  formal: [
    'رسمی', 'کت', 'شلوار پارچه‌ای', 'پیراهن', 'کمربند', 'کفش رسمی', 'لوفر',
    'مجلسی', 'اداری', 'classic', 'blazer', 'shirt', 'trousers', 'formal', 'suit',
    'چرم', 'سفید', 'مشکی', 'سرمه', 'خاکستری',
  ],
  party: [
    'مهمانی', 'مجلسی', 'ساتن', 'براق', 'پولکی', 'کفش پاشنه‌دار', 'کفش پاشنه',
    'کیف دستی', 'کلچ', 'لباس مجلسی', 'شب', 'party', 'evening', 'heels', 'clutch',
    'دکلته', 'شاین', 'متالیک', 'طلایی', 'صورتی', 'قرمز',
  ],
  casual: [
    'روزمره', 'کژوال', 'جین', 'تیشرت', 'تی‌شرت', 'کفش ورزشی', 'اسنیکر',
    'هودی', 'سویشرت', 'شلوارک', 'casual', 'jean', 'denim', 'sneaker', 't-shirt',
    'راحت', 'اسپرت',
  ],
};

const WEATHER_KEYWORDS: Record<OutfitWeather, string[]> = {
  sunny: ['سبک', 'نخی', 'کتان', 'کوتاه', 'صندل', 'آفتابی', 'linen', 'cotton', 'light'],
  rainy: [
    'بارانی', 'ضدآب', 'چتر', 'چکمه', 'بارانی', 'trench', 'rain', 'waterproof',
    'کت بارانی', 'بوت',
  ],
  cold: [
    'زمستانه', 'پالتو', 'کاپشن', 'بافت', 'پلیور', 'بافتنی', 'گرم', 'پشمی',
    'coat', 'wool', 'knit', 'sweater', 'jacket', 'boots', 'بوت', 'شال',
  ],
};

const ENV_KEYWORDS: Record<OutfitEnvironment, string[]> = {
  office: ['اداری', 'رسمی', 'کت', 'شلوار', 'پیراهن', 'office', 'work', 'blazer'],
  gathering: ['دورهمی', 'مهمانی', 'دوستانه', 'کژوال', 'party', 'social', 'gathering'],
};

function textBlob(item: ClothingItem): string {
  return [item.name, item.color, item.category, ...(item.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function keywordScore(blob: string, keywords: string[]): number {
  let score = 0;
  for (const kw of keywords) {
    if (blob.includes(kw.toLowerCase())) score += 12;
  }
  return Math.min(score, 48);
}

/** Category preference weights by context */
function categoryBias(ctx: OutfitContext, category: ClothingCategory): number {
  let score = 0;

  // Style
  if (ctx.style === 'formal') {
    if (category === 'tops' || category === 'bottoms' || category === 'outerwear') score += 10;
    if (category === 'shoes') score += 8;
    if (category === 'dresses') score += 6;
    if (category === 'accessories') score += 4;
  } else if (ctx.style === 'party') {
    if (category === 'dresses') score += 14;
    if (category === 'shoes' || category === 'accessories') score += 10;
    if (category === 'tops') score += 6;
  } else {
    // casual
    if (category === 'tops' || category === 'bottoms' || category === 'shoes') score += 10;
    if (category === 'accessories') score += 4;
  }

  // Environment
  if (ctx.environment === 'office') {
    if (category === 'outerwear' || category === 'tops' || category === 'bottoms') score += 6;
    if (category === 'dresses' && ctx.style === 'party') score -= 4;
  }

  // Weather
  if (ctx.weather === 'cold') {
    if (category === 'outerwear') score += 16;
    if (category === 'shoes') score += 4;
  } else if (ctx.weather === 'rainy') {
    if (category === 'outerwear') score += 12;
    if (category === 'shoes') score += 8;
  } else if (ctx.weather === 'sunny') {
    if (category === 'outerwear') score -= 4;
    if (category === 'dresses' || category === 'tops') score += 4;
  }

  return score;
}

/** Score a single item for how well it fits the context (0–100). */
export function scoreItemForContext(item: ClothingItem, ctx: OutfitContext): number {
  const blob = textBlob(item);
  let score = 40;

  score += keywordScore(blob, STYLE_KEYWORDS[ctx.style]);
  score += keywordScore(blob, WEATHER_KEYWORDS[ctx.weather]) * 0.7;
  score += keywordScore(blob, ENV_KEYWORDS[ctx.environment]) * 0.5;
  score += categoryBias(ctx, item.category);

  // Formal + bright party colors penalty
  if (ctx.style === 'formal' || ctx.environment === 'office') {
    if (/صورتی|قرمز براق|پولکی|شاین/.test(blob)) score -= 8;
  }

  // Cold weather: penalize very light/summer-only signals
  if (ctx.weather === 'cold' && /صندل|شلوارک|نخی نازک/.test(blob)) score -= 15;

  // Sunny: slight boost for light neutrals
  if (ctx.weather === 'sunny' && isNeutralColor(item.color)) score += 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Build a complete outfit from wardrobe ranked by context + color harmony.
 * Uses user-selected items as anchors when provided.
 */
export function buildContextOutfit(
  wardrobe: ClothingItem[],
  ctx: OutfitContext,
  anchors: ClothingItem[] = []
): ClothingItem[] {
  if (wardrobe.length === 0) return [];

  const anchorIds = new Set(anchors.map((a) => a.id));
  const ranked = [...wardrobe]
    .map((item) => ({ item, score: scoreItemForContext(item, ctx) }))
    .sort((a, b) => b.score - a.score);

  const picked: ClothingItem[] = [...anchors];
  const usedCategories = new Set(anchors.map((a) => a.category));

  const need = (cat: ClothingCategory) => !usedCategories.has(cat);

  const tryPick = (predicate: (i: ClothingItem) => boolean) => {
    for (const { item } of ranked) {
      if (anchorIds.has(item.id) || picked.some((p) => p.id === item.id)) continue;
      if (!predicate(item)) continue;

      // Color harmony with already picked
      if (picked.length > 0 && item.color) {
        let colorOk = false;
        for (const p of picked) {
          if (!p.color) {
            colorOk = true;
            break;
          }
          const { score } = scoreColorPair(p.color, item.color);
          if (score >= 55) {
            colorOk = true;
            break;
          }
        }
        if (!colorOk && picked.every((p) => p.color)) continue;
      }

      picked.push(item);
      usedCategories.add(item.category);
      return true;
    }
    return false;
  };

  // Dress path for party / optional formal
  if (
    (ctx.style === 'party' || ctx.style === 'formal') &&
    need('dresses')
  ) {
    tryPick((i) => i.category === 'dresses');
  }

  // Classic path
  if (need('tops')) tryPick((i) => i.category === 'tops');
  if (need('bottoms') && need('dresses')) {
    // if no dress, need bottoms
    if (![...picked].some((p) => p.category === 'dresses')) {
      tryPick((i) => i.category === 'bottoms');
    }
  } else if (need('bottoms')) {
    tryPick((i) => i.category === 'bottoms');
  }

  if (need('shoes')) tryPick((i) => i.category === 'shoes');

  if (ctx.weather === 'cold' || ctx.weather === 'rainy') {
    if (need('outerwear')) tryPick((i) => i.category === 'outerwear');
  } else if (need('outerwear') && (ctx.style === 'formal' || ctx.environment === 'office')) {
    tryPick((i) => i.category === 'outerwear');
  }

  if (need('accessories')) tryPick((i) => i.category === 'accessories');

  // Ensure at least 2 items
  if (picked.length < 2) {
    for (const { item } of ranked) {
      if (picked.some((p) => p.id === item.id)) continue;
      picked.push(item);
      if (picked.length >= 3) break;
    }
  }

  return picked;
}

/** Persian blurb describing the context for AI / local text */
export function describeContext(ctx: OutfitContext): string {
  const style = STYLE_OPTIONS.find((o) => o.value === ctx.style)!;
  const env = ENVIRONMENT_OPTIONS.find((o) => o.value === ctx.environment)!;
  const weather = WEATHER_OPTIONS.find((o) => o.value === ctx.weather)!;
  return `مناسبت: ${style.label} (${style.hint})، محیط: ${env.label}، آب‌وهوا: ${weather.label}`;
}

export function contextPromptBlock(ctx: OutfitContext): string {
  return `
User occasion context (MUST respect these constraints):
- Style / dress code: ${ctx.style} (${STYLE_OPTIONS.find((o) => o.value === ctx.style)?.label})
- Environment: ${ctx.environment} (${ENVIRONMENT_OPTIONS.find((o) => o.value === ctx.environment)?.label})
- Weather: ${ctx.weather} (${WEATHER_OPTIONS.find((o) => o.value === ctx.weather)?.label})

Guidelines:
- formal + office → polished, modest, professional pieces; avoid flashy party wear
- party + gathering → elevated, stylish, can include statement pieces
- casual → comfortable everyday wear
- cold → include layers / outerwear / closed shoes when available
- rainy → prefer outerwear and practical shoes when available
- sunny → lighter fabrics, avoid heavy coats unless formal layering
Only use items from the provided wardrobe list.
`.trim();
}
