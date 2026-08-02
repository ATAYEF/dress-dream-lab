import { supabase } from '@/integrations/supabase/client';

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days — refreshed on every fetch

/** Extract storage object path from a full Supabase URL or return path as-is. */
export const extractStoragePath = (imageUrlOrPath: string): string | null => {
  if (!imageUrlOrPath) return null;

  // Already a bare path like "userId/filename.jpg"
  if (
    !imageUrlOrPath.startsWith('http') &&
    !imageUrlOrPath.startsWith('data:') &&
    !imageUrlOrPath.startsWith('blob:') &&
    !imageUrlOrPath.startsWith('/')
  ) {
    return imageUrlOrPath;
  }

  try {
    const url = new URL(imageUrlOrPath);
    const match = url.pathname.match(/\/clothing-images\/(.+)$/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch {
    // not a valid URL
  }

  return null;
};

/**
 * Upload a clothing image and return the **storage path** (not a signed URL).
 * Paths are stable; signed URLs are generated on read via resolveImageUrl.
 */
export const uploadClothingImage = async (
  file: File,
  userId: string
): Promise<string> => {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('clothing-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error('خطا در آپلود تصویر');
  }

  return filePath;
};

export const getSignedImageUrl = async (
  filePath: string,
  expiresIn = SIGNED_URL_TTL_SECONDS
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('clothing-images')
      .createSignedUrl(filePath, expiresIn);

    if (error || !data?.signedUrl) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
};

/**
 * Resolve any stored image reference (path, signed URL, data URL, external URL, local asset)
 * into a displayable URL. Re-signs Supabase storage paths so expired tokens recover.
 */
export const resolveImageUrl = async (
  imageUrlOrPath: string | null | undefined
): Promise<string> => {
  if (!imageUrlOrPath) return '';

  // Data URLs, blobs, relative/local assets, or non-Supabase absolute URLs
  if (
    imageUrlOrPath.startsWith('data:') ||
    imageUrlOrPath.startsWith('blob:') ||
    imageUrlOrPath.startsWith('/') ||
    (imageUrlOrPath.startsWith('http') && !imageUrlOrPath.includes('supabase'))
  ) {
    return imageUrlOrPath;
  }

  const path = extractStoragePath(imageUrlOrPath);
  if (!path) {
    return imageUrlOrPath;
  }

  const signed = await getSignedImageUrl(path);
  return signed || imageUrlOrPath;
};

/** Resolve many image refs in parallel. */
export const resolveImageUrls = async (
  urls: (string | null | undefined)[]
): Promise<string[]> => {
  return Promise.all(urls.map((u) => resolveImageUrl(u)));
};

export const deleteClothingImage = async (imageUrlOrPath: string): Promise<void> => {
  try {
    const filePath = extractStoragePath(imageUrlOrPath);
    if (!filePath) return;

    const { error } = await supabase.storage.from('clothing-images').remove([filePath]);
    if (error) {
      console.error('Delete error:', error);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

export const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
};

export const compressImage = async (file: File, maxWidth = 800): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not compress image'));
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
};

/** Generate a stable unique id (guest items / local suggestions). */
export const createLocalId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};
