import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClothingItem, ClothingCategory, OutfitSuggestion, UserProfile } from '@/types/wardrobe';
import {
  deleteClothingImage,
  uploadClothingImage,
  compressImage,
  dataUrlToFile,
  resolveImageUrl,
  createLocalId,
  extractStoragePath,
} from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { SAMPLE_CLOTHES, SAMPLE_WARDROBE_VERSION } from '@/lib/sampleWardrobe';
import { describeColorHarmony, scoreOutfitColors } from '@/lib/colorHarmony';
import {
  runOutfitEngine,
  loadPreferences,
  savePreferences,
  applyLike,
  applyDislike,
  markWorn,
} from '@/lib/outfitEngine';
import {
  loadRankerModel,
  saveRankerModel,
  updateModel,
  extractOutfitFeatures,
  modelAccuracy,
} from '@/lib/outfitEngine/mlRanker';
import { buildProfileMap } from '@/lib/outfitEngine/profile';
import {
  OutfitContext,
  DEFAULT_OUTFIT_CONTEXT,
  buildContextOutfit,
  describeContext,
  contextLabels,
} from '@/lib/outfitContext';

const SAMPLES_VERSION = SAMPLE_WARDROBE_VERSION;
const LOCAL_STORAGE_KEYS = {
  CLOTHES: 'styler_clothes',
  SUGGESTIONS: 'styler_suggestions',
  PROFILE: 'styler_profile',
  SAMPLES_SEEDED: 'styler_samples_seeded',
  SAMPLES_VERSION_KEY: 'styler_samples_version',
};

const isSampleItem = (item: { id?: string }) =>
  Boolean(item?.id?.startsWith('sample-'));

const migratedKeyFor = (uid: string) => `styler_migrated_${uid}`;

/** Map a DB clothing row to ClothingItem (image path still unresolved). */
const mapClothingRow = (item: {
  id: string;
  name: string;
  category: string;
  image_url: string;
  color: string | null;
  created_at: string;
  tags?: string[] | null;
}): ClothingItem => ({
  id: item.id,
  name: item.name,
  category: item.category as ClothingCategory,
  imageUrl: item.image_url,
  color: item.color || undefined,
  tags: item.tags?.length ? item.tags : undefined,
  createdAt: new Date(item.created_at),
});

/** Resolve imageUrl fields for a list of clothing items. */
const withResolvedImages = async (items: ClothingItem[]): Promise<ClothingItem[]> => {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      imageUrl: await resolveImageUrl(item.imageUrl),
    }))
  );
};

