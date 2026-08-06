import { ClothingItem } from '@/types/wardrobe';

/** Bump when samples change so guest localStorage refreshes */
export const SAMPLE_WARDROBE_VERSION = 'v8-public-catalog';

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
 * Demo wardrobe — catalog product photos served from /sample-products/
 * (white background, no model, consistent framing)
 */
export const SAMPLE_CLOTHES: ClothingItem[] = [
  // —— Outerwear (کت) ——
  base('outer-blazer-beige', 'کت بژ', 'outerwear', '/sample-products/blazer-beige.jpg', 'بژ', ['نمونه', 'رسمی']),
  base('outer-blazer-black', 'کت مشکی', 'outerwear', '/sample-products/blazer-black.jpg', 'مشکی', ['نمونه', 'رسمی']),
  base('outer-blazer-sage', 'کت سبز', 'outerwear', '/sample-products/blazer-sage.jpg', 'سبز', ['نمونه', 'کژوال']),
  base('outer-blazer-sky', 'کت آبی', 'outerwear', '/sample-products/blazer-sky.jpg', 'آبی', ['نمونه', 'رسمی']),
  base('outer-blazer-cream', 'کت کرم', 'outerwear', '/sample-products/blazer-cream.jpg', 'کرم', ['نمونه', 'رسمی']),

  // —— Tops / پیراهن ——
  base('top-shirt-white', 'پیراهن سفید', 'tops', '/sample-products/shirt-white.jpg', 'سفید', ['نمونه', 'اساسی', 'روزمره']),
  base('top-shirt-sky', 'پیراهن آبی', 'tops', '/sample-products/shirt-sky.jpg', 'آبی', ['نمونه', 'روزمره']),
  base('top-shirt-pink', 'پیراهن صورتی', 'tops', '/sample-products/shirt-pink.jpg', 'صورتی', ['نمونه', 'لوکس']),
  base('top-shirt-sage', 'پیراهن سبز', 'tops', '/sample-products/shirt-sage.jpg', 'سبز', ['نمونه', 'روزمره']),
  base('top-shirt-black', 'پیراهن مشکی', 'tops', '/sample-products/shirt-black.jpg', 'مشکی', ['نمونه', 'اساسی']),

  // —— Tops / تی‌شرت ——
  base('top-tee-white', 'تی‌شرت سفید', 'tops', '/sample-products/tee-white.jpg', 'سفید', ['نمونه', 'روزمره']),
  base('top-tee-black', 'تی‌شرت مشکی', 'tops', '/sample-products/tee-black.jpg', 'مشکی', ['نمونه', 'اساسی']),
  base('top-tee-pink', 'تی‌شرت صورتی', 'tops', '/sample-products/tee-pink.jpg', 'صورتی', ['نمونه', 'روزمره']),
  base('top-tee-sage', 'تی‌شرت سبز', 'tops', '/sample-products/tee-sage.jpg', 'سبز', ['نمونه', 'روزمره']),
  base('top-tee-sky', 'تی‌شرت آبی', 'tops', '/sample-products/tee-sky.jpg', 'آبی', ['نمونه', 'روزمره']),

  // —— Dresses ——
  base('dress-beige', 'لباس بژ', 'dresses', '/sample-products/dress-beige.jpg', 'بژ', ['نمونه', 'رسمی']),
  base('dress-black', 'لباس مشکی', 'dresses', '/sample-products/dress-black.jpg', 'مشکی', ['نمونه', 'رسمی']),
  base('dress-pink', 'لباس صورتی', 'dresses', '/sample-products/dress-pink.jpg', 'صورتی', ['نمونه', 'مهمانی']),
  base('dress-sage', 'لباس سبز', 'dresses', '/sample-products/dress-sage.jpg', 'سبز', ['نمونه', 'مجلسی']),
  base('dress-sky', 'لباس آبی', 'dresses', '/sample-products/dress-sky.jpg', 'آبی', ['نمونه', 'مجلسی']),

  // —— Bottoms ——
  base('bottom-beige', 'شلوار بژ', 'bottoms', '/sample-products/pants-beige.jpg', 'بژ', ['نمونه', 'روزمره']),
  base('bottom-black', 'شلوار مشکی', 'bottoms', '/sample-products/pants-black.jpg', 'مشکی', ['نمونه', 'رسمی']),
  base('bottom-pink', 'شلوار صورتی', 'bottoms', '/sample-products/pants-pink.jpg', 'صورتی', ['نمونه', 'کژوال']),
  base('bottom-sage', 'شلوار سبز', 'bottoms', '/sample-products/pants-sage.jpg', 'سبز', ['نمونه', 'روزمره']),
  base('bottom-sky', 'شلوار آبی', 'bottoms', '/sample-products/pants-sky.jpg', 'آبی', ['نمونه', 'روزمره']),

  // —— Shoes ——
  base('shoes-beige', 'پاشنه بژ', 'shoes', '/sample-products/heels-beige.jpg', 'بژ', ['نمونه', 'مجلسی']),
  base('shoes-black', 'پاشنه مشکی', 'shoes', '/sample-products/heels-black.jpg', 'مشکی', ['نمونه', 'مهمانی']),
  base('shoes-pink', 'پاشنه صورتی', 'shoes', '/sample-products/heels-pink.jpg', 'صورتی', ['نمونه', 'مجلسی']),
  base('shoes-cream', 'پاشنه کرم', 'shoes', '/sample-products/heels-cream.jpg', 'کرم', ['نمونه', 'مجلسی']),
  base('shoes-sky', 'پاشنه آبی', 'shoes', '/sample-products/heels-sky.jpg', 'آبی', ['نمونه', 'مهمانی']),

  // —— Accessories / bags ——
  base('acc-bag-beige', 'کیف بژ', 'accessories', '/sample-products/bag-beige.jpg', 'بژ', ['نمونه', 'روزمره']),
  base('acc-bag-black', 'کیف مشکی', 'accessories', '/sample-products/bag-black.jpg', 'مشکی', ['نمونه', 'رسمی']),
  base('acc-bag-pink', 'کیف صورتی', 'accessories', '/sample-products/bag-pink.jpg', 'صورتی', ['نمونه', 'مهمانی']),
  base('acc-bag-sage', 'کیف سبز', 'accessories', '/sample-products/bag-sage.jpg', 'سبز', ['نمونه', 'روزمره']),
  base('acc-bag-sky', 'کیف آبی', 'accessories', '/sample-products/bag-sky.jpg', 'آبی', ['نمونه', 'روزمره']),
];

export const SAMPLE_CLOTHES_CORE = SAMPLE_CLOTHES.filter((c) => c.tags?.includes('نمونه'));
