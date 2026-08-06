import { ClothingItem } from '@/types/wardrobe';
import { PRODUCT_IMAGES } from '@/lib/sampleProductImages';

/** Bump when samples change so guest localStorage refreshes */
export const SAMPLE_WARDROBE_VERSION = 'v7-catalog-photos';

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
 * Demo wardrobe — extracted catalog product photos (white bg, no model).
 */
export const SAMPLE_CLOTHES: ClothingItem[] = [
  // —— Outerwear (کت) ——
  base('outer-blazer-beige', 'کت بژ', 'outerwear', PRODUCT_IMAGES['outer-blazer-beige'], 'بژ', ['نمونه', 'رسمی']),
  base('outer-blazer-black', 'کت مشکی', 'outerwear', PRODUCT_IMAGES['outer-blazer-black'], 'مشکی', ['نمونه', 'رسمی']),
  base('outer-blazer-sage', 'کت سبز', 'outerwear', PRODUCT_IMAGES['outer-blazer-sage'], 'سبز', ['نمونه', 'کژوال']),
  base('outer-blazer-sky', 'کت آبی', 'outerwear', PRODUCT_IMAGES['outer-blazer-sky'], 'آبی', ['نمونه', 'رسمی']),
  base('outer-blazer-cream', 'کت کرم', 'outerwear', PRODUCT_IMAGES['outer-blazer-cream'], 'کرم', ['نمونه', 'رسمی']),

  // —— Tops / پیراهن ——
  base('top-shirt-white', 'پیراهن سفید', 'tops', PRODUCT_IMAGES['top-shirt-white'], 'سفید', ['نمونه', 'اساسی', 'روزمره']),
  base('top-shirt-sky', 'پیراهن آبی', 'tops', PRODUCT_IMAGES['top-shirt-sky'], 'آبی', ['نمونه', 'روزمره']),
  base('top-shirt-pink', 'پیراهن صورتی', 'tops', PRODUCT_IMAGES['top-shirt-pink'], 'صورتی', ['نمونه', 'لوکس']),
  base('top-shirt-sage', 'پیراهن سبز', 'tops', PRODUCT_IMAGES['top-shirt-sage'], 'سبز', ['نمونه', 'روزمره']),
  base('top-shirt-black', 'پیراهن مشکی', 'tops', PRODUCT_IMAGES['top-shirt-black'], 'مشکی', ['نمونه', 'اساسی']),

  // —— Tops / تی‌شرت ——
  base('top-tee-white', 'تی‌شرت سفید', 'tops', PRODUCT_IMAGES['top-tee-white'], 'سفید', ['نمونه', 'روزمره']),
  base('top-tee-black', 'تی‌شرت مشکی', 'tops', PRODUCT_IMAGES['top-tee-black'], 'مشکی', ['نمونه', 'اساسی']),
  base('top-tee-pink', 'تی‌شرت صورتی', 'tops', PRODUCT_IMAGES['top-tee-pink'], 'صورتی', ['نمونه', 'روزمره']),
  base('top-tee-sage', 'تی‌شرت سبز', 'tops', PRODUCT_IMAGES['top-tee-sage'], 'سبز', ['نمونه', 'روزمره']),
  base('top-tee-sky', 'تی‌شرت آبی', 'tops', PRODUCT_IMAGES['top-tee-sky'], 'آبی', ['نمونه', 'روزمره']),

  // —— Dresses ——
  base('dress-beige', 'لباس بژ', 'dresses', PRODUCT_IMAGES['dress-beige'], 'بژ', ['نمونه', 'رسمی']),
  base('dress-black', 'لباس مشکی', 'dresses', PRODUCT_IMAGES['dress-black'], 'مشکی', ['نمونه', 'رسمی']),
  base('dress-pink', 'لباس صورتی', 'dresses', PRODUCT_IMAGES['dress-pink'], 'صورتی', ['نمونه', 'مهمانی']),
  base('dress-sage', 'لباس سبز', 'dresses', PRODUCT_IMAGES['dress-sage'], 'سبز', ['نمونه', 'مجلسی']),
  base('dress-sky', 'لباس آبی', 'dresses', PRODUCT_IMAGES['dress-sky'], 'آبی', ['نمونه', 'مجلسی']),

  // —— Bottoms ——
  base('bottom-beige', 'شلوار بژ', 'bottoms', PRODUCT_IMAGES['bottom-beige'], 'بژ', ['نمونه', 'روزمره']),
  base('bottom-black', 'شلوار مشکی', 'bottoms', PRODUCT_IMAGES['bottom-black'], 'مشکی', ['نمونه', 'رسمی']),
  base('bottom-pink', 'شلوار صورتی', 'bottoms', PRODUCT_IMAGES['bottom-pink'], 'صورتی', ['نمونه', 'کژوال']),
  base('bottom-sage', 'شلوار سبز', 'bottoms', PRODUCT_IMAGES['bottom-sage'], 'سبز', ['نمونه', 'روزمره']),
  base('bottom-sky', 'شلوار آبی', 'bottoms', PRODUCT_IMAGES['bottom-sky'], 'آبی', ['نمونه', 'روزمره']),

  // —— Shoes ——
  base('shoes-beige', 'پاشنه بژ', 'shoes', PRODUCT_IMAGES['shoes-beige'], 'بژ', ['نمونه', 'مجلسی']),
  base('shoes-black', 'پاشنه مشکی', 'shoes', PRODUCT_IMAGES['shoes-black'], 'مشکی', ['نمونه', 'مهمانی']),
  base('shoes-pink', 'پاشنه صورتی', 'shoes', PRODUCT_IMAGES['shoes-pink'], 'صورتی', ['نمونه', 'مجلسی']),
  base('shoes-cream', 'پاشنه کرم', 'shoes', PRODUCT_IMAGES['shoes-cream'], 'کرم', ['نمونه', 'مجلسی']),
  base('shoes-sky', 'پاشنه آبی', 'shoes', PRODUCT_IMAGES['shoes-sky'], 'آبی', ['نمونه', 'مهمانی']),

  // —— Accessories / bags ——
  base('acc-bag-beige', 'کیف بژ', 'accessories', PRODUCT_IMAGES['acc-bag-beige'], 'بژ', ['نمونه', 'روزمره']),
  base('acc-bag-black', 'کیف مشکی', 'accessories', PRODUCT_IMAGES['acc-bag-black'], 'مشکی', ['نمونه', 'رسمی']),
  base('acc-bag-pink', 'کیف صورتی', 'accessories', PRODUCT_IMAGES['acc-bag-pink'], 'صورتی', ['نمونه', 'مهمانی']),
  base('acc-bag-sage', 'کیف سبز', 'accessories', PRODUCT_IMAGES['acc-bag-sage'], 'سبز', ['نمونه', 'روزمره']),
  base('acc-bag-sky', 'کیف آبی', 'accessories', PRODUCT_IMAGES['acc-bag-sky'], 'آبی', ['نمونه', 'روزمره']),
];

export const SAMPLE_CLOTHES_CORE = SAMPLE_CLOTHES.filter((c) => c.tags?.includes('نمونه'));
