import { scoreColorPair } from '@/lib/colorHarmony';
import { ClothingProfile } from './types';

/** Hard reject combinations */
export function isHardConflict(a: ClothingProfile, b: ClothingProfile): boolean {
  // Winter coat + shorts
  const coldHeavy = (p: ClothingProfile) =>
    p.kind === 'jacket' && (p.season.includes('winter') || p.fabric === 'wool');
  if (
    (coldHeavy(a) && b.kind === 'shorts') ||
    (coldHeavy(b) && a.kind === 'shorts')
  ) {
    return true;
  }
  // Formal jacket + ripped jeans heuristic via kind jeans + formal jacket in formal mismatch handled by score
  return false;
}

/** Soft score 0–10 for a pair */
export function pairHarmony(a: ClothingProfile, b: ClothingProfile): number {
  let score = 6;

  if (a.color && b.color) {
    const { score: cs } = scoreColorPair(a.color, b.color);
    score = cs / 10; // map ~0-100 → 0-10
  }

  // Formality clash
  if (Math.abs(a.formality - b.formality) > 45) score -= 2.5;

  // Fabric clash: leather + linen
  if (
    (a.fabric === 'leather' && b.fabric === 'linen') ||
    (b.fabric === 'leather' && a.fabric === 'linen')
  ) {
    score -= 2;
  }

  // Denim + formal jacket mild penalty
  if (
    (a.kind === 'jacket' && a.formality >= 70 && b.kind === 'jeans') ||
    (b.kind === 'jacket' && b.formality >= 70 && a.kind === 'jeans')
  ) {
    score -= 1.5;
  }

  return Math.max(0, Math.min(10, score));
}

export function outfitColorScore(profiles: ClothingProfile[]): number {
  if (profiles.length < 2) return 7;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      sum += pairHarmony(profiles[i], profiles[j]);
      n++;
    }
  }
  return n ? sum / n : 7;
}

export function outfitFabricScore(profiles: ClothingProfile[]): number {
  const fabrics = profiles.map((p) => p.fabric).filter((f) => f !== 'unknown');
  if (fabrics.length < 2) return 7;
  let score = 8;
  if (fabrics.includes('leather') && fabrics.includes('linen')) score -= 3;
  if (fabrics.includes('silk') && fabrics.includes('denim')) score -= 1;
  return Math.max(0, score);
}
