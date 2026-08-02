import { ClothingItem } from '@/types/wardrobe';
import { scoreColorPair, isNeutralColor, resolveColorName } from '@/lib/colorHarmony';
import type { OutfitContext } from '@/lib/outfitContext';
import beltBlack from '@/assets/belt-black.png';
import beltBrown from '@/assets/belt-brown.png';
import bagClutch from '@/assets/bag-clutch.png';
import bagTote from '@/assets/bag-tote.png';

export interface SuggestedAccessory {
  id: string;
  name: string;
  imageUrl: string;
  type: 'belt' | 'bag' | 'wardrobe';
  /** English description used for the AI try-on prompt */
  prompt: string;
  /** Optional Persian color label for matching */
  color?: string;
  /** Match score 0–100 when ranked */
  score?: number;
  /** Short Persian reason */
  reason?: string;
  /** Linked wardrobe item when suggestion comes from user's closet */
  wardrobeItem?: ClothingItem;
}

export const ALL_ACCESSORY_OPTIONS: SuggestedAccessory[] = [
  {
    id: 'belt-black-gold',
    name: 'کمربند چرم مشکی (گُلد طلا)',
    imageUrl: beltBlack,
    type: 'belt',
    color: 'مشکی',
    prompt: 'a slim black leather belt with a polished gold buckle at the waist',
  },
  {
    id: 'belt-black-silver',
    name: 'کمربند مشکی (گُلد نقره‌ای)',
    imageUrl: beltBlack,
    type: 'belt',
    color: 'مشکی',
    prompt: 'a black leather belt with a classic silver buckle at the waist',
  },
  {
    id: 'belt-brown-casual',
    name: 'کمربند چرم قهوه‌ای کژوال',
    imageUrl: beltBrown,
    type: 'belt',
    color: 'قهوه‌ای',
    prompt: 'a warm light-brown casual leather belt at the waist',
  },
  {
    id: 'belt-brown-vintage',
    name: 'کمربند چرم قهوه‌ای وینتیج',
    imageUrl: beltBrown,
    type: 'belt',
    color: 'قهوه‌ای',
    prompt: 'a vintage dark-tan leather belt with a classic brass buckle',
  },
  {
    id: 'bag-clutch-black',
    name: 'کیف دستی مشکی مجلسی',
    imageUrl: bagClutch,
    type: 'bag',
    color: 'مشکی',
    prompt: 'an elegant black leather clutch bag held in one hand',
  },
  {
    id: 'bag-clutch-gold',
    name: 'کیف دستی مشکی با جزئیات طلا',
    imageUrl: bagClutch,
    type: 'bag',
    color: 'مشکی',
    prompt: 'a black evening clutch bag with gold hardware details',
  },
  {
    id: 'bag-tote-beige',
    name: 'کیف دوشی بژ',
    imageUrl: bagTote,
    type: 'bag',
    color: 'بژ',
    prompt: 'a beige leather tote shoulder bag hanging from the shoulder',
  },
  {
    id: 'bag-tote-leather',
    name: 'کیف دوشی چرمی',
    imageUrl: bagTote,
    type: 'bag',
    color: 'قهوه‌ای',
    prompt: 'a classy structured leather tote bag over the shoulder',
  },
];

const BELT_POOL = ALL_ACCESSORY_OPTIONS.filter((a) => a.type === 'belt').map((a) => a.id);
const BAG_POOL = ALL_ACCESSORY_OPTIONS.filter((a) => a.type === 'bag').map((a) => a.id);

const CASUAL_WORDS = [
  'jean', 'denim', 'شلوار جین', 'جین', 'تیشرت', 'تی شرت',
  't-shirt', 'tshirt', 'هودی', 'hoodie', 'sweat', 'شورت',
  'ورزشی', 'sport', 'کژوال', 'casual', 'کتانی', 'اسپرت', 'bomber',
];
const DARK_WORDS = ['مشکی', 'سیاه', 'black', 'سرمه', 'navy', 'تیره', 'آبی تیره', 'قهوه‌ای'];
const LIGHT_WORDS = ['سفید', 'white', 'روشن', 'کرم', 'بژ', 'طلایی', 'beige', 'شیری'];
const FORMAL_WORDS = [
  'کت', 'suit', 'blazer', 'رسمی', 'formal', 'پیراهن مردانه',
  'shirt', 'دامن', 'skirt', 'مجلسی', 'مهمانی', 'دخترانه',
  'عروسی', 'مراسم', 'شومیز', 'سرمه',
];
const WINTER_WORDS = [
  'زمستان', 'زمستانی', 'پالتو', 'کت پشمی', 'بافتنی', 'پشمی',
  'پارکا', 'winter', 'wool', 'مانتو',
];
const BAG_WORDS = ['کیف', 'bag', 'clutch', 'tote', 'کوله‌پشتی', 'backpack'];
const BELT_WORDS = ['کمربند', 'belt'];

