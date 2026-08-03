/**
 * Lightweight online learning ranker for outfits.
 *
 * Model: logistic regression over hand-crafted features, trained with SGD
 * from 👍 / 👎 feedback in the browser (no server training required).
 *
 * Features capture color, formality fit, season, fabric harmony, category
 * coverage, and preference signals so the model personalizes ranking over time.
 */

import { ClothingItem } from '@/types/wardrobe';
import { OutfitContext } from '@/lib/outfitContext';
import { ClothingProfile } from './types';
import { outfitColorScore, outfitFabricScore } from './styleRules';

const STORAGE_KEY = 'styler_ml_ranker_v1';
const LEARNING_RATE = 0.12;
const L2 = 0.002;
const MAX_SAMPLES = 400;

/** Ordered feature names — must stay stable for persisted weights */
export const FEATURE_NAMES = [
  'bias',
  'color_harmony',
  'fabric_harmony',
  'formality_fit',
  'season_cold',
  'season_rainy',
  'season_sunny',
  'style_formal',
  'style_party',
  'style_casual',
  'env_office',
  'has_outerwear',
  'has_shoes',
  'has_dress',
  'has_tops_bottoms',
  'item_count_norm',
  'avg_formality',
  'pref_color_boost',
  'pref_color_penalty',
  'freshness',
  'neutral_ratio',
] as const;

export type FeatureName = (typeof FEATURE_NAMES)[number];

export interface RankerModel {
  version: 1;
  weights: number[];
  /** number of SGD updates applied */
  updates: number;
  /** rolling accuracy on feedback */
  correct: number;
  total: number;
}

export interface FeatureVector {
  values: number[];
  names: readonly string[];
}

function emptyWeights(): number[] {
  return FEATURE_NAMES.map((_, i) => (i === 0 ? 0.1 : 0));
}

export function defaultModel(): RankerModel {
  return {
    version: 1,
    weights: emptyWeights(),
    updates: 0,
    correct: 0,
    total: 0,
  };
}

export function loadRankerModel(): RankerModel {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultModel();
    const parsed = JSON.parse(raw) as RankerModel;
    if (!parsed.weights || parsed.weights.length !== FEATURE_NAMES.length) {
      return defaultModel();
    }
    return parsed;
  } catch {
    return defaultModel();
  }
}

export function saveRankerModel(model: RankerModel): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
  } catch {
    /* ignore */
  }
}

function sigmoid(z: number): number {
  if (z > 20) return 1;
  if (z < -20) return 0;
  return 1 / (1 + Math.exp(-z));
}

function mean(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function isNeutral(color?: string): boolean {
  if (!color) return false;
  return /مشکی|سیاه|سفید|خاکستری|طوسی|کرم|بژ|navy|سرمه/.test(color);
}

export interface PrefSignals {
  colorBoost: Record<string, number>;
  colorPenalty: Record<string, number>;
  wearLog: Record<string, number[]>;
}

/**
 * Stage-style feature extraction for an outfit under a context.
 * All features roughly scaled to ~0–1 for stable SGD.
 */
export function extractOutfitFeatures(
  items: ClothingItem[],
  profiles: Map<string, ClothingProfile>,
  ctx: OutfitContext,
  prefs?: PrefSignals
): FeatureVector {
  const profs = items
    .map((i) => profiles.get(i.id))
    .filter(Boolean) as ClothingProfile[];

  const cats = new Set(items.map((i) => i.category));
  const formalities = profs.map((p) => p.formality);
  const avgFormality = mean(formalities) / 100;

  const targetFormality =
    ctx.style === 'formal' ? 0.8 : ctx.style === 'party' ? 0.7 : 0.4;
  const formalityFit = 1 - Math.min(1, Math.abs(avgFormality - targetFormality));

  const colorH = outfitColorScore(profs) / 10;
  const fabricH = outfitFabricScore(profs) / 10;

  let prefBoost = 0;
  let prefPen = 0;
  let freshness = 1;
  if (prefs) {
    for (const it of items) {
      if (it.color) {
        prefBoost += prefs.colorBoost[it.color] || 0;
        prefPen += prefs.colorPenalty[it.color] || 0;
      }
      const wears = prefs.wearLog[it.id] || [];
      if (wears.length) {
        const last = Math.max(...wears);
        const days = (Date.now() - last) / (24 * 3600 * 1000);
        freshness = Math.min(freshness, Math.min(1, days / 7));
      }
    }
    prefBoost = Math.min(1, prefBoost / 8);
    prefPen = Math.min(1, prefPen / 8);
  }

  const neutralRatio =
    items.filter((i) => isNeutral(i.color)).length / Math.max(1, items.length);

  const values: number[] = [
    1, // bias
    colorH,
    fabricH,
    formalityFit,
    ctx.weather === 'cold' ? 1 : 0,
    ctx.weather === 'rainy' ? 1 : 0,
    ctx.weather === 'sunny' ? 1 : 0,
    ctx.style === 'formal' ? 1 : 0,
    ctx.style === 'party' ? 1 : 0,
    ctx.style === 'casual' ? 1 : 0,
    ctx.environment === 'office' ? 1 : 0,
    cats.has('outerwear') ? 1 : 0,
    cats.has('shoes') ? 1 : 0,
    cats.has('dresses') ? 1 : 0,
    cats.has('tops') && cats.has('bottoms') ? 1 : 0,
    Math.min(1, items.length / 5),
    avgFormality,
    prefBoost,
    prefPen,
    freshness,
    neutralRatio,
  ];

  return { values, names: FEATURE_NAMES };
}

/** P(like) in 0–1 */
export function predictProba(model: RankerModel, features: FeatureVector): number {
  const w = model.weights;
  let z = 0;
  for (let i = 0; i < w.length; i++) {
    z += w[i] * (features.values[i] || 0);
  }
  return sigmoid(z);
}

/** Map probability to 0–100 score blend-friendly */
export function predictScore(model: RankerModel, features: FeatureVector): number {
  return Math.round(predictProba(model, features) * 100);
}

/**
 * One SGD step on logistic loss for label y ∈ {0,1}.
 */
export function updateModel(
  model: RankerModel,
  features: FeatureVector,
  label: 0 | 1
): RankerModel {
  const p = predictProba(model, features);
  const error = p - label; // dL/dz for logistic
  const weights = model.weights.slice();

  for (let i = 0; i < weights.length; i++) {
    const x = features.values[i] || 0;
    const grad = error * x + L2 * weights[i];
    weights[i] -= LEARNING_RATE * grad;
  }

  const predicted = p >= 0.5 ? 1 : 0;
  const correct = model.correct + (predicted === label ? 1 : 0);
  const total = model.total + 1;

  return {
    version: 1,
    weights,
    updates: model.updates + 1,
    correct,
    total: Math.min(MAX_SAMPLES, total),
  };
}

/** Top feature contributions for explainability */
export function topContributions(
  model: RankerModel,
  features: FeatureVector,
  k = 3
): { name: string; value: number; weight: number; contribution: number }[] {
  const rows = FEATURE_NAMES.map((name, i) => ({
    name,
    value: features.values[i] || 0,
    weight: model.weights[i] || 0,
    contribution: (model.weights[i] || 0) * (features.values[i] || 0),
  }))
    .filter((r) => r.name !== 'bias')
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  return rows.slice(0, k);
}

export function modelAccuracy(model: RankerModel): number | null {
  if (model.total < 5) return null;
  return Math.round((model.correct / model.total) * 100);
}
