import { ClothingItem } from '@/types/wardrobe';

import whiteShirt from '@/assets/sample-top-white-shirt.png';
import blackSweater from '@/assets/sample-top-black-sweater.png';
import jeans from '@/assets/sample-bottom-jeans.png';
import skirt from '@/assets/sample-bottom-skirt.png';
import navyDress from '@/assets/sample-dress-navy.png';
import trench from '@/assets/sample-outer-trench.png';
import sneakers from '@/assets/shoes-sneakers.png';
import heels from '@/assets/shoes-heels.png';
import beltBrown from '@/assets/belt-brown.png';
import bagTote from '@/assets/bag-tote.png';

const AI_IMG = (prompt: string) =>
  `https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`;

const base = (
  id: string,
  name: string,
  category: ClothingItem['category'],
  imageUrl: string,
  color: string,
  tags?: string[],
): ClothingItem => ({
  id: `sample-${id}`,
  name,
  category,
  imageUrl,
  color,
  tags,
  createdAt: new Date(),
});

/** Demo wardrobe shown to guest users so they can test the mannequin right away. */
export const SAMPLE_CLOTHES: ClothingItem[] = [
  // ===== Tops (بالایی) =====
  base('top-shirt', 'پیراهن سفید (نمونه)', 'tops', whiteShirt, 'سفید'),
  base('top-sweater', 'پلیور مشکی (نمونه)', 'tops', blackSweater, 'مشکی'),
  base(
    'ai-top-blouse-pink',
    'بلوز ساتن صورتی (AI)',
    'tops',
    AI_IMG(
      'product photography of elegant light pink satin blouse on mannequin, soft studio lighting, clean white background, luxury fashion e-commerce, silky texture, buttoned front, long sleeves, professional catalog photo, hyper realistic, high detail'
    ),
    'صورتی',
    ['AI', 'جدید', 'لوکس']
  ),
  base(
    'ai-top-knit-cream',
    'ژاکت بافتنی کرم (AI)',
    'tops',
    AI_IMG(
      'product photography of cozy cream cable knit sweater on mannequin, soft studio lighting, white background, fashion e-commerce, chunky wool texture, round neck, oversized fit, warm autumn winter knitwear, professional catalog photo, high detail'
    ),
    'کرم',
    ['AI', 'زمستانه', 'بافتنی']
  ),
  base(
    'ai-top-leather-black',
    'شومیز چرم مشکی (AI)',
    'tops',
    AI_IMG(
      'product photography of black genuine leather button up shirt on female mannequin, dramatic studio lighting, crisp white background, luxury fashion, biker style, shiny leather texture, long sleeves, professional e-commerce catalog, hyper realistic'
    ),
    'مشکی',
    ['AI', 'چرم', 'شیک']
  ),

  // ===== Bottoms (پایینی) =====
  base('bottom-jeans', 'شلوار جین آبی (نمونه)', 'bottoms', jeans, 'آبی'),
  base('bottom-skirt', 'دامن پلیسه کرم (نمونه)', 'bottoms', skirt, 'کرم'),
  base(
    'ai-bottom-leatherpants',
    'شلوار چرم مشکی (AI)',
    'bottoms',
    AI_IMG(
      'product photography of high waisted black leather pants on mannequin legs, soft studio lighting, white background, fashion e-commerce, skinny fit, shiny genuine leather texture, professional catalog photo, luxury style, hyper realistic'
    ),
    'مشکی',
    ['AI', 'چرم', 'شب']
  ),
  base(
    'ai-bottom-midiskirt-navy',
    'دامن میدی سرمه‌ای (AI)',
    'bottoms',
    AI_IMG(
      'product photography of elegant pleated navy midi skirt on mannequin, soft studio lighting, clean white background, fashion e-commerce, silky flowy fabric, navy blue color, A-line shape, professional catalog, hyper realistic, feminine style'
    ),
    'سرمه‌ای',
    ['AI', 'اداری', 'شیک']
  ),
  base(
    'ai-bottom-trousers-beige',
    'شلوار کتان بژ (AI)',
    'bottoms',
    AI_IMG(
      'product photography of wide leg beige linen trousers on mannequin, soft studio lighting, white background, fashion e-commerce, summer casual style, natural linen fabric texture, high waist, professional catalog photo, high detail'
    ),
    'بژ',
    ['AI', 'تابستانه', 'کتان']
  ),

  // ===== Dresses (لباس مجلسی) =====
  base('dress-navy', 'پیراهن مجلسی سرمه‌ای (نمونه)', 'dresses', navyDress, 'سرمه‌ای'),
  base(
    'ai-dress-evening-red',
    'لباس مجلسی ساتن قرمز (AI)',
    'dresses',
    AI_IMG(
      'product photography of stunning red satin evening gown on female mannequin, dramatic studio lighting, clean white background, luxury fashion e-commerce, silk satin fabric, cowl neckline, mermaid fit, floor length, glamorous red carpet style, hyper realistic'
    ),
    'قرمز',
    ['AI', 'شب', 'مجلسی']
  ),
  base(
    'ai-dress-floral-maxi',
    'لباس ماکسی گلدار (AI)',
    'dresses',
    AI_IMG(
      'product photography of bohemian floral maxi dress on mannequin, soft natural lighting, white background, fashion e-commerce, flowy chiffon fabric, summer flowers print, spaghetti straps, tiered skirt, romantic boho style, high detail, professional catalog'
    ),
    'گل‌های رنگی',
    ['AI', 'تابستانه', 'بوهم']
  ),
  base(
    'ai-dress-cocktail-black',
    'لباس راکت مشکی (AI)',
    'dresses',
    AI_IMG(
      'product photography of elegant little black cocktail dress on mannequin, glamorous studio lighting, white background, luxury fashion e-commerce, off shoulder, above knee length, crepe fabric, classic timeless style, professional catalog photo, hyper realistic'
    ),
    'مشکی',
    ['AI', 'مجلسی', 'کلاسیک']
  ),

  // ===== Outerwear (لباس بیرونی) =====
  base('outer-trench', 'ترنچ کت بژ (نمونه)', 'outerwear', trench, 'بژ'),
  base(
    'ai-outer-puffer-gray',
    'کاپشن پفری طوسی (AI)',
    'outerwear',
    AI_IMG(
      'product photography of modern gray puffer jacket on mannequin, soft studio lighting, clean white background, fashion e-commerce, quilted down winter coat, hooded, zip up front, warm outdoor style, professional catalog photo, high detail, winter outerwear'
    ),
    'طوسی',
    ['AI', 'زمستانه', 'اورجینال']
  ),
  base(
    'ai-outer-leather-brown',
    'کت چرم قهوه‌ای (AI)',
    'outerwear',
    AI_IMG(
      'product photography of vintage brown leather biker jacket on mannequin, dramatic lighting, white background, luxury fashion e-commerce, genuine worn leather texture, zipper details, lapel collar, motorcycle style, professional catalog, hyper realistic'
    ),
    'قهوه‌ای',
    ['AI', 'چرم', 'بایکر']
  ),
  base(
    'ai-outer-blazer-navy',
    'بلیزر رسمی سرمه‌ای (AI)',
    'outerwear',
    AI_IMG(
      'product photography of tailored navy blue double breasted blazer on mannequin, soft studio lighting, clean white background, fashion e-commerce, wool blend fabric, structured shoulders, gold buttons, professional business style, hyper realistic high detail'
    ),
    'سرمه‌ای',
    ['AI', 'اداری', 'رسمی']
  ),

  // ===== Shoes (کفش) =====
  base('shoes-sneakers', 'کتانی سفید (نمونه)', 'shoes', sneakers, 'سفید'),
  base('shoes-heels', 'کفش پاشنه‌دار (نمونه)', 'shoes', heels, 'مشکی'),
  base(
    'ai-shoes-boots-brown',
    'بوت چرم قهوه‌ای (AI)',
    'shoes',
    AI_IMG(
      'product photography of elegant tan brown leather ankle boots on white display stand, soft studio lighting, white background, luxury footwear e-commerce, side zipper, block heel, cowboy western style, genuine leather texture, professional catalog photo, hyper realistic'
    ),
    'قهوه‌ای',
    ['AI', 'چرم', 'زمستانه']
  ),
  base(
    'ai-shoes-sandals-gold',
    'صندل پاشنه‌دار طلایی (AI)',
    'shoes',
    AI_IMG(
      'product photography of glamorous gold metallic strappy high heel sandals on white display, dramatic studio lighting, white background, luxury footwear e-commerce, stiletto heel, ankle strap, shiny gold finish, party wedding shoes, professional catalog, hyper realistic'
    ),
    'طلایی',
    ['AI', 'شب', 'مجلسی']
  ),
  base(
    'ai-shoes-loafers-green',
    'کفش رافی سبز (AI)',
    'shoes',
    AI_IMG(
      'product photography of emerald green velvet loafers on white display, soft studio lighting, clean background, luxury footwear e-commerce, gold horsebit detail, elegant womens shoes, velvet texture, professional catalog photo, high detail'
    ),
    'سبز زمردی',
    ['AI', 'لوکس', 'اداری']
  ),

  // ===== Accessories (اکسسوری) =====
  base('acc-belt', 'کمربند چرم قهوه‌ای (نمونه)', 'accessories', beltBrown, 'قهوه‌ای'),
  base('acc-bag', 'کیف دوشی (نمونه)', 'accessories', bagTote, 'قهوه‌ای'),
  base(
    'ai-acc-hat-wool-beige',
    'کلاه پشمی فدوره‌ای (AI)',
    'accessories',
    AI_IMG(
      'product photography of elegant beige wool fedora hat on white display stand, soft studio lighting, white background, luxury accessories e-commerce, felt wool texture, grosgrain ribbon band, classic vintage style, professional catalog photo, hyper realistic'
    ),
    'بژ',
    ['AI', 'پشمی', 'کلاسیک']
  ),
  base(
    'ai-acc-sunglasses-black',
    'عینک آفتابی کات‌ای مشکی (AI)',
    'accessories',
    AI_IMG(
      'product photography of luxury black cat eye sunglasses on white display, dramatic studio lighting, clean white background, fashion accessories e-commerce, glossy black acetate frame, dark gradient lenses, gold logo detail, elegant womens style, professional catalog photo, high detail'
    ),
    'مشکی',
    ['AI', 'تابستانه', 'لوکس']
  ),
  base(
    'ai-acc-bag-handbag-red',
    'کیف دستی چرم قرمز (AI)',
    'accessories',
    AI_IMG(
      'product photography of luxury red leather designer handbag on white display, soft studio lighting, clean white background, luxury accessories e-commerce, structured top handle bag, gold hardware, premium calfskin texture, elegant designer style, professional catalog photo, hyper realistic'
    ),
    'قرمز',
    ['AI', 'چرم', 'طراح']
  ),
  base(
    'ai-acc-scarf-silk-blue',
    'شال ساتن آبی (AI)',
    'accessories',
    AI_IMG(
      'product photography of luxurious royal blue silk scarf artistically draped, soft studio lighting, white background, fashion accessories e-commerce, hand painted floral print, silky satin texture, elegant neck scarf, high detail, professional catalog photo'
    ),
    'آبی',
    ['AI', 'ساتن', 'شیک']
  ),
];
