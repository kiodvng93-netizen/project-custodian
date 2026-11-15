// js/gore.js — Кров і бризки в стилі Diablo / Path of Exile: земля фарбується червоним, зеленим, синім
// Малює в чанки декалей (DecalManager.paintOnWorld). Пензлі — goreBrush.js, сліди гусениць — goreTracks.js.

import { CONFIG } from './config.js';
import { rgba, makeRng, newSeed, lumpyBlob, blob, brokenStreak, smearSegment, smallSplat } from './goreBrush.js';
import { registerFreshPool } from './goreTracks.js';

// Палітри крові (RGB): dark — запечена кров/контур, base — свіжа, bright — мокрий відблиск
export const BLOOD = {
  slime:   { dark: [12, 58, 22],  base: [44, 150, 62],  bright: [170, 245, 175], tint: 0x40c057, hex: '#40c057' },
  corrupt: { dark: [62, 4, 8],    base: [168, 18, 24],  bright: [255, 150, 150], tint: 0xe03131, hex: '#e03131' },
  ichor:   { dark: [8, 30, 78],   base: [26, 108, 205], bright: [160, 215, 255], tint: 0x339af0, hex: '#339af0' },
  venom:   { dark: [40, 6, 60],   base: [150, 44, 182], bright: [235, 175, 250], tint: 0xbe4bdb, hex: '#be4bdb' },
  amber:   { dark: [70, 32, 4],   base: [205, 112, 16], bright: [255, 220, 150], tint: 0xf08c00, hex: '#f08c00' },
  oil:     { dark: [8, 10, 16],   base: [30, 36, 50],   bright: [110, 125, 150], tint: 0x343a40, hex: '#343a40' },
};

// Колір крові за типом ворога: червоний / зелений / синій (+ фіолетовий бос)
const ENEMY_BLOOD = { sprout: 'slime', stalker: 'corrupt', dasher: 'ichor', warden: 'venom' };

export function bloodFor(enemy) {
  return ENEMY_BLOOD[enemy.typeKey] || 'corrupt';
}

const rand = (a, b) => a + Math.random() * (b - a);

// Пляма смерті: напівпрозора «просочена» пляма → темна калюжа → свіжа кров → рвані смуги й бризки
// по вектору удару. power: 1 = звичайна смерть; більше — надлишковий урон, еліта, бос.
export function paintSplatter(decals, x, y, { blood = 'corrupt', radius = 18, dirX = 0, dirY = 0, power = 1 } = {}) {
  if (!decals) return;
  const pal = BLOOD[blood] || BLOOD.corrupt;
  const R = radius * power * CONFIG.GORE.splatterScale;
  const hasDir = dirX !== 0 || dirY !== 0;
  const dirA = hasDir ? Math.atan2(dirY, dirX) : Math.random() * Math.PI * 2;
  const reach = R * (hasDir ? 4.9 : 3.0);

  // Геометрія один раз — малюємо однаково в кожен зачеплений чанк (сід для нерівних країв)
  const seed = newSeed();
  const pool = [];
  for (let i = 0, n = 4 + Math.floor(Math.random() * 3); i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = rand(0, R * 0.45);
    pool.push([Math.cos(a) * d + Math.cos(dirA) * R * 0.3, Math.sin(a) * d + Math.sin(dirA) * R * 0.3, rand(0.45, 0.75) * R * CONFIG.GORE.poolMult]);
  }
  const streaks = [];
  for (let i = 0, n = hasDir ? 4 + Math.floor(Math.random() * 4) : 2; i < n; i++) {
    const a = dirA + rand(-0.45, 0.45);
    const start = R * rand(0.2, 0.5);
    streaks.push([Math.cos(a) * start, Math.sin(a) * start, a, R * rand(1.5, 3.9), R * rand(0.16, 0.3)]);
  }
  const drops = [];
  const dropCount = Math.round((16 + 10 * Math.min(2, power)) * CONFIG.GORE.dropMult);
  const spread = hasDir ? 0.7 : Math.PI;
  for (let i = 0; i < dropCount; i++) {
    const a = dirA + rand(-spread, spread) * (Math.random() < 0.7 ? 0.6 : 1);
    const d = R * rand(0.8, hasDir ? 4.5 : 2.7);
    drops.push([Math.cos(a) * d, Math.sin(a) * d, Math.max(1.5, R * rand(0.05, 0.16) * CONFIG.GORE.dropSizeMult), rand(0.55, 0.9), Math.random() < 0.35]);
  }

  registerFreshPool(x + Math.cos(dirA) * R * 0.3, y + Math.sin(dirA) * R * 0.3, R * 1.1, blood);

  decals.paintOnWorld(x, y, reach + R, (ctx, lx, ly) => {
    const rng = makeRng(seed);
    // 1. просочена в ґрунт пляма — м'який нерівний край
    ctx.fillStyle = rgba(pal.base, 0.2);
    for (const [px, py, r] of pool) lumpyBlob(ctx, lx + px, ly + py, r * 1.45, rng, 0.45);
    // 2. темна калюжа
    ctx.fillStyle = rgba(pal.dark, 0.88);
    for (const [px, py, r] of pool) lumpyBlob(ctx, lx + px, ly + py, r, rng, 0.4);
    // 3. свіжа кров у центрі калюжі
    ctx.fillStyle = rgba(pal.base, 0.82);
    for (const [px, py, r] of pool) lumpyBlob(ctx, lx + px * 0.8, ly + py * 0.8, r * 0.68, rng, 0.4);
    // 4. рвані смуги від удару
    for (const [sx, sy, a, len, w] of streaks) brokenStreak(ctx, lx + sx, ly + sy, a, len, w, rng, pal.dark, pal.base, 0.82);
    // 5. бризки
    for (const [px, py, s, alpha, dark] of drops) {
      ctx.fillStyle = rgba(dark ? pal.dark : pal.base, alpha);
      blob(ctx, lx + px, ly + py, s);
    }
    // 6. мокрий відблиск
    ctx.fillStyle = rgba(pal.bright, 0.55);
    for (let i = 0; i < Math.min(2, pool.length); i++) {
      const [px, py, r] = pool[i];
      blob(ctx, lx + px * 0.8 - r * 0.25, ly + py * 0.8 - r * 0.25, r * 0.12);
    }
  });
}

