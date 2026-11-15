// js/groundCover.js — Покрив землі (мох, трава, квіти): окремі чанки-canvas над шаром крові (під живими).
// Окремий шар потрібен, бо старіння крові (decals.js) фарбує весь чанк і перетемнило б траву.
// Мазки запікаються назавжди на забіг і нічого не коштують щокадру (ES Module).

import { CONFIG } from './config.js';

const MOSS_COLORS = ['rgba(52, 96, 58, 0.24)', 'rgba(40, 78, 54, 0.24)', 'rgba(70, 104, 56, 0.20)'];
const GRASS_COLORS = ['#3f7048', '#4d8452', '#35623f', '#5c8f55'];
const FLOWER_COLORS = ['#d8c36a', '#d98fa6', '#8fb4e0', '#e8e4d8', '#b79be0'];

class CoverChunk {
  constructor(cx, cy, size) {
    this.cx = cx; this.cy = cy; this.size = size;
    this.worldX = cx * size; this.worldY = cy * size;
    this.canvas = document.createElement('canvas');
    this.canvas.width = size; this.canvas.height = size;
    this.ctx = this.canvas.getContext('2d');
    this.needsTextureUpdate = false;
    this.lastUploadAt = 0;
    this.lastUsed = performance.now();
  }
}

// Піксельний крок малювання (світові px): мазки вирівняні по сітці 2 px
const PX = 2;

export class GroundCover {
  constructor() {
    this.chunkSize = CONFIG.DECALS.chunkSize;
    this.chunks = new Map();
    this.maxChunks = 160;
    this.onEvict = null;   // рендерер звільняє текстуру чанка
  }

  key(cx, cy) { return `${cx},${cy}`; }

  getChunk(cx, cy) {
    const k = this.key(cx, cy);
    let c = this.chunks.get(k);
    if (!c) {
      if (this.chunks.size >= this.maxChunks) {
        let oldest = null, t = Infinity;
        for (const [kk, cc] of this.chunks) if (cc.lastUsed < t) { t = cc.lastUsed; oldest = kk; }
        if (oldest) this.evict(oldest);
      }
      c = new CoverChunk(cx, cy, this.chunkSize);
      this.chunks.set(k, c);
    }
    c.lastUsed = performance.now();
    return c;
  }

  evict(k) {
    this.chunks.delete(k);
    if (this.onEvict) this.onEvict(k);
  }

  clear() {
    for (const k of [...this.chunks.keys()]) this.evict(k);
  }

  // Мазок у світових координатах; дрібні мазки (≤ ~30 px) не перетинають більше одного чанка
  // помітно, але для безпечності малюємо в усі чанки, яких торкається габарит
  paint(x, y, reach, draw) {
    const cs = this.chunkSize;
    const x0 = Math.floor((x - reach) / cs), x1 = Math.floor((x + reach) / cs);
    const y0 = Math.floor((y - reach) / cs), y1 = Math.floor((y + reach) / cs);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const ch = this.getChunk(cx, cy);
        draw(ch.ctx, x - ch.worldX, y - ch.worldY);
        ch.needsTextureUpdate = true;
      }
    }
  }

  mossBlob(x, y, rnd) {
    const color = MOSS_COLORS[(rnd() * MOSS_COLORS.length) | 0];
    const n = 8 + ((rnd() * 6) | 0);
    this.paint(x, y, 32, (ctx, lx, ly) => {
      ctx.fillStyle = color;
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2, d = rnd() * 22;
        const s = PX * (3 + ((rnd() * 3) | 0));
        ctx.fillRect(Math.round((lx + Math.cos(a) * d) / PX) * PX, Math.round((ly + Math.sin(a) * d) / PX) * PX, s, s);
      }
    });
  }

  // Пучок трави: 2–3 пікселі-стебла різної висоти
  grassTuft(x, y, rnd) {
    const color = GRASS_COLORS[(rnd() * GRASS_COLORS.length) | 0];
    const blades = 3 + ((rnd() * 2) | 0);
    this.paint(x, y, 10, (ctx, lx, ly) => {
      ctx.fillStyle = color;
      const bx = Math.round(lx / PX) * PX, by = Math.round(ly / PX) * PX;
      for (let i = 0; i < blades; i++) {
        const h = PX * (3 + ((rnd() * 4) | 0));
        ctx.fillRect(bx + (i - 1) * PX, by - h, PX, h);
      }
    });
  }

  // Маленька квітка: хрестик 3×3 пікселі з серединкою
  flower(x, y, rnd) {
    const color = FLOWER_COLORS[(rnd() * FLOWER_COLORS.length) | 0];
    this.paint(x, y, 8, (ctx, lx, ly) => {
      const bx = Math.round(lx / PX) * PX, by = Math.round(ly / PX) * PX;
      ctx.fillStyle = color;
      ctx.fillRect(bx - PX, by, PX, PX); ctx.fillRect(bx + PX, by, PX, PX);
      ctx.fillRect(bx, by - PX, PX, PX); ctx.fillRect(bx, by + PX, PX, PX);
      ctx.fillStyle = '#e9d36a';
      ctx.fillRect(bx, by, PX, PX);
    });
  }
}
