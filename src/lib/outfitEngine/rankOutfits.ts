import { ClothingItem, ClothingCategory } from '@/types/wardrobe';
import { OutfitContext } from '@/lib/outfitContext';
import { buildProfileMap } from './profile';
import { scoreItem } from './scoring';
import { isHardConflict, outfitColorScore, outfitFabricScore } from './styleRules';
import { suggestGaps } from './gaps';
import { ClothingProfile, EngineOptions, PreferenceState, RankedOutfit } from './types';

function pickBest(
  pool: ClothingItem[],
  profiles: Map<string, ClothingProfile>,
  scores: Map<string, number>,
  category: ClothingCategory,
  used: Set<string>
): ClothingItem | null {
  const candidates = pool
    .filter((i) => i.category === category && !used.has(i.id))
    .sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0));
  return candidates[0] || null;
}

function conflictsWithSet(
  item: ClothingItem,
  current: ClothingItem[],
  profiles: Map<string, ClothingProfile>
): boolean {
  const p = profiles.get(item.id);
  if (!p) return false;
  for (const c of current) {
    const cp = profiles.get(c.id);
    if (cp && isHardConflict(p, cp)) return true;
  }
  return false;
}

/** Build several candidate outfits using category slots + top-scoring items */
function generateCandidates(
  wardrobe: ClothingItem[],
  profiles: Map<string, ClothingProfile>,
  scores: Map<string, number>,
  ctx: OutfitContext,
  anchors: ClothingItem[]
): ClothingItem[][] {
  const candidates: ClothingItem[][] = [];
  const usedGlobal = new Set(anchors.map((a) => a.id));

  const structures: ClothingCategory[][] = [
    ['tops', 'bottoms', 'shoes'],
    ['tops', 'bottoms', 'outerwear', 'shoes'],
    ['dresses', 'shoes'],
    ['dresses', 'outerwear', 'shoes'],
    ['tops', 'bottoms'],
    ['dresses'],
  ];

  // Bias structures by weather/style
  if (ctx.weather === 'cold' || ctx.weather === 'rainy') {
    structures.unshift(['tops', 'bottoms', 'outerwear', 'shoes']);
  }
  if (ctx.style === 'formal') {
    structures.unshift(['tops', 'bottoms', 'shoes']);
  }

  for (const structure of structures) {
    const set = [...anchors];
    const used = new Set(usedGlobal);
    for (const cat of structure) {
      if (set.some((i) => i.category === cat)) continue;
      // try top 3 in category for diversity
      const ordered = wardrobe
        .filter((i) => i.category === cat && !used.has(i.id))
        .sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0));
      let picked: ClothingItem | null = null;
      for (const cand of ordered.slice(0, 4)) {
        if (!conflictsWithSet(cand, set, profiles)) {
          picked = cand;
          break;
        }
      }
      if (picked) {
        set.push(picked);
        used.add(picked.id);
      }
    }
    if (set.length >= 2) {
      candidates.push(set);
    }
  }

  // Diversity: second pass with second-best tops/bottoms
  const tops = wardrobe
    .filter((i) => i.category === 'tops')
    .sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0));
  const bottoms = wardrobe
    .filter((i) => i.category === 'bottoms')
    .sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0));
  for (let i = 0; i < Math.min(3, tops.length); i++) {
    for (let j = 0; j < Math.min(3, bottoms.length); j++) {
      if (tops[i].id === bottoms[j].id) continue;
      const set = [...anchors];
      const ids = new Set(set.map((s) => s.id));
      if (!ids.has(tops[i].id)) set.push(tops[i]);
      if (!ids.has(bottoms[j].id)) set.push(bottoms[j]);
      const shoe = pickBest(wardrobe, profiles, scores, 'shoes', new Set(set.map((s) => s.id)));
      if (shoe) set.push(shoe);
      if (set.length >= 2) candidates.push(set);
    }
  }

  // Dedupe by sorted id key
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = c
      .map((i) => i.id)
      .sort()
      .join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreOutfit(
  items: ClothingItem[],
  profiles: Map<string, ClothingProfile>,
  itemScores: Map<string, number>,
  ctx: OutfitContext,
  prefs?: PreferenceState
): RankedOutfit {
  const profs = items
    .map((i) => profiles.get(i.id))
    .filter(Boolean) as ClothingProfile[];

  const color = outfitColorScore(profs) * 3; // max ~30
  const fabric = outfitFabricScore(profs); // max 10
  const season =
    items.reduce((s, i) => s + (itemScores.get(i.id) || 0), 0) / Math.max(1, items.length);
  // Map item total (~0-100) contribution → season/occasion-ish
  const seasonPart = Math.min(20, season * 0.2);
  const occasionPart = Math.min(
    20,
    profs.reduce((s, p) => {
      const target = ctx.style === 'formal' ? 80 : ctx.style === 'party' ? 70 : 45;
      return s + Math.max(0, 10 - Math.abs(p.formality - target) / 10);
    }, 0)
  );
  const preference = Math.min(
    15,
    items.reduce((s, i) => {
      if (!prefs) return s;
      if (prefs.likedItemIds.includes(i.id)) return s + 4;
      if (i.color && prefs.colorBoost[i.color]) return s + prefs.colorBoost[i.color];
      return s;
    }, 5)
  );
  const freshness = Math.min(
    10,
    items.reduce((s, i) => {
      if (!prefs?.wearLog[i.id]?.length) return s + 3;
      const last = Math.max(...prefs.wearLog[i.id]);
      const days = (Date.now() - last) / (24 * 3600 * 1000);
      return s + Math.min(3, days);
    }, 0)
  );

  const total = Math.round(
    Math.min(
      100,
      color + seasonPart + occasionPart + fabric + preference + freshness
    )
  );

  const reason = buildReason(items, profs, ctx, total);
  const gaps = suggestGaps(items, profiles, ctx);

  return {
    items,
    score: total,
    breakdown: {
      color: Math.round(color),
      season: Math.round(seasonPart),
      occasion: Math.round(occasionPart),
      fabric: Math.round(fabric),
      preference: Math.round(preference),
      freshness: Math.round(freshness),
    },
    reason,
    gaps,
  };
}