const matches = (text: string, words: string[]) =>
  words.some((w) => text.includes(w.toLowerCase()));

function pickOne<T>(salt: string, text: string, options: T[]): T {
  if (options.length === 0) return null as unknown as T;
  const s = salt + text;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return options[Math.abs(hash) % options.length];
}

function outfitText(items: ClothingItem[]): string {
  return items
    .map((i) => `${i.name} ${i.category} ${i.color ?? ''} ${(i.tags || []).join(' ')}`)
    .join(' ')
    .toLowerCase();
}

function dominantOutfitColors(items: ClothingItem[]): string[] {
  return items
    .map((i) => resolveColorName(i.color))
    .filter((c): c is string => Boolean(c));
}

function colorMatchScore(accessoryColor: string | undefined, outfitColors: string[]): number {
  if (!accessoryColor || outfitColors.length === 0) return 55;
  let best = 0;
  for (const c of outfitColors) {
    const { score } = scoreColorPair(accessoryColor, c);
    if (score > best) best = score;
  }
  // Neutrals always acceptable with outfits
  if (isNeutralColor(accessoryColor)) best = Math.max(best, 82);
  return best;
}

function contextBoost(
  type: 'belt' | 'bag' | 'wardrobe',
  ctx?: OutfitContext
): number {
  if (!ctx) return 0;
  let s = 0;
  if (type === 'belt') {
    if (ctx.style === 'formal' || ctx.environment === 'office') s += 10;
    if (ctx.style === 'casual') s += 4;
  }
  if (type === 'bag') {
    if (ctx.style === 'party') s += 12;
    if (ctx.environment === 'office') s += 8;
    if (ctx.style === 'casual') s += 6;
  }
  return s;
}

/**
 * Catalog accessory suggestions (belt/bag assets) for mannequin overlay.
 */
