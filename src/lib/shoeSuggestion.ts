import { ClothingItem } from '@/types/wardrobe';
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
}

/* ========== Shoe Options (variety pool) ==========
Same image assets can appear with different names/prompts to give variety.
This keeps suggestions dynamic instead of always returning the exact same pair. */
export const ALL_SHOE_OPTIONS: SuggestedShoe[] = [
  {
    id: 'shoe-heels-black',
    name: 'کفش پاشنه‌بلند مشکی',
    imageUrl: shoesHeels,
    prompt: 'elegant black leather high-heel pumps with a subtle stiletto',
  },
  {
    id: 'shoe-heels-nude',
    name: 'پاشنه‌بلند نو (Nude)',
    imageUrl: shoesHeels,
    prompt: 'nude/beige elegant high heel stilettos to elongate the legs',
  },
  {
    id: 'shoe-sneakers-white',
    name: 'کتانی سفید استاندارد',
    imageUrl: shoesSneakers,
    prompt: 'clean white minimal leather sneakers with flat laces',
  },
  {
    id: 'shoe-sneakers-sport',
    name: 'کتانی ورزشی سفید',
    imageUrl: shoesSneakers,
    prompt: 'white chunky athletic running sneakers with a sporty sole',
  },
  {
    id: 'shoe-boots-brown',
    name: 'بوت چرم قهوه‌ای',
    imageUrl: shoesBoots,
    prompt: 'warm brown leather Chelsea ankle boots',
  },
  {
    id: 'shoe-boots-black',
    name: 'بوت چرم مشکی',
    imageUrl: shoesBoots,
    prompt: 'sleek black leather ankle boots with a low heel',
  },
  {
    id: 'shoe-loafers-black',
    name: 'کفش رسمی مشکی',
    imageUrl: shoesLoafers,
    prompt: 'classic black leather Oxford dress shoes with a polished toe',
  },
  {
    id: 'shoe-loafers-brown',
    name: 'کفش رسمی قهوه‌ای',
    imageUrl: shoesLoafers,
    prompt: 'brown leather penny loafers - smart and casual',
  },
];

const CASUAL_WORDS = [
  'jean', 'denim', 'شلوار جین', 'جین', 'تیشرت', 'تی شرت',
  't-shirt', 'tshirt', 'هودی', 'hoodie', 'sweat', 'شورت',
  'ورزشی', 'sport', 'کژوال', 'casual', 'کتانی', 'اسپرت',
  'کمربند', 'دانگل', 'biker', 'bomber',
];
const FORMAL_WORDS = [
  'کت', 'suit', 'blazer', 'رسمی', 'formal', 'پیراهن مردانه',
  'shirt', 'دامن', 'skirt', 'مجلسی', 'مهمانی', 'دخترانه',
  'عروسی', 'مراسم', 'کارت', 'شرتی', 'شومیز', 'سرمه',
];
const SUMMER_WORDS = [
  'تابستان', 'تابستانی', 'کوتاه', 'summer', 'شب', 'شبانه',
  'تیشرت', 'یقه گرد', 'کمی', 'نازک', 'ست شلوارک', 'شلوارک',
];
const WINTER_WORDS = [
  'زمستان', 'زمستانی', 'پالتو', 'کت پشمی', 'بوتی', 'بافتنی',
  'پشمی', 'پشمینه', 'پارکا', 'winter', 'wool', 'gown', 'مانتو',
];
const DARK_COLOR_WORDS = ['مشکی', 'سیاه', 'black', 'سرمه', 'navy', 'تیره', 'آبی تیره', 'قهوه‌ای'];
const LIGHT_COLOR_WORDS = ['سفید', 'white', 'روشن', 'کرم', 'بژ', 'طلایی', 'beige'];

const matches = (text: string, words: string[]) =>
  words.some((w) => text.includes(w.toLowerCase()));

/** Seeded-ish deterministic "random" pick based on outfit hash so the user
 * sees consistent-but-varied options across different outfits (not always the same).
 */
function pickOne<T>(text: string, options: T[]): T {
  if (options.length === 0) return null as unknown as T;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % options.length;
  return options[index];
}

/**
 * Suggests a pair of shoes that fits the currently selected outfit,
 * used when the user has not picked any shoes themselves.
 */
export function suggestShoes(
  items: ClothingItem[],
  gender: 'female' | 'male' = 'female'
): SuggestedShoe | null {
  if (items.length === 0) return null;
  if (items.some((i) => i.category === 'shoes')) return null;

  const text = items
    .map((i) => `${i.name} ${i.category} ${i.color ?? ''}`)
    .join(' ')
    .toLowerCase();

  const hasDress = items.some((i) => i.category === 'dresses');
  const hasOuterwear = items.some((i) => i.category === 'outerwear');
  const dark = matches(text, DARK_COLOR_WORDS);
  const light = matches(text, LIGHT_COLOR_WORDS);

  // Casual > sneakers (white for light outfits, sport for dark/neutral)
  if (matches(text, CASUAL_WORDS)) {
    const pool = light
      ? ['shoe-sneakers-white', 'shoe-sneakers-sport']
      : dark
      ? ['shoe-sneakers-sport', 'shoe-loafers-brown']
      : ['shoe-sneakers-white', 'shoe-sneakers-sport', 'shoe-loafers-brown'];
    const id = pickOne(text + 'snk', pool);
    return ALL_SHOE_OPTIONS.find((s) => s.id === id) ?? ALL_SHOE_OPTIONS[1];
  }

  // Dresses > heels for female, loafers for male
  if (hasDress) {
    if (gender === 'male') {
      const id = dark ? 'shoe-loafers-black' : pickOne(text + 'drm', ['shoe-loafers-black', 'shoe-loafers-brown']);
      return ALL_SHOE_OPTIONS.find((s) => s.id === id) ?? ALL_SHOE_OPTIONS[6];
    }
    const pool = dark
      ? ['shoe-heels-black', 'shoe-heels-nude']
      : light
      ? ['shoe-heels-nude', 'shoe-heels-black']
      : ['shoe-heels-black', 'shoe-heels-nude'];
    const id = pickOne(text + 'hls', pool);
    return ALL_SHOE_OPTIONS.find((s) => s.id === id) ?? ALL_SHOE_OPTIONS[0];
  }

  // Outerwear or winter vibes > boots (color-aware)
  if (hasOuterwear || matches(text, WINTER_WORDS)) {
    const id = dark
      ? 'shoe-boots-black'
      : light
      ? pickOne(text + 'bt', ['shoe-boots-brown', 'shoe-loafers-brown'])
      : pickOne(text + 'bt2', ['shoe-boots-brown', 'shoe-boots-black', 'shoe-loafers-brown']);
    return ALL_SHOE_OPTIONS.find((s) => s.id === id) ?? ALL_SHOE_OPTIONS[4];
  }

  // Formal > loafers for male, heels for female
  if (matches(text, FORMAL_WORDS)) {
    if (gender === 'male') {
      const id = dark ? 'shoe-loafers-black' : pickOne(text + 'frm', ['shoe-loafers-black', 'shoe-loafers-brown']);
      return ALL_SHOE_OPTIONS.find((s) => s.id === id) ?? ALL_SHOE_OPTIONS[6];
    }
    const pool = dark ? ['shoe-heels-black'] : ['shoe-heels-nude', 'shoe-heels-black'];
    const id = pickOne(text + 'frm2', pool);
    return ALL_SHOE_OPTIONS.find((s) => s.id === id) ?? ALL_SHOE_OPTIONS[0];
  }

  // Summer / warm outfits
  if (matches(text, SUMMER_WORDS)) {
    const id = pickOne(text + 'smr', [
      'shoe-sneakers-white',
      gender === 'female' ? 'shoe-heels-nude' : 'shoe-loafers-brown',
    ]);
    return ALL_SHOE_OPTIONS.find((s) => s.id === id) ?? ALL_SHOE_OPTIONS[1];
  }

  // Default - color-aware gender fallback
  if (gender === 'male') {
    const pool = dark
      ? ['shoe-loafers-black', 'shoe-boots-black']
      : light
      ? ['shoe-sneakers-white', 'shoe-loafers-brown']
      : ['shoe-sneakers-white', 'shoe-boots-brown', 'shoe-loafers-brown'];
    const id = pickOne(text + 'dfm', pool);
    return ALL_SHOE_OPTIONS.find((s) => s.id === id) ?? ALL_SHOE_OPTIONS[1];
  }
  // Female default
  const pool = dark
    ? ['shoe-heels-black', 'shoe-boots-black']
    : light
    ? ['shoe-heels-nude', 'shoe-sneakers-white']
    : ['shoe-heels-black', 'shoe-boots-brown', 'shoe-heels-nude'];
  const id = pickOne(text + 'dff', pool);
  return ALL_SHOE_OPTIONS.find((s) => s.id === id) ?? ALL_SHOE_OPTIONS[4];
}
