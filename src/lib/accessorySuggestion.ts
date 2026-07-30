import { ClothingItem } from '@/types/wardrobe';
import beltBlack from '@/assets/belt-black.png';
import beltBrown from '@/assets/belt-brown.png';
import bagClutch from '@/assets/bag-clutch.png';
import bagTote from '@/assets/bag-tote.png';

export interface SuggestedAccessory {
  id: string;
  name: string;
  imageUrl: string;
  type: 'belt' | 'bag';
  /** English description used for the AI try-on prompt */
  prompt: string;
}

/* ========== Accessory Options (variety pool) ==========
Same image assets can appear with different names/prompts so suggestions
are dynamic and change between outfits instead of always being identical. */
export const ALL_ACCESSORY_OPTIONS: SuggestedAccessory[] = [
  // Belts
  {
    id: 'belt-black-gold',
    name: 'کمربند چرم مشکی (گُلد طلا)',
    imageUrl: beltBlack,
    type: 'belt',
    prompt: 'a slim black leather belt with a polished gold buckle at the waist',
  },
  {
    id: 'belt-black-silver',
    name: 'کمربند مشکی (گُلد نقره‌ای)',
    imageUrl: beltBlack,
    type: 'belt',
    prompt: 'a black leather belt with a classic silver buckle at the waist',
  },
  {
    id: 'belt-brown-casual',
    name: 'کمربند چرم قهوه‌ای کژوال',
    imageUrl: beltBrown,
    type: 'belt',
    prompt: 'a warm light-brown casual leather belt at the waist',
  },
  {
    id: 'belt-brown-vintage',
    name: 'کمربند چرم قهوه‌ای وینتیج',
    imageUrl: beltBrown,
    type: 'belt',
    prompt: 'a vintage dark-tan leather belt with a classic brass buckle',
  },
  // Bags
  {
    id: 'bag-clutch-black',
    name: 'کیف دستی مشکی مجلسی',
    imageUrl: bagClutch,
    type: 'bag',
    prompt: 'an elegant black leather clutch bag held in one hand',
  },
  {
    id: 'bag-clutch-gold',
    name: 'کیف دستی مشکی با جزئیات طلا',
    imageUrl: bagClutch,
    type: 'bag',
    prompt: 'a black evening clutch bag with gold hardware details',
  },
  {
    id: 'bag-tote-beige',
    name: 'کیف دوشی بژ',
    imageUrl: bagTote,
    type: 'bag',
    prompt: 'a beige leather tote shoulder bag hanging from the shoulder',
  },
  {
    id: 'bag-tote-leather',
    name: 'کیف دوشی چرمی',
    imageUrl: bagTote,
    type: 'bag',
    prompt: 'a classy structured leather tote bag over the shoulder',
  },
];

const BELT_POOL = ALL_ACCESSORY_OPTIONS.filter((a) => a.type === 'belt').map((a) => a.id);
const BAG_POOL = ALL_ACCESSORY_OPTIONS.filter((a) => a.type === 'bag').map((a) => a.id);

const CASUAL_WORDS = [
  'jean', 'denim', 'شلوار جین', 'جین', 'تیشرت', 'تی شرت',
  't-shirt', 'tshirt', 'هودی', 'hoodie', 'sweat', 'شورت',
  'ورزشی', 'sport', 'کژوال', 'casual', 'کتانی', 'اسپرت',
  'bomber',
];
const DARK_WORDS = ['مشکی', 'سیاه', 'black', 'سرمه', 'navy', 'تیره', 'آبی تیره', 'قهوه‌ای'];
const LIGHT_WORDS = ['سفید', 'white', 'روشن', 'کرم', 'بژ', 'طلایی', 'beige', 'شیری'];
const FORMAL_WORDS = [
  'کت', 'suit', 'blazer', 'رسمی', 'formal', 'پیراهن مردانه',
  'shirt', 'دامن', 'skirt', 'مجلسی', 'مهمانی', 'دخترانه',
  'عروسی', 'مراسم', 'شومیز', 'سرمه',
];
const WINTER_WORDS = [
  'زمستان', 'زمستانی', 'پالتو', 'کت پشمی', 'بافتنی', 'پشمی', 'پشمینه',
  'پارکا', 'winter', 'wool', 'gown', 'مانتو', 'کت',
];

