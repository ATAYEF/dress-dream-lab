import { ClothingItem } from '@/types/wardrobe';
import { scoreColorPair, isNeutralColor, resolveColorName } from '@/lib/colorHarmony';
import type { OutfitContext } from '@/lib/outfitContext';
import shoesHeels from '@/assets/shoes-heels.png';
import shoesSneakers from '@/assets/shoes-sneakers.png';
import shoesBoots from '@/assets/shoes-boots.png';
import shoesLoafers from '@/assets/shoes-loafers.png';

export interface SuggestedShoe {
  id: string;
  name: string;
  imageUrl: string;
  /** English description used for the AI try-on prompt */
  prompt: string;
  color?: string;
  kind?: 'heels' | 'sneakers' | 'boots' | 'loafers' | 'wardrobe';
  score?: number;
  reason?: string;
  wardrobeItem?: ClothingItem;
}

export const ALL_SHOE_OPTIONS: SuggestedShoe[] = [
  {
    id: 'shoe-heels-black',
    name: 'کفش پاشنه‌بلند مشکی',
    imageUrl: shoesHeels,
    color: 'مشکی',
    kind: 'heels',
    prompt: 'elegant black leather high-heel pumps with a subtle stiletto',
  },
  {
    id: 'shoe-heels-nude',
    name: 'پاشنه‌بلند نود',
    imageUrl: shoesHeels,
    color: 'بژ',
    kind: 'heels',
    prompt: 'nude/beige elegant high heel stilettos to elongate the legs',
  },
  {
    id: 'shoe-sneakers-white',
    name: 'کتانی سفید استاندارد',
    imageUrl: shoesSneakers,
    color: 'سفید',
    kind: 'sneakers',
    prompt: 'clean white minimal leather sneakers with flat laces',
  },
  {
    id: 'shoe-sneakers-sport',
    name: 'کتانی ورزشی سفید',
    imageUrl: shoesSneakers,
    color: 'سفید',
    kind: 'sneakers',
    prompt: 'white chunky athletic running sneakers with a sporty sole',
  },
  {
    id: 'shoe-boots-brown',
    name: 'بوت چرم قهوه‌ای',
    imageUrl: shoesBoots,
    color: 'قهوه‌ای',
    kind: 'boots',
    prompt: 'warm brown leather Chelsea ankle boots',
  },
  {
    id: 'shoe-boots-black',
    name: 'بوت چرم مشکی',
    imageUrl: shoesBoots,
    color: 'مشکی',
    kind: 'boots',
    prompt: 'sleek black leather ankle boots with a low heel',
  },
  {
    id: 'shoe-loafers-black',
    name: 'کفش رسمی مشکی',
    imageUrl: shoesLoafers,
    color: 'مشکی',
    kind: 'loafers',
    prompt: 'classic black leather Oxford dress shoes with a polished toe',
  },
  {
    id: 'shoe-loafers-brown',
    name: 'کفش رسمی قهوه‌ای',
    imageUrl: shoesLoafers,
    color: 'قهوه‌ای',
    kind: 'loafers',
    prompt: 'brown leather penny loafers - smart and casual',
  },
];

const CASUAL_WORDS = [
  'jean', 'denim', 'شلوار جین', 'جین', 'تیشرت', 'تی شرت',
  't-shirt', 'tshirt', 'هودی', 'hoodie', 'sweat', 'شورت',
  'ورزشی', 'sport', 'کژوال', 'casual', 'کتانی', 'اسپرت', 'bomber',
];
const FORMAL_WORDS = [
  'کت', 'suit', 'blazer', 'رسمی', 'formal', 'پیراهن مردانه',
  'shirt', 'دامن', 'skirt', 'مجلسی', 'مهمانی', 'شومیز', 'سرمه',
];
const SUMMER_WORDS = [
  'تابستان', 'تابستانی', 'کوتاه', 'نخی', 'کتان', 'صندل', 'linen', 'summer',
];
const WINTER_WORDS = [
  'زمستان', 'زمستانی', 'پالتو', 'بافتنی', 'پشمی', 'winter', 'wool', 'مانتو', 'بوت',
];
const DARK_WORDS = ['مشکی', 'سیاه', 'black', 'سرمه', 'navy', 'تیره', 'قهوه‌ای'];
const LIGHT_WORDS = ['سفید', 'white', 'روشن', 'کرم', 'بژ', 'beige', 'شیری'];
const SHOE_WORDS = [
  'کفش', 'کتانی', 'اسنیکر', 'بوت', 'پاشنه', 'لوفر', 'صندل',
  'sneaker', 'boot', 'heel', 'loafer', 'shoe', 'oxford',
];

const matches = (text: string, words: string[]) =>
  words.some((w) => text.includes(w.toLowerCase()));

function pickOne(text: string, options: string[]): string {
  if (options.length === 0) return '';
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return options[Math.abs(hash) % options.length];
}

