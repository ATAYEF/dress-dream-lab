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

export interface OutfitSuggestion {
  id: string;
  items: ClothingItem[];
  suggestionText?: string;
  generatedImageUrl?: string;
  isFavorite?: boolean;
  createdAt: Date;
}

export interface UserProfile {
  imageUrl: string | null;
  name?: string;
}
