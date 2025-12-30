import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClothingItem, ClothingCategory, OutfitSuggestion, UserProfile } from '@/types/wardrobe';
import { deleteClothingImage } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEYS = {
  CLOTHES: 'styler_clothes',
  SUGGESTIONS: 'styler_suggestions',
  PROFILE: 'styler_profile',
};

export const useWardrobe = () => {
  const [profile, setProfile] = useState<UserProfile>({ imageUrl: null });
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Load from localStorage for anonymous users
  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedClothes = localStorage.getItem(LOCAL_STORAGE_KEYS.CLOTHES);
      const savedSuggestions = localStorage.getItem(LOCAL_STORAGE_KEYS.SUGGESTIONS);
      const savedProfile = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE);

      if (savedClothes) {
        const parsed = JSON.parse(savedClothes);
        setClothes(parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        })));
      }

      if (savedSuggestions) {
        const parsed = JSON.parse(savedSuggestions);
        setSuggestions(parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          items: item.items?.map((i: any) => ({
            ...i,
            createdAt: new Date(i.createdAt),
          })) || [],
        })));
      }

      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage for anonymous users
  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, []);

  // Fetch user session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      if (!session?.user?.id) {
        loadFromLocalStorage();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadFromLocalStorage]);

  // Fetch clothes from database (for authenticated users)
  const fetchClothes = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: ClothingItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        category: item.category as ClothingCategory,
        imageUrl: item.image_url,
        color: item.color || undefined,
        createdAt: new Date(item.created_at),
      }));

      setClothes(items);
    } catch (error) {
      console.error('Error fetching clothes:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در بارگذاری لباس‌ها پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch suggestions from database (for authenticated users)
  const fetchSuggestions = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('outfit_suggestions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: OutfitSuggestion[] = (data || []).map(item => ({
        id: item.id,
        items: [],
        suggestionText: item.suggestion_text || undefined,
        generatedImageUrl: item.generated_image_url || undefined,
        isFavorite: item.is_favorite || false,
        createdAt: new Date(item.created_at),
      }));

      setSuggestions(items);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchClothes();
      fetchSuggestions();
    }
  }, [userId, fetchClothes, fetchSuggestions]);

  // Add clothing item
  const addClothing = async (item: Omit<ClothingItem, 'id' | 'createdAt'>) => {
    const newItem: ClothingItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
    };

    if (userId) {
      // Authenticated user - save to database
      try {
        const { data, error } = await supabase
          .from('clothing_items')
          .insert({
            user_id: userId,
            name: item.name,
            category: item.category,
            image_url: item.imageUrl,
            color: item.color,
          })
          .select()
          .single();

        if (error) throw error;

        newItem.id = data.id;
        newItem.createdAt = new Date(data.created_at);
      } catch (error) {
        console.error('Error adding clothing:', error);
        toast({
          title: 'خطا',
          description: 'مشکلی در افزودن لباس پیش آمد',
          variant: 'destructive',
        });
        return;
      }
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

  // Remove clothing item
  const removeClothing = async (id: string) => {
    const item = clothes.find(c => c.id === id);

    if (userId) {
      try {
        const { error } = await supabase
          .from('clothing_items')
          .delete()
          .eq('id', id);

        if (error) throw error;

        if (item?.imageUrl && item.imageUrl.includes('supabase')) {
          await deleteClothingImage(item.imageUrl);
        }
      } catch (error) {
        console.error('Error removing clothing:', error);
        toast({
          title: 'خطا',
          description: 'مشکلی در حذف لباس پیش آمد',
          variant: 'destructive',
        });
        return;
      }
    }

    const updatedClothes = clothes.filter(c => c.id !== id);
    setClothes(updatedClothes);

    if (!userId) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.CLOTHES, updatedClothes);
    }

    toast({
      title: 'لباس حذف شد',
      description: 'لباس از کمد شما حذف شد',
    });
  };

  // Toggle favorite suggestion
  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    if (userId) {
      try {
        const { error } = await supabase
          .from('outfit_suggestions')
          .update({ is_favorite: isFavorite })
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast({
          title: 'خطا',
          description: 'مشکلی پیش آمد',
          variant: 'destructive',
        });
        return;
      }
    }

    const updatedSuggestions = suggestions.map(s => 
      s.id === id ? { ...s, isFavorite } : s
    );
    setSuggestions(updatedSuggestions);

    if (!userId) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
    }

    toast({
      title: isFavorite ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد',
    });
  };

  // Delete suggestion
  const deleteSuggestion = async (id: string) => {
    if (userId) {
      try {
        const { error } = await supabase
          .from('outfit_suggestions')
          .delete()
          .eq('id', id);

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

    const updatedSuggestions = suggestions.filter(s => s.id !== id);
    setSuggestions(updatedSuggestions);

    if (!userId) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
    }

    toast({
      title: 'پیشنهاد حذف شد',
    });
  };

  // Generate outfit suggestion with AI
  const generateSuggestion = async (selectedItems: ClothingItem[]) => {
    if (clothes.length < 2) {
      toast({
        title: 'لباس کافی نیست',
        description: 'برای ایجاد ست، حداقل ۲ لباس اضافه کنید',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-outfit', {
        body: {
          clothes: clothes.map(c => ({
            id: c.id,
            name: c.name,
            category: c.category,
            color: c.color,
          })),
          selectedItemIds: selectedItems.map(i => i.id),
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      const itemsForSuggestion = selectedItems.length >= 2 
        ? selectedItems 
        : clothes.slice(0, Math.min(4, clothes.length));

      let newSuggestion: OutfitSuggestion;

      if (userId) {
        const { data: savedSuggestion, error: saveError } = await supabase
          .from('outfit_suggestions')
          .insert({
            user_id: userId,
            item_ids: itemsForSuggestion.map(i => i.id),
            suggestion_text: data.suggestion,
          })
          .select()
          .single();

        if (saveError) throw saveError;

        newSuggestion = {
          id: savedSuggestion.id,
          items: itemsForSuggestion,
          suggestionText: data.suggestion,
          isFavorite: false,
          createdAt: new Date(savedSuggestion.created_at),
        };
      } else {
        newSuggestion = {
          id: Date.now().toString(),
          items: itemsForSuggestion,
          suggestionText: data.suggestion,
          isFavorite: false,
          createdAt: new Date(),
        };
      }

      const updatedSuggestions = [newSuggestion, ...suggestions];
      setSuggestions(updatedSuggestions);

      if (!userId) {
        saveToLocalStorage(LOCAL_STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
      }

      toast({
        title: 'ست جدید ایجاد شد!',
        description: 'پیشنهاد هوش مصنوعی برای شما آماده است',
      });
    } catch (error) {
      console.error('Error generating suggestion:', error);
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'مشکلی در ایجاد پیشنهاد پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Update profile
  const updateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);

    if (!userId) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.PROFILE, newProfile);
    } else if (newProfile.imageUrl) {
      try {
        await supabase
          .from('profiles')
          .update({ image_url: newProfile.imageUrl })
          .eq('user_id', userId);
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  const favoriteSuggestions = suggestions.filter(s => s.isFavorite);

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
    generateSuggestion,
    toggleFavorite,
    deleteSuggestion,
    updateProfile,
    fetchClothes,
  };
};
