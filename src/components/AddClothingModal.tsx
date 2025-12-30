import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from './ImageUploader';
import { ClothingCategory, ClothingItem } from '@/types/wardrobe';
import { uploadClothingImage, compressImage } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AddClothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<ClothingItem, 'id' | 'createdAt'>) => void;
}

const categoryOptions: { id: ClothingCategory; label: string }[] = [
  { id: 'tops', label: 'بالاتنه' },
  { id: 'bottoms', label: 'پایین‌تنه' },
  { id: 'dresses', label: 'لباس یکسره' },
  { id: 'outerwear', label: 'ژاکت و کت' },
  { id: 'shoes', label: 'کفش' },
  { id: 'accessories', label: 'اکسسوری' },
];

export const AddClothingModal: React.FC<AddClothingModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('tops');
  const [color, setColor] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!imageFile || !name || !userId) {
      toast({
        title: 'خطا',
        description: 'لطفا تصویر و نام لباس را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Compress the image
      const compressedBlob = await compressImage(imageFile);
      const compressedFile = new File([compressedBlob], imageFile.name, {
        type: 'image/jpeg',
      });

      // Upload to storage
      const imageUrl = await uploadClothingImage(compressedFile, userId);

      // Add the clothing item
      onAdd({
        name,
        category,
        imageUrl,
        color: color || undefined,
      });

      // Reset form
      setImageFile(null);
      setImagePreview('');
      setName('');
      setCategory('tops');
      setColor('');
      onClose();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'مشکلی در آپلود تصویر پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setImageFile(null);
      setImagePreview('');
      setName('');
      setCategory('tops');
      setColor('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-background rounded-2xl shadow-elevated p-6 animate-scale-in max-h-[90vh] overflow-y-auto" dir="rtl">
        <button
          onClick={handleClose}
          disabled={isUploading}
          className="absolute top-4 left-4 p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-display font-semibold mb-6">افزودن لباس جدید</h2>

        <div className="space-y-5">
          <ImageUploader
            onFileSelect={handleImageSelect}
            currentImage={imagePreview}
            onRemove={() => {
              setImageFile(null);
              setImagePreview('');
            }}
            label="عکس لباس"
            aspectRatio="square"
            disabled={isUploading}
          />

          <div>
            <label className="block text-sm font-medium mb-2">نام لباس</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: پیراهن آبی"
              disabled={isUploading}
              className="w-full px-4 py-3 bg-cream border border-border rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent outline-none transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">رنگ (اختیاری)</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="مثال: آبی نفتی"
              disabled={isUploading}
              className="w-full px-4 py-3 bg-cream border border-border rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent outline-none transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">دسته‌بندی</label>
            <div className="grid grid-cols-3 gap-2">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  disabled={isUploading}
                  className={cn(
                    'py-2.5 px-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50',
                    category === cat.id
                      ? 'bg-foreground text-background'
                      : 'bg-cream hover:bg-cream-dark'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!imageFile || !name || isUploading}
            variant="gold"
            size="lg"
            className="w-full mt-4"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال آپلود...</span>
              </>
            ) : (
              'افزودن به کمد'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
