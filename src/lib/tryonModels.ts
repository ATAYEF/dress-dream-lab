/**
 * Virtual try-on model catalog (free Gemini image models only).
 * Edge function walks this same chain until one succeeds.
 */

export interface TryOnModelOption {
  id: string;
  name: string;
  description: string;
  free: boolean;
}

export const TRYON_MODELS: TryOnModelOption[] = [
  {
    id: 'google/gemini-3.1-flash-lite-image',
    name: 'جمینای لایت',
    description: 'ارزان‌ترین / رایگان',
    free: true,
  },
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'نانو بنانا',
    description: 'سبک و رایگان',
    free: true,
  },
  {
    id: 'google/gemini-3.1-flash-image',
    name: 'نانو بنانا ۲',
    description: 'سریع و رایگان',
    free: true,
  },
];

export const DEFAULT_TRYON_MODEL = TRYON_MODELS[0].id;
