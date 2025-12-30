import React from 'react';
import { Shirt, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddClick }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center" dir="rtl">
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-cream rounded-full flex items-center justify-center animate-float">
          <Shirt className="w-10 h-10 text-gold" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-gold rounded-full flex items-center justify-center shadow-glow">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>
      
      <h3 className="text-xl font-display font-semibold mb-2">
        کمد لباس شما خالی است
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        برای شروع، لباس‌های خود را اضافه کنید تا بتوانیم بهترین ست‌ها را برایتان پیشنهاد دهیم
      </p>
      
      <Button onClick={onAddClick} variant="gold" size="lg">
        <Plus className="w-5 h-5" />
        <span>اولین لباس را اضافه کنید</span>
      </Button>
    </div>
  );
};