export const useWardrobe = () => {
  const [profile, setProfile] = useState<UserProfile>({ imageUrl: null });
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const hasMigratedRef = useRef(false);

  // ---------- localStorage helpers (guests) ----------
  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedClothes = localStorage.getItem(LOCAL_STORAGE_KEYS.CLOTHES);
      const savedSuggestions = localStorage.getItem(LOCAL_STORAGE_KEYS.SUGGESTIONS);
      const savedProfile = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE);
      const savedVersion = localStorage.getItem(LOCAL_STORAGE_KEYS.SAMPLES_VERSION_KEY);

      if (savedClothes) {
        const parsed: any[] = JSON.parse(savedClothes);

        if (savedVersion !== SAMPLES_VERSION) {
          const userItems = parsed.filter((item: any) => !isSampleItem(item));
          const refreshed = [...SAMPLE_CLOTHES, ...userItems];
          setClothes(
            refreshed.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt),
            }))
          );
          localStorage.setItem(LOCAL_STORAGE_KEYS.CLOTHES, JSON.stringify(refreshed));
          localStorage.setItem(LOCAL_STORAGE_KEYS.SAMPLES_VERSION_KEY, SAMPLES_VERSION);
          localStorage.setItem(LOCAL_STORAGE_KEYS.SAMPLES_SEEDED, '1');
        } else {
          setClothes(
            parsed.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt),
            }))
          );
        }
      } else if (
        !localStorage.getItem(LOCAL_STORAGE_KEYS.SAMPLES_SEEDED) ||
        savedVersion !== SAMPLES_VERSION
      ) {
        setClothes(SAMPLE_CLOTHES);
        localStorage.setItem(LOCAL_STORAGE_KEYS.CLOTHES, JSON.stringify(SAMPLE_CLOTHES));
        localStorage.setItem(LOCAL_STORAGE_KEYS.SAMPLES_SEEDED, '1');
        localStorage.setItem(LOCAL_STORAGE_KEYS.SAMPLES_VERSION_KEY, SAMPLES_VERSION);
      } else {
        setClothes([]);
      }

      if (savedSuggestions) {
        const parsed = JSON.parse(savedSuggestions);
        setSuggestions(
          parsed.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            items:
              item.items?.map((i: any) => ({
                ...i,
                createdAt: new Date(i.createdAt),
              })) || [],
          }))
        );
      } else {
        setSuggestions([]);
      }

      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        setProfile({ imageUrl: null });
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setClothes(SAMPLE_CLOTHES);
      setSuggestions([]);
      setProfile({ imageUrl: null });
    }
    setIsLoading(false);
  }, []);

  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, []);

  /** Reset in-memory state and reload guest wardrobe (used on logout). */
  const resetToGuestState = useCallback(() => {
    hasMigratedRef.current = false;
    setIsLoading(true);
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // ---------- Auth session ----------
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);

      // On explicit sign-out, clear account data and restore guest wardrobe
      if (event === 'SIGNED_OUT') {
        resetToGuestState();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        loadFromLocalStorage();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadFromLocalStorage, resetToGuestState]);

  // ---------- Profile ----------
  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('image_url, name')
        .eq('user_id', uid)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const imageUrl = data.image_url
          ? await resolveImageUrl(data.image_url)
          : null;
        setProfile({
          imageUrl,
          name: data.name || undefined,
        });
      } else {
        setProfile({ imageUrl: null });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  // ---------- Clothes ----------
  const fetchClothes = useCallback(async (uid?: string): Promise<ClothingItem[]> => {
    const activeUid = uid ?? userId;
    if (!activeUid) return [];

    try {
      // tags column may not exist until migration is applied — fall back without it
      let data: any[] | null = null;
      let error: any = null;

      const withTags = await supabase
        .from('clothing_items')
        .select('id, name, category, image_url, color, created_at, tags')
        .eq('user_id', activeUid)
        .order('created_at', { ascending: false });

      if (withTags.error && /tags/i.test(withTags.error.message || '')) {
        const withoutTags = await supabase
          .from('clothing_items')
          .select('id, name, category, image_url, color, created_at')
          .eq('user_id', activeUid)
          .order('created_at', { ascending: false });
        data = withoutTags.data;
        error = withoutTags.error;
      } else {
        data = withTags.data;
        error = withTags.error;
      }

      if (error) throw error;

      const mapped = (data || []).map(mapClothingRow);
      const resolved = await withResolvedImages(mapped);
      setClothes(resolved);
      return resolved;
    } catch (error) {
      console.error('Error fetching clothes:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در بارگذاری لباس‌ها پیش آمد',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ---------- Suggestions (resolve item_ids against wardrobe) ----------
  const fetchSuggestions = useCallback(
    async (uid: string, wardrobe: ClothingItem[]) => {
      try {
        const { data, error } = await supabase
          .from('outfit_suggestions')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const byId = new Map(wardrobe.map((c) => [c.id, c]));

        const items: OutfitSuggestion[] = (data || []).map((row) => {
          const linked = ((row.item_ids as string[]) || [])
            .map((id) => byId.get(id))
            .filter((c): c is ClothingItem => Boolean(c));

          return {
            id: row.id,
            items: linked,
            suggestionText: row.suggestion_text || undefined,
            generatedImageUrl: row.generated_image_url || undefined,
            isFavorite: row.is_favorite || false,
            createdAt: new Date(row.created_at),
          };
        });

        setSuggestions(items);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    },
    []
  );

  // ---------- Guest → account migration ----------
  const migrateGuestDataToAccount = useCallback(async (uid: string) => {
    if (hasMigratedRef.current) return;
    if (localStorage.getItem(migratedKeyFor(uid))) {
      hasMigratedRef.current = true;
      return;
    }

    let savedClothes: any[] = [];
    let savedSuggestions: any[] = [];
    let savedProfile: UserProfile | null = null;

    try {
      const savedClothesRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.CLOTHES);
      const savedSuggestionsRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.SUGGESTIONS);
      const savedProfileRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE);
      savedClothes = savedClothesRaw ? JSON.parse(savedClothesRaw) : [];
      savedSuggestions = savedSuggestionsRaw ? JSON.parse(savedSuggestionsRaw) : [];
      savedProfile = savedProfileRaw ? JSON.parse(savedProfileRaw) : null;
    } catch {
      hasMigratedRef.current = true;
      return;
    }

    // Never migrate demo/sample items into a real account
    const userClothes = savedClothes.filter((item) => !isSampleItem(item));
    const userSuggestions = savedSuggestions.filter((s) => {
      const ids: string[] = (s.items || []).map((i: any) => i.id);
      return ids.some((id) => id && !id.startsWith('sample-'));
    });

    const hasGuestData =
      userClothes.length > 0 ||
      userSuggestions.length > 0 ||
      Boolean(savedProfile?.imageUrl);

    if (!hasGuestData) {
      localStorage.setItem(migratedKeyFor(uid), '1');
      hasMigratedRef.current = true;
      return;
    }

    toast({
      title: 'در حال انتقال داده‌ها...',
      description: 'کمد لباس مهمان شما به حساب کاربری منتقل می‌شود',
    });

    const idMap = new Map<string, string>();

    try {
      for (const item of userClothes) {
        let imageUrl = item.imageUrl as string;

        if (imageUrl?.startsWith('data:')) {
          try {
            const file = await dataUrlToFile(imageUrl, `${item.name || 'item'}.jpg`);
            const compressedBlob = await compressImage(file);
            const compressedFile = new File([compressedBlob], file.name, {
              type: 'image/jpeg',
            });
            imageUrl = await uploadClothingImage(compressedFile, uid);
          } catch (uploadErr) {
            console.error('Error migrating clothing image, skipping item:', uploadErr);
            continue;
          }
        }

        const insertPayload: Record<string, unknown> = {
          user_id: uid,
          name: item.name,
          category: item.category,
          image_url: imageUrl,
          color: item.color ?? null,
        };
        if (Array.isArray(item.tags) && item.tags.length) {
          insertPayload.tags = item.tags;
        }

        let data: any = null;
        let error: any = null;

        const firstTry = await supabase
          .from('clothing_items')
          .insert(insertPayload as never)
          .select()
          .single();

        if (firstTry.error && /tags/i.test(firstTry.error.message || '')) {
          delete insertPayload.tags;
          const secondTry = await supabase
            .from('clothing_items')
            .insert(insertPayload as never)
            .select()
            .single();
          data = secondTry.data;
          error = secondTry.error;
        } else {
          data = firstTry.data;
          error = firstTry.error;
        }

        if (!error && data) {
          idMap.set(item.id, data.id);
        }
      }

      for (const suggestion of userSuggestions) {
        const migratedItemIds = (suggestion.items || [])
          .map((i: any) => idMap.get(i.id))
          .filter(Boolean) as string[];

        if (migratedItemIds.length === 0) continue;

        await supabase.from('outfit_suggestions').insert({
          user_id: uid,
          item_ids: migratedItemIds,
          suggestion_text: suggestion.suggestionText,
          is_favorite: suggestion.isFavorite || false,
        });
      }

      if (savedProfile?.imageUrl) {
        let profileImage = savedProfile.imageUrl;
        if (profileImage.startsWith('data:')) {
          try {
            const file = await dataUrlToFile(profileImage, 'profile.jpg');
            const compressedBlob = await compressImage(file);
            const compressedFile = new File([compressedBlob], 'profile.jpg', {
              type: 'image/jpeg',
            });
            profileImage = await uploadClothingImage(compressedFile, uid);
          } catch (e) {
            console.error('Error migrating profile image:', e);
          }
        }

        await supabase
          .from('profiles')
          .update({ image_url: profileImage })
          .eq('user_id', uid);
      }

      // Clear guest data only after successful migration
      localStorage.removeItem(LOCAL_STORAGE_KEYS.CLOTHES);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.SUGGESTIONS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.PROFILE);
      localStorage.setItem(migratedKeyFor(uid), '1');
      hasMigratedRef.current = true;

      toast({
        title: 'انتقال کامل شد',
        description: 'کمد لباس و ست‌های شما به حساب کاربری‌تان منتقل شد',
      });
    } catch (err) {
      console.error('Error migrating guest data:', err);
      // Do NOT set hasMigratedRef / migrated key — allow retry next load
      toast({
        title: 'خطا در انتقال داده‌ها',
        description: 'برخی از لباس‌های مهمان شما منتقل نشدند. با رفرش دوباره تلاش می‌شود.',
        variant: 'destructive',
      });
    }
  }, []);

  // Load account data when userId is set
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      await migrateGuestDataToAccount(userId);
      if (cancelled) return;

      const wardrobe = await fetchClothes(userId);
      if (cancelled) return;

      await Promise.all([
        fetchSuggestions(userId, wardrobe),
        fetchProfile(userId),
      ]);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, migrateGuestDataToAccount, fetchClothes, fetchSuggestions, fetchProfile]);

  // ---------- Mutations ----------
  const addClothing = async (item: Omit<ClothingItem, 'id' | 'createdAt'>) => {
    const newItem: ClothingItem = {
      ...item,
      id: createLocalId(),
      createdAt: new Date(),
    };

    if (userId) {
      try {
        const insertPayload: Record<string, unknown> = {
          user_id: userId,
          name: item.name,
          category: item.category,
          image_url: item.imageUrl,
          color: item.color ?? null,
        };
        if (item.tags?.length) {
          insertPayload.tags = item.tags;
        }

        let data: any = null;
        let error: any = null;

        const firstTry = await supabase
          .from('clothing_items')
          .insert(insertPayload as never)
          .select()
          .single();

        if (firstTry.error && /tags/i.test(firstTry.error.message || '')) {
          delete insertPayload.tags;
          const secondTry = await supabase
            .from('clothing_items')
            .insert(insertPayload as never)
            .select()
            .single();
          data = secondTry.data;
          error = secondTry.error;
        } else {
          data = firstTry.data;
          error = firstTry.error;
        }

        if (error) throw error;

        newItem.id = data.id;
        newItem.createdAt = new Date(data.created_at);
        newItem.imageUrl = await resolveImageUrl(data.image_url);
      } catch (error) {
        console.error('Error adding clothing:', error);
        toast({
          title: 'خطا',
          description: 'مشکلی در افزودن لباس پیش آمد',
          variant: 'destructive',
        });
        return;
      }
    } else {
      newItem.imageUrl = await resolveImageUrl(item.imageUrl);
    }

    const updatedClothes = [newItem, ...clothes];
    setClothes(updatedClothes);

    if (!userId) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.CLOTHES, updatedClothes);
    }

    toast({
      title: 'لباس اضافه شد',
      description: `${item.name} به کمد شما اضافه شد`,
    });
  };

  const removeClothing = async (id: string) => {
    const item = clothes.find((c) => c.id === id);

    if (userId) {
      try {
        const { error } = await supabase
          .from('clothing_items')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) throw error;

        if (item?.imageUrl) {
          const path = extractStoragePath(item.imageUrl);
          if (path || item.imageUrl.includes('supabase')) {
            await deleteClothingImage(item.imageUrl);
          }
        }
      } catch (error) {
        console.error('Error removing clothing:', error);
        toast({
          title: 'خطا',
          description: 'مشکلی در حذف لباس پیش آمد',
          variant: 'destructive',
        });
        return false;
      }
    }

    const updatedClothes = clothes.filter((c) => c.id !== id);
    setClothes(updatedClothes);

    if (!userId) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.CLOTHES, updatedClothes);
    }

    toast({
      title: 'لباس حذف شد',
      description: 'لباس از کمد شما حذف شد',
    });
    return true;
  };

  const updateClothing = async (
    id: string,
    updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>
  ) => {
    const existingItem = clothes.find((c) => c.id === id);
    if (!existingItem) return;

    if (userId) {
      try {
        const dbPayload: {
          name?: string;
          category?: string;
          image_url?: string;
          color?: string | null;
          tags?: string[];
        } = {};
        if (updates.name !== undefined) dbPayload.name = updates.name;
        if (updates.category !== undefined) dbPayload.category = updates.category;
        if (updates.imageUrl !== undefined) dbPayload.image_url = updates.imageUrl;
        if (updates.color !== undefined) {
          dbPayload.color = updates.color?.trim() ? updates.color : null;
        }
        if (updates.tags !== undefined) dbPayload.tags = updates.tags;

        let error: any = null;
        const firstTry = await supabase
          .from('clothing_items')
          .update(dbPayload)
          .eq('id', id)
          .eq('user_id', userId);

        if (firstTry.error && /tags/i.test(firstTry.error.message || '')) {
          delete dbPayload.tags;
          const secondTry = await supabase
            .from('clothing_items')
            .update(dbPayload)
            .eq('id', id)
            .eq('user_id', userId);
          error = secondTry.error;
        } else {
          error = firstTry.error;
        }

        if (error) throw error;

        if (updates.imageUrl && updates.imageUrl !== existingItem.imageUrl) {
          await deleteClothingImage(existingItem.imageUrl);
        }
      } catch (error) {
        console.error('Error updating clothing:', error);
        toast({
          title: 'خطا',
          description: 'مشکلی در ویرایش لباس پیش آمد',
          variant: 'destructive',
        });
        return;
      }
    }

    const resolvedUpdates = { ...updates };
    if (updates.imageUrl) {
      resolvedUpdates.imageUrl = await resolveImageUrl(updates.imageUrl);
    }

    const updatedClothes = clothes.map((c) =>
      c.id === id ? { ...c, ...resolvedUpdates } : c
    );
    setClothes(updatedClothes);

    if (!userId) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.CLOTHES, updatedClothes);
    }

    toast({
      title: 'تغییرات ذخیره شد',
      description: `«${updates.name || existingItem.name}» به‌روز شد`,
    });
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    if (userId) {
      try {
        const { error } = await supabase
          .from('outfit_suggestions')
          .update({ is_favorite: isFavorite })
          .eq('id', id)
          .eq('user_id', userId);

        if (error) throw error;
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast({
          title: 'خطا',
          description: 'مشکلی در ذخیره علاقه‌مندی پیش آمد',
          variant: 'destructive',
        });
        return;
      }
    }

    const updatedSuggestions = suggestions.map((s) =>
      s.id === id ? { ...s, isFavorite } : s
    );
    setSuggestions(updatedSuggestions);

    if (!userId) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
    }
  };

  const deleteSuggestion = async (id: string) => {
    if (userId) {
      try {
        const { error } = await supabase
          .from('outfit_suggestions')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting suggestion:', error);
        toast({
          title: 'خطا',
          description: 'مشکلی در حذف پیشنهاد پیش آمد',
          variant: 'destructive',
        });
        return;
      }
    }

    const updatedSuggestions = suggestions.filter((s) => s.id !== id);
    setSuggestions(updatedSuggestions);

    if (!userId) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
    }

    toast({
      title: 'حذف شد',
      description: 'ست پیشنهادی حذف شد',
    });
  };

  const generateSuggestion = async (
    selectedItems: ClothingItem[],
    context: OutfitContext = DEFAULT_OUTFIT_CONTEXT
  ) => {
    if (clothes.length < 2 && selectedItems.length < 2) {
      toast({
        title: 'لباس کافی نیست',
        description: 'حداقل ۲ لباس برای ساخت ست لازم است',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    const generateLocalSuggestion = (items: ClothingItem[], ctx: OutfitContext): string => {
      const tops = items.filter((i) => i.category === 'tops');
      const bottoms = items.filter((i) => i.category === 'bottoms');
      const dresses = items.filter((i) => i.category === 'dresses');
      const outerwear = items.filter((i) => i.category === 'outerwear');
      const shoes = items.filter((i) => i.category === 'shoes');
      const accessories = items.filter((i) => i.category === 'accessories');

      const parts: string[] = [];

      if (dresses.length > 0) {
        parts.push(`${dresses.map((d) => d.name).join(' و ')}`);
      } else {
        if (tops.length > 0) {
          parts.push(`${tops.map((t) => t.name).join(' و ')}`);
        }
        if (bottoms.length > 0) {
          parts.push(`همراه با ${bottoms.map((b) => b.name).join(' و ')}`);
        }
      }

      if (outerwear.length > 0) {
        parts.push(`و ${outerwear.map((o) => o.name).join(' و ')} رویش`);
      }
      if (shoes.length > 0) {
        parts.push(`با ${shoes.map((s) => s.name).join(' و ')} که خیلی هماهنگه`);
      }
      if (accessories.length > 0) {
        parts.push(
          `و ${accessories.map((a) => a.name).join(' و ')} که ست رو کامل می‌کنه`
        );
      }

      const occasionLine = `این ست برای «${contextLabels(ctx)}» پیشنهاد شده است. ${describeContext(ctx)}.`;

      const base =
        parts.length > 0
          ? `${parts.join('، ')}. ${occasionLine}`
          : `یک ترکیب هماهنگ از کمد شما. ${occasionLine}`;

      const colorNote = describeColorHarmony(items);
      const match = scoreOutfitColors(items);
      const scoreNote =
        match.colors.length > 0
          ? ` امتیاز هماهنگی رنگ: ${match.score} از ۱۰۰.`
          : '';

      return `${base}${colorNote ? ` ${colorNote}` : ''}${scoreNote} 👗✨`;
    };

    try {
      // Rules engine: analyze → score → candidates → rank (1–3 top outfits)
      const prefs = typeof window !== 'undefined' ? loadPreferences() : undefined;
      const ranked = runOutfitEngine(
        clothes,
        { context, limit: 3 },
        prefs,
        selectedItems
      );

      const best = ranked[0];
      const stripInvalidCombo = (items: ClothingItem[]) => {
        const hasDress = items.some((i) => i.category === 'dresses');
        const hasTop = items.some((i) => i.category === 'tops');
        const hasBottom = items.some((i) => i.category === 'bottoms');
        if (hasDress && (hasTop || hasBottom)) {
          // Prefer one-piece look when a dress is present
          return items.filter((i) => i.category !== 'tops' && i.category !== 'bottoms');
        }
        return items;
      };
      const itemsForSuggestion = stripInvalidCombo(
        selectedItems.length >= 2
          ? selectedItems
          : best?.items || buildContextOutfit(clothes, context, selectedItems)
      );

      if (itemsForSuggestion.length < 2) {
        toast({
          title: 'ست کامل نشد',
          description: 'با لباس‌های فعلی کمد نتوانستیم ست مناسب بسازیم',
          variant: 'destructive',
        });
        setIsGenerating(false);
        return;
      }

      // Explanation from engine + optional gaps
      const engineReason = best?.reason || '';
      const gapsText = best?.gaps?.length
        ? ' ' + best.gaps.join(' ')
        : '';

      // Local text is free baseline; prefer engine reason when present
      let suggestionText =
        engineReason
          ? `${engineReason}${gapsText}`
          : generateLocalSuggestion(itemsForSuggestion, context);

      // Optional AI polish: short timeout, only the chosen outfit items (not full wardrobe)
      // to minimize token cost. Failures fall back to local text silently.
      if (userId) {
        try {
          const AI_TIMEOUT_MS = 4500;
          const invokePromise = supabase.functions.invoke('generate-outfit', {
            body: {
              clothes: itemsForSuggestion.map((c) => ({
                id: c.id,
                name: c.name,
                category: c.category,
                color: c.color,
              })),
              selectedItemIds: itemsForSuggestion.map((i) => i.id),
              context: {
                style: context.style,
                environment: context.environment,
                weather: context.weather,
              },
            },
          });
          const timed = await Promise.race([
            invokePromise,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), AI_TIMEOUT_MS)),
          ]);
          if (timed && !('error' in timed && timed.error) && (timed as any).data?.suggestion) {
            const aiText = (timed as any).data.suggestion as string;
            if (aiText && aiText.trim().length > 20) {
              suggestionText = aiText.trim();
            }
          }
        } catch {
          // keep local text
        }
      }

      let newSuggestion: OutfitSuggestion;

      if (userId) {
        const { data: savedSuggestion, error: saveError } = await supabase
          .from('outfit_suggestions')
          .insert({
            user_id: userId,
            item_ids: itemsForSuggestion.map((i) => i.id),
            suggestion_text: suggestionText,
          })
          .select()
          .single();

        if (saveError) throw saveError;

        newSuggestion = {
          id: savedSuggestion.id,
          items: itemsForSuggestion,
          suggestionText,
          isFavorite: false,
          createdAt: new Date(savedSuggestion.created_at),
          context: { ...context },
        };
      } else {
        newSuggestion = {
          id: createLocalId(),
          items: itemsForSuggestion,
          suggestionText,
          isFavorite: false,
          createdAt: new Date(),
          context: { ...context },
        };
      }

      const updatedSuggestions = [newSuggestion, ...suggestions];
      setSuggestions(updatedSuggestions);

      if (!userId) {
        saveToLocalStorage(LOCAL_STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
      }

      toast({
        title: 'ست جدید ایجاد شد!',
        description: `برای ${contextLabels(context)} آماده شد`,
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'مشکلی در ایجاد پیشنهاد پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateProfile = async (newProfile: UserProfile) => {
    const displayProfile: UserProfile = {
      ...newProfile,
      imageUrl: newProfile.imageUrl
        ? await resolveImageUrl(newProfile.imageUrl)
        : null,
    };
    setProfile(displayProfile);

    if (!userId) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.PROFILE, displayProfile);
    } else {
      try {
        const path =
          newProfile.imageUrl && extractStoragePath(newProfile.imageUrl);
        await supabase
          .from('profiles')
          .update({
            image_url: path || newProfile.imageUrl,
            ...(newProfile.name !== undefined ? { name: newProfile.name } : {}),
          })
          .eq('user_id', userId);
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  const favoriteSuggestions = suggestions.filter((s) => s.isFavorite);

  const feedbackOutfit = (
    suggestion: OutfitSuggestion,
    liked: boolean
  ) => {
    if (typeof window === 'undefined') return;
    let prefs = loadPreferences();
    const colors = suggestion.items.map((i) => i.color);
    const ids = suggestion.items.map((i) => i.id);
    prefs = liked ? applyLike(prefs, ids, colors) : applyDislike(prefs, ids, colors);
    if (liked) prefs = markWorn(prefs, ids);
    savePreferences(prefs);

    // Persist feedback on the suggestion for filters (لایک‌شده‌ها)
    const feedback: 'liked' | 'disliked' = liked ? 'liked' : 'disliked';
    const updatedSuggestions = suggestions.map((s) =>
      s.id === suggestion.id ? { ...s, userFeedback: feedback } : s
    );
    setSuggestions(updatedSuggestions);
    if (!userId) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
    }

    // Online ML update (logistic regression SGD)
    try {
      const ctx = suggestion.context || {
        style: 'casual' as const,
        environment: 'gathering' as const,
        weather: 'sunny' as const,
      };
      const profiles = buildProfileMap(suggestion.items);
      const features = extractOutfitFeatures(suggestion.items, profiles, ctx, prefs);
      let model = loadRankerModel();
      model = updateModel(model, features, liked ? 1 : 0);
      saveRankerModel(model);
      const acc = modelAccuracy(model);
      toast({
        title: liked ? 'یادگیری مدل ✓' : 'بازخورد ثبت شد',
        description: acc
          ? `پیشنهادها شخصی‌سازی شد · دقت تقریبی مدل: ${acc.toLocaleString('fa-IR')}٪`
          : liked
            ? 'با چند بازخورد بعدی مدل دقیق‌تر می‌شود'
            : 'از این الگو کمتر استفاده می‌شود',
      });
    } catch {
      toast({
        title: liked ? 'یاد گرفتیم ✓' : 'ثبت شد',
        description: liked
          ? 'پیشنهادهای بعدی به سلیقه شما نزدیک‌تر می‌شوند'
          : 'از این ترکیب در پیشنهادهای بعدی کمتر استفاده می‌شود',
      });
    }
  };

  return {
    profile,
    clothes,
    suggestions,
    favoriteSuggestions,
    isLoading,
    isGenerating,
    userId,
    addClothing,
    removeClothing,
    updateClothing,
    generateSuggestion,
    feedbackOutfit,
    toggleFavorite,
    deleteSuggestion,
    updateProfile,
    fetchClothes,
  };
};
