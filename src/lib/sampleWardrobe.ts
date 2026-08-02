import { ClothingItem } from '@/types/wardrobe';
import { productSvg, SAMPLE_COLORS } from '@/lib/sampleAssets';

/* ========== Local PNG assets (bundled with the app — always available) ========== */
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

/**
 * Version bumped when sample set changes so guests refresh local cache
 * without losing their own (non-sample) items.
 */
export const SAMPLE_WARDROBE_VERSION = 'v3-local-assets';

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

/** Stable SVG catalog item (no network). */
const svgItem = (
  id: string,
  name: string,
  category: ClothingItem['category'],
  colorName: string,
  hex: string,
  tags?: string[]
) =>
  base(
    id,
    name,
    category,
    productSvg({ label: name.replace(/\s*\(.*?\)\s*/g, '').slice(0, 28), color: hex, category }),
    colorName,
    tags
  );

/**
 * Demo wardrobe for guests — **only local / in-app assets**.
 * No external image APIs (trae, etc.) so images never break offline.
 */
export const SAMPLE_CLOTHES: ClothingItem[] = [
  // ===== Tops — real PNGs + local SVGs =====
  base('top-shirt', 'پیراهن سفید (نمونه)', 'tops', whiteShirt, 'سفید', ['نمونه', 'اساسی']),
  base('top-sweater', 'پلیور مشکی (نمونه)', 'tops', blackSweater, 'مشکی', ['نمونه', 'اساسی']),
  svgItem('top-blouse-pink', 'بلوز ساتن صورتی', 'tops', 'صورتی', SAMPLE_COLORS.pink, [
    'لوکس',
    'مهمانی',
  ]),
  svgItem('top-knit-cream', 'ژاکت بافتنی کرم', 'tops', 'کرم', SAMPLE_COLORS.cream, [
    'زمستانه',
    'بافتنی',
  ]),
  svgItem('top-leather-black', 'شومیز چرم مشکی', 'tops', 'مشکی', SAMPLE_COLORS.black, [
    'چرم',
    'شیک',
  ]),

  // ===== Bottoms =====
  base('bottom-jeans', 'شلوار جین آبی (نمونه)', 'bottoms', jeans, 'آبی', ['نمونه', 'روزمره']),
  base('bottom-skirt', 'دامن پلیسه کرم (نمونه)', 'bottoms', skirt, 'کرم', ['نمونه']),
  svgItem('bottom-leather', 'شلوار چرم مشکی', 'bottoms', 'مشکی', SAMPLE_COLORS.black, [
    'چرم',
    'شیک',
  ]),
  svgItem('bottom-trouser-navy', 'شلوار پارچه‌ای سرمه‌ای', 'bottoms', 'سرمه', SAMPLE_COLORS.navy, [
    'رسمی',
    'اداری',
  ]),
  svgItem('bottom-wide-beige', 'شلوار گشاد بژ', 'bottoms', 'بژ', SAMPLE_COLORS.beige, [
    'روزمره',
    'کژوال',
  ]),

  // ===== Dresses =====
  base('dress-navy', 'لباس سرمه‌ای (نمونه)', 'dresses', navyDress, 'سرمه', ['نمونه', 'مجلسی']),
  svgItem('dress-red', 'لباس مجلسی قرمز', 'dresses', 'قرمز', SAMPLE_COLORS.red, [
    'مهمانی',
    'مجلسی',
  ]),
  svgItem('dress-black', 'لباس مشکی کلاسیک', 'dresses', 'مشکی', SAMPLE_COLORS.black, [
    'رسمی',
    'شب',
  ]),
  svgItem('dress-cream', 'پیراهن کرم تابستانی', 'dresses', 'کرم', SAMPLE_COLORS.cream, [
    'تابستانه',
    'روزمره',
  ]),

  // ===== Outerwear =====
  base('outer-trench', 'بارانی ترنچ (نمونه)', 'outerwear', trench, 'بژ', ['نمونه', 'بارانی']),
  svgItem('outer-blazer-navy', 'کت بلیزر سرمه‌ای', 'outerwear', 'سرمه', SAMPLE_COLORS.navy, [
    'رسمی',
    'اداری',
  ]),
  svgItem('outer-coat-black', 'پالتو مشکی زمستانه', 'outerwear', 'مشکی', SAMPLE_COLORS.black, [
    'زمستانه',
    'سرد',
  ]),
  svgItem('outer-jacket-denim', 'کت جین آبی', 'outerwear', 'آبی', SAMPLE_COLORS.denim, [
    'روزمره',
    'کژوال',
  ]),

  // ===== Shoes — local PNGs =====
  base('shoes-sneakers', 'کتانی سفید (نمونه)', 'shoes', sneakers, 'سفید', ['نمونه', 'روزمره']),
  base('shoes-heels', 'کفش پاشنه‌دار مشکی (نمونه)', 'shoes', heels, 'مشکی', [
    'نمونه',
    'مهمانی',
  ]),
  base('shoes-boots', 'بوت چرم (نمونه)', 'shoes', boots, 'قهوه‌ای', ['نمونه', 'زمستانه']),
  base('shoes-loafers', 'کفش رسمی (نمونه)', 'shoes', loafers, 'مشکی', ['نمونه', 'اداری']),
  svgItem('shoes-heels-nude', 'پاشنه نود', 'shoes', 'بژ', SAMPLE_COLORS.beige, [
    'مهمانی',
    'مجلسی',
  ]),
  svgItem('shoes-sneakers-sport', 'کتانی ورزشی', 'shoes', 'سفید', SAMPLE_COLORS.white, [
    'روزمره',
    'اسپرت',
  ]),

  // ===== Accessories — local PNGs + SVG =====
  base('acc-belt-brown', 'کمربند چرم قهوه‌ای (نمونه)', 'accessories', beltBrown, 'قهوه‌ای', [
    'نمونه',
  ]),
  base('acc-belt-black', 'کمربند مشکی (نمونه)', 'accessories', beltBlack, 'مشکی', ['نمونه', 'رسمی']),
  base('acc-bag-tote', 'کیف دوشی (نمونه)', 'accessories', bagTote, 'بژ', ['نمونه', 'روزمره']),
  base('acc-bag-clutch', 'کیف مجلسی (نمونه)', 'accessories', bagClutch, 'مشکی', [
    'نمونه',
    'مهمانی',
  ]),
  svgItem('acc-scarf-blue', 'شال آبی', 'accessories', 'آبی', SAMPLE_COLORS.sky, [
    'شیک',
    'لایه',
  ]),
  svgItem('acc-bag-red', 'کیف قرمز', 'accessories', 'قرمز', SAMPLE_COLORS.red, [
    'مهمانی',
    'چرم',
  ]),
];

/** Only the core photo samples (for lighter demos if needed). */
export const SAMPLE_CLOTHES_CORE = SAMPLE_CLOTHES.filter((c) =>
  c.tags?.includes('نمونه')
);
