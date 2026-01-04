import { supabase } from '@/integrations/supabase/client';

export const uploadClothingImage = async (
  file: File,
  userId: string
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
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

  // Use signed URL instead of public URL for security
  const { data, error: signedUrlError } = await supabase.storage
    .from('clothing-images')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

  if (signedUrlError || !data?.signedUrl) {
    console.error('Signed URL error:', signedUrlError);
    throw new Error('خطا در دریافت لینک تصویر');
  }

  return data.signedUrl;
};

export const getSignedImageUrl = async (filePath: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('clothing-images')
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

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

export const deleteClothingImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the URL (works for both public and signed URLs)
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/clothing-images\/(.+?)(?:\?|$)/);
    
    if (pathMatch && pathMatch[1]) {
      const filePath = decodeURIComponent(pathMatch[1]);
      
      const { error } = await supabase.storage
        .from('clothing-images')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
      }
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
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
