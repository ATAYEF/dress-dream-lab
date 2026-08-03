import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import {
  ClothingProfile,
  FabricGuess,
  GarmentKind,
  PatternGuess,
  SeasonTag,
} from './types';

function textOf(item: ClothingItem): string {
  return `${item.name} ${(item.tags || []).join(' ')} ${item.color || ''}`.toLowerCase();
}

function detectKind(item: ClothingItem): GarmentKind {
  const t = textOf(item);
  const rules: [RegExp, GarmentKind][] = [
    [/کت|بلِیزر|blazer|jacket|مانتو/, item.category === 'dresses' ? 'manteau' : 'jacket'],
    [/پیراهن|shirt|بلوز|blouse/, 'shirt'],
    [/جلیقه|vest/, 'vest'],
    [/پلیور|سوئتر|sweater|بافت/, 'sweater'],
    [/هودی|hoodie|سویشرت/, 'hoodie'],
    [/تی\s*شرت|تیشرت|t-?shirt/, 'tshirt'],
    [/جین|jean|denim/, 'jeans'],
    [/شلوارک|shorts/, 'shorts'],
    [/دامن|skirt/, 'skirt'],
    [/شلوار|pants|trousers/, 'pants'],
    [/کفش\s*رسمی|لوفر|loafer|oxford/, 'formal_shoes'],
    [/پاشنه|heels?/, 'heels'],
    [/بوت|boots?/, 'boots'],
    [/اسنیکر|کتانی|sneaker/, 'sneakers'],
    [/شال|روسری|scarf/, 'scarf'],
    [/کیف|bag|clutch/, 'bag'],
    [/کمربند|belt/, 'belt'],
  ];
  for (const [re, kind] of rules) {
    if (re.test(t)) return kind;
  }
  const fallback: Record<ClothingCategory, GarmentKind> = {
    tops: 'shirt',
    bottoms: 'pants',
    dresses: 'dress',
    outerwear: 'jacket',
    shoes: 'sneakers',
    accessories: 'other',
  };
  return fallback[item.category] || 'other';
}

function detectFabric(t: string): FabricGuess {
  if (/جین|denim/.test(t)) return 'denim';
  if (/چرم|leather/.test(t)) return 'leather';
  if (/کتان|linen/.test(t)) return 'linen';
  if (/پشم|wool|بافت/.test(t)) return 'wool';
  if (/ابریشم|silk|ساتن/.test(t)) return 'silk';
  if (/نخی|cotton|پنبه/.test(t)) return 'cotton';
  return 'unknown';
}

function detectSeason(t: string, kind: GarmentKind): SeasonTag[] {
  if (/زمستان|پالتو|کاپشن|boot|بوت|پشم/.test(t) || kind === 'sweater') {
    return ['autumn', 'winter'];
  }
  if (/تابستان|شلوارک|shorts|کتان|linen/.test(t) || kind === 'shorts') {
    return ['spring', 'summer'];
  }
  if (/پاییز|autumn/.test(t)) return ['autumn'];
  return ['all'];
}

function detectFormality(item: ClothingItem, kind: GarmentKind): number {
  const t = textOf(item);
  let score = 50;
  if (item.category === 'dresses' && /مجلسی|شب|party/.test(t)) score = 75;
  if (kind === 'jacket' || kind === 'formal_shoes' || kind === 'shirt') score += 20;
  if (kind === 'jeans' || kind === 'tshirt' || kind === 'hoodie' || kind === 'sneakers') score -= 25;
  if (kind === 'heels') score += 15;
  if (/رسمی|اداری|classic|formal/.test(t)) score += 25;
  if (/راحت|روزمره|casual|اسپرت/.test(t)) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function detectStyles(formality: number, t: string): Array<'casual' | 'formal' | 'party'> {
  const styles: Array<'casual' | 'formal' | 'party'> = [];
  if (formality >= 65 || /رسمی|formal|اداری/.test(t)) styles.push('formal');
  if (formality <= 55 || /روزمره|casual|جین|hoodie/.test(t)) styles.push('casual');
  if (/مهمانی|مجلسی|party|پاشنه|ساتن/.test(t) || formality >= 70) styles.push('party');
  if (styles.length === 0) styles.push('casual');
  return [...new Set(styles)];
}

function detectPattern(t: string): PatternGuess {
  if (/راه\s*راه|striped|چهارخانه|چهارخونه/.test(t)) return 'striped';
  if (/طرح|گل|printed|پولکی/.test(t)) return 'printed';
  if (/ساده|solid|ساده/.test(t)) return 'solid';
  return 'unknown';
}

function imageQualityHeuristic(item: ClothingItem): number {
  // Local assets / data urls rank higher than missing color metadata
  let q = 6;
  if (item.imageUrl?.startsWith('data:')) q = 7;
  if (item.imageUrl && !item.imageUrl.includes('placeholder')) q = 8;
  if (item.color) q += 1;
  if ((item.tags?.length || 0) > 0) q += 1;
  return Math.min(10, q);
}

/** Stage 1 — build (or refresh) a clothing profile from existing fields */
export function buildClothingProfile(item: ClothingItem): ClothingProfile {
  const t = textOf(item);
  const kind = detectKind(item);
  const formality = detectFormality(item, kind);
  return {
    itemId: item.id,
    category: item.category,
    kind,
    color: item.color,
    fabric: detectFabric(t),
    season: detectSeason(t, kind),
    styleTags: detectStyles(formality, t),
    formality,
    pattern: detectPattern(t),
    imageQuality: imageQualityHeuristic(item),
  };
}

export function buildProfileMap(items: ClothingItem[]): Map<string, ClothingProfile> {
  const map = new Map<string, ClothingProfile>();
  for (const item of items) {
    map.set(item.id, buildClothingProfile(item));
  }
  return map;
}
