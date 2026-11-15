// js/render/groundTile.js — Процедурний тайл пустки: темний, десатурований, низькочастотний.
// Без різких тріщин і дрібного шуму — щоб вороги, пікапи, кров і робот читались поверх.
// Тайл безшовний: кожна пляма малюється з обгорткою по краях.

import { mulberry32 } from '../world/terraform.js';

export const GROUND_TILE_SIZE = 512;
let cached = null;

const BASE = '#1b1c20';
// Дуже близькі до бази відтінки: різниця яскравості ~±4%
const TONES = ['#202126', '#17181c', '#1e1f23', '#191a1e', '#222226'];

function wrappedBlob(ctx, size, x, y, r, color, alpha) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let ox = -1; ox <= 1; ox++) {
    for (let oy = -1; oy <= 1; oy++) {
      const cx = x + ox * size, cy = y + oy * size;
      if (cx + r < 0 || cy + r < 0 || cx - r > size || cy - r > size) continue;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
  }
}

export function getGroundTileCanvas() {
  if (cached) return cached;
  const size = GROUND_TILE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const rnd = mulberry32(90210);

  ctx.fillStyle = BASE;
  ctx.fillRect(0, 0, size, size);

  // Великі м'які плями (низька частота)
  for (let i = 0; i < 22; i++) {
    const r = 70 + rnd() * 120;
    wrappedBlob(ctx, size, rnd() * size, rnd() * size, r, TONES[Math.floor(rnd() * TONES.length)], 0.55);
  }
  // Дуже слабкі середні плями — «брудна» нерівність без контрасту
  for (let i = 0; i < 30; i++) {
    const r = 24 + rnd() * 40;
    wrappedBlob(ctx, size, rnd() * size, rnd() * size, r, rnd() < 0.5 ? '#141519' : '#232328', 0.25);
  }
  ctx.globalAlpha = 1;
  cached = canvas;
  return canvas;
}
