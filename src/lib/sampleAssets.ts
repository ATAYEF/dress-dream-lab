/**
 * Premium fashion-flat vector product cards for the demo wardrobe.
 * SVG data-URLs — offline, consistent 3:4 framing, no CDN.
 * Style: editorial fashion illustration (soft gradients, stitch detail, depth).
 */

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

export const SAMPLE_COLORS = {
  white: '#F1EDE6',
  cream: '#E5D4B5',
  beige: '#C9A87C',
  pink: '#E39AAD',
  sage: '#87A892',
  sky: '#7EADCB',
  denim: '#4A6F9C',
  navy: '#2A3D5C',
  black: '#2C2C30',
  charcoal: '#3A3A40',
  red: '#C25050',
  brown: '#8A5A38',
  gold: '#C9A227',
  rose: '#D4848A',
} as const;

function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const f = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function darker(hex: string, amount = 0.2): string {
  return mix(hex, '#000000', amount);
}

function lighter(hex: string, amount = 0.3): string {
  return mix(hex, '#ffffff', amount);
}

/** Stable short id so gradient/filter ids don't clash across cards */
function uid(variant: string, color: string): string {
  let h = 0;
  const s = variant + color;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `v${(h >>> 0).toString(36)}`;
}

function garmentDefs(id: string, color: string): string {
  const c0 = lighter(color, 0.22);
  const c1 = color;
  const c2 = darker(color, 0.18);
  const c3 = darker(color, 0.32);
  return `
  <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${c0}"/>
    <stop offset="45%" stop-color="${c1}"/>
    <stop offset="100%" stop-color="${c2}"/>
  </linearGradient>
  <linearGradient id="${id}-v" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${c0}"/>
    <stop offset="100%" stop-color="${c2}"/>
  </linearGradient>
  <linearGradient id="${id}-shine" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
    <stop offset="40%" stop-color="#ffffff" stop-opacity="0.22"/>
    <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="${id}-spot" cx="35%" cy="30%" r="65%">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
    <stop offset="100%" stop-color="${c3}" stop-opacity="0"/>
  </radialGradient>
  <filter id="${id}-sh" x="-40%" y="-20%" width="180%" height="160%">
    <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#1a1410" flood-opacity="0.16"/>
  </filter>
  <filter id="${id}-soft" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur stdDeviation="0.4"/>
  </filter>`;
}

