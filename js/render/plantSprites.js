// js/render/plantSprites.js — Процедурні піксель-спрайти кущів і дерев (canvas 2D, крок 2 px).
// Малюються один раз у canvas і запікаються в текстури; фрукти малює рендерер окремо (їх кількість змінюється).

const PX = 2;
const BUSH = { w: 44, h: 34, feet: 30 };
const TREE = { w: 48, h: 66, feet: 62 };
// Палітри: контур, тінь, середній, світлий, відблиск
const LEAF = ['#16301f', '#2c5a37', '#3f7a48', '#5a9a58', '#86bd70'];
const LEAF_ALT = ['#1a2f20', '#30593a', '#487d45', '#6a9f56', '#a2c46c'];
const BARK = ['#2a1a10', '#4a3020', '#6b4a2e'];

// Детермінований генератор: однакові варіанти щозабігу
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

// Піксельна «грудка листя» з освітленням згори-ліворуч і нерівним краєм
function blob(ctx, cx, cy, rx, ry, pal, rnd) {
  for (let pass = 0; pass < 2; pass++) {
    const grow = pass === 0 ? PX : 0; // перший прохід — темний контур
    for (let y = cy - ry - grow; y <= cy + ry + grow; y += PX) {
      for (let x = cx - rx - grow; x <= cx + rx + grow; x += PX) {
        const nx = (x - cx) / (rx + grow), ny = (y - cy) / (ry + grow);
        const d = nx * nx + ny * ny;
        if (d > 1 + (rnd() - 0.5) * 0.3) continue;
        if (pass === 0) { ctx.fillStyle = pal[0]; }
        else {
          const light = -(nx * 0.55 + ny * 0.85) + (rnd() - 0.5) * 0.35;
          ctx.fillStyle = light > 0.55 ? pal[4] : light > 0.15 ? pal[3] : light > -0.45 ? pal[2] : pal[1];
        }
        ctx.fillRect(Math.round(x / PX) * PX, Math.round(y / PX) * PX, PX, PX);
      }
    }
  }
}

function bushCanvas(variant) {
  const rnd = rng(100 + variant * 7);
  const c = document.createElement('canvas');
  c.width = BUSH.w; c.height = BUSH.h;
  const ctx = c.getContext('2d');
  const pal = variant === 1 ? LEAF_ALT : LEAF;
  blob(ctx, 14, 22, 11, 7, pal, rnd);
  blob(ctx, 30, 21, 11, 8, pal, rnd);
  blob(ctx, 22, 14 + variant, 12, 8, pal, rnd);
  return c;
}

function treeCanvas(variant) {
  const rnd = rng(500 + variant * 11);
  const c = document.createElement('canvas');
  c.width = TREE.w; c.height = TREE.h;
  const ctx = c.getContext('2d');
  const pal = variant === 2 ? LEAF_ALT : LEAF;
  // Стовбур: темний контур, кора, світла смужка
  ctx.fillStyle = BARK[0]; ctx.fillRect(21, 36, 8, 26);
  ctx.fillStyle = BARK[1]; ctx.fillRect(22, 36, 6, 25);
  ctx.fillStyle = BARK[2]; ctx.fillRect(22, 36, 2, 24);
  ctx.fillStyle = BARK[0]; ctx.fillRect(17, 59, 16, 3); // коріння
  blob(ctx, 24, 30, 11, 8, pal, rnd);
  blob(ctx, 14, 25, 9, 8, pal, rnd);
  blob(ctx, 34, 25, 9, 8, pal, rnd);
  blob(ctx, 24, 17 - variant, 12, 10, pal, rnd);
  return c;
}

// Текстури кущів/дерев (3 варіанти кожного) → { bush:[...], tree:[...] } з якорями для рендерера
export function buildPlantTextures(pixi) {
  const out = { bush: [], tree: [], size: { bush: BUSH, tree: TREE } };
  for (let v = 0; v < 3; v++) {
    for (const [kind, make] of [['bush', bushCanvas], ['tree', treeCanvas]]) {
      const tex = pixi.getCanvasTexture(`plant_${kind}_${v}`, make(v));
      tex.source.scaleMode = 'nearest';
      out[kind].push(tex);
    }
  }
  return out;
}
