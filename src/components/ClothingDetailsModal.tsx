import { CalendarDays, Palette, Pencil, Shirt, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClothingCategory, ClothingItem } from '@/types/wardrobe';

interface ClothingDetailsModalProps {
  item: ClothingItem | null;
  onClose: () => void;
  onEdit: (item: ClothingItem) => void;
  onDelete: (item: ClothingItem) => void;
}

const categoryLabels: Record<ClothingCategory, string> = {
  tops: 'بالاتنه',
  bottoms: 'پایین‌تنه',
  dresses: 'لباس یکسره',
  outerwear: 'ژاکت و کت',
  shoes: 'کفش',
  accessories: 'اکسسوری',
};

export function ClothingDetailsModal({
  item,
  onClose,
  onEdit,
  onDelete,
}: ClothingDetailsModalProps) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      {item && (
        <DialogContent dir="rtl" className="max-h-[92vh] max-w-2xl overflow-y-auto p-0 sm:rounded-3xl">
          <div className="grid md:grid-cols-[1.05fr_1fr]">
            <div className="aspect-square overflow-hidden bg-muted md:aspect-auto md:min-h-[430px]">
              <img
                src={item.imageUrl}
                alt={`تصویر ${item.name}`}
                className="size-full object-cover"
              />
            </div>

            <div className="flex flex-col gap-6 p-6 sm:p-8">
              <DialogHeader className="gap-2 text-right sm:text-right">
                <Badge variant="secondary" className="w-fit">
                  {categoryLabels[item.category]}
                </Badge>
                <DialogTitle className="text-balance font-display text-2xl font-black leading-relaxed">
                  {item.name}
                </DialogTitle>
                <DialogDescription>جزئیات لباس ثبت‌شده در کمد شما</DialogDescription>
              </DialogHeader>

              <dl className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/60 p-4">
                  <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shirt aria-hidden="true" />
                    دسته‌بندی
                  </dt>
                  <dd className="text-sm font-bold">{categoryLabels[item.category]}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/60 p-4">
                  <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Palette aria-hidden="true" />
                    رنگ
                  </dt>
                  <dd className="text-sm font-bold">{item.color || 'ثبت نشده'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/60 p-4">
                  <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays aria-hidden="true" />
                    تاریخ ثبت
                  </dt>
                  <dd className="text-sm font-bold">
                    {new Date(item.createdAt).toLocaleDateString('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>

              <DialogFooter className="mt-auto flex-row gap-2 sm:justify-start">
                <Button variant="gold" className="flex-1" onClick={() => onEdit(item)}>
                  <Pencil data-icon="inline-start" aria-hidden="true" />
                  ویرایش لباس
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => onDelete(item)}>
                  <Trash2 data-icon="inline-start" aria-hidden="true" />
                  حذف
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
