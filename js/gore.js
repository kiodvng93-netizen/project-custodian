// js/gore.js — Кров і бризки в стилі Diablo / Path of Exile: земля фарбується червоним, зеленим, синім
// Малює в чанки декалей (DecalManager.paintOnWorld). Без залежностей від світу/ворогів.

import { CONFIG } from './config.js';

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

const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
const rand = (a, b) => a + Math.random() * (b - a);

function blob(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function streak(ctx, x, y, angle, len, width) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.ellipse(len * 0.5, 0, len * 0.5, width * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Пляма смерті: напівпрозора «просочена» пляма → темна калюжа → свіжа кров → смуги й дрібні бризки
// по вектору удару. power: 1 = звичайна смерть; більше — надлишковий урон, еліта, бос.
export function paintSplatter(decals, x, y, { blood = 'corrupt', radius = 18, dirX = 0, dirY = 0, power = 1 } = {}) {
  if (!decals) return;
  const pal = BLOOD[blood] || BLOOD.corrupt;
  const R = radius * power * CONFIG.GORE.splatterScale;
  const hasDir = dirX !== 0 || dirY !== 0;
  const dirA = hasDir ? Math.atan2(dirY, dirX) : Math.random() * Math.PI * 2;
  const reach = R * (hasDir ? 4.6 : 2.8);

  // Геометрія один раз — малюємо однаково в кожен зачеплений чанк
  const pool = [];
  for (let i = 0, n = 4 + Math.floor(Math.random() * 3); i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = rand(0, R * 0.45);
    pool.push([Math.cos(a) * d + Math.cos(dirA) * R * 0.3, Math.sin(a) * d + Math.sin(dirA) * R * 0.3, rand(0.45, 0.75) * R]);
  }
  const streaks = [];
  for (let i = 0, n = hasDir ? 4 + Math.floor(Math.random() * 4) : 2; i < n; i++) {
    streaks.push([dirA + rand(-0.4, 0.4), R * rand(1.8, 4.2), R * rand(0.07, 0.15)]);
  }
  const drops = [];
  const dropCount = Math.round(16 + 10 * Math.min(2, power));
  const spread = hasDir ? 0.7 : Math.PI;
  for (let i = 0; i < dropCount; i++) {
    const a = dirA + rand(-spread, spread) * (Math.random() < 0.7 ? 0.6 : 1);
    const d = R * rand(0.8, hasDir ? 4.5 : 2.7);
    drops.push([Math.cos(a) * d, Math.sin(a) * d, Math.max(1, R * rand(0.05, 0.16)), rand(0.55, 0.9), Math.random() < 0.35]);
  }

  registerFreshPool(x + Math.cos(dirA) * R * 0.3, y + Math.sin(dirA) * R * 0.3, R * 1.1, blood);

  decals.paintOnWorld(x, y, reach + R, (ctx, lx, ly) => {
    // 1. просочена в ґрунт пляма — м'який край
    ctx.fillStyle = rgba(pal.base, 0.22);
    for (const [px, py, r] of pool) blob(ctx, lx + px, ly + py, r * 1.45);
    // 2. темна калюжа
    ctx.fillStyle = rgba(pal.dark, 0.88);
    for (const [px, py, r] of pool) blob(ctx, lx + px, ly + py, r);
    // 3. свіжа кров у центрі калюжі
    ctx.fillStyle = rgba(pal.base, 0.82);
    for (const [px, py, r] of pool) blob(ctx, lx + px * 0.8, ly + py * 0.8, r * 0.68);
    // 4. смуги від удару: темний край + свіжа середина
    for (const [a, len, w] of streaks) {
      ctx.fillStyle = rgba(pal.dark, 0.75);
      streak(ctx, lx, ly, a, len, w * 1.5);
      ctx.fillStyle = rgba(pal.base, 0.8);
      streak(ctx, lx, ly, a, len * 0.92, w * 0.8);
    }
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

// Дрібний бризок при влучанні (не смерть): смуга й кілька крапель за спину ворога
export function paintSpurt(decals, x, y, { blood = 'corrupt', radius = 10, dirX = 0, dirY = 0 } = {}) {
  if (!decals) return;
  const pal = BLOOD[blood] || BLOOD.corrupt;
  const R = radius * CONFIG.GORE.splatterScale;
  const dirA = (dirX || dirY) ? Math.atan2(dirY, dirX) : Math.random() * Math.PI * 2;
  const drops = [];
  for (let i = 0, n = 4 + Math.floor(Math.random() * 4); i < n; i++) {
    const a = dirA + rand(-0.5, 0.5), d = R * rand(0.6, 2.8);
    drops.push([Math.cos(a) * d, Math.sin(a) * d, Math.max(1, R * rand(0.07, 0.18)), rand(0.55, 0.85)]);
  }
  const sA = dirA + rand(-0.2, 0.2), sLen = R * rand(1.4, 2.6), sW = R * rand(0.08, 0.14);
  decals.paintOnWorld(x, y, R * 3, (ctx, lx, ly) => {
    ctx.fillStyle = rgba(pal.dark, 0.7);
    streak(ctx, lx, ly, sA, sLen, sW * 1.5);
    ctx.fillStyle = rgba(pal.base, 0.8);
    streak(ctx, lx, ly, sA, sLen * 0.9, sW * 0.8);
    for (const [px, py, s, alpha] of drops) {
      ctx.fillStyle = rgba(pal.base, alpha);
      blob(ctx, lx + px, ly + py, s);
    }
  });
}

// Мазок від уламка, що ковзає по землі
export function paintSmear(decals, x, y, blood, size) {
  if (!decals) return;
  const pal = BLOOD[blood] || BLOOD.corrupt;
  decals.paintOnWorld(x, y, size * 1.5, (ctx, lx, ly) => {
    ctx.fillStyle = rgba(pal.dark, 0.7);
    blob(ctx, lx, ly, size * 0.5);
    ctx.fillStyle = rgba(pal.base, 0.75);
    blob(ctx, lx, ly, size * 0.32);
  });
}

// ── Сліди робота у свіжій крові ────────────────────────────────────────────────
// Пам'ятаємо останні калюжі (кільцевий буфер); проїзд крізь свіжу забруднює гусениці
// на TRACKS.trailLength пікселів: відбитки кольору тієї крові, що бліднуть.

const freshPools = [];
let poolCursor = 0;
const trail = { blood: null, left: 0, dist: 0, checkTimer: 0 };

function registerFreshPool(x, y, r, blood) {
  const entry = { x, y, r2: r * r, blood, t: performance.now() };
  const max = CONFIG.TRACKS.maxFreshPools;
  if (freshPools.length < max) freshPools.push(entry);
  else { freshPools[poolCursor] = entry; poolCursor = (poolCursor + 1) % max; }
}

export function resetGore() {
  freshPools.length = 0;
  poolCursor = 0;
  trail.blood = null; trail.left = 0; trail.dist = 0; trail.checkTimer = 0;
}

function paintTreads(decals, x, y, angle, blood, strength, halfWidth) {
  const pal = BLOOD[blood] || BLOOD.corrupt;
  const nx = -Math.sin(angle), ny = Math.cos(angle);
  decals.paintOnWorld(x, y, halfWidth + 8, (ctx, lx, ly) => {
    ctx.fillStyle = rgba(pal.base, 0.2 + 0.55 * strength);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(lx + nx * halfWidth * side, ly + ny * halfWidth * side);
      ctx.rotate(angle);
      ctx.fillRect(-4.5, -2.5, 9, 5);
      ctx.restore();
    }
  });
}

export function updateRobotTracks(decals, player, dt) {
  if (!decals) return;
  const T = CONFIG.TRACKS;
  trail.checkTimer -= dt;
  if (trail.checkTimer <= 0) {
    trail.checkTimer = 0.1;
    const now = performance.now(), maxAge = T.freshBloodSeconds * 1000;
    for (let i = 0; i < freshPools.length; i++) {
      const p = freshPools[i];
      if (now - p.t > maxAge) continue;
      const dx = player.x - p.x, dy = player.y - p.y;
      if (dx * dx + dy * dy <= p.r2) { trail.blood = p.blood; trail.left = T.trailLength; break; }
    }
  }
  if (trail.left <= 0) return;
  const step = Math.hypot(player.vx, player.vy) * dt;
  if (step <= 0) return;
  trail.dist += step;
  trail.left -= step;
  if (trail.dist >= T.stepPx) {
    trail.dist = 0;
    paintTreads(decals, player.x, player.y, Math.atan2(player.vy, player.vx), trail.blood, Math.max(0, trail.left / T.trailLength), player.radius * 0.55);
  }
}
