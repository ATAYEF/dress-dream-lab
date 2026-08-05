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
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  width: 24,
  height: 24,
  'aria-hidden': true,
};

/** شلوار / پایین‌تنه */
const PantsIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement(
    'svg',
    { className, ...svgBase },
    // waistband
    React.createElement('path', { d: 'M7 3.5h10v2.5H7z' }),
    // left leg
    React.createElement('path', { d: 'M7 6v14.5h4.2V12.5' }),
    // right leg
    React.createElement('path', { d: 'M17 6v14.5h-4.2V12.5' }),
    // crotch
    React.createElement('path', { d: 'M11.2 12.5h1.6' })
  );

/** لباس یکسره — silhouette روشن پیراهن زنانه */
const DressIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement(
    'svg',
    { className, ...svgBase },
    // straps / neckline
    React.createElement('path', { d: 'M9 3.5 10.5 7h3L15 3.5' }),
    // bodice
    React.createElement('path', { d: 'M8 7h8v4.5' }),
    React.createElement('path', { d: 'M8 7v4.5' }),
    // A-line skirt
    React.createElement('path', { d: 'M8 11.5 4.5 21h15L16 11.5' })
  );

/** ژاکت و کت — کت با آستین و یقه */
const JacketIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement(
    'svg',
    { className, ...svgBase },
    // left body + sleeve
    React.createElement('path', { d: 'M12 6.5 8 4 4.5 8v12.5h4V13h3' }),
    // right body + sleeve
    React.createElement('path', { d: 'M12 6.5 16 4l3.5 4v12.5h-4V13h-3' }),
    // collar peak
    React.createElement('path', { d: 'M9.5 5.2 12 7.5l2.5-2.3' }),
    // buttons
    React.createElement('circle', { cx: 12, cy: 11, r: 0.7, fill: 'currentColor', stroke: 'none' }),
    React.createElement('circle', { cx: 12, cy: 14.5, r: 0.7, fill: 'currentColor', stroke: 'none' })
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
