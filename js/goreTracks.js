// js/goreTracks.js — Сліди гусениць робота у свіжій крові (чиста математика, без спрайтів)
// Пам'ятаємо останні калюжі (кільцевий буфер); проїзд крізь свіжу забруднює гусениці на
// TRACKS.trailLength пікселів. Малюємо дві смуги гусениць сегментами від попередньої точки
// до поточної (тож вони гнуться разом із поворотом), з шевронними ґрунтозачепами, що бліднуть
// і рвуться, коли кров на траках закінчується.

import { CONFIG } from './config.js';
import { BLOOD } from './gore.js';
import { rgba, makeRng, newSeed } from './goreBrush.js';

const freshPools = [];
let poolCursor = 0;
const trail = { blood: null, left: 0, checkTimer: 0, lastX: 0, lastY: 0, lastA: 0, has: false, barPhase: 0, dist: 0 };

export function registerFreshPool(x, y, r, blood) {
  const entry = { x, y, r2: r * r, blood, t: performance.now() };
  const max = CONFIG.TRACKS.maxFreshPools;
  if (freshPools.length < max) freshPools.push(entry);
  else { freshPools[poolCursor] = entry; poolCursor = (poolCursor + 1) % max; }
}

export function resetGore() {
  freshPools.length = 0;
  poolCursor = 0;
  trail.blood = null; trail.left = 0; trail.checkTimer = 0; trail.has = false; trail.barPhase = 0; trail.dist = 0;
}

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

// Один сегмент двох гусениць від (x0,y0,a0) до (x1,y1,a1). strength 1 → 0 по мірі висихання.
function paintTreadSegment(decals, x0, y0, a0, x1, y1, a1, blood, strength, halfGap, treadW, barPhase0) {
  const T = CONFIG.TRACKS;
  const pal = BLOOD[blood] || BLOOD.corrupt;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const seed = newSeed();
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const n0x = -Math.sin(a0), n0y = Math.cos(a0), n1x = -Math.sin(a1), n1y = Math.cos(a1);
  const s = strength;

  decals.paintOnWorld(mx, my, len * 0.5 + halfGap + treadW + 4, (ctx, lx, ly) => {
    const rng = makeRng(seed);
    const ox = lx - mx, oy = ly - my; // світ → локальні координати чанку
    for (const side of [-1, 1]) {
      const c0x = x0 + n0x * halfGap * side + ox, c0y = y0 + n0y * halfGap * side + oy;
      const c1x = x1 + n1x * halfGap * side + ox, c1y = y1 + n1y * halfGap * side + oy;
      const hw = treadW * 0.5;
      // 1. просочена смуга траку (нерівна прозорість)
      ctx.fillStyle = rgba(pal.base, (0.04 + 0.42 * s) * (0.75 + rng() * 0.25));
      ctx.beginPath();
      ctx.moveTo(c0x + n0x * hw, c0y + n0y * hw);
      ctx.lineTo(c1x + n1x * hw, c1y + n1y * hw);
      ctx.lineTo(c1x - n1x * hw, c1y - n1y * hw);
      ctx.lineTo(c0x - n0x * hw, c0y - n0y * hw);
      ctx.closePath();
      ctx.fill();
      // 2. краї траку — тонкі лінії
      ctx.strokeStyle = rgba(pal.dark, 0.1 + 0.75 * s);
      ctx.lineWidth = 1;
      for (const e of [-1, 1]) {
        if (rng() > 0.15 + s * 0.85) continue;
        ctx.beginPath();
        ctx.moveTo(c0x + n0x * hw * e, c0y + n0y * hw * e);
        ctx.lineTo(c1x + n1x * hw * e, c1y + n1y * hw * e);
        ctx.stroke();
      }
      // 3. ґрунтозачепи: шеврони (ліва гусениця «\», права «/»), безперервний крок між сегментами
      ctx.lineWidth = Math.max(1.5, treadW * 0.34);
      ctx.lineCap = 'butt';
      for (let d = T.barSpacing - barPhase0; d <= len; d += T.barSpacing) {
        if (rng() < (1 - s) * 0.85) continue; // висихає — відбитки рвуться
        const t = len > 0 ? d / len : 0;
        const a = lerpAngle(a0, a1, t);
        const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
        const cx = c0x + (c1x - c0x) * t, cy = c0y + (c1y - c0y) * t;
        const slant = treadW * 0.38 * side;
        ctx.strokeStyle = rgba(pal.dark, (0.2 + 0.8 * s) * (0.7 + rng() * 0.3));
        ctx.beginPath();
        ctx.moveTo(cx + nx * hw * 0.9 - ux * slant, cy + ny * hw * 0.9 - uy * slant);
        ctx.lineTo(cx - nx * hw * 0.9 + ux * slant, cy - ny * hw * 0.9 + uy * slant);
        ctx.stroke();
      }
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
      if (dx * dx + dy * dy <= p.r2) {
        if (trail.left <= 0) trail.has = false; // новий слід — не тягнемо лінію зі старої точки
        trail.blood = p.blood; trail.left = T.trailLength;
        break;
      }
    }
  }
  if (trail.left <= 0) { trail.has = false; return; }

  if (!trail.has) {
    trail.lastX = player.x; trail.lastY = player.y;
    trail.lastA = Math.atan2(player.vy, player.vx) || player.facingAngle || 0;
    trail.has = true;
    return;
  }
  const dx = player.x - trail.lastX, dy = player.y - trail.lastY;
  const d = Math.hypot(dx, dy);
  if (d > T.stepPx * 8) { trail.has = false; return; } // телепорт / ривок — без лінії через пів карти
  if (d < T.stepPx) return;

  const segA = Math.atan2(dy, dx);
  const a1 = lerpAngle(trail.lastA, segA, 0.7);
  const strength = Math.max(0, trail.left / T.trailLength); // лінійно: кров на траках витирається рівномірно
  const r = player.radius;
  paintTreadSegment(decals, trail.lastX, trail.lastY, trail.lastA, player.x, player.y, a1,
    trail.blood, strength, r * T.gapMult, r * T.widthMult, trail.barPhase);
  trail.barPhase = (trail.barPhase + d) % T.barSpacing;
  trail.left -= d;
  trail.lastX = player.x; trail.lastY = player.y; trail.lastA = a1;
}
