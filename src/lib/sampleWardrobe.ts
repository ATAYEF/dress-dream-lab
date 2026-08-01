import { ClothingItem } from '@/types/wardrobe';

import whiteShirt from '@/assets/sample-top-white-shirt.png';
import blackSweater from '@/assets/sample-top-black-sweater.png';
import jeans from '@/assets/sample-bottom-jeans.png';
import skirt from '@/assets/sample-bottom-skirt.png';
import navyDress from '@/assets/sample-dress-navy.png';
import trench from '@/assets/sample-outer-trench.png';
import sneakers from '@/assets/shoes-sneakers.png';
import heels from '@/assets/shoes-heels.png';
import beltBrown from '@/assets/belt-brown.png';
import bagTote from '@/assets/bag-tote.png';

const base = (
  id: string,
  name: string,
  category: ClothingItem['category'],
  imageUrl: string,
  color: string,
): ClothingItem => ({
  id: `sample-${id}`,
  name,
  category,
  imageUrl,
  color,
  createdAt: new Date(),
});

/** Demo wardrobe shown to guest users so they can test the mannequin right away. */
export const SAMPLE_CLOTHES: ClothingItem[] = [
  base('top-shirt', 'پیراهن سفید (نمونه)', 'tops', whiteShirt, 'سفید'),
  base('top-sweater', 'پلیور مشکی (نمونه)', 'tops', blackSweater, 'مشکی'),
  base('bottom-jeans', 'شلوار جین آبی (نمونه)', 'bottoms', jeans, 'آبی'),
  base('bottom-skirt', 'دامن پلیسه کرم (نمونه)', 'bottoms', skirt, 'کرم'),
  base('dress-navy', 'پیراهن مجلسی سرمه‌ای (نمونه)', 'dresses', navyDress, 'سرمه‌ای'),
  base('outer-trench', 'ترنچ کت بژ (نمونه)', 'outerwear', trench, 'بژ'),
  base('shoes-sneakers', 'کتانی سفید (نمونه)', 'shoes', sneakers, 'سفید'),
  base('shoes-heels', 'کفش پاشنه‌دار (نمونه)', 'shoes', heels, 'مشکی'),
  base('acc-belt', 'کمربند چرم قهوه‌ای (نمونه)', 'accessories', beltBrown, 'قهوه‌ای'),
  base('acc-bag', 'کیف دوشی (نمونه)', 'accessories', bagTote, 'قهوه‌ای'),
];
