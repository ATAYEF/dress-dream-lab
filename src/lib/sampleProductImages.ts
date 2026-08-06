/** Re-export all extracted catalog product images */
import { IMAGES_OUTERWEAR } from './sampleImages_outerwear';
import { IMAGES_TOPS } from './sampleImages_tops';
import { IMAGES_DRESSES } from './sampleImages_dresses';
import { IMAGES_BOTTOMS } from './sampleImages_bottoms';
import { IMAGES_SHOES } from './sampleImages_shoes';
import { IMAGES_ACCESSORIES } from './sampleImages_accessories';

export const PRODUCT_IMAGES = {
  ...IMAGES_OUTERWEAR,
  ...IMAGES_TOPS,
  ...IMAGES_DRESSES,
  ...IMAGES_BOTTOMS,
  ...IMAGES_SHOES,
  ...IMAGES_ACCESSORIES,
} as const;

export type ProductImageKey = keyof typeof PRODUCT_IMAGES;
