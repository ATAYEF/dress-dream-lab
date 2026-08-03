import { ClothingCategory, ClothingItem } from '@/types/wardrobe';
import { OutfitContext } from '@/lib/outfitContext';
import { ClothingProfile } from './types';

const CORE: ClothingCategory[] = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes'];

/**
 * Suggest missing pieces in Persian when wardrobe cannot complete a look.
 */
export function suggestGaps(
  selected: ClothingItem[],
  profiles: Map<string, ClothingProfile>,
  ctx: OutfitContext
): string[] {
  const cats = new Set(selected.map((s) => s.category));
  const gaps: string[] = [];

  const hasDress = cats.has('dresses');
  if (!hasDress) {
    if (!cats.has('tops')) {
      gaps.push('برای کامل شدن ست، یک بالاتنه ساده (مثلاً پیراهن یا تی‌شرت خنثی) مناسب است.');
    }
    if (!cats.has('bottoms')) {
      gaps.push(
        ctx.style === 'formal'
          ? 'یک شلوار پارچه‌ای راسته یا کرم/بژ ست را کامل می‌کند.'
          : 'یک شلوار جین تیره یا کتان راسته گزینه خوبی برای پایین‌تنه است.'
      );
    }
  }

  if (!cats.has('shoes')) {
    gaps.push(
      ctx.style === 'formal' || ctx.environment === 'office'
        ? 'یک کفش رسمی تیره یا لوفر ست اداری را کامل می‌کند.'
        : 'یک کفش اسپرت تمیز یا کژوال ست روزمره را جمع می‌کند.'
    );
  }

  if (ctx.weather === 'cold' && !cats.has('outerwear')) {
    gaps.push('با توجه به هوای سرد، یک لایه رویه (پلیور یا کاپشن سبک) پیشنهاد می‌شود.');
  }
  if (ctx.weather === 'rainy' && !cats.has('outerwear')) {
    gaps.push('برای هوای بارانی، یک رویه مقاوم یا بارانی سبک مناسب است.');
  }

  // Color gap: if all dark, suggest light accent
  const colors = selected.map((s) => s.color).filter(Boolean) as string[];
  if (colors.length >= 2 && colors.every((c) => /مشکی|سیاه|سرمه|خاکستری/.test(c))) {
    gaps.push('افزودن یک قطعه روشن (سفید یا کرم) کنتراست و تعادل رنگ را بهتر می‌کند.');
  }

  return gaps.slice(0, 3);
}