function outfitText(items: ClothingItem[]): string {
  return items
    .map((i) => `${i.name} ${i.category} ${i.color ?? ''} ${(i.tags || []).join(' ')}`)
    .join(' ')
    .toLowerCase();
}

function outfitColors(items: ClothingItem[]): string[] {
  return items
    .map((i) => resolveColorName(i.color))
    .filter((c): c is string => Boolean(c));
}

function colorMatchScore(shoeColor: string | undefined, colors: string[]): number {
  if (!shoeColor || colors.length === 0) return 55;
  let best = 0;
  for (const c of colors) {
    const { score } = scoreColorPair(shoeColor, c);
    if (score > best) best = score;
  }
  if (isNeutralColor(shoeColor)) best = Math.max(best, 84);
  return best;
}

function contextKindBoost(kind: SuggestedShoe['kind'], ctx?: OutfitContext): number {
  if (!ctx || !kind) return 0;
  let s = 0;
  if (ctx.style === 'formal' || ctx.environment === 'office') {
    if (kind === 'loafers' || kind === 'heels') s += 14;
    if (kind === 'sneakers') s -= 10;
  }
  if (ctx.style === 'party') {
    if (kind === 'heels') s += 16;
    if (kind === 'loafers') s += 4;
  }
  if (ctx.style === 'casual') {
    if (kind === 'sneakers') s += 12;
    if (kind === 'boots') s += 4;
  }
  if (ctx.weather === 'cold' || ctx.weather === 'rainy') {
    if (kind === 'boots') s += 18;
    if (kind === 'sneakers' && ctx.weather === 'rainy') s -= 6;
  }
  if (ctx.weather === 'sunny') {
    if (kind === 'sneakers' || kind === 'heels') s += 6;
    if (kind === 'boots') s -= 4;
  }
  return s;
}

function byId(id: string): SuggestedShoe | undefined {
  return ALL_SHOE_OPTIONS.find((s) => s.id === id);
}

