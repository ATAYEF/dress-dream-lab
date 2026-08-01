import React from 'react';
import {
  Shirt,
  CircleDot,
  Sparkles,
  Sun,
  Footprints,
  Watch,
  Crown,
} from 'lucide-react';
import { ClothingCategory } from '@/types/wardrobe';

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
    icon: Crown,
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
    icon: CircleDot,
    colorToken: 'rose',
    hexFrom: ROSE.hexFrom,
    hexTo: ROSE.hexTo,
  },
  dresses: {
    key: 'dresses',
    label: 'لباس یکسره',
    icon: Sparkles,
    colorToken: 'gold-light',
    hexFrom: GOLD_LIGHT.hexFrom,
    hexTo: GOLD_LIGHT.hexTo,
  },
  outerwear: {
    key: 'outerwear',
    label: 'ژاکت و کت',
    icon: Sun,
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
