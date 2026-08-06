/**
 * Vector product cards for the demo wardrobe.
 * Pure SVG data-URLs — offline, consistent framing, no CDN, no photos.
 * Style: flat fashion vector on warm-white background (catalog grid look).
 */

export type SampleCategory =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'accessories';

export type VectorVariant =
  | 'shirt'
  | 'sweater'
  | 'jeans'
  | 'pants'
  | 'skirt'
  | 'dress'
  | 'trench'
  | 'blazer'
  | 'coat'
  | 'sneakers'
  | 'heels'
  | 'boots'
  | 'loafers'
  | 'belt'
  | 'tote'
  | 'clutch'
  | 'scarf';

/** Fashion palette — soft, retail-friendly */
export const SAMPLE_COLORS = {
  white: '#F4F2EE',
  cream: '#E8D9C0',
  beige: '#C4A574',
  pink: '#E8A0B5',
  sage: '#8FAF9A',
  sky: '#8BB4D4',
  denim: '#4A6FA5',
  navy: '#2C3E5C',
  black: '#2A2A2E',
  charcoal: '#3D3D42',
  red: '#C45C5C',
  brown: '#8B5E3C',
  gold: '#C9A227',
  rose: '#D4848A',
} as const;

function darker(hex: string, amount = 0.18): string {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const f = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v * (1 - amount))))
      .toString(16)
      .padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
}

function lighter(hex: string, amount = 0.25): string {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const f = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + (255 - v) * amount)))
      .toString(16)
      .padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
}

