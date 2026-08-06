import { ClothingItem } from '@/types/wardrobe';
import { sampleVector, SAMPLE_COLORS } from '@/lib/sampleAssets';

/** Bump when samples change so guest localStorage refreshes */
export const SAMPLE_WARDROBE_VERSION = 'v6-vector';

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
 * Demo wardrobe — women’s vector product cards.
 * Consistent framing, warm-white background, no model, offline SVG.
 */
export const SAMPLE_CLOTHES: ClothingItem[] = [
  // —— Tops ——
  base('top-shirt-white', 'پیراهن سفید', 'tops', sampleVector('shirt', SAMPLE_COLORS.white), 'سفید', ['نمونه', 'اساسی', 'روزمره']),
  base('top-blouse-pink', 'پیراهن صورتی', 'tops', sampleVector('shirt', SAMPLE_COLORS.pink), 'صورتی', ['نمونه', 'لوکس']),
  base('top-shirt-sage', 'پیراهن سبز', 'tops', sampleVector('shirt', SAMPLE_COLORS.sage), 'سبز', ['نمونه', 'روزمره']),
  base('top-shirt-sky', 'پیراهن آبی', 'tops', sampleVector('shirt', SAMPLE_COLORS.sky), 'آبی', ['نمونه', 'اساسی']),
  base('top-knit-cream', 'بافت کرم', 'tops', sampleVector('sweater', SAMPLE_COLORS.cream), 'کرم', ['نمونه', 'زمستانه']),
  base('top-sweater-black', 'پلیور مشکی', 'tops', sampleVector('sweater', SAMPLE_COLORS.black), 'مشکی', ['نمونه', 'اساسی']),

  // —— Bottoms ——
  base('bottom-jeans', 'شلوار جین آبی', 'bottoms', sampleVector('jeans', SAMPLE_COLORS.denim), 'آبی', ['نمونه', 'روزمره']),
  base('bottom-skirt', 'دامن پلیسه کرم', 'bottoms', sampleVector('skirt', SAMPLE_COLORS.cream), 'کرم', ['نمونه', 'شیک']),
  base('bottom-dark', 'شلوار تیره', 'bottoms', sampleVector('pants', SAMPLE_COLORS.charcoal), 'مشکی', ['نمونه', 'شیک']),
  base('bottom-formal', 'شلوار پارچه‌ای', 'bottoms', sampleVector('pants', SAMPLE_COLORS.navy), 'سرمه', ['نمونه', 'رسمی']),
  base('bottom-beige', 'شلوار کژوال بژ', 'bottoms', sampleVector('pants', SAMPLE_COLORS.beige), 'بژ', ['نمونه', 'روزمره']),

  // —— Dresses ——
  base('dress-black', 'لباس مشکی کلاسیک', 'dresses', sampleVector('dress', SAMPLE_COLORS.black), 'مشکی', ['نمونه', 'رسمی']),
  base('dress-red', 'لباس قرمز', 'dresses', sampleVector('dress', SAMPLE_COLORS.red), 'قرمز', ['نمونه', 'مهمانی']),
  base('dress-navy', 'لباس سرمه‌ای', 'dresses', sampleVector('dress', SAMPLE_COLORS.navy), 'سرمه', ['نمونه', 'مجلسی']),
  base('dress-cream', 'پیراهن روشن', 'dresses', sampleVector('dress', SAMPLE_COLORS.cream), 'کرم', ['نمونه', 'تابستانه']),

  // —— Outerwear ——
  base('outer-trench', 'بارانی ترنچ بژ', 'outerwear', sampleVector('trench', SAMPLE_COLORS.beige), 'بژ', ['نمونه', 'بارانی']),
  base('outer-blazer', 'کت بلیزر', 'outerwear', sampleVector('blazer', SAMPLE_COLORS.navy), 'سرمه', ['نمونه', 'رسمی']),
  base('outer-coat', 'پالتو زمستانه', 'outerwear', sampleVector('coat', SAMPLE_COLORS.black), 'مشکی', ['نمونه', 'زمستانه']),
  base('outer-denim', 'کت جین', 'outerwear', sampleVector('blazer', SAMPLE_COLORS.denim), 'آبی', ['نمونه', 'کژوال']),

  // —— Shoes ——
  base('shoes-sneakers', 'کتانی سفید', 'shoes', sampleVector('sneakers', SAMPLE_COLORS.white), 'سفید', ['نمونه', 'روزمره']),
  base('shoes-heels', 'پاشنه مشکی', 'shoes', sampleVector('heels', SAMPLE_COLORS.black), 'مشکی', ['نمونه', 'مهمانی']),
  base('shoes-boots', 'بوت چرم', 'shoes', sampleVector('boots', SAMPLE_COLORS.brown), 'قهوه‌ای', ['نمونه', 'زمستانه']),
  base('shoes-loafers', 'کفش رسمی', 'shoes', sampleVector('loafers', SAMPLE_COLORS.charcoal), 'مشکی', ['نمونه', 'اداری']),
  base('shoes-heels-nude', 'پاشنه نود', 'shoes', sampleVector('heels', SAMPLE_COLORS.beige), 'بژ', ['نمونه', 'مجلسی']),
  base('shoes-sport', 'کتانی ورزشی', 'shoes', sampleVector('sneakers', SAMPLE_COLORS.red), 'قرمز', ['نمونه', 'اسپرت']),

  // —— Accessories ——
  base('acc-belt-brown', 'کمربند قهوه‌ای', 'accessories', sampleVector('belt', SAMPLE_COLORS.brown), 'قهوه‌ای', ['نمونه']),
  base('acc-belt-black', 'کمربند مشکی', 'accessories', sampleVector('belt', SAMPLE_COLORS.black), 'مشکی', ['نمونه', 'رسمی']),
  base('acc-bag-tote', 'کیف دوشی', 'accessories', sampleVector('tote', SAMPLE_COLORS.beige), 'بژ', ['نمونه', 'روزمره']),
  base('acc-bag-clutch', 'کیف مجلسی', 'accessories', sampleVector('clutch', SAMPLE_COLORS.black), 'مشکی', ['نمونه', 'مهمانی']),
  base('acc-scarf', 'شال', 'accessories', sampleVector('scarf', SAMPLE_COLORS.sky), 'آبی', ['نمونه', 'شیک']),
  base('acc-bag-red', 'کیف قرمز', 'accessories', sampleVector('tote', SAMPLE_COLORS.red), 'قرمز', ['نمونه', 'مهمانی']),
];

export const SAMPLE_CLOTHES_CORE = SAMPLE_CLOTHES.filter((c) => c.tags?.includes('نمونه'));
