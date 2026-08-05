import React from 'react';
import {
  Shirt,
  Footprints,
  Watch,
  LayoutGrid,
} from 'lucide-react';
import { ClothingCategory } from '@/types/wardrobe';

/** Minimal category glyphs that read clearly at small sizes */
const PantsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {/* waistband */}
    <path d="M7 4h10v3H7z" />
    {/* legs */}
    <path d="M7 7l-1.5 13h5.5l1-8 1 8h5.5L17 7" />
  </svg>
);

const DressIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {/* neckline */}
    <path d="M9 4h6" />
    {/* bodice */}
    <path d="M9 4c0 2.5-1 4-2.5 5.5L4 20h16l-2.5-10.5C16 8 15 6.5 15 4" />
    {/* waist accent */}
    <path d="M8.5 11h7" />
  </svg>
);

const JacketIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {/* body + open front */}
    <path d="M8 5l-4 4v11h5v-7h2v7h5V9l-4-4" />
    {/* collar */}
    <path d="M8 5c1.5 1.5 2.5 2 4 2s2.5-.5 4-2" />
    {/* lapel line */}
    <path d="M12 7v5" />
  </svg>
);

export interface CategoryDefinition {
  key: ClothingCategory | 'all';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorToken:
    | 'gold'
    | 'gold-light'
    | 'rose'
    | 'espresso'
    | 'sage'
    | 'lavender'
    | 'all';
  hexFrom: string;
  hexTo: string;
}

const GOLD = { hexFrom: '#f5c451', hexTo: '#c9912a', token: 'gold' as const };
const ROSE = { hexFrom: '#e99aae', hexTo: '#c9778c', token: 'rose' as const };
const GOLD_LIGHT = { hexFrom: '#eccd8a', hexTo: '#d1b06a', token: 'gold-light' as const };
const ESPRESSO = { hexFrom: '#5c4a3a', hexTo: '#3f3126', token: 'espresso' as const };
const SAGE = { hexFrom: '#b8c9bd', hexTo: '#8faaa0', token: 'sage' as const };
const LAVENDER = { hexFrom: '#d8d0e6', hexTo: '#b3a9c9', token: 'lavender' as const };

export const CATEGORY_CONFIG: Record<ClothingCategory | 'all', CategoryDefinition> = {
  all: {
    key: 'all',
    label: 'همه',
    icon: LayoutGrid,
    colorToken: 'all',
    hexFrom: '#f5c451',
    hexTo: '#c9912a',
  },
  tops: {
    key: 'tops',
    label: 'بالاتنه',
    icon: Shirt,
    colorToken: 'gold',
    hexFrom: GOLD.hexFrom,
    hexTo: GOLD.hexTo,
  },
  bottoms: {
    key: 'bottoms',
    label: 'پایین‌تنه',
    icon: PantsIcon,
    colorToken: 'rose',
    hexFrom: ROSE.hexFrom,
    hexTo: ROSE.hexTo,
  },
  dresses: {
    key: 'dresses',
    label: 'لباس یکسره',
    icon: DressIcon,
    colorToken: 'gold-light',
    hexFrom: GOLD_LIGHT.hexFrom,
    hexTo: GOLD_LIGHT.hexTo,
  },
  outerwear: {
    key: 'outerwear',
    label: 'ژاکت و کت',
    icon: JacketIcon,
    colorToken: 'espresso',
    hexFrom: ESPRESSO.hexFrom,
    hexTo: ESPRESSO.hexTo,
  },
  shoes: {
    key: 'shoes',
    label: 'کفش',
    icon: Footprints,
    colorToken: 'sage',
    hexFrom: SAGE.hexFrom,
    hexTo: SAGE.hexTo,
  },
  accessories: {
    key: 'accessories',
    label: 'اکسسوری',
    icon: Watch,
    colorToken: 'lavender',
    hexFrom: LAVENDER.hexFrom,
    hexTo: LAVENDER.hexTo,
  },
};

export const CATEGORY_ORDER: (ClothingCategory | 'all')[] = [
  'all',
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
];

export const CATEGORY_CLOTHING_ORDER: ClothingCategory[] = [
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
];