/** Vector garment geometry (viewBox 0 0 240 300, centered) */
function silhouette(variant: VectorVariant, color: string): string {
  const deep = darker(color, 0.22);
  const soft = lighter(color, 0.35);
  const line = '#1a1a1a18';

  switch (variant) {
    case 'shirt':
      return `
        <path d="M78 92 L102 68 L120 76 L138 68 L162 92 L150 108 L142 100 V200 H98 V100 L90 108 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <path d="M110 72 L120 64 L130 72 L126 88 L120 80 L114 88 Z" fill="${soft}"/>
        <line x1="120" y1="88" x2="120" y2="196" stroke="${deep}" stroke-width="1.2" opacity="0.35"/>
        <circle cx="120" cy="110" r="2.2" fill="${deep}" opacity="0.4"/>
        <circle cx="120" cy="130" r="2.2" fill="${deep}" opacity="0.4"/>
        <circle cx="120" cy="150" r="2.2" fill="${deep}" opacity="0.4"/>
        <circle cx="120" cy="170" r="2.2" fill="${deep}" opacity="0.4"/>`;

    case 'sweater':
      return `
        <path d="M72 100 L100 70 L120 78 L140 70 L168 100 L154 118 L146 108 V210 H94 V108 L86 118 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <ellipse cx="120" cy="78" rx="16" ry="9" fill="${soft}"/>
        <ellipse cx="120" cy="82" rx="11" ry="7" fill="#FAF8F5"/>
        <path d="M94 150 H146" stroke="${deep}" stroke-width="1" opacity="0.2"/>
        <path d="M94 170 H146" stroke="${deep}" stroke-width="1" opacity="0.2"/>`;

    case 'jeans':
      return `
        <path d="M92 70 H148 V105 L158 230 H128 L120 130 L112 230 H82 L92 105 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <path d="M92 70 H148 V88 H92 Z" fill="${deep}" opacity="0.25"/>
        <line x1="120" y1="88" x2="120" y2="128" stroke="${deep}" stroke-width="1.2" opacity="0.35"/>
        <circle cx="104" cy="92" r="2" fill="${soft}" opacity="0.7"/>
        <circle cx="136" cy="92" r="2" fill="${soft}" opacity="0.7"/>`;

    case 'pants':
      return `
        <path d="M94 68 H146 V100 L156 235 H128 L120 125 L112 235 H84 L94 100 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <path d="M94 68 H146 V82 H94 Z" fill="${deep}" opacity="0.2"/>
        <line x1="120" y1="82" x2="120" y2="122" stroke="${deep}" stroke-width="1" opacity="0.3"/>`;

    case 'skirt':
      return `
        <path d="M95 78 H145 L165 220 H75 Z" fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <path d="M95 72 H145 V86 H95 Z" fill="${deep}" opacity="0.28"/>
        <path d="M100 100 Q120 108 140 100" fill="none" stroke="${deep}" stroke-width="1" opacity="0.2"/>
        <path d="M92 140 Q120 150 148 140" fill="none" stroke="${deep}" stroke-width="1" opacity="0.15"/>
        <path d="M84 180 Q120 192 156 180" fill="none" stroke="${deep}" stroke-width="1" opacity="0.12"/>`;

    case 'dress':
      return `
        <path d="M100 58 L120 50 L140 58 L150 80 L142 92 V110 L168 230 H72 L98 110 V92 L90 80 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <path d="M110 54 L120 48 L130 54 L126 70 L120 64 L114 70 Z" fill="${soft}"/>
        <path d="M98 110 H142" stroke="${deep}" stroke-width="1.2" opacity="0.25"/>`;

    case 'trench':
      return `
        <path d="M68 95 L98 68 L120 76 L142 68 L172 95 L158 114 L148 104 V215 H92 V104 L82 114 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <line x1="120" y1="76" x2="120" y2="215" stroke="${soft}" stroke-width="2.5" opacity="0.55"/>
        <path d="M88 145 H152" stroke="${deep}" stroke-width="6" stroke-linecap="round" opacity="0.55"/>
        <circle cx="120" cy="145" r="4" fill="${deep}" opacity="0.45"/>
        <path d="M98 68 L120 76 L142 68" fill="none" stroke="${deep}" stroke-width="1.2" opacity="0.3"/>`;

    case 'blazer':
      return `
        <path d="M70 98 L100 70 L120 78 L140 70 L170 98 L156 116 L148 106 V210 H92 V106 L84 116 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <path d="M120 78 L112 115 L120 210" fill="none" stroke="${soft}" stroke-width="1.5" opacity="0.5"/>
        <path d="M120 78 L128 115 L120 210" fill="none" stroke="${soft}" stroke-width="1.5" opacity="0.5"/>
        <path d="M92 155 H110" stroke="${deep}" stroke-width="1" opacity="0.25"/>
        <path d="M130 155 H148" stroke="${deep}" stroke-width="1" opacity="0.25"/>`;

    case 'coat':
      return `
        <path d="M64 92 L98 64 L120 72 L142 64 L176 92 L162 112 L152 102 V230 H88 V102 L78 112 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <line x1="120" y1="72" x2="120" y2="230" stroke="${soft}" stroke-width="2" opacity="0.4"/>
        <path d="M100 64 L120 72 L140 64" fill="none" stroke="${deep}" stroke-width="1.2" opacity="0.3"/>
        <circle cx="120" cy="120" r="2.5" fill="${deep}" opacity="0.35"/>
        <circle cx="120" cy="145" r="2.5" fill="${deep}" opacity="0.35"/>
        <circle cx="120" cy="170" r="2.5" fill="${deep}" opacity="0.35"/>`;

    case 'sneakers':
      return `
        <path d="M55 175 Q90 150 140 158 L185 165 Q198 168 192 185 L70 192 Q50 188 55 175 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <path d="M55 175 Q90 150 140 158 L160 162 L155 175 Z" fill="${soft}" opacity="0.7"/>
        <path d="M70 192 L192 185 Q196 190 190 198 L72 202 Q55 200 70 192 Z" fill="${deep}" opacity="0.35"/>
        <path d="M100 158 L105 175" stroke="${deep}" stroke-width="1.5" opacity="0.3"/>
        <path d="M125 160 L128 176" stroke="${deep}" stroke-width="1.5" opacity="0.3"/>
        <path d="M150 163 L151 178" stroke="${deep}" stroke-width="1.5" opacity="0.3"/>`;

    case 'heels':
      return `
        <path d="M70 150 L150 148 L175 165 L160 175 L150 195 L145 230 L130 230 L128 195 L115 175 L70 168 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <path d="M145 230 L138 255 L132 255 L130 230" fill="${deep}"/>
        <path d="M70 150 L150 148 L160 155 L70 160 Z" fill="${soft}" opacity="0.5"/>`;

    case 'boots':
      return `
        <path d="M88 100 H152 V150 L165 230 Q168 245 155 250 H95 Q82 245 85 230 L98 150 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <path d="M88 100 H152 V118 H88 Z" fill="${deep}" opacity="0.22"/>
        <path d="M95 250 Q125 258 155 250" fill="none" stroke="${deep}" stroke-width="2" opacity="0.3"/>
        <line x1="120" y1="118" x2="120" y2="200" stroke="${soft}" stroke-width="1" opacity="0.25"/>`;

    case 'loafers':
      return `
        <path d="M52 170 Q88 148 140 155 L188 162 Q200 166 194 182 L68 190 Q48 186 52 170 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <path d="M90 155 Q120 148 150 158" fill="none" stroke="${deep}" stroke-width="3" stroke-linecap="round" opacity="0.35"/>
        <path d="M68 190 L194 182 Q198 188 192 196 L70 200 Q52 198 68 190 Z" fill="${deep}" opacity="0.3"/>`;

    case 'belt':
      return `
        <rect x="48" y="140" width="144" height="28" rx="6" fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <rect x="100" y="132" width="40" height="44" rx="4" fill="${SAMPLE_COLORS.gold}" opacity="0.9"/>
        <rect x="108" y="140" width="24" height="28" rx="2" fill="#FAF8F5"/>
        <rect x="52" y="148" width="40" height="4" rx="1" fill="${deep}" opacity="0.25"/>
        <rect x="148" y="148" width="40" height="4" rx="1" fill="${deep}" opacity="0.25"/>`;

    case 'tote':
      return `
        <path d="M70 120 H170 L178 230 Q178 242 166 242 H74 Q62 242 62 230 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <path d="M88 120 Q88 78 120 78 Q152 78 152 120" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <path d="M70 120 H170" stroke="${deep}" stroke-width="2" opacity="0.25"/>
        <circle cx="120" cy="175" r="6" fill="${SAMPLE_COLORS.gold}" opacity="0.55"/>`;

    case 'clutch':
      return `
        <rect x="55" y="145" width="130" height="55" rx="10" fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <path d="M55 162 H185" stroke="${deep}" stroke-width="1" opacity="0.2"/>
        <circle cx="120" cy="172" r="5" fill="${SAMPLE_COLORS.gold}" opacity="0.75"/>
        <circle cx="120" cy="172" r="2" fill="#FAF8F5"/>`;

    case 'scarf':
      return `
        <path d="M85 70 Q120 55 155 70 L165 95 Q140 110 120 105 Q100 110 75 95 Z"
          fill="${color}" stroke="${line}" stroke-width="1.5"/>
        <path d="M95 95 L80 210 Q120 225 160 210 L145 95" fill="${color}" stroke="${line}" stroke-width="1.5" opacity="0.92"/>
        <path d="M100 130 Q120 140 140 130" fill="none" stroke="${soft}" stroke-width="2" opacity="0.4"/>
        <path d="M96 160 Q120 172 144 160" fill="none" stroke="${soft}" stroke-width="2" opacity="0.3"/>`;

    default:
      return `<rect x="70" y="100" width="100" height="100" rx="16" fill="${color}"/>`;
  }
}

/**
 * Build a clean vector product card as SVG data-URL.
 * No text label on the image — name comes from the wardrobe card UI.
 */
export function productSvg(options: {
  color: string;
  variant: VectorVariant;
  accent?: string;
}): string {
  const { color, variant, accent = SAMPLE_COLORS.gold } = options;
  const shape = silhouette(variant, color);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="600" viewBox="0 0 240 300">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FCFBF8"/>
      <stop offset="100%" stop-color="#F5F0E8"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#2a201810"/>
    </filter>
  </defs>
  <rect width="240" height="300" fill="url(#bg)"/>
  <circle cx="200" cy="36" r="48" fill="${accent}" opacity="0.08"/>
  <circle cx="28" cy="270" r="40" fill="${color}" opacity="0.07"/>
  <g filter="url(#shadow)" transform="translate(0,8)">
    ${shape}
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Convenience: one-liner for wardrobe samples */
export function sampleVector(variant: VectorVariant, color: string): string {
  return productSvg({ variant, color });
}
