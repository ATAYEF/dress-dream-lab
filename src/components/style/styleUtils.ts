import type { OutfitSuggestion, ClothingItem } from '@/types/wardrobe';
import {
  STYLE_OPTIONS,
  ENVIRONMENT_OPTIONS,
  WEATHER_OPTIONS,
  type OutfitContext,
} from '@/lib/outfitContext';

export type StyleBadge = 'ai_pick' | 'perfect_match' | 'trending' | 'favorite';

export function getStyleBadge(s: OutfitSuggestion, index: number): StyleBadge {
  if (s.isFavorite) return 'favorite';
  if (index === 0) return 'ai_pick';
  if (s.userFeedback === 'liked') return 'perfect_match';
  if (index < 3) return 'trending';
  return 'ai_pick';
}

export const BADGE_LABEL: Record<StyleBadge, string> = {
  ai_pick: 'AI PICK',
  perfect_match: 'PERFECT MATCH',
  trending: 'TRENDING',
  favorite: 'علاقه‌مندی',
};

export function styleTitle(s: OutfitSuggestion): string {
  const ctx = s.context;
  if (ctx?.style === 'formal') return 'استایل رسمی شیک';
  if (ctx?.style === 'party') return 'استایل مهمانی';
  if (ctx?.style === 'casual') return 'استایل روزمره شیک';
  return 'استایل پیشنهادی';
}

export function styleSubtitle(s: OutfitSuggestion): string {
  const ctx = s.context;
  if (!ctx) return 'Selected for you';
  const map: Record<string, string> = {
    formal: 'Elegant Formal',
    party: 'Party Ready',
    casual: 'Casual Chic',
  };
  return map[ctx.style] ?? 'AI Styled';
}

export function contextChips(s: OutfitSuggestion): { key: string; label: string }[] {
  const ctx = s.context;
  if (!ctx) return [];
  const chips: { key: string; label: string }[] = [];
  const st = STYLE_OPTIONS.find((o) => o.value === ctx.style);
  const env = ENVIRONMENT_OPTIONS.find((o) => o.value === ctx.environment);
  const w = WEATHER_OPTIONS.find((o) => o.value === ctx.weather);
  if (st) chips.push({ key: 'style', label: st.label });
  if (env) chips.push({ key: 'env', label: env.label });
  if (w) chips.push({ key: 'weather', label: w.label });
  return chips;
}

/** Derive short «why this style» reasons from text + items + context */
export function buildStyleReasons(s: OutfitSuggestion): string[] {
  const reasons: string[] = [];
  const items = s.items || [];
  const colors = [...new Set(items.map((i) => i.color).filter(Boolean))] as string[];

  if (colors.length >= 2) {
    reasons.push(`با رنگ‌های ${colors.slice(0, 3).join('، ')} هماهنگ است`);
  } else if (colors.length === 1) {
    reasons.push(`تم رنگی ${colors[0]} با سلیقه شما سازگار است`);
  }

  if (s.context) {
    const st = STYLE_OPTIONS.find((o) => o.value === s.context!.style)?.label;
    const env = ENVIRONMENT_OPTIONS.find((o) => o.value === s.context!.environment)?.label;
    const w = WEATHER_OPTIONS.find((o) => o.value === s.context!.weather)?.label;
    if (st && env) reasons.push(`مناسب «${st}» در «${env}»`);
    if (w) reasons.push(`هماهنگ با هوای ${w}`);
  }

  const cats = new Set(items.map((i) => i.category));
  if (cats.has('dresses') || (cats.has('tops') && cats.has('bottoms'))) {
    reasons.push('از آیتم‌های موجود در کمد شما ست شده است');
  }

  if (s.suggestionText) {
    const first = s.suggestionText.split(/[.。!?؟]/)[0]?.trim();
    if (first && first.length > 12 && first.length < 90 && !reasons.includes(first)) {
      reasons.push(first);
    }
  }

  if (reasons.length === 0) {
    reasons.push('ترکیب انتخاب‌شده با کمد و شرایط شما هم‌خوانی دارد');
  }

  return reasons.slice(0, 4);
}

export function heroImage(s: OutfitSuggestion): string | null {
  if (s.generatedImageUrl) return s.generatedImageUrl;
  const prefer = s.items?.find((i) => i.category === 'dresses' || i.category === 'tops');
  return prefer?.imageUrl || s.items?.[0]?.imageUrl || null;
}
