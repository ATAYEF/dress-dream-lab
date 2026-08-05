# معماری فرانت‌اند استایلر

## ساختار پیشنهادی (در حال مهاجرت تدریجی)

```
src/
  components/
    ui/           # primitives شاد‌سی‌ان (دکمه، دیالوگ، …)
    shared/       # کامپوننت‌های مشترک بین فیچرها (SegmentedControl, FilterChip)
    features/
      closet/     # کمد لباس
      tryon/      # ست‌ساز و پرو
      upload/     # آپلود و برش تصویر
    *.tsx         # فایل‌های فعلی (هنوز در ریشه؛ barrelها از آن‌ها re-export می‌کنند)
  hooks/
  lib/
  pages/
  types/
```

## نحوه استفاده

```ts
import { ClothingCard, EmptyState } from '@/components/features/closet';
import { OutfitBuilder } from '@/components/features/tryon';
import { SegmentedControl, FilterChip } from '@/components/shared';
```

## قوانین

1. کامپوننت‌های UI خام فقط در `ui/`
2. منطق دامنه در `lib/` و `hooks/`
3. فیچرهای جدید را در `features/<name>/` بسازید و از barrel export کنید
4. مهاجرت فایل‌های قدیمی به پوشه فیچر به‌صورت تدریجی انجام شود تا importها نشکنند
