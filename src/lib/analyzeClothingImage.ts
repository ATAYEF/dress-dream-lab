import { ClothingCategory } from '@/types/wardrobe';
import { autoDetectClothing, extractDominantColor } from '@/lib/clothingAutoDetect';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyzeResult {
  category: ClothingCategory;
  color?: string;
  name?: string;
  method: 'cloud' | 'local';
}

/**
 * Shared clothing image analysis used by single-add and bulk-add flows.
 */
export async function analyzeClothingImage(
  dataUrl: string,
  fileName = '',
  cloudTimeoutMs = 2200
): Promise<AnalyzeResult> {
  const cloudPromise = (async (): Promise<AnalyzeResult | null> => {
    try {
      const timeout = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), cloudTimeoutMs)
      );
      const invoke = supabase.functions.invoke('analyze-clothing', {
        body: { imageUrl: dataUrl },
      });
      const result = await Promise.race([invoke, timeout]);
      if (!result) return null;
      const { data, error } = result as { data?: any; error?: any };
      if (error || data?.error || !data) return null;
      return {
        category: (data.category as ClothingCategory) || 'tops',
        color: data.color as string | undefined,
        name: data.name as string | undefined,
        method: 'cloud',
      };
    } catch {
      return null;
    }
  })();

  const localPromise = (async (): Promise<AnalyzeResult> => {
    const result = await autoDetectClothing(dataUrl, fileName);
    let color = result.color || undefined;
    try {
      if (!color) {
        const d = await extractDominantColor(dataUrl);
        color = d.colorName;
      }
    } catch {
      /* ignore */
    }
    return {
      category: result.category,
      color,
      name: result.name,
      method: 'local',
    };
  })();

  const cloudRes = await Promise.race([
    cloudPromise,
    new Promise<null>((r) => setTimeout(() => r(null), 1800)),
  ]);

  if (cloudRes) {
    if (!cloudRes.color) {
      try {
        const d = await extractDominantColor(dataUrl);
        cloudRes.color = d.colorName;
      } catch {
        /* ignore */
      }
    }
    return cloudRes;
  }

  return localPromise;
}
