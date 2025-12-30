import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from './ImageUploader';
import { ClothingCategory, ClothingItem } from '@/types/wardrobe';
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
  const [imageUrl, setImageUrl] = useState<string>('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('tops');

  const handleSubmit = () => {
    if (imageUrl && name) {
      onAdd({
        name,
        category,
        imageUrl,
      });
      setImageUrl('');
      setName('');
      setCategory('tops');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-background rounded-2xl shadow-elevated p-6 animate-scale-in" dir="rtl">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 hover:bg-muted rounded-full transition-smooth"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-display font-semibold mb-6">افزودن لباس جدید</h2>

        <div className="space-y-5">
          <ImageUploader
            onImageUpload={setImageUrl}
            currentImage={imageUrl}
            onRemove={() => setImageUrl('')}
            label="عکس لباس"
            aspectRatio="square"
          />

          <div>
            <label className="block text-sm font-medium mb-2">نام لباس</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: پیراهن آبی"
              className="w-full px-4 py-3 bg-cream border border-border rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent outline-none transition-smooth"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">دسته‌بندی</label>
            <div className="grid grid-cols-3 gap-2">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    'py-2.5 px-3 rounded-xl text-sm font-medium transition-smooth',
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
            disabled={!imageUrl || !name}
            variant="gold"
            size="lg"
            className="w-full mt-4"
          >
            افزودن به کمد
          </Button>
        </div>
      </div>
    </div>
  );
};
