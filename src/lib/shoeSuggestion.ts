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

const HEELS: SuggestedShoe = {
  id: 'suggested-heels',
  name: 'کفش پاشنه‌بلند مشکی',
  imageUrl: shoesHeels,
  prompt: 'elegant black leather high-heel pumps',
};

const SNEAKERS: SuggestedShoe = {
  id: 'suggested-sneakers',
  name: 'کتانی سفید',
  imageUrl: shoesSneakers,
  prompt: 'clean white minimal leather sneakers',
};

const BOOTS: SuggestedShoe = {
  id: 'suggested-boots',
  name: 'بوت چرم قهوه‌ای',
  imageUrl: shoesBoots,
  prompt: 'brown leather ankle boots',
};

const LOAFERS: SuggestedShoe = {
  id: 'suggested-loafers',
  name: 'کفش رسمی مشکی',
  imageUrl: shoesLoafers,
  prompt: 'black classic leather oxford dress shoes',
};

const CASUAL_WORDS = ['jean', 'denim', 'شلوار جین', 'جین', 'تیشرت', 'تی شرت', 't-shirt', 'tshirt', 'هودی', 'hoodie', 'sweat', 'شورت', 'ورزشی', 'sport'];
const FORMAL_WORDS = ['کت', 'suit', 'blazer', 'رسمی', 'formal', 'پیراهن مردانه', 'shirt', 'دامن', 'skirt', 'مجلسی'];

const matches = (text: string, words: string[]) => words.some((w) => text.includes(w));

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

  const text = items.map((i) => `${i.name} ${i.category}`).join(' ').toLowerCase();
  const hasDress = items.some((i) => i.category === 'dresses');
  const hasOuterwear = items.some((i) => i.category === 'outerwear');

  if (matches(text, CASUAL_WORDS)) return SNEAKERS;
  if (hasDress) return gender === 'male' ? LOAFERS : HEELS;
  if (hasOuterwear) return BOOTS;
  if (matches(text, FORMAL_WORDS)) return gender === 'male' ? LOAFERS : HEELS;

  return gender === 'male' ? SNEAKERS : BOOTS;
}