// Дрібний бризок при влучанні (не смерть): рвана смуга й кілька крапель за спину ворога
export function paintSpurt(decals, x, y, { blood = 'corrupt', radius = 10, dirX = 0, dirY = 0 } = {}) {
  if (!decals) return;
  const pal = BLOOD[blood] || BLOOD.corrupt;
  const R = radius * CONFIG.GORE.splatterScale;
  const dirA = (dirX || dirY) ? Math.atan2(dirY, dirX) : Math.random() * Math.PI * 2;
  const drops = [];
  for (let i = 0, n = 2 + Math.floor(Math.random() * 2); i < n; i++) {
    const a = dirA + rand(-0.5, 0.5), d = R * rand(0.6, 2.8);
    drops.push([Math.cos(a) * d, Math.sin(a) * d, Math.max(1.5, R * rand(0.07, 0.18) * CONFIG.GORE.dropSizeMult), rand(0.55, 0.85)]);
  }
  const sA = dirA + rand(-0.2, 0.2), sLen = R * rand(1.3, 2.4), sW = R * rand(0.18, 0.28);
  const seed = newSeed();
  decals.paintOnWorld(x, y, R * 3.2, (ctx, lx, ly) => {
    const rng = makeRng(seed);
    brokenStreak(ctx, lx, ly, sA, sLen, sW, rng, pal.dark, pal.base, 0.78);
    for (const [px, py, s, alpha] of drops) {
      ctx.fillStyle = rgba(pal.base, alpha);
      blob(ctx, lx + px, ly + py, s);
    }
  });
}

// Мазок від тіла, що ковзає по землі (corpses.js): нерівна пляма замість чистого кола
export function paintSmear(decals, x, y, blood, size) {
  if (!decals) return;
  const pal = BLOOD[blood] || BLOOD.corrupt;
  const seed = newSeed();
  decals.paintOnWorld(x, y, size * 1.5, (ctx, lx, ly) => {
    const rng = makeRng(seed);
    ctx.fillStyle = rgba(pal.dark, 0.7);
    lumpyBlob(ctx, lx, ly, size * 0.5, rng, 0.5);
    ctx.fillStyle = rgba(pal.base, 0.75);
    lumpyBlob(ctx, lx, ly, size * 0.32, rng, 0.5);
  });
}

// Мазок уламка між двома точками: рвана, нерівна смуга; ink 0..1 — скільки крові ще на уламку
export function paintGibSmear(decals, x0, y0, x1, y1, blood, width, ink, phase = 0) {
  if (!decals) return;
  const pal = BLOOD[blood] || BLOOD.corrupt;
  const seed = newSeed();
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  decals.paintOnWorld(mx, my, Math.hypot(x1 - x0, y1 - y0) * 0.5 + width * 1.5, (ctx, lx, ly) => {
    const ox = lx - mx, oy = ly - my;
    smearSegment(ctx, x0 + ox, y0 + oy, x1 + ox, y1 + oy, width, ink, makeRng(seed), pal, phase);
  });
}

// «Шльоп» уламка: при відскоку від землі і там, де мазок закінчився
export function paintGibSplat(decals, x, y, r, angle, blood, power = 1) {
  if (!decals) return;
  const pal = BLOOD[blood] || BLOOD.corrupt;
  const seed = newSeed();
  decals.paintOnWorld(x, y, r * (3 + power * 1.6), (ctx, lx, ly) => {
    smallSplat(ctx, lx, ly, r, angle, makeRng(seed), pal, power);
  });
}
