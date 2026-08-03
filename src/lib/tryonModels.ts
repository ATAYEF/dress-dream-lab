/**
 * Virtual try-on model catalog (server uses cost-optimized chain).
 * Client does not expose model picker — edge function picks available models.
 * Order here mirrors cheapest → premium for documentation only.
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
    description: 'ارزان‌ترین',
    free: true,
  },
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'نانو بنانا',
    description: 'سبک و کم‌هزینه',
    free: true,
  },
  {
    id: 'google/gemini-3.1-flash-image',
    name: 'نانو بنانا ۲',
    description: 'سریع و باکیفیت',
    free: true,
  },
  {
    id: 'openai/gpt-image-1-mini',
    name: 'GPT Image Mini',
    description: 'پشتیبان اقتصادی',
    free: false,
  },
  {
    id: 'openai/gpt-image-2',
    name: 'GPT Image 2',
    description: 'پرهزینه',
    free: false,
  },
  {
    id: 'google/gemini-3-pro-image',
    name: 'جمینای ۳ پرو',
    description: 'گران‌ترین',
    free: false,
  },
];

export const DEFAULT_TRYON_MODEL = TRYON_MODELS[0].id;
