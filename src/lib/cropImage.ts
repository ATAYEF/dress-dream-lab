/** Utilities for client-side image cropping before AI analysis / upload */

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Draw a cropped region of an image into a JPEG data URL.
 * @param imageSrc - object URL or data URL
 * @param crop - crop in natural image pixel coordinates
 * @param maxEdge - longest edge of output (keeps quality for AI, limits size)
 */
export async function getCroppedDataUrl(
  imageSrc: string,
  crop: PixelCrop,
  maxEdge = 1024,
  mime: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92
): Promise<string> {
  const image = await loadImage(imageSrc);
  const scale = Math.min(1, maxEdge / Math.max(crop.width, crop.height));
  const outW = Math.max(1, Math.round(crop.width * scale));
  const outH = Math.max(1, Math.round(crop.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outW,
    outH
  );

  return canvas.toDataURL(mime, quality);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Compute a centered crop rectangle for a given aspect ratio inside the image.
 */
export function centeredCrop(
  imgW: number,
  imgH: number,
  aspect: number
): PixelCrop {
  if (imgW / imgH > aspect) {
    const height = imgH;
    const width = height * aspect;
    return { x: (imgW - width) / 2, y: 0, width, height };
  }
  const width = imgW;
  const height = width / aspect;
  return { x: 0, y: (imgH - height) / 2, width, height };
}

/**
 * Map crop in "display" space (container) back to natural image pixels.
 * displayRect is the drawn image box inside the container; cropBox is relative to container.
 */
export function displayCropToPixels(
  naturalW: number,
  naturalH: number,
  display: { left: number; top: number; width: number; height: number },
  cropBox: { left: number; top: number; width: number; height: number }
): PixelCrop {
  const scaleX = naturalW / display.width;
  const scaleY = naturalH / display.height;
  const x = Math.max(0, (cropBox.left - display.left) * scaleX);
  const y = Math.max(0, (cropBox.top - display.top) * scaleY);
  const width = Math.min(naturalW - x, cropBox.width * scaleX);
  const height = Math.min(naturalH - y, cropBox.height * scaleY);
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}


/** Auto center-crop to aspect ratio (used in bulk import to skip manual crop). */
export async function autoCenterCropDataUrl(
  imageSrc: string,
  aspect = 4 / 5,
  maxEdge = 1024
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('load failed'));
    img.src = imageSrc;
  });
  const crop = centeredCrop(image.naturalWidth, image.naturalHeight, aspect);
  return getCroppedDataUrl(imageSrc, crop, maxEdge);
}
