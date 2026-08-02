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

/* Photo samples downloaded & stored in-app (no external runtime dependency) */
import topPink from '@/assets/sample-photo-top-pink.jpg';
import topCream from '@/assets/sample-photo-top-cream.jpg';
import topLeather from '@/assets/sample-photo-top-leather.jpg';
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
export const SAMPLE_WARDROBE_VERSION = 'v4-real-photos';

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
 * Demo wardrobe — only bundled images (PNG/JPG in src/assets).
 * No SVG silhouettes, no external image APIs at runtime.
 */
export const SAMPLE_CLOTHES: ClothingItem[] = [
  // Tops
  base('top-shirt', 'پیراهن سفید (نمونه)', 'tops', whiteShirt, 'سفید', ['نمونه', 'اساسی']),
  base('top-sweater', 'پلیور مشکی (نمونه)', 'tops', blackSweater, 'مشکی', ['نمونه', 'اساسی']),
  base('top-blouse-pink', 'بلوز صورتی', 'tops', topPink, 'صورتی', ['لوکس', 'مهمانی']),
  base('top-knit-cream', 'ژاکت بافتنی کرم', 'tops', topCream, 'کرم', ['زمستانه', 'بافتنی']),
  base('top-leather-black', 'کاپشن چرم مشکی', 'tops', topLeather, 'مشکی', ['چرم', 'شیک']),

  // Bottoms
  base('bottom-jeans', 'شلوار جین آبی (نمونه)', 'bottoms', jeans, 'آبی', ['نمونه', 'روزمره']),
  base('bottom-skirt', 'دامن پلیسه کرم (نمونه)', 'bottoms', skirt, 'کرم', ['نمونه']),
  base('bottom-leather', 'شلوار جین تیره', 'bottoms', pantsBlack, 'مشکی', ['چرم', 'شیک']),
  base('bottom-trouser-navy', 'شلوار پارچه‌ای رسمی', 'bottoms', pantsFormal, 'سرمه', ['رسمی', 'اداری']),
  base('bottom-wide-beige', 'شلوار کژوال', 'bottoms', pantsBeige, 'بژ', ['روزمره', 'کژوال']),

  // Dresses
  base('dress-navy', 'لباس سرمه‌ای (نمونه)', 'dresses', navyDress, 'سرمه', ['نمونه', 'مجلسی']),
  base('dress-red', 'لباس مجلسی قرمز', 'dresses', dressRed, 'قرمز', ['مهمانی', 'مجلسی']),
  base('dress-black', 'لباس مشکی کلاسیک', 'dresses', dressBlack, 'مشکی', ['رسمی', 'شب']),
  base('dress-cream', 'پیراهن روشن تابستانی', 'dresses', dressCream, 'کرم', ['تابستانه', 'روزمره']),

  // Outerwear
  base('outer-trench', 'بارانی ترنچ (نمونه)', 'outerwear', trench, 'بژ', ['نمونه', 'بارانی']),
  base('outer-blazer-navy', 'کت بلیزر', 'outerwear', blazer, 'سرمه', ['رسمی', 'اداری']),
  base('outer-coat-black', 'پالتو زمستانه', 'outerwear', coat, 'مشکی', ['زمستانه', 'سرد']),
  base('outer-jacket-denim', 'کت جین', 'outerwear', denimJkt, 'آبی', ['روزمره', 'کژوال']),

  // Shoes
  base('shoes-sneakers', 'کتانی سفید (نمونه)', 'shoes', sneakers, 'سفید', ['نمونه', 'روزمره']),
  base('shoes-heels', 'کفش پاشنه‌دار مشکی (نمونه)', 'shoes', heels, 'مشکی', ['نمونه', 'مهمانی']),
  base('shoes-boots', 'بوت چرم (نمونه)', 'shoes', boots, 'قهوه‌ای', ['نمونه', 'زمستانه']),
  base('shoes-loafers', 'کفش رسمی (نمونه)', 'shoes', loafers, 'مشکی', ['نمونه', 'اداری']),
  base('shoes-heels-nude', 'پاشنه نود', 'shoes', heelsNude, 'بژ', ['مهمانی', 'مجلسی']),
  base('shoes-sneakers-sport', 'کتانی ورزشی', 'shoes', sneakersSport, 'قرمز', ['روزمره', 'اسپرت']),

  // Accessories
  base('acc-belt-brown', 'کمربند چرم قهوه‌ای (نمونه)', 'accessories', beltBrown, 'قهوه‌ای', ['نمونه']),
  base('acc-belt-black', 'کمربند مشکی (نمونه)', 'accessories', beltBlack, 'مشکی', ['نمونه', 'رسمی']),
  base('acc-bag-tote', 'کیف دوشی (نمونه)', 'accessories', bagTote, 'بژ', ['نمونه', 'روزمره']),
  base('acc-bag-clutch', 'کیف مجلسی (نمونه)', 'accessories', bagClutch, 'مشکی', ['نمونه', 'مهمانی']),
  base('acc-scarf-blue', 'شال', 'accessories', scarf, 'آبی', ['شیک', 'لایه']),
  base('acc-bag-red', 'کیف قرمز', 'accessories', bagRed, 'قرمز', ['مهمانی', 'چرم']),
];

export const SAMPLE_CLOTHES_CORE = SAMPLE_CLOTHES.filter((c) => c.tags?.includes('نمونه'));