export function suggestAccessories(
  items: ClothingItem[],
  gender: 'female' | 'male' = 'female',
  context?: OutfitContext
): SuggestedAccessory[] {
  if (items.length === 0) return [];
  if (items.some((i) => i.category === 'accessories')) return [];

  const text = outfitText(items);
  const outfitColors = dominantOutfitColors(items);

  const hasBottom = items.some((i) => i.category === 'bottoms');
  const hasTop = items.some((i) => i.category === 'tops');
  const hasDress = items.some((i) => i.category === 'dresses');
  const hasOuterwear = items.some((i) => i.category === 'outerwear');
  const casual = matches(text, CASUAL_WORDS) || context?.style === 'casual';
  const dark = matches(text, DARK_WORDS);
  const light = matches(text, LIGHT_WORDS);
  const formal =
    matches(text, FORMAL_WORDS) ||
    matches(text, WINTER_WORDS) ||
    context?.style === 'formal' ||
    context?.environment === 'office';
  const party = context?.style === 'party';

  const result: SuggestedAccessory[] = [];

  // ---- Belt ----
  let beltPool: string[] = [];
  let addBelt = false;

  if (hasBottom && (hasTop || hasOuterwear)) {
    addBelt = true;
    if (dark || formal) beltPool = ['belt-black-gold', 'belt-black-silver'];
    else if (light || casual) beltPool = ['belt-brown-casual', 'belt-brown-vintage', 'belt-black-silver'];
    else beltPool = [...BELT_POOL];
  } else if (gender === 'male' && (formal || hasOuterwear || hasDress)) {
    addBelt = true;
    beltPool = dark ? ['belt-black-gold', 'belt-black-silver'] : [...BELT_POOL];
  } else if (hasDress && formal && gender === 'female') {
    addBelt = true;
    beltPool = dark ? ['belt-black-gold'] : ['belt-brown-vintage', 'belt-black-silver'];
  }

  if (addBelt && beltPool.length > 0) {
    // Rank belt pool by color match
    const rankedBelts = beltPool
      .map((id) => ALL_ACCESSORY_OPTIONS.find((a) => a.id === id)!)
      .filter(Boolean)
      .map((belt) => {
        const colorScore = colorMatchScore(belt.color, outfitColors);
        const score = Math.min(
          100,
          Math.round(colorScore * 0.7 + 20 + contextBoost('belt', context))
        );
        return {
          ...belt,
          score,
          reason: formal ? 'هماهنگ با استایل رسمی' : 'تکمیل کمر و خطوط ست',
        };
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    if (rankedBelts[0]) result.push(rankedBelts[0]);
  }

  // ---- Bag (prefer female / party / office) ----
  if (gender === 'female' || party || context?.environment === 'office') {
    let bagPool: string[] = [];
    if (hasDress || party) {
      if (formal || dark || party) bagPool = ['bag-clutch-black', 'bag-clutch-gold', 'bag-tote-leather'];
      else bagPool = light ? ['bag-tote-beige', 'bag-tote-leather'] : ['bag-clutch-black', 'bag-tote-beige'];
    } else if (casual) {
      bagPool = light
        ? ['bag-tote-beige', 'bag-tote-leather']
        : dark
          ? ['bag-tote-leather', 'bag-clutch-black']
          : ['bag-tote-beige', 'bag-clutch-gold'];
    } else {
      bagPool = light
        ? ['bag-tote-beige', 'bag-clutch-gold']
        : dark
          ? ['bag-clutch-black', 'bag-tote-leather']
          : [...BAG_POOL];
    }

    const rankedBags = bagPool
      .map((id) => ALL_ACCESSORY_OPTIONS.find((a) => a.id === id)!)
      .filter(Boolean)
      .map((bag) => {
        const colorScore = colorMatchScore(bag.color, outfitColors);
        const score = Math.min(
          100,
          Math.round(colorScore * 0.65 + 18 + contextBoost('bag', context))
        );
        return {
          ...bag,
          score,
          reason: party
            ? 'کیف مناسب مهمانی'
            : formal
              ? 'کیف شیک برای محیط رسمی'
              : 'تکمیل کاربردی ست',
        };
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    if (rankedBags[0]) result.push(rankedBags[0]);
  }

  return result;
}

/**
 * Rank accessories from the user's own wardrobe that coordinate with the outfit.
 */
export function suggestWardrobeAccessories(
  outfitItems: ClothingItem[],
  wardrobe: ClothingItem[],
  options?: { limit?: number; context?: OutfitContext }
): SuggestedAccessory[] {
  if (outfitItems.length === 0) return [];

  const selectedIds = new Set(outfitItems.map((i) => i.id));
  const alreadyHasAccessory = outfitItems.some((i) => i.category === 'accessories');
  if (alreadyHasAccessory) return [];

  const outfitColors = dominantOutfitColors(outfitItems);
  const text = outfitText(outfitItems);
  const formal =
    matches(text, FORMAL_WORDS) ||
    options?.context?.style === 'formal' ||
    options?.context?.environment === 'office';
  const party = options?.context?.style === 'party';

  const candidates = wardrobe.filter(
    (i) => i.category === 'accessories' && !selectedIds.has(i.id)
  );

  const ranked = candidates.map((item) => {
    const blob = `${item.name} ${item.color ?? ''}`.toLowerCase();
    const isBag = matches(blob, BAG_WORDS);
    const isBelt = matches(blob, BELT_WORDS);
    let score = colorMatchScore(item.color, outfitColors);

    if (isBelt && (formal || outfitItems.some((i) => i.category === 'bottoms'))) {
      score += 12;
    }
    if (isBag) {
      if (party) score += 14;
      if (options?.context?.environment === 'office') score += 8;
      score += 6;
    }
    if (isNeutralColor(item.color)) score += 5;
    score += contextBoost(isBelt ? 'belt' : 'bag', options?.context);

    let reason = 'هماهنگ با رنگ ست';
    if (isBelt) reason = 'کمربند هماهنگ از کمد شما';
    else if (isBag) reason = party ? 'کیف مناسب مهمانی از کمد' : 'کیف هماهنگ از کمد شما';
    else if (score >= 80) reason = 'تطبیق رنگ عالی با ست';

    return {
      id: `wardrobe-${item.id}`,
      name: item.name,
      imageUrl: item.imageUrl,
      type: 'wardrobe' as const,
      color: item.color,
      prompt: item.name,
      score: Math.min(100, Math.round(score)),
      reason,
      wardrobeItem: item,
    };
  });

  ranked.sort((a, b) => (b.score || 0) - (a.score || 0));
  return ranked.slice(0, options?.limit ?? 4);
}

/**
 * Combined: wardrobe accessories first, then catalog fillers.
 */
export function suggestCoordinatedAccessories(
  outfitItems: ClothingItem[],
  wardrobe: ClothingItem[],
  gender: 'female' | 'male' = 'female',
  context?: OutfitContext
): SuggestedAccessory[] {
  const fromWardrobe = suggestWardrobeAccessories(outfitItems, wardrobe, {
    limit: 3,
    context,
  });
  const fromCatalog = suggestAccessories(outfitItems, gender, context).map((a) => ({
    ...a,
    reason: a.reason || 'پیشنهاد کاتالوگ هماهنگ',
  }));

  // Prefer wardrobe items; fill remaining slots from catalog
  const combined = [...fromWardrobe];
  for (const c of fromCatalog) {
    if (combined.length >= 4) break;
    // avoid duplicate types if wardrobe already has bag/belt feel
    combined.push(c);
  }
  return combined.slice(0, 4);
}

export function suggestAccessory(
  items: ClothingItem[],
  gender: 'female' | 'male' = 'female'
): SuggestedAccessory | null {
  return suggestAccessories(items, gender)[0] ?? null;
}
