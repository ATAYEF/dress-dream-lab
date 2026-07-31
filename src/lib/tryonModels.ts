export interface TryOnModelOption {
  /** Exact Lovable AI Gateway model id */
  id: string;
  /** Short Persian label shown in the UI */
  name: string;
  /** Persian description of speed / cost */
  description: string;
  /** True while the model is inside the monthly free AI allowance tier */
  free: boolean;
}

/**
 * Image models available for Virtual Try-on.
 * All of them run through the Lovable AI Gateway (no personal API key needed).
 */
export const TRYON_MODELS: TryOnModelOption[] = [
  {
    id: 'google/gemini-3.1-flash-image',
    name: 'نانو بنانا ۲',
    description: 'سریع و باکیفیت — پیشنهاد ما',
    free: true,
  },
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'نانو بنانا',
    description: 'سبک و کم‌هزینه',
    free: true,
  },
  {
    id: 'google/gemini-3-pro-image',
    name: 'جمینای ۳ پرو',
    description: 'بالاترین کیفیت — پرهزینه‌تر',
    free: false,
  },
];

export const DEFAULT_TRYON_MODEL = TRYON_MODELS[0].id;