function silhouette(variant: VectorVariant, color: string, id: string): string {
  const deep = darker(color, 0.28);
  const mid = darker(color, 0.12);
  const soft = lighter(color, 0.4);
  const fill = `url(#${id}-g)`;
  const fillV = `url(#${id}-v)`;
  const stitch = deep;

  switch (variant) {
    case 'shirt':
      return `
      <g filter="url(#${id}-sh)">
        <!-- body -->
        <path d="M70 98
          C78 82 96 64 112 70
          L120 76 L128 70
          C144 64 162 82 170 98
          L158 118 L150 108
          L150 218 C150 226 144 230 136 230
          L104 230 C96 230 90 226 90 218
          L90 108 L82 118 Z" fill="${fill}"/>
        <path d="M90 108 L150 108 L150 218 C150 226 144 230 136 230 L104 230 C96 230 90 226 90 218 Z" fill="url(#${id}-spot)"/>
        <!-- collar -->
        <path d="M108 72 L120 64 L132 72 L128 92 L120 84 L112 92 Z" fill="${soft}"/>
        <path d="M108 72 L120 64 L132 72" fill="none" stroke="${mid}" stroke-width="1.2" opacity="0.5"/>
        <!-- placket + buttons -->
        <line x1="120" y1="92" x2="120" y2="220" stroke="${stitch}" stroke-width="1.4" opacity="0.35"/>
        <circle cx="120" cy="112" r="2.6" fill="${soft}" stroke="${mid}" stroke-width="0.8"/>
        <circle cx="120" cy="136" r="2.6" fill="${soft}" stroke="${mid}" stroke-width="0.8"/>
        <circle cx="120" cy="160" r="2.6" fill="${soft}" stroke="${mid}" stroke-width="0.8"/>
        <circle cx="120" cy="184" r="2.6" fill="${soft}" stroke="${mid}" stroke-width="0.8"/>
        <circle cx="120" cy="208" r="2.6" fill="${soft}" stroke="${mid}" stroke-width="0.8"/>
        <!-- cuff hints -->
        <path d="M70 98 L82 118" stroke="${mid}" stroke-width="1" opacity="0.35"/>
        <path d="M170 98 L158 118" stroke="${mid}" stroke-width="1" opacity="0.35"/>
        <!-- hem -->
        <path d="M94 228 H146" stroke="${stitch}" stroke-width="1" opacity="0.2" stroke-dasharray="3 2"/>
      </g>`;

    case 'sweater':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M64 108
          C74 78 98 62 118 72
          L120 74 L122 72
          C142 62 166 78 176 108
          L160 128 L152 116
          L152 228 C152 236 146 240 138 240
          L102 240 C94 240 88 236 88 228
          L88 116 L80 128 Z" fill="${fill}"/>
        <path d="M88 116 L152 116 L152 228 C152 236 146 240 138 240 L102 240 C94 240 88 236 88 228 Z" fill="url(#${id}-spot)"/>
        <!-- rib neck -->
        <ellipse cx="120" cy="78" rx="18" ry="11" fill="${soft}"/>
        <ellipse cx="120" cy="84" rx="12" ry="8" fill="#FAF8F5"/>
        <!-- knit rows -->
        <path d="M92 150 H148" stroke="${stitch}" stroke-width="1.2" opacity="0.15"/>
        <path d="M92 170 H148" stroke="${stitch}" stroke-width="1.2" opacity="0.15"/>
        <path d="M92 190 H148" stroke="${stitch}" stroke-width="1.2" opacity="0.15"/>
        <path d="M92 210 H148" stroke="${stitch}" stroke-width="1.2" opacity="0.15"/>
        <!-- cuff ribs -->
        <path d="M64 108 L80 128" stroke="${mid}" stroke-width="3" opacity="0.25" stroke-linecap="round"/>
        <path d="M176 108 L160 128" stroke="${mid}" stroke-width="3" opacity="0.25" stroke-linecap="round"/>
      </g>`;

    case 'jeans':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M88 62 H152
          L152 100 L164 248 C164 256 158 260 150 260 L128 260
          L120 130 L112 260 L90 260 C82 260 76 256 76 248
          L88 100 Z" fill="${fillV}"/>
        <path d="M88 62 H152 V92 H88 Z" fill="${deep}" opacity="0.22"/>
        <!-- fly -->
        <line x1="120" y1="92" x2="120" y2="128" stroke="${stitch}" stroke-width="1.5" opacity="0.4"/>
        <!-- pockets -->
        <path d="M94 100 C100 118 110 122 118 118" fill="none" stroke="${stitch}" stroke-width="1.4" opacity="0.45"/>
        <path d="M146 100 C140 118 130 122 122 118" fill="none" stroke="${stitch}" stroke-width="1.4" opacity="0.45"/>
        <!-- rivets -->
        <circle cx="100" cy="96" r="2.2" fill="${SAMPLE_COLORS.gold}" opacity="0.75"/>
        <circle cx="140" cy="96" r="2.2" fill="${SAMPLE_COLORS.gold}" opacity="0.75"/>
        <!-- belt loops -->
        <rect x="96" y="62" width="4" height="12" rx="1" fill="${mid}" opacity="0.5"/>
        <rect x="140" y="62" width="4" height="12" rx="1" fill="${mid}" opacity="0.5"/>
        <rect x="118" y="62" width="4" height="12" rx="1" fill="${mid}" opacity="0.5"/>
        <!-- hem stitch -->
        <path d="M90 252 H112" stroke="${stitch}" stroke-width="1" opacity="0.3"/>
        <path d="M128 252 H150" stroke="${stitch}" stroke-width="1" opacity="0.3"/>
      </g>`;

    case 'pants':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M90 58 H150
          L150 96 L162 252 C162 260 156 264 148 264 L128 264
          L120 122 L112 264 L92 264 C84 264 78 260 78 252
          L90 96 Z" fill="${fillV}"/>
        <path d="M90 58 H150 V80 H90 Z" fill="${deep}" opacity="0.18"/>
        <line x1="120" y1="80" x2="120" y2="120" stroke="${stitch}" stroke-width="1.2" opacity="0.3"/>
        <path d="M92 256 H112" stroke="${stitch}" stroke-width="1" opacity="0.25" stroke-dasharray="2 2"/>
        <path d="M128 256 H148" stroke="${stitch}" stroke-width="1" opacity="0.25" stroke-dasharray="2 2"/>
        <path d="M90 58 H150" stroke="${soft}" stroke-width="2" opacity="0.3"/>
      </g>`;

    case 'skirt':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M92 72 H148
          L172 236 C172 248 164 252 152 252
          L88 252 C76 252 68 248 68 236 Z" fill="${fillV}"/>
        <path d="M92 66 H148 V84 H92 Z" fill="${deep}" opacity="0.22"/>
        <!-- pleats -->
        <path d="M100 84 L92 248" stroke="${stitch}" stroke-width="1" opacity="0.18"/>
        <path d="M112 84 L108 248" stroke="${stitch}" stroke-width="1" opacity="0.14"/>
        <path d="M120 84 L120 248" stroke="${stitch}" stroke-width="1.2" opacity="0.2"/>
        <path d="M128 84 L132 248" stroke="${stitch}" stroke-width="1" opacity="0.14"/>
        <path d="M140 84 L148 248" stroke="${stitch}" stroke-width="1" opacity="0.18"/>
        <path d="M92 84 H148" stroke="${soft}" stroke-width="1.5" opacity="0.35"/>
      </g>`;

    case 'dress':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M96 58
          C104 48 116 44 120 44
          C124 44 136 48 144 58
          L154 84 L146 98
          L146 118 L176 248 C176 258 168 264 156 264
          L84 264 C72 264 64 258 64 248
          L94 118 L94 98 L86 84 Z" fill="${fill}"/>
        <path d="M94 118 L146 118 L176 248 C176 258 168 264 156 264 L84 264 C72 264 64 258 64 248 Z" fill="url(#${id}-spot)"/>
        <!-- neckline -->
        <path d="M108 56 C114 50 126 50 132 56" fill="none" stroke="${soft}" stroke-width="2" opacity="0.6"/>
        <!-- waist seam -->
        <path d="M96 118 H144" stroke="${stitch}" stroke-width="1.3" opacity="0.3"/>
        <!-- darts -->
        <path d="M108 98 L112 118" stroke="${stitch}" stroke-width="1" opacity="0.25"/>
        <path d="M132 98 L128 118" stroke="${stitch}" stroke-width="1" opacity="0.25"/>
      </g>`;

    case 'trench':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M60 100
          C72 72 96 58 116 68
          L120 72 L124 68
          C144 58 168 72 180 100
          L164 122 L154 110
          L154 240 C154 248 148 252 140 252
          L100 252 C92 252 86 248 86 240
          L86 110 L76 122 Z" fill="${fill}"/>
        <path d="M86 110 L154 110 L154 240 C154 248 148 252 140 252 L100 252 C92 252 86 248 86 240 Z" fill="url(#${id}-spot)"/>
        <!-- lapels -->
        <path d="M116 68 L120 72 L100 115 L90 108 Z" fill="${soft}" opacity="0.7"/>
        <path d="M124 68 L120 72 L140 115 L150 108 Z" fill="${soft}" opacity="0.7"/>
        <!-- center storm flap -->
        <line x1="120" y1="72" x2="120" y2="248" stroke="${soft}" stroke-width="3" opacity="0.45"/>
        <!-- belt -->
        <rect x="84" y="158" width="72" height="12" rx="3" fill="${mid}" opacity="0.85"/>
        <circle cx="120" cy="164" r="4.5" fill="${deep}" opacity="0.55"/>
        <circle cx="120" cy="164" r="2" fill="${SAMPLE_COLORS.gold}" opacity="0.7"/>
        <!-- cuff straps -->
        <path d="M60 100 L76 122" stroke="${mid}" stroke-width="2.5" opacity="0.3" stroke-linecap="round"/>
        <path d="M180 100 L164 122" stroke="${mid}" stroke-width="2.5" opacity="0.3" stroke-linecap="round"/>
      </g>`;

    case 'blazer':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M62 104
          C74 74 98 60 118 70
          L120 74 L122 70
          C142 60 166 74 178 104
          L162 126 L152 114
          L152 236 C152 244 146 248 138 248
          L102 248 C94 248 88 244 88 236
          L88 114 L78 126 Z" fill="${fill}"/>
        <path d="M88 114 L152 114 L152 236 C152 244 146 248 138 248 L102 248 C94 248 88 244 88 236 Z" fill="url(#${id}-spot)"/>
        <!-- notch lapels -->
        <path d="M118 70 L120 74 L105 125 L88 114 L100 95 Z" fill="${soft}" opacity="0.65"/>
        <path d="M122 70 L120 74 L135 125 L152 114 L140 95 Z" fill="${soft}" opacity="0.65"/>
        <!-- buttons -->
        <circle cx="120" cy="150" r="3" fill="${SAMPLE_COLORS.gold}" opacity="0.7"/>
        <circle cx="120" cy="175" r="3" fill="${SAMPLE_COLORS.gold}" opacity="0.7"/>
        <!-- pocket flaps -->
        <rect x="92" y="168" width="22" height="8" rx="1.5" fill="${mid}" opacity="0.35"/>
        <rect x="126" y="168" width="22" height="8" rx="1.5" fill="${mid}" opacity="0.35"/>
      </g>`;

    case 'coat':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M56 98
          C70 66 98 52 118 64
          L120 68 L122 64
          C142 52 170 66 184 98
          L168 120 L158 108
          L158 252 C158 260 152 264 144 264
          L96 264 C88 264 82 260 82 252
          L82 108 L72 120 Z" fill="${fill}"/>
        <path d="M82 108 L158 108 L158 252 C158 260 152 264 144 264 L96 264 C88 264 82 260 82 252 Z" fill="url(#${id}-spot)"/>
        <line x1="120" y1="68" x2="120" y2="260" stroke="${soft}" stroke-width="2.2" opacity="0.35"/>
        <circle cx="120" cy="130" r="3" fill="${deep}" opacity="0.4"/>
        <circle cx="120" cy="160" r="3" fill="${deep}" opacity="0.4"/>
        <circle cx="120" cy="190" r="3" fill="${deep}" opacity="0.4"/>
        <circle cx="120" cy="220" r="3" fill="${deep}" opacity="0.4"/>
        <path d="M118 64 L120 68 L100 105" fill="none" stroke="${mid}" stroke-width="1.2" opacity="0.35"/>
        <path d="M122 64 L120 68 L140 105" fill="none" stroke="${mid}" stroke-width="1.2" opacity="0.35"/>
      </g>`;

    case 'sneakers':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M48 182
          C70 152 110 148 150 156
          L195 168 C208 172 210 182 200 192
          L70 204 C48 202 42 194 48 182 Z" fill="${fill}"/>
        <!-- toe cap -->
        <path d="M150 156 C175 160 195 168 200 180 L200 192 C190 188 170 182 150 178 Z" fill="${soft}" opacity="0.75"/>
        <!-- sole -->
        <path d="M52 196 L200 188 C206 192 204 200 196 204 L60 210 C48 208 46 202 52 196 Z" fill="${deep}" opacity="0.4"/>
        <!-- laces -->
        <path d="M100 160 L108 186" stroke="${mid}" stroke-width="2" opacity="0.4"/>
        <path d="M120 158 L126 186" stroke="${mid}" stroke-width="2" opacity="0.4"/>
        <path d="M140 160 L144 186" stroke="${mid}" stroke-width="2" opacity="0.4"/>
        <path d="M95 172 H145" stroke="${soft}" stroke-width="1.5" opacity="0.35"/>
        <path d="M98 182 H148" stroke="${soft}" stroke-width="1.5" opacity="0.3"/>
      </g>`;

    case 'heels':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M62 155
          L155 150 L185 170
          L168 182 L155 205
          L150 248 L132 248
          L130 205 L115 182 L62 172 Z" fill="${fill}"/>
        <path d="M62 155 L155 150 L168 160 L62 168 Z" fill="${soft}" opacity="0.55"/>
        <!-- stiletto -->
        <path d="M150 248 L142 278 L134 278 L132 248 Z" fill="${deep}"/>
        <ellipse cx="138" cy="278" rx="8" ry="3" fill="${mid}" opacity="0.6"/>
        <!-- insole hint -->
        <path d="M80 162 Q120 158 150 162" fill="none" stroke="${soft}" stroke-width="2" opacity="0.4"/>
      </g>`;

    case 'boots':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M85 88 H155
          L155 150 L172 250
          C174 262 166 270 152 270
          L98 270 C84 270 76 262 78 250
          L95 150 Z" fill="${fillV}"/>
        <path d="M85 88 H155 V112 H85 Z" fill="${deep}" opacity="0.2"/>
        <path d="M95 150 L98 270" stroke="${stitch}" stroke-width="1" opacity="0.15"/>
        <path d="M155 150 L152 270" stroke="${stitch}" stroke-width="1" opacity="0.15"/>
        <!-- buckle strap -->
        <rect x="100" y="200" width="40" height="8" rx="2" fill="${mid}" opacity="0.45"/>
        <rect x="132" y="196" width="12" height="16" rx="2" fill="${SAMPLE_COLORS.gold}" opacity="0.55"/>
        <path d="M90 265 Q125 272 160 265" fill="none" stroke="${deep}" stroke-width="2" opacity="0.3"/>
      </g>`;

    case 'loafers':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M46 178
          C72 150 115 148 155 156
          L198 168 C210 172 210 184 198 192
          L64 202 C46 198 40 188 46 178 Z" fill="${fill}"/>
        <path d="M46 178 C72 150 115 148 155 156 L170 160 L160 178 Z" fill="${soft}" opacity="0.5"/>
        <!-- penny strap -->
        <path d="M88 162 Q120 152 152 164" fill="none" stroke="${deep}" stroke-width="5" stroke-linecap="round" opacity="0.4"/>
        <ellipse cx="120" cy="160" rx="10" ry="5" fill="${SAMPLE_COLORS.gold}" opacity="0.45"/>
        <!-- sole -->
        <path d="M50 194 L198 186 C206 192 204 200 196 204 L58 210 C46 208 44 200 50 194 Z" fill="${deep}" opacity="0.35"/>
      </g>`;

    case 'belt':
      return `
      <g filter="url(#${id}-sh)">
        <rect x="36" y="138" width="168" height="32" rx="7" fill="${fill}"/>
        <rect x="40" y="146" width="50" height="5" rx="1.5" fill="${deep}" opacity="0.2"/>
        <rect x="150" y="146" width="50" height="5" rx="1.5" fill="${deep}" opacity="0.2"/>
        <!-- buckle -->
        <rect x="98" y="128" width="44" height="52" rx="5" fill="${SAMPLE_COLORS.gold}"/>
        <rect x="106" y="138" width="28" height="32" rx="3" fill="#FAF8F5"/>
        <rect x="116" y="138" width="4" height="32" fill="${SAMPLE_COLORS.gold}" opacity="0.7"/>
      </g>`;

    case 'tote':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M62 118 H178
          L188 242 C188 256 176 264 162 264
          H78 C64 264 52 256 52 242 Z" fill="${fill}"/>
        <path d="M62 118 H178 L188 242 C188 256 176 264 162 264 H78 C64 264 52 256 52 242 Z" fill="url(#${id}-spot)"/>
        <!-- handles -->
        <path d="M85 118 C85 72 120 62 120 62 C120 62 155 72 155 118"
          fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
        <path d="M85 118 C85 72 120 62 120 62 C120 62 155 72 155 118"
          fill="none" stroke="${soft}" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
        <path d="M62 118 H178" stroke="${deep}" stroke-width="2" opacity="0.2"/>
        <circle cx="120" cy="185" r="7" fill="${SAMPLE_COLORS.gold}" opacity="0.5"/>
        <circle cx="120" cy="185" r="3" fill="#FAF8F5" opacity="0.8"/>
      </g>`;

    case 'clutch':
      return `
      <g filter="url(#${id}-sh)">
        <rect x="48" y="142" width="144" height="62" rx="12" fill="${fill}"/>
        <path d="M48 160 H192" stroke="${deep}" stroke-width="1.2" opacity="0.2"/>
        <rect x="48" y="142" width="144" height="20" rx="12" fill="${soft}" opacity="0.35"/>
        <circle cx="120" cy="174" r="6" fill="${SAMPLE_COLORS.gold}" opacity="0.8"/>
        <circle cx="120" cy="174" r="2.5" fill="#FAF8F5"/>
      </g>`;

    case 'scarf':
      return `
      <g filter="url(#${id}-sh)">
        <path d="M80 68
          C100 48 140 48 160 68
          L172 98 C150 118 120 112 120 112
          C120 112 90 118 68 98 Z" fill="${fill}"/>
        <path d="M92 100
          L72 230 C100 250 140 250 168 230
          L148 100" fill="${fillV}" opacity="0.95"/>
        <path d="M100 140 Q120 152 140 140" fill="none" stroke="${soft}" stroke-width="2.5" opacity="0.45"/>
        <path d="M96 170 Q120 184 144 170" fill="none" stroke="${soft}" stroke-width="2.5" opacity="0.35"/>
        <path d="M94 200 Q120 214 146 200" fill="none" stroke="${soft}" stroke-width="2" opacity="0.28"/>
      </g>`;

    default:
      return `<rect x="70" y="100" width="100" height="100" rx="16" fill="${fill}"/>`;
  }
}

/**
 * Premium fashion-flat product card as SVG data-URL.
 */
export function productSvg(options: {
  color: string;
  variant: VectorVariant;
  accent?: string;
}): string {
  const { color, variant, accent = SAMPLE_COLORS.gold } = options;
  const id = uid(variant, color);
  const shape = silhouette(variant, color, id);
  const defs = garmentDefs(id, color);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 240 300">
  <defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFEFB"/>
      <stop offset="100%" stop-color="#F3EDE4"/>
    </linearGradient>
    ${defs}
  </defs>
  <rect width="240" height="300" fill="url(#${id}-bg)"/>
  <circle cx="198" cy="32" r="52" fill="${accent}" opacity="0.07"/>
  <circle cx="24" cy="275" r="44" fill="${color}" opacity="0.06"/>
  ${shape}
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function sampleVector(variant: VectorVariant, color: string): string {
  return productSvg({ variant, color });
}