function buildReason(
  items: ClothingItem[],
  profs: ClothingProfile[],
  ctx: OutfitContext,
  score: number
): string {
  const colors = [...new Set(items.map((i) => i.color).filter(Boolean))] as string[];
  const colorPart =
    colors.length >= 2
      ? `هماهنگی رنگ ${colors.slice(0, 3).join(' و ')}`
      : colors.length === 1
        ? `تم رنگ ${colors[0]}`
        : 'ترکیب دسته‌بندی‌ها';

  const styleFa =
    ctx.style === 'formal' ? 'محیط رسمی' : ctx.style === 'party' ? 'فضای مهمانی' : 'استفاده روزمره';
  const weatherFa =
    ctx.weather === 'cold'
      ? 'هوای سرد'
      : ctx.weather === 'rainy'
        ? 'هوای بارانی'
        : 'هوای معتدل/آفتابی';
  const envFa = ctx.environment === 'office' ? 'فضای اداری' : 'دورهمی';

  const kinds = profs.map((p) => p.kind).filter((k) => k !== 'other');
  const kindPart = kinds.length ? `با تکیه بر ${kinds.slice(0, 3).join('، ')}` : '';

  return `این ست به‌خاطر ${colorPart}، مناسب بودن برای ${styleFa} و ${envFa} در ${weatherFa}${kindPart ? ` ${kindPart}` : ''} پیشنهاد شد (امتیاز ${score} از ۱۰۰).`;
}

/**
 * Full 5-stage engine:
 * analyze → score items → apply rules via candidate gen → context → rank
 */
export function runOutfitEngine(
  wardrobe: ClothingItem[],
  options: EngineOptions,
  prefs?: PreferenceState,
  anchorItems: ClothingItem[] = []
): RankedOutfit[] {
  const limit = Math.min(3, Math.max(1, options.limit ?? 3));
  const ctx = options.context;
  const profiles = buildProfileMap(wardrobe);

  // Stage 2 scores
  const scoreMap = new Map<string, number>();
  for (const item of wardrobe) {
    const p = profiles.get(item.id)!;
    scoreMap.set(item.id, scoreItem(p, ctx, prefs).total);
  }

  const candidates = generateCandidates(
    wardrobe,
    profiles,
    scoreMap,
    ctx,
    anchorItems
  );

  if (candidates.length === 0 && wardrobe.length >= 2) {
    // fallback: top 2 by score
    const top = [...wardrobe]
      .sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0))
      .slice(0, 3);
    if (top.length >= 2) candidates.push(top);
  }

  const ranked = candidates
    .map((items) => scoreOutfit(items, profiles, scoreMap, ctx, prefs))
    .sort((a, b) => b.score - a.score);

  // Prefer diverse top results (not same top item always)
  const final: RankedOutfit[] = [];
  const usedKeys = new Set<string>();
  for (const r of ranked) {
    const key = r.items
      .map((i) => i.id)
      .sort()
      .join('|');
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    final.push(r);
    if (final.length >= limit) break;
  }

  return final;
}
