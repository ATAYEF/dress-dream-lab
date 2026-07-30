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
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
    // Reset inputs
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
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

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  const uniqueId = label.replace(/\s+/g, '-');

  return (
    <div className={cn('relative group', className)}>
      {/* Gallery Input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        id={`gallery-upload-${uniqueId}`}
      />
      
      {/* Camera Input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        id={`camera-upload-${uniqueId}`}
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
            <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <label
                htmlFor={`gallery-upload-${uniqueId}`}
                className="flex-1 py-2 px-3 bg-background/90 rounded-lg text-center text-sm cursor-pointer hover:bg-background flex items-center justify-center gap-1"
              >
                <Upload className="w-3 h-3" />
                گالری
              </label>
              <label
                htmlFor={`camera-upload-${uniqueId}`}
                className="flex-1 py-2 px-3 bg-background/90 rounded-lg text-center text-sm cursor-pointer hover:bg-background flex items-center justify-center gap-1"
              >
                <Camera className="w-3 h-3" />
                دوربین
              </label>
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl transition-all duration-300 hover:border-gold hover:bg-cream-dark/50',
            aspectClasses[aspectRatio],
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex flex-col items-center gap-3 p-6 text-muted-foreground transition-colors duration-300">
            <div className="flex gap-3">
              <label
                htmlFor={`gallery-upload-${uniqueId}`}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 bg-cream rounded-xl cursor-pointer hover:bg-gold/20 transition-colors duration-300',
                  disabled && 'pointer-events-none'
                )}
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs font-medium">گالری</span>
              </label>
              <label
                htmlFor={`camera-upload-${uniqueId}`}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 bg-cream rounded-xl cursor-pointer hover:bg-gold/20 transition-colors duration-300',
                  disabled && 'pointer-events-none'
                )}
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs font-medium">دوربین</span>
              </label>
            </div>
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-muted-foreground text-center">
              PNG, JPG تا ۱۰ مگابایت
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
