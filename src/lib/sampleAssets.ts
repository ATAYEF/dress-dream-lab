/**
 * Always-available sample product images (no external CDN).
 * - Real PNGs from /src/assets for core samples
 * - SVG data-URLs generated in-app for extra catalog variety
 */

/** Build a fashion product card SVG as data URL (works offline, never expires). */
export function productSvg(options: {
  label: string;
  color: string;
  accent?: string;
  category: 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'accessories';
}): string {
  const { label, color, accent = '#f5c451', category } = options;
  const safeLabel = label.replace(/[<>&]/g, '');

  const silhouette = (() => {
    switch (category) {
      case 'tops':
        return `
          <path d="M70 95 L95 70 L125 78 L145 70 L170 95 L155 110 L145 100 L145 175 L95 175 L95 100 L85 110 Z"
            fill="${color}" stroke="#1a1a1a22" stroke-width="2"/>
          <ellipse cx="120" cy="78" rx="18" ry="10" fill="${color}" opacity="0.85"/>`;
      case 'bottoms':
        return `
          <path d="M95 70 H145 V110 L155 200 H125 L120 120 L115 200 H85 L95 110 Z"
            fill="${color}" stroke="#1a1a1a22" stroke-width="2"/>`;
      case 'dresses':
        return `
          <path d="M100 55 L120 48 L140 55 L148 75 L140 85 V100 L165 200 H75 L100 100 V85 L92 75 Z"
            fill="${color}" stroke="#1a1a1a22" stroke-width="2"/>
          <circle cx="120" cy="48" r="8" fill="${color}" opacity="0.9"/>`;
      case 'outerwear':
        return `
          <path d="M65 90 L95 65 L120 72 L145 65 L175 90 L160 110 L150 100 V190 H90 V100 L80 110 Z"
            fill="${color}" stroke="#1a1a1a22" stroke-width="2"/>
          <path d="M120 72 V190" stroke="#ffffff55" stroke-width="3"/>`;
      case 'shoes':
        return `
          <path d="M60 150 Q90 130 140 140 L175 145 Q185 148 180 160 L70 165 Q55 162 60 150 Z"
            fill="${color}" stroke="#1a1a1a22" stroke-width="2"/>
          <path d="M140 140 L155 120" stroke="${color}" stroke-width="8" stroke-linecap="round"/>`;
      case 'accessories':
      default:
        return `
          <rect x="75" y="90" width="90" height="70" rx="12" fill="${color}" stroke="#1a1a1a22" stroke-width="2"/>
          <path d="M95 90 Q120 60 145 90" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
          <circle cx="120" cy="125" r="10" fill="${accent}"/>`;
    }
  })();

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="600" viewBox="0 0 240 300">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#faf8f5"/>
      <stop offset="100%" stop-color="#f0ebe3"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#00000018"/>
    </filter>
  </defs>
  <rect width="240" height="300" rx="24" fill="url(#bg)"/>
  <circle cx="200" cy="40" r="50" fill="${accent}" opacity="0.12"/>
  <circle cx="30" cy="260" r="40" fill="${color}" opacity="0.1"/>
  <g filter="url(#shadow)" transform="translate(0,10)">
    ${silhouette}
  </g>
  <rect x="24" y="248" width="192" height="32" rx="10" fill="#ffffffcc"/>
  <text x="120" y="268" text-anchor="middle" font-family="Tahoma,Arial,sans-serif"
    font-size="11" font-weight="700" fill="#3d3429">${safeLabel}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Palette helpers */
export const SAMPLE_COLORS = {
  pink: '#f9a8d4',
  cream: '#f5e6c8',
  black: '#1f2937',
  navy: '#1e3a5f',
  denim: '#3b82f6',
  beige: '#d4a574',
  white: '#f8fafc',
  red: '#dc2626',
  green: '#059669',
  gold: '#d97706',
  brown: '#92400e',
  gray: '#6b7280',
  rose: '#e11d48',
  sky: '#0ea5e9',
  purple: '#7c3aed',
} as const;