const matches = (text: string, words: string[]) =>
  words.some((w) => text.includes(w.toLowerCase()));

/** Deterministic "random" pick based on outfit hash. */
function pickOne<T>(salt: string, text: string, options: T[]): T {
  if (options.length === 0) return null as unknown as T;
  const s = salt + text;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % options.length;
  return options[index];
}

/**
 * Suggests the accessories (belt and/or bag) that complete the currently
 * selected outfit. Returns 0, 1 or 2 accessories depending on the outfit.
 */
export function suggestAccessories(
  items: ClothingItem[],
  gender: 'female' | 'male' = 'female'
): SuggestedAccessory[] {
  if (items.length === 0) return [];
  if (items.some((i) => i.category === 'accessories')) return [];

  const text = items
    .map((i) => `${i.name} ${i.category} ${i.color ?? ''}`)
    .join(' ')
    .toLowerCase();

  const hasBottom = items.some((i) => i.category === 'bottoms');
  const hasTop = items.some((i) => i.category === 'tops');
  const hasDress = items.some((i) => i.category === 'dresses');
  const hasOuterwear = items.some((i) => i.category === 'outerwear');
  const casual = matches(text, CASUAL_WORDS);
  const dark = matches(text, DARK_WORDS);
  const light = matches(text, LIGHT_WORDS);
  const formal = matches(text, FORMAL_WORDS) || matches(text, WINTER_WORDS);

  const result: SuggestedAccessory[] = [];

  // ---- Belt logic ----
  // Belt for tucked shirts (top + bottom), outerwear with bottom, or male formal
  let beltPool: string[] = [];
  let addBelt = false;

  if (hasBottom && (hasTop || hasOuterwear)) {
    addBelt = true;
    if (dark) beltPool = ['belt-black-gold', 'belt-black-silver'];
    else if (light || casual) beltPool = ['belt-brown-casual', 'belt-brown-vintage', 'belt-black-silver'];
    else beltPool = [...BELT_POOL];
  } else if (gender === 'male' && (formal || hasOuterwear || hasDress)) {
    addBelt = true;
    beltPool = dark ? ['belt-black-gold', 'belt-black-silver'] : BELT_POOL;
  } else if (hasDress && formal && gender === 'female') {
    // Sometimes a thin belt elevates a formal dress
    addBelt = Math.random() < 0.5;
    beltPool = dark ? ['belt-black-gold'] : ['belt-brown-vintage', 'belt-black-silver'];
  }

  if (addBelt && beltPool.length > 0) {
    const beltId = pickOne('belt', text, beltPool);
    const belt = ALL_ACCESSORY_OPTIONS.find((a) => a.id === beltId);
    if (belt) result.push(belt);
  }

  // ---- Bag logic (female outfits only) ----
  if (gender === 'female') {
    let bagPool: string[] = [];
    if (hasDress) {
      if (formal || dark) bagPool = ['bag-clutch-black', 'bag-clutch-gold', 'bag-tote-leather'];
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
        : ['bag-clutch-black', 'bag-tote-beige', 'bag-tote-leather'];
    }

    if (bagPool.length > 0) {
      // For lighter outfits: tote is generally more appropriate
      // For darker/formal outfits: clutch is generally more appropriate
      // Pick based on hash so it's deterministic but changes
      const bagId = pickOne('bag', text, bagPool);
      const bag = ALL_ACCESSORY_OPTIONS.find((a) => a.id === bagId);
      if (bag) result.push(bag);
    }
  }

  return result;
}

/** Backwards compatible single suggestion */
export function suggestAccessory(
  items: ClothingItem[],
  gender: 'female' | 'male' = 'female'
): SuggestedAccessory | null {
  return suggestAccessories(items, gender)[0] ?? null;
}
