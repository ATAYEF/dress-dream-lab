export { buildClothingProfile, buildProfileMap } from './profile';
export { scoreItem } from './scoring';
export { runOutfitEngine } from './rankOutfits';
export { suggestGaps } from './gaps';
export {
  loadPreferences,
  savePreferences,
  applyLike,
  applyDislike,
  markWorn,
} from './preferences';
export type {
  ClothingProfile,
  ItemScores,
  RankedOutfit,
  EngineOptions,
  PreferenceState,
} from './types';
