import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { OutfitContext } from '@/lib/outfitContext';

/** Sub-type within a broad category */
export type GarmentKind =
  | 'jacket' | 'shirt' | 'vest' | 'sweater' | 'hoodie' | 'tshirt' | 'blouse'
  | 'pants' | 'jeans' | 'skirt' | 'shorts'
  | 'dress' | 'manteau'
  | 'scarf' | 'bag' | 'belt' | 'hat'
  | 'sneakers' | 'formal_shoes' | 'boots' | 'heels'
  | 'other';

export type SeasonTag = 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
export type FabricGuess = 'cotton' | 'denim' | 'leather' | 'linen' | 'wool' | 'silk' | 'synthetic' | 'unknown';
export type PatternGuess = 'solid' | 'striped' | 'printed' | 'unknown';

/** Stage 1: rich profile derived once from item metadata */
export interface ClothingProfile {
  itemId: string;
  category: ClothingCategory;
  kind: GarmentKind;
  color?: string;
  fabric: FabricGuess;
  season: SeasonTag[];
  styleTags: Array<'casual' | 'formal' | 'party'>;
  /** 0–100 */
  formality: number;
  pattern: PatternGuess;
  /** 0–10 heuristics */
  imageQuality: number;
}

/** Stage 2: per-item scores for a given context */
export interface ItemScores {
  itemId: string;
  imageQuality: number;
  seasonFit: number;
  occasionFit: number;
  wearFrequencyPenalty: number;
  userPreference: number;
  total: number;
}

export interface RankedOutfit {
  items: ClothingItem[];
  score: number;
  breakdown: {
    color: number;
    season: number;
    occasion: number;
    fabric: number;
    preference: number;
    freshness: number;
  };
  /** Persian explanation: why this outfit */
  reason: string;
  /** Gap tips when wardrobe cannot complete the set */
  gaps: string[];
}

export interface EngineOptions {
  context: OutfitContext;
  /** max outfits to return (1–3) */
  limit?: number;
  /** item ids worn recently → freshness penalty */
  recentItemIds?: string[];
  /** colors the user liked historically */
  preferredColors?: string[];
  /** colors the user disliked */
  avoidedColors?: string[];
}

export interface PreferenceState {
  colorBoost: Record<string, number>;
  colorPenalty: Record<string, number>;
  likedItemIds: string[];
  dislikedItemIds: string[];
  /** itemId → last worn timestamps (ms) */
  wearLog: Record<string, number[]>;
}
