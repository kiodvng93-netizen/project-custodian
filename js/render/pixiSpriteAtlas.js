// js/render/pixiSpriteAtlas.js — Нарізання та кешування кадрів спрайт-листів для PixiJS v8

import { Rectangle, Texture } from 'pixi.js';

export class PixiSpriteAtlas {
  constructor(pixi) {
    this.pixi = pixi;
    this.grids = new Map();
    this.robotFrames = null;
  }

  ensureRobot(spriteManager) {
    if (this.robotFrames || !spriteManager || !spriteManager.has('robot')) return;
    const srcCanvas = spriteManager.getSource('robot');
    const baseTex = this.pixi.getCanvasTexture('robot_sheet', srcCanvas);
    const meta = spriteManager.getMeta('robot') || { cols: 7, moveCols: 8, rows: 4 };
    if (!baseTex) return;

    const rowH = srcCanvas.height / meta.rows;
    const idleW = srcCanvas.width / meta.cols;
    const moveW = srcCanvas.width / meta.moveCols;

    this.robotFrames = { idle: [], move: [] };
    for (let c = 0; c < 4; c++) {
      this.robotFrames.idle.push(new Texture({
        source: baseTex.source,
        frame: new Rectangle(c * idleW, 0, idleW, rowH)
      }));
    }
    for (let c = 0; c < meta.moveCols; c++) {
      this.robotFrames.move.push(new Texture({
        source: baseTex.source,
        frame: new Rectangle(c * moveW, 3 * rowH, moveW, rowH)
      }));
    }
  }

  getRobotFrame(spriteManager, player, nowSec) {
    this.ensureRobot(spriteManager);
    if (!this.robotFrames) return null;

    if (Math.hypot(player.vx, player.vy) > 10) {
      const norm = ((player.facingAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const dirMap = [2, 1, 0, 7, 6, 5, 4, 3];
      const octant = Math.round(norm / (Math.PI / 4)) % 8;
      return { tex: this.robotFrames.move[dirMap[octant]], bob: Math.sin(nowSec * 14) * 1.5 };
    }

    const col = Math.floor(nowSec * 3) % 4;
    return { tex: this.robotFrames.idle[col], bob: 0 };
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