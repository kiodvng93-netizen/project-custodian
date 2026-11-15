// js/render/pixiSpriteAtlas.js — Нарізання та кешування кадрів спрайт-листів для PixiJS v8

import { Rectangle, Texture } from 'pixi.js';

export class PixiSpriteAtlas {
  constructor(pixi) {
    this.pixi = pixi;
    this.grids = new Map();
  }

  // Кадри з автонарізки (spriteSlicer): rows[r][c] → Texture. null, якщо нарізки немає.
  ensureSliced(spriteManager, key) {
    const cacheKey = 'sliced_' + key;
    if (this.grids.has(cacheKey)) return this.grids.get(cacheKey);
    const rects = spriteManager && spriteManager.getFrameRects(key);
    if (!rects) return null;
    const baseTex = this.pixi.getCanvasTexture('sheet_' + key, spriteManager.getSource(key));
    if (!baseTex) return null;
    const rows = rects.map((row) => row.map((r) => new Texture({ source: baseTex.source, frame: new Rectangle(r.x, r.y, r.w, r.h) })));
    this.grids.set(cacheKey, rows);
    return rows;
  }

  // Біла силует-копія листа: справжній білий спалах удару і кольорові контури (еліта, Титан)
  ensureSilhouette(spriteManager, key) {
    const cacheKey = 'white_' + key;
    if (this.grids.has(cacheKey)) return this.grids.get(cacheKey);
    const rects = spriteManager && spriteManager.getFrameRects(key);
    const src = spriteManager && spriteManager.getSource(key);
    if (!rects || !src) return null;
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    const baseTex = this.pixi.getCanvasTexture('sheet_white_' + key, c);
    const rows = rects.map((row) => row.map((r) => new Texture({ source: baseTex.source, frame: new Rectangle(r.x, r.y, r.w, r.h) })));
    this.grids.set(cacheKey, rows);
    return rows;
  }

  getSilhouette(spriteManager, key, row, col) {
    const rows = this.ensureSilhouette(spriteManager, key);
    if (!rows) return null;
    const r = rows[Math.max(0, Math.min(rows.length - 1, row))];
    return r[((col % r.length) + r.length) % r.length];
  }

  getSliced(spriteManager, key, row, col) {
    const rows = this.ensureSliced(spriteManager, key);
    if (!rows) return null;
    const r = rows[Math.max(0, Math.min(rows.length - 1, row))];
    return r[((col % r.length) + r.length) % r.length];
  }

  // Робот: idle — ряд 0 (перші 4 кадри, далі емоції); їзда схід/захід — анімований ряд 1
  // (у листі їде праворуч, для заходу віддзеркалюємо); інші напрямки — ряд 3 за октантом.
  // { tex, bob, flip } — tex уже з правильними пропорціями, масштаб рахує рендерер.
  getRobotFrame(spriteManager, player, nowSec) {
    if (!this.ensureSliced(spriteManager, 'robot')) return null;
    const speed = Math.hypot(player.vx, player.vy);
    if (speed > 10) {
      const norm = ((player.facingAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const octant = Math.round(norm / (Math.PI / 4)) % 8; // 0 = E, 2 = S, 4 = W, 6 = N
      if (octant === 0 || octant === 4) {
        const col = Math.floor(nowSec * (6 + speed / 30));
        return { tex: this.getSliced(spriteManager, 'robot', 1, col), row: 1, col, bob: Math.sin(nowSec * 14) * 1.0, flip: octant === 4 ? -1 : 1 };
      }
      const dirMap = [2, 1, 0, 7, 6, 5, 4, 3];
      return { tex: this.getSliced(spriteManager, 'robot', 3, dirMap[octant]), row: 3, col: dirMap[octant], bob: Math.sin(nowSec * 14) * 1.5, flip: 1 };
    }
    const col = Math.floor(nowSec * 3) % 4;
    return { tex: this.getSliced(spriteManager, 'robot', 0, col), row: 0, col, bob: 0, flip: 1 };
  }

  ensureGrid(spriteManager, key) {
    if (this.grids.has(key)) return this.grids.get(key);
    if (!spriteManager || !spriteManager.has(key)) return null;

    const srcCanvas = spriteManager.getSource(key);
    const baseTex = this.pixi.getCanvasTexture(`sheet_${key}`, srcCanvas);
    if (!baseTex) return null;

    const meta = spriteManager.getMeta(key) || { cols: 1, rows: 1 };
    const cols = meta.cols || 1;
    const rows = meta.rows || 1;
    const fw = srcCanvas.width / cols;
    const fh = srcCanvas.height / rows;
    const inset = (fw > 20 && fh > 20) ? 1 : 0;

    const grid = [];
    for (let r = 0; r < rows; r++) {
      const rowArr = [];
      for (let c = 0; c < cols; c++) {
        rowArr.push(new Texture({
          source: baseTex.source,
          frame: new Rectangle(
            Math.floor(c * fw) + inset,
            Math.floor(r * fh) + inset,
            Math.max(1, Math.floor(fw) - inset * 2),
            Math.max(1, Math.floor(fh) - inset * 2)
          )
        }));
      }
      grid.push(rowArr);
    }

    this.grids.set(key, grid);
    return grid;
  }

  // Кадр тіла (купа решток) за явним прямокутником meta.corpseFrames[variant]
  getCorpseFrame(spriteManager, key, variant = 0) {
    const cacheKey = `corpse_${key}_${variant}`;
    if (this.grids.has(cacheKey)) return this.grids.get(cacheKey);
    const meta = spriteManager && spriteManager.getMeta(key);
    if (!meta || !meta.corpseFrames || !spriteManager.has(key)) return null;
    const rect = meta.corpseFrames[variant % meta.corpseFrames.length];
    const baseTex = this.pixi.getCanvasTexture(`sheet_${key}`, spriteManager.getSource(key));
    if (!baseTex) return null;
    const tex = new Texture({ source: baseTex.source, frame: new Rectangle(rect[0], rect[1], rect[2], rect[3]) });
    this.grids.set(cacheKey, tex);
    return tex;
  }

  getFrame(spriteManager, key, row = 0, col = 0) {
    const grid = this.ensureGrid(spriteManager, key);
    if (!grid || grid.length === 0) return null;
    const safeRow = Math.max(0, Math.min(grid.length - 1, row));
    const rowArr = grid[safeRow];
    if (!rowArr || rowArr.length === 0) return null;
    const safeCol = ((col % rowArr.length) + rowArr.length) % rowArr.length;
    return rowArr[safeCol];
  }
}