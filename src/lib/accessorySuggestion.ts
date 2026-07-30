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

const BELT_BLACK: SuggestedAccessory = {
  id: 'suggested-belt-black',
  name: 'کمربند چرم مشکی',
  imageUrl: beltBlack,
  type: 'belt',
  prompt: 'a slim black leather belt with a gold buckle at the waist',
};

const BELT_BROWN: SuggestedAccessory = {
  id: 'suggested-belt-brown',
  name: 'کمربند چرم قهوه‌ای',
  imageUrl: beltBrown,
  type: 'belt',
  prompt: 'a brown leather belt with a silver buckle at the waist',
};

const BAG_CLUTCH: SuggestedAccessory = {
  id: 'suggested-bag-clutch',
  name: 'کیف دستی مشکی',
  imageUrl: bagClutch,
  type: 'bag',
  prompt: 'an elegant black leather clutch bag held in one hand',
};

const BAG_TOTE: SuggestedAccessory = {
  id: 'suggested-bag-tote',
  name: 'کیف دوشی بژ',
  imageUrl: bagTote,
  type: 'bag',
  prompt: 'a beige leather tote shoulder bag hanging from the shoulder',
};

const CASUAL_WORDS = ['jean', 'denim', 'جین', 'تیشرت', 'تی شرت', 't-shirt', 'tshirt', 'هودی', 'hoodie', 'sweat', 'شورت', 'ورزشی', 'sport'];
const DARK_WORDS = ['مشکی', 'سیاه', 'black', 'سرمه', 'navy', 'dark'];

const matches = (text: string, words: string[]) => words.some((w) => text.includes(w));

/** Every accessory the user can toggle on the mannequin */
export const ACCESSORY_OPTIONS: SuggestedAccessory[] = [
  BELT_BLACK,
  BELT_BROWN,
  BAG_CLUTCH,
  BAG_TOTE,
];

/**
 * Suggests the accessories (belt and/or bag) that complete the currently
 * selected outfit. The user can then toggle or swap them on the mannequin.
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
  const casual = matches(text, CASUAL_WORDS);
  const dark = matches(text, DARK_WORDS);

  const result: SuggestedAccessory[] = [];

  // A tucked top with trousers/skirt is best finished with a belt
  if (hasBottom && hasTop) {
    result.push(casual || !dark ? BELT_BROWN : BELT_BLACK);
  } else if (gender === 'male') {
    result.push(dark ? BELT_BLACK : BELT_BROWN);
  }

  if (gender === 'female') {
    if (hasDress) result.push(dark ? BAG_CLUTCH : BAG_TOTE);
    else result.push(casual ? BAG_TOTE : BAG_CLUTCH);
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
