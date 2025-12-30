import React, { useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void;
  currentImage?: string | null;
  onRemove?: () => void;
  label?: string;
  className?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  currentImage,
  onRemove,
  label = 'آپلود تصویر',
  className,
  aspectRatio = 'square',
}) => {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  return (
    <div className={cn('relative group', className)}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id={`image-upload-${label}`}
      />
      
      {currentImage ? (
        <div className={cn('relative overflow-hidden rounded-xl', aspectClasses[aspectRatio])}>
          <img
            src={currentImage}
            alt={label}
            className="w-full h-full object-cover transition-smooth group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-smooth" />
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 p-2 bg-background/90 rounded-full opacity-0 group-hover:opacity-100 transition-smooth hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <label
            htmlFor={`image-upload-${label}`}
            className="absolute bottom-2 left-2 right-2 py-2 px-3 bg-background/90 rounded-lg text-center text-sm cursor-pointer opacity-0 group-hover:opacity-100 transition-smooth hover:bg-background"
          >
            تغییر تصویر
          </label>
        </div>
      ) : (
        <label
          htmlFor={`image-upload-${label}`}
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl cursor-pointer transition-smooth hover:border-gold hover:bg-cream-dark/50 group',
            aspectClasses[aspectRatio]
          )}
        >
          <div className="flex flex-col items-center gap-3 p-6 text-muted-foreground group-hover:text-foreground transition-smooth">
            <div className="p-4 bg-cream rounded-full group-hover:bg-gold/20 transition-smooth">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">PNG, JPG تا 10MB</span>
          </div>
        </label>
      )}
    </div>
  );
};
