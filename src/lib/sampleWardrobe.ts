import { ClothingItem } from '@/types/wardrobe';

/* ========== Real local product photos (bundled — always available) ========== */
import whiteShirt from '@/assets/sample-top-white-shirt.png';
import blackSweater from '@/assets/sample-top-black-sweater.png';
import jeans from '@/assets/sample-bottom-jeans.png';
import skirt from '@/assets/sample-bottom-skirt.png';
import navyDress from '@/assets/sample-dress-navy.png';
import trench from '@/assets/sample-outer-trench.png';
import sneakers from '@/assets/shoes-sneakers.png';
import heels from '@/assets/shoes-heels.png';
import boots from '@/assets/shoes-boots.png';
import loafers from '@/assets/shoes-loafers.png';
import beltBrown from '@/assets/belt-brown.png';
import beltBlack from '@/assets/belt-black.png';
import bagTote from '@/assets/bag-tote.png';
import bagClutch from '@/assets/bag-clutch.png';

/* Clean product-style photos (light background, no model, consistent framing) */
import topPink from '@/assets/sample-photo-top-pink.jpg';
import topCream from '@/assets/sample-photo-top-cream.jpg';
import pantsBlack from '@/assets/sample-photo-pants-black.jpg';
import pantsFormal from '@/assets/sample-photo-pants-formal.jpg';
import pantsBeige from '@/assets/sample-photo-pants-beige.jpg';
import dressRed from '@/assets/sample-photo-dress-red.jpg';
import dressBlack from '@/assets/sample-photo-dress-black.jpg';
import dressCream from '@/assets/sample-photo-dress-cream.jpg';
import blazer from '@/assets/sample-photo-blazer.jpg';
import coat from '@/assets/sample-photo-coat.jpg';
import denimJkt from '@/assets/sample-photo-denim-jkt.jpg';
import heelsNude from '@/assets/sample-photo-heels-nude.jpg';
import sneakersSport from '@/assets/sample-photo-sneakers-red.jpg';
import scarf from '@/assets/sample-photo-scarf.jpg';
import bagRed from '@/assets/sample-photo-bag-red.jpg';

/** Bump when samples change so guest localStorage refreshes */
export const SAMPLE_WARDROBE_VERSION = 'v5-clean-product';

const base = (
  id: string,
  name: string,
  category: ClothingItem['category'],
  imageUrl: string,
  color: string,
  tags?: string[]
): ClothingItem => ({
  id: `sample-${id}`,
  name,
  category,
  imageUrl,
  color,
  tags,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

/**
 * Demo wardrobe — women’s product shots only.
 * Style: flat / product photography on light background, no model, consistent framing.
 * Categories + colors vary across the set (matches e-commerce grid look).
 */
export const SAMPLE_CLOTHES: ClothingItem[] = [
  // —— Tops (پیراهن / بلوز / بافتنی) — varied colors ——
  base('top-shirt-white', 'پیراهن سفید', 'tops', whiteShirt, 'سفید', ['نمونه', 'اساسی', 'روزمره']),
  base('top-blouse-pink', 'پیراهن صورتی', 'tops', topPink, 'صورتی', ['نمونه', 'لوکس']),
  base('top-knit-cream', 'بافت کرم', 'tops', topCream, 'کرم', ['نمونه', 'زمستانه']),
  base('top-sweater-black', 'پلیور مشکی', 'tops', blackSweater, 'مشکی', ['نمونه', 'اساسی']),

  // —— Bottoms ——
  base('bottom-jeans', 'شلوار جین آبی', 'bottoms', jeans, 'آبی', ['نمونه', 'روزمره']),
  base('bottom-skirt', 'دامن پلیسه کرم', 'bottoms', skirt, 'کرم', ['نمونه', 'شیک']),
  base('bottom-dark', 'شلوار تیره', 'bottoms', pantsBlack, 'مشکی', ['نمونه', 'شیک']),
  base('bottom-formal', 'شلوار پارچه‌ای', 'bottoms', pantsFormal, 'سرمه', ['نمونه', 'رسمی']),
  base('bottom-beige', 'شلوار کژوال بژ', 'bottoms', pantsBeige, 'بژ', ['نمونه', 'روزمره']),

  // —— Dresses ——
  base('dress-black', 'لباس مشکی کلاسیک', 'dresses', dressBlack, 'مشکی', ['نمونه', 'رسمی']),
  base('dress-red', 'لباس قرمز', 'dresses', dressRed, 'قرمز', ['نمونه', 'مهمانی']),
  base('dress-navy', 'لباس سرمه‌ای', 'dresses', navyDress, 'سرمه', ['نمونه', 'مجلسی']),
  base('dress-cream', 'پیراهن روشن', 'dresses', dressCream, 'کرم', ['نمونه', 'تابستانه']),

  // —— Outerwear ——
  base('outer-trench', 'بارانی ترنچ بژ', 'outerwear', trench, 'بژ', ['نمونه', 'بارانی']),
  base('outer-blazer', 'کت بلیزر', 'outerwear', blazer, 'سرمه', ['نمونه', 'رسمی']),
  base('outer-coat', 'پالتو زمستانه', 'outerwear', coat, 'مشکی', ['نمونه', 'زمستانه']),
  base('outer-denim', 'کت جین', 'outerwear', denimJkt, 'آبی', ['نمونه', 'کژوال']),

  // —— Shoes ——
  base('shoes-sneakers', 'کتانی سفید', 'shoes', sneakers, 'سفید', ['نمونه', 'روزمره']),
  base('shoes-heels', 'پاشنه مشکی', 'shoes', heels, 'مشکی', ['نمونه', 'مهمانی']),
  base('shoes-boots', 'بوت چرم', 'shoes', boots, 'قهوه‌ای', ['نمونه', 'زمستانه']),
  base('shoes-loafers', 'کفش رسمی', 'shoes', loafers, 'مشکی', ['نمونه', 'اداری']),
  base('shoes-heels-nude', 'پاشنه نود', 'shoes', heelsNude, 'بژ', ['نمونه', 'مجلسی']),
  base('shoes-sport', 'کتانی ورزشی', 'shoes', sneakersSport, 'قرمز', ['نمونه', 'اسپرت']),

  // —— Accessories ——
  base('acc-belt-brown', 'کمربند قهوه‌ای', 'accessories', beltBrown, 'قهوه‌ای', ['نمونه']),
  base('acc-belt-black', 'کمربند مشکی', 'accessories', beltBlack, 'مشکی', ['نمونه', 'رسمی']),
  base('acc-bag-tote', 'کیف دوشی', 'accessories', bagTote, 'بژ', ['نمونه', 'روزمره']),
  base('acc-bag-clutch', 'کیف مجلسی', 'accessories', bagClutch, 'مشکی', ['نمونه', 'مهمانی']),
  base('acc-scarf', 'شال', 'accessories', scarf, 'آبی', ['نمونه', 'شیک']),
  base('acc-bag-red', 'کیف قرمز', 'accessories', bagRed, 'قرمز', ['نمونه', 'مهمانی']),
];

export const SAMPLE_CLOTHES_CORE = SAMPLE_CLOTHES.filter((c) => c.tags?.includes('نمونه'));