function rankCatalog(
  poolIds: string[],
  colors: string[],
  ctx: OutfitContext | undefined,
  reason: string
): SuggestedShoe[] {
  return poolIds
    .map((id) => byId(id))
    .filter((s): s is SuggestedShoe => Boolean(s))
    .map((shoe) => {
      const score = Math.min(
        100,
        Math.round(
          colorMatchScore(shoe.color, colors) * 0.65 +
            18 +
            contextKindBoost(shoe.kind, ctx)
        )
      );
      return { ...shoe, score, reason };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}

/**
 * Catalog shoe suggestion for mannequin (single best pick — backwards compatible).
 */
export function suggestShoes(
  items: ClothingItem[],
  gender: 'female' | 'male' = 'female',
  context?: OutfitContext
): SuggestedShoe | null {
  const list = suggestCatalogShoes(items, gender, context);
  return list[0] ?? null;
}

/** Multiple ranked catalog shoe ideas */
export function suggestCatalogShoes(
  items: ClothingItem[],
  gender: 'female' | 'male' = 'female',
  context?: OutfitContext
): SuggestedShoe[] {
  if (items.length === 0) return [];
  if (items.some((i) => i.category === 'shoes')) return [];

  const text = outfitText(items);
  const colors = outfitColors(items);
  const dark = matches(text, DARK_WORDS);
  const light = matches(text, LIGHT_WORDS);
  const casual = matches(text, CASUAL_WORDS) || context?.style === 'casual';
  const formal =
    matches(text, FORMAL_WORDS) ||
    context?.style === 'formal' ||
    context?.environment === 'office';
  const party = context?.style === 'party';
  const cold = matches(text, WINTER_WORDS) || context?.weather === 'cold' || context?.weather === 'rainy';
  const summer = matches(text, SUMMER_WORDS) || context?.weather === 'sunny';

  let pool: string[] = [];
  let reason = 'هماهنگ با ست';

  if (cold) {
    pool = dark
      ? ['shoe-boots-black', 'shoe-boots-brown', 'shoe-loafers-black']
      : ['shoe-boots-brown', 'shoe-boots-black', 'shoe-loafers-brown'];
    reason = context?.weather === 'rainy' ? 'مناسب هوای بارانی' : 'مناسب هوای سرد';
  } else if (party) {
    pool =
      gender === 'female'
        ? dark
          ? ['shoe-heels-black', 'shoe-boots-black']
          : ['shoe-heels-nude', 'shoe-heels-black']
        : dark
          ? ['shoe-loafers-black', 'shoe-boots-black']
          : ['shoe-loafers-brown', 'shoe-loafers-black'];
    reason = 'مناسب مهمانی';
  } else if (formal) {
    if (gender === 'male') {
      pool = dark
        ? ['shoe-loafers-black', 'shoe-boots-black']
        : ['shoe-loafers-black', 'shoe-loafers-brown'];
    } else {
      pool = dark ? ['shoe-heels-black', 'shoe-loafers-black'] : ['shoe-heels-nude', 'shoe-heels-black'];
    }
    reason = context?.environment === 'office' ? 'مناسب محیط اداری' : 'استایل رسمی';
  } else if (casual || summer) {
    pool =
      gender === 'female'
        ? light
          ? ['shoe-sneakers-white', 'shoe-heels-nude', 'shoe-sneakers-sport']
          : ['shoe-sneakers-white', 'shoe-boots-brown', 'shoe-sneakers-sport']
        : light
          ? ['shoe-sneakers-white', 'shoe-loafers-brown']
          : ['shoe-sneakers-white', 'shoe-boots-brown', 'shoe-sneakers-sport'];
    reason = 'روزمره و راحت';
  } else {
    // default
    if (gender === 'male') {
      pool = dark
        ? ['shoe-loafers-black', 'shoe-boots-black']
        : light
          ? ['shoe-sneakers-white', 'shoe-loafers-brown']
          : ['shoe-sneakers-white', 'shoe-boots-brown', 'shoe-loafers-brown'];
    } else {
      pool = dark
        ? ['shoe-heels-black', 'shoe-boots-black']
        : light
          ? ['shoe-heels-nude', 'shoe-sneakers-white']
          : ['shoe-heels-black', 'shoe-boots-brown', 'shoe-heels-nude'];
    }
    reason = 'پیشنهاد هماهنگ با رنگ ست';
  }

  // Deterministic primary + ranked alternatives
  const primaryId = pickOne(text + gender + (context?.style || ''), pool);
  const ordered = [primaryId, ...pool.filter((id) => id !== primaryId)];
  return rankCatalog(ordered, colors, context, reason).slice(0, 3);
}

/** Rank shoes from user's wardrobe */
export function suggestWardrobeShoes(
  outfitItems: ClothingItem[],
  wardrobe: ClothingItem[],
  options?: { limit?: number; context?: OutfitContext }
): SuggestedShoe[] {
  if (outfitItems.length === 0) return [];
  if (outfitItems.some((i) => i.category === 'shoes')) return [];

  const selectedIds = new Set(outfitItems.map((i) => i.id));
  const colors = outfitColors(outfitItems);
  const text = outfitText(outfitItems);
  const formal =
    matches(text, FORMAL_WORDS) ||
    options?.context?.style === 'formal' ||
    options?.context?.environment === 'office';
  const party = options?.context?.style === 'party';
  const cold =
    options?.context?.weather === 'cold' || options?.context?.weather === 'rainy';

  const candidates = wardrobe.filter(
    (i) => i.category === 'shoes' && !selectedIds.has(i.id)
  );

  const ranked = candidates.map((item) => {
    const blob = `${item.name} ${item.color ?? ''}`.toLowerCase();
    let kind: SuggestedShoe['kind'] = 'wardrobe';
    if (/پاشنه|heel|ستiletto|pump/.test(blob)) kind = 'heels';
    else if (/کتانی|اسنیکر|sneaker|ورزشی/.test(blob)) kind = 'sneakers';
    else if (/بوت|boot|چکمه/.test(blob)) kind = 'boots';
    else if (/لوفر|رسمی|oxford|loafer/.test(blob)) kind = 'loafers';

    let score = colorMatchScore(item.color, colors);
    score += contextKindBoost(kind === 'wardrobe' ? undefined : kind, options?.context);

    if (formal && (kind === 'loafers' || kind === 'heels')) score += 10;
    if (party && kind === 'heels') score += 12;
    if (cold && kind === 'boots') score += 14;
    if (isNeutralColor(item.color)) score += 4;

    let reason = 'کفش هماهنگ از کمد شما';
    if (kind === 'boots' && cold) reason = 'بوت مناسب هوا از کمد شما';
    else if (kind === 'heels' && party) reason = 'پاشنه مناسب مهمانی از کمد';
    else if (kind === 'loafers' && formal) reason = 'کفش رسمی از کمد شما';
    else if (score >= 85) reason = 'تطبیق رنگ عالی با ست';

    return {
      id: `wardrobe-shoe-${item.id}`,
      name: item.name,
      imageUrl: item.imageUrl,
      prompt: item.name,
      color: item.color,
      kind: 'wardrobe' as const,
      score: Math.min(100, Math.round(score)),
      reason,
      wardrobeItem: item,
    };
  });

  ranked.sort((a, b) => (b.score || 0) - (a.score || 0));
  return ranked.slice(0, options?.limit ?? 3);
}

/** Wardrobe first, then catalog ideas */
export function suggestCoordinatedShoes(
  outfitItems: ClothingItem[],
  wardrobe: ClothingItem[],
  gender: 'female' | 'male' = 'female',
  context?: OutfitContext
): SuggestedShoe[] {
  const fromWardrobe = suggestWardrobeShoes(outfitItems, wardrobe, {
    limit: 3,
    context,
  });
  const fromCatalog = suggestCatalogShoes(outfitItems, gender, context);

  const combined = [...fromWardrobe];
  for (const c of fromCatalog) {
    if (combined.length >= 4) break;
    combined.push(c);
  }
  return combined.slice(0, 4);
}
