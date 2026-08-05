export type ClothingCategory = 'tops' | 'bottoms' | 'shoes' | 'accessories' | 'outerwear' | 'dresses';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  imageUrl: string;
  color?: string;
  tags?: string[];
  createdAt: Date;
}

export type OutfitStyle = 'formal' | 'party' | 'casual';
export type OutfitEnvironment = 'office' | 'gathering';
export type OutfitWeather = 'sunny' | 'rainy' | 'cold';

export interface OutfitContextMeta {
  style: OutfitStyle;
  environment: OutfitEnvironment;
  weather: OutfitWeather;
}

export interface OutfitSuggestion {
  id: string;
  items: ClothingItem[];
  suggestionText?: string;
  generatedImageUrl?: string;
  isFavorite?: boolean;
  /** 👍/👎 feedback on this suggestion */
  userFeedback?: 'liked' | 'disliked' | null;
  createdAt: Date;
  /** Occasion filters used when the outfit was generated */
  context?: OutfitContextMeta;
}

export interface UserProfile {
  imageUrl: string | null;
  name?: string;
}
