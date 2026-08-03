import { OutfitContext } from '@/lib/outfitContext';
import { ClothingProfile, ItemScores, PreferenceState } from './types';

function seasonFit(profile: ClothingProfile, weather: OutfitContext['weather']): number {
  const seasons = profile.season;
  if (seasons.includes('all')) return 9;
  if (weather === 'cold') {
    if (seasons.includes('winter') || seasons.includes('autumn')) return 10;
    if (seasons.includes('summer')) return 2;
    return 5;
  }
  if (weather === 'rainy') {
    if (profile.kind === 'jacket' || profile.kind === 'boots') return 10;
    if (profile.kind === 'shorts') return 2;
    return 7;
  }
  // sunny
  if (seasons.includes('summer') || seasons.includes('spring')) return 10;
  if (profile.kind === 'sweater' || profile.kind === 'boots') return 4;
  return 8;
}

function occasionFit(profile: ClothingProfile, ctx: OutfitContext): number {
  const target =
    ctx.style === 'formal' ? 80 : ctx.style === 'party' ? 70 : 40;
  const distance = Math.abs(profile.formality - target);
  let score = Math.max(0, 10 - distance / 10);

  if (ctx.environment === 'office' && profile.kind === 'hoodie') score -= 3;
  if (ctx.environment === 'office' && profile.kind === 'formal_shoes') score += 2;
  if (ctx.style === 'party' && (profile.kind === 'heels' || profile.formality >= 70)) score += 2;
  if (ctx.style === 'casual' && (profile.kind === 'jeans' || profile.kind === 'tshirt')) score += 2;

  return Math.max(0, Math.min(10, score));
}

function preferenceScore(
  profile: ClothingProfile,
  prefs?: PreferenceState
): number {
  let score = 5;
  if (!prefs) return score;
  const color = profile.color;
  if (color) {
    score += Math.min(4, prefs.colorBoost[color] || 0);
    score -= Math.min(4, prefs.colorPenalty[color] || 0);
  }
  if (prefs.likedItemIds.includes(profile.itemId)) score += 3;
  if (prefs.dislikedItemIds.includes(profile.itemId)) score -= 4;
  return Math.max(0, Math.min(10, score));
}

function wearPenalty(itemId: string, prefs?: PreferenceState): number {
  if (!prefs?.wearLog[itemId]?.length) return 10; // fresh
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const wears = prefs.wearLog[itemId];
  const last7 = wears.filter((t) => now - t < 7 * day).length;
  const yesterday = wears.some((t) => now - t < day);
  let score = 10;
  if (yesterday) score -= 6;
  score -= Math.min(5, last7); // used a lot this week
  return Math.max(0, score);
}

/** Stage 2 — score one item for context + preferences */
export function scoreItem(
  profile: ClothingProfile,
  ctx: OutfitContext,
  prefs?: PreferenceState
): ItemScores {
  const imageQuality = profile.imageQuality;
  const season = seasonFit(profile, ctx.weather);
  const occasion = occasionFit(profile, ctx);
  const wearFrequencyPenalty = wearPenalty(profile.itemId, prefs);
  const userPreference = preferenceScore(profile, prefs);
  // Weighted total 0–10 scale then *10 → 0–100-ish for ranking inputs
  const total =
    imageQuality * 0.1 +
    season * 0.25 +
    occasion * 0.3 +
    wearFrequencyPenalty * 0.15 +
    userPreference * 0.2;

  return {
    itemId: profile.itemId,
    imageQuality,
    seasonFit: season,
    occasionFit: occasion,
    wearFrequencyPenalty,
    userPreference,
    total: Math.round(total * 10),
  };
}
