import { PreferenceState } from './types';

const STORAGE_KEY = 'styler_outfit_engine_prefs_v1';

export function loadPreferences(): PreferenceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyPrefs();
    }
    return { ...emptyPrefs(), ...JSON.parse(raw) };
  } catch {
    return emptyPrefs();
  }
}

export function savePreferences(prefs: PreferenceState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota */
  }
}

function emptyPrefs(): PreferenceState {
  return {
    colorBoost: {},
    colorPenalty: {},
    likedItemIds: [],
    dislikedItemIds: [],
    wearLog: {},
  };
}

/** 👍 — boost colors of items in the outfit */
export function applyLike(
  prefs: PreferenceState,
  itemIds: string[],
  colors: (string | undefined)[]
): PreferenceState {
  const next = clone(prefs);
  for (const id of itemIds) {
    if (!next.likedItemIds.includes(id)) next.likedItemIds.push(id);
    next.dislikedItemIds = next.dislikedItemIds.filter((x) => x !== id);
  }
  for (const c of colors) {
    if (!c) continue;
    next.colorBoost[c] = Math.min(5, (next.colorBoost[c] || 0) + 1);
  }
  return next;
}

/** 👎 */
export function applyDislike(
  prefs: PreferenceState,
  itemIds: string[],
  colors: (string | undefined)[]
): PreferenceState {
  const next = clone(prefs);
  for (const id of itemIds) {
    if (!next.dislikedItemIds.includes(id)) next.dislikedItemIds.push(id);
    next.likedItemIds = next.likedItemIds.filter((x) => x !== id);
  }
  for (const c of colors) {
    if (!c) continue;
    next.colorPenalty[c] = Math.min(5, (next.colorPenalty[c] || 0) + 1);
  }
  return next;
}

/** Mark items as worn today (anti-repeat) */
export function markWorn(prefs: PreferenceState, itemIds: string[]): PreferenceState {
  const next = clone(prefs);
  const now = Date.now();
  for (const id of itemIds) {
    const log = next.wearLog[id] || [];
    log.push(now);
    next.wearLog[id] = log.slice(-20);
  }
  return next;
}

function clone(p: PreferenceState): PreferenceState {
  return {
    colorBoost: { ...p.colorBoost },
    colorPenalty: { ...p.colorPenalty },
    likedItemIds: [...p.likedItemIds],
    dislikedItemIds: [...p.dislikedItemIds],
    wearLog: Object.fromEntries(
      Object.entries(p.wearLog).map(([k, v]) => [k, [...v]])
    ),
  };
}
