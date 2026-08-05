import React from 'react';
import {
  Shirt,
  Footprints,
  Watch,
  LayoutGrid,
} from 'lucide-react';
import { ClothingCategory } from '@/types/wardrobe';

const svgBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.85,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  width: 24,
  height: 24,
  'aria-hidden': true,
};

/** شلوار / پایین‌تنه — no JSX (this file is .ts) */
const PantsIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement(
    'svg',
    { className, ...svgBase },
    React.createElement('path', { d: 'M8 3h8v3.5H8z' }),
    React.createElement('path', { d: 'M8 6.5 6.2 21h4.6l1.2-9.5 1.2 9.5h4.6L16 6.5' })
  );

/** لباس یکسره */
const DressIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement(
    'svg',
    { className, ...svgBase },
    React.createElement('path', { d: 'M9 3.5h6' }),
    React.createElement('path', {
      d: 'M9 3.5c0 2.2-1.2 3.8-2.8 5.2L3.5 20.5h17l-2.7-11.8C16.2 7.3 15 5.7 15 3.5',
    }),
    React.createElement('path', { d: 'M9 11h6' })
  );

/** ژاکت و کت */
const JacketIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement(
    'svg',
    { className, ...svgBase },
    React.createElement('path', { d: 'M8.5 4.5 4 9v11.5h5V13h2v7.5h5V9l-4.5-4.5' }),
    React.createElement('path', { d: 'M8.5 4.5C10 6 11 6.5 12 6.5s2-.5 3.5-2' }),
    React.createElement('path', { d: 'M12 6.5v5' })
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
