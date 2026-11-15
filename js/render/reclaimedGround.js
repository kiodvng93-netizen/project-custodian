// js/render/reclaimedGround.js — Процедурна текстура відновленої землі (трава поверх пустки).
// Форма краю детермінована seed ділянки: однакова щозабігу й лише розширюється зі стадією.
// Малюємо в половинній роздільності й масштабуємо «nearest» — пікселі як у тайлі пустки.
// Край — той самий, що й у геймплеї (site.edge з world/terraform.js).

import { mulberry32, EDGE_MAX } from '../world/terraform.js';

export const GROUND_SCALE = 0.5;  // пікселів канви на світовий піксель
const FRINGE = 80;                // світових px моху за краєм
const cache = new Map();          // id → { stage, canvas }

const BLOTCH = ['#30502a', '#263d20', '#3a5a2e', '#22371c', '#2f4f22'];
const GRAIN = ['#4b7535', '#3f6a2f', '#5b8a3e', '#1d3018', '#6d9c48', '#355a29'];
// Приглушені квіти: яскраві білі/жовті точки плутались із пікапами
const FLOWERS = ['#9f7aea', '#b7791f', '#97266d', '#c05621'];

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function bake(site, stage, radiusWorld) {
  const r = radiusWorld * GROUND_SCALE;
  const fringe = FRINGE * GROUND_SCALE;
  const size = Math.ceil((r * EDGE_MAX + fringe) * 2) + 4;
  const c = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const edge = site.edge;
  const rnd = mulberry32(site.seed * 31 + stage * 977 + 7);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const inDisc = (maxR) => {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * maxR;
    return [c + Math.cos(a) * d, c + Math.sin(a) * d, a, d];
  };

  const path = new Path2D();
  const steps = 220;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const rr = r * edge(a);
    if (i === 0) path.moveTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr);
    else path.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr);
  }
  path.closePath();

  // Волога темна смуга ґрунту на межі
  ctx.strokeStyle = 'rgba(28, 22, 12, 0.45)';
  ctx.lineWidth = 7;
  ctx.stroke(path);

  ctx.save();
  ctx.clip(path);
  ctx.fillStyle = '#2c4423';
  ctx.fillRect(0, 0, size, size);
  const area = Math.PI * r * r;

  // Великі плями відтінків
  for (let i = 0, n = Math.floor(area / 260); i < n; i++) {
    const [x, y] = inDisc(r * EDGE_MAX);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = pick(BLOTCH);
    ctx.beginPath(); ctx.arc(x, y, 3 + rnd() * 9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Дрібне зерно
  for (let i = 0, n = Math.floor(area / 9); i < n; i++) {
    const [x, y] = inDisc(r * EDGE_MAX);
    px(ctx, x, y, rnd() < 0.3 ? 2 : 1, 1, pick(GRAIN));
  }
  // Пучки трави
  for (let i = 0, n = Math.floor(area / 160); i < n; i++) {
    const [x, y] = inDisc(r * 1.05);
    px(ctx, x - 1, y + 1, 3, 1, '#1d3018');
    px(ctx, x - 1, y - 1, 1, 2, '#6d9c48');
    px(ctx, x, y - 2, 1, 3, '#86b85a');
    px(ctx, x + 1, y - 1, 1, 2, '#5b8a3e');
  }
  // Квіти
  for (let i = 0, n = Math.floor(area / 2600); i < n; i++) {
    const [x, y] = inDisc(r * 0.95);
    const col = pick(FLOWERS);
    px(ctx, x - 1, y, 1, 1, col); px(ctx, x + 1, y, 1, 1, col);
    px(ctx, x, y - 1, 1, 1, col); px(ctx, x, y + 1, 1, 1, col);
    px(ctx, x, y, 1, 1, '#744210');
  }
  // Тінь усередині краю — земля «піднята»
  ctx.strokeStyle = 'rgba(16, 28, 12, 0.5)';
  ctx.lineWidth = 3;
  ctx.stroke(path);
  ctx.restore();

  // Мох, що повзе на пустку за краєм (рідшає назовні)
  const perimeter = Math.PI * 2 * r;
  for (let i = 0, n = Math.floor(perimeter * 1.6); i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const t = rnd();
    const d = r * edge(a) + t * t * fringe;
    const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d;
    const clump = 1 + Math.floor(rnd() * (t < 0.3 ? 5 : 3));
    for (let j = 0; j < clump; j++) {
      px(ctx, x + (rnd() - 0.5) * 4, y + (rnd() - 0.5) * 4, rnd() < 0.4 ? 2 : 1, 1, pick(GRAIN));
    }
  }
  return canvas;
}

// Канва для поточної стадії ділянки (кеш: одна на ділянку)
export function getReclaimedCanvas(site) {
  if (site.stage < 0) return null;
  const hit = cache.get(site.id);
  if (hit && hit.stage === site.stage) return hit.canvas;
  const canvas = bake(site, site.stage, site.radius);
  cache.set(site.id, { stage: site.stage, canvas });
  return canvas;
}

// Розмір спрайта у світі з урахуванням анімації розростання
export function reclaimedWorldSize(site, canvas, displayRadius) {
  return (canvas.width / GROUND_SCALE) * (displayRadius / site.radius);
}

// Canvas 2D запасний шлях (коли Pixi не стартував)
export function renderReclaimedGround(ctx, terraform) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < terraform.areas.length; i++) {
    const site = terraform.areas[i];
    const canvas = getReclaimedCanvas(site);
    if (!canvas) continue;
    const s = reclaimedWorldSize(site, canvas, terraform.displayRadius(site));
    ctx.drawImage(canvas, site.x - s / 2, site.y - s / 2, s, s);
  }
  ctx.restore();
}
