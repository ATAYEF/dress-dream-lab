import React, { useCallback, useRef } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  currentImage?: string | null;
  onRemove?: () => void;
  label?: string;
  className?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onFileSelect,
  currentImage,
  onRemove,
  label = 'آپلود تصویر',
  className,
  aspectRatio = 'square',
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('لطفا یک فایل تصویری انتخاب کنید');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('حجم فایل نباید بیشتر از ۱۰ مگابایت باشد');
        return;
      }
      onFileSelect(file);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (disabled) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size <= 10 * 1024 * 1024) {
        onFileSelect(file);
      } else {
        alert('حجم فایل نباید بیشتر از ۱۰ مگابایت باشد');
      }
    }
  }, [onFileSelect, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  }, []);

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  return (
    <div className={cn('relative group', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        id={`image-upload-${label}`}
      />
      
      {currentImage ? (
        <div className={cn('relative overflow-hidden rounded-xl', aspectClasses[aspectRatio])}>
          <img
            src={currentImage}
            alt={label}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300" />
          {onRemove && !disabled && (
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 p-2 bg-background/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {!disabled && (
            <label
              htmlFor={`image-upload-${label}`}
              className="absolute bottom-2 left-2 right-2 py-2 px-3 bg-background/90 rounded-lg text-center text-sm cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background"
            >
              تغییر تصویر
            </label>
          )}
        </div>
      ) : (
        <label
          htmlFor={`image-upload-${label}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl cursor-pointer transition-all duration-300 hover:border-gold hover:bg-cream-dark/50 group',
            aspectClasses[aspectRatio],
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex flex-col items-center gap-3 p-6 text-muted-foreground group-hover:text-foreground transition-colors duration-300">
            <div className="flex gap-2">
              <div className="p-4 bg-cream rounded-full group-hover:bg-gold/20 transition-colors duration-300">
                <Upload className="w-6 h-6" />
              </div>
              <div className="p-4 bg-cream rounded-full group-hover:bg-gold/20 transition-colors duration-300">
                <Camera className="w-6 h-6" />
              </div>
            </div>
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-muted-foreground text-center">
              PNG, JPG تا ۱۰ مگابایت
              <br />
              یا از دوربین عکس بگیرید
            </span>
          </div>
        </label>
      )}
    </div>
  );
};
