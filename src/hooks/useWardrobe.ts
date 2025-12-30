import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClothingItem, ClothingCategory, OutfitSuggestion, UserProfile } from '@/types/wardrobe';
import { deleteClothingImage } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

export const useWardrobe = () => {
  const [profile, setProfile] = useState<UserProfile>({ imageUrl: null });
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch clothes from database
  const fetchClothes = useCallback(async () => {
    if (!userId) {
      setClothes([]);
      setIsLoading(false);
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

  // Fetch suggestions from database
  const fetchSuggestions = useCallback(async () => {
    if (!userId) {
      setSuggestions([]);
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
    fetchClothes();
    fetchSuggestions();
  }, [fetchClothes, fetchSuggestions]);

  // Add clothing item
  const addClothing = async (item: Omit<ClothingItem, 'id' | 'createdAt'>) => {
    if (!userId) {
      toast({
        title: 'خطا',
        description: 'لطفا ابتدا وارد شوید',
        variant: 'destructive',
      });
      return;
    }

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

      const newItem: ClothingItem = {
        id: data.id,
        name: data.name,
        category: data.category as ClothingCategory,
        imageUrl: data.image_url,
        color: data.color || undefined,
        createdAt: new Date(data.created_at),
      };

      setClothes(prev => [newItem, ...prev]);
      
      toast({
        title: 'لباس اضافه شد',
        description: `${item.name} به کمد شما اضافه شد`,
      });
    } catch (error) {
      console.error('Error adding clothing:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در افزودن لباس پیش آمد',
        variant: 'destructive',
      });
    }
  };

  // Remove clothing item
  const removeClothing = async (id: string) => {
    try {
      const item = clothes.find(c => c.id === id);
      
      const { error } = await supabase
        .from('clothing_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (item?.imageUrl) {
        await deleteClothingImage(item.imageUrl);
      }

      setClothes(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: 'لباس حذف شد',
        description: 'لباس از کمد شما حذف شد',
      });
    } catch (error) {
      console.error('Error removing clothing:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در حذف لباس پیش آمد',
        variant: 'destructive',
      });
    }
  };

  // Toggle favorite suggestion
  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('outfit_suggestions')
        .update({ is_favorite: isFavorite })
        .eq('id', id);

      if (error) throw error;

      setSuggestions(prev => 
        prev.map(s => s.id === id ? { ...s, isFavorite } : s)
      );
      
      toast({
        title: isFavorite ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد',
        description: isFavorite ? 'این ست در لیست علاقه‌مندی‌های شماست' : 'ست از علاقه‌مندی‌ها حذف شد',
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی پیش آمد',
        variant: 'destructive',
      });
    }
  };

  // Delete suggestion
  const deleteSuggestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('outfit_suggestions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.id !== id));
      
      toast({
        title: 'پیشنهاد حذف شد',
        description: 'ست از لیست پیشنهادات حذف شد',
      });
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در حذف پیشنهاد پیش آمد',
        variant: 'destructive',
      });
    }
  };

  // Generate outfit suggestion with AI
  const generateSuggestion = async (selectedItems: ClothingItem[]) => {
    if (!userId) {
      toast({
        title: 'خطا',
        description: 'لطفا ابتدا وارد شوید',
        variant: 'destructive',
      });
      return;
    }

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

      const newSuggestion: OutfitSuggestion = {
        id: savedSuggestion.id,
        items: itemsForSuggestion,
        suggestionText: data.suggestion,
        isFavorite: false,
        createdAt: new Date(savedSuggestion.created_at),
      };

      setSuggestions(prev => [newSuggestion, ...prev]);
      
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
    
    if (userId && newProfile.imageUrl) {
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

  // Get favorite suggestions
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
