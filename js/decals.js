// js/decals.js — Чанкова система декалів (сліди слизу, олії, опіків) (ES Module)

import { CONFIG } from './config.js';

export class DecalChunk {
  constructor(cx, cy, size = 512) {
    this.cx = cx;
    this.cy = cy;
    this.size = size;
    this.worldX = cx * size;
    this.worldY = cy * size;

    this.canvas = document.createElement('canvas');
    this.canvas.width = size;
    this.canvas.height = size;
    this.ctx = this.canvas.getContext('2d');
    this.lastUsed = performance.now();
    this.needsTextureUpdate = false;
  }

  touch() {
    this.lastUsed = performance.now();
  }
}

export class DecalManager {
  constructor() {
    this.chunkSize = (CONFIG.DECALS && CONFIG.DECALS.chunkSize) || 512;
    this.maxChunks = (CONFIG.DECALS && CONFIG.DECALS.maxChunks) || 128;
    this.chunks = new Map();
  }

  getChunkKey(cx, cy) {
    return `${cx},${cy}`;
  }

  getOrCreateChunk(cx, cy) {
    const key = this.getChunkKey(cx, cy);
    let chunk = this.chunks.get(key);

    if (!chunk) {
      if (this.chunks.size >= this.maxChunks) {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [k, c] of this.chunks.entries()) {
          if (c.lastUsed < oldestTime) {
            oldestTime = c.lastUsed;
            oldestKey = k;
          }
        }
        if (oldestKey) this.chunks.delete(oldestKey);
      }

      chunk = new DecalChunk(cx, cy, this.chunkSize);
      this.chunks.set(key, chunk);
    }

    chunk.touch();
    return chunk;
  }

  paintOnWorld(worldX, worldY, radius, drawCallback) {
    const minCx = Math.floor((worldX - radius) / this.chunkSize);
    const maxCx = Math.floor((worldX + radius) / this.chunkSize);
    const minCy = Math.floor((worldY - radius) / this.chunkSize);
    const maxCy = Math.floor((worldY + radius) / this.chunkSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const chunk = this.getOrCreateChunk(cx, cy);
        const localX = worldX - chunk.worldX;
        const localY = worldY - chunk.worldY;

        chunk.ctx.save();
        drawCallback(chunk.ctx, localX, localY);
        chunk.ctx.restore();
        chunk.needsTextureUpdate = true;
      }
    }
  }

  addSplatter(x, y, options = {}) {
    const type = options.type || 'slime';
    const radius = options.radius || 18;
    const dirX = options.dirX || 0;
    const dirY = options.dirY || 0;
    const count = options.count || 8;

    let baseColor = 'rgba(74, 222, 128, 0.7)';
    let deepColor = 'rgba(22, 101, 52, 0.85)';
    let glowColor = 'rgba(187, 247, 208, 0.9)';

    if (type === 'corrupt') {
      baseColor = 'rgba(159, 18, 57, 0.75)';
      deepColor = 'rgba(76, 5, 25, 0.9)';
      glowColor = 'rgba(251, 113, 133, 0.85)';
    } else if (type === 'oil') {
      baseColor = 'rgba(30, 41, 59, 0.85)';
      deepColor = 'rgba(15, 23, 42, 0.95)';
      glowColor = 'rgba(71, 85, 105, 0.6)';
    } else if (type === 'amber') {
      baseColor = 'rgba(217, 119, 6, 0.8)';
      deepColor = 'rgba(120, 53, 15, 0.9)';
      glowColor = 'rgba(253, 230, 138, 0.85)';
    }

    const boundRadius = radius * 2.8;

    this.paintOnWorld(x, y, boundRadius, (ctx, lx, ly) => {
      ctx.fillStyle = deepColor;
      ctx.beginPath();
      const points = 7;
      for (let i = 0; i < points; i++) {
        const angle = (i * Math.PI * 2) / points;
        const rVar = radius * (0.65 + Math.random() * 0.55);
        const px = lx + Math.cos(angle) * rVar;
        const py = ly + Math.sin(angle) * rVar;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(lx, ly, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      const baseAngle = (dirX !== 0 || dirY !== 0) ? Math.atan2(dirY, dirX) : Math.random() * Math.PI * 2;
      const spread = (dirX !== 0 || dirY !== 0) ? 1.2 : Math.PI * 2;

      for (let i = 0; i < count; i++) {
        const a = baseAngle + (Math.random() - 0.5) * spread;
        const dist = radius * (0.8 + Math.random() * 1.5);
        const dropR = 1.5 + Math.random() * (radius * 0.18);
        const dx = lx + Math.cos(a) * dist;
        const dy = ly + Math.sin(a) * dist;

        ctx.fillStyle = Math.random() > 0.4 ? baseColor : glowColor;
        ctx.beginPath();
        ctx.arc(dx, dy, dropR, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  addScorch(x, y, radius = 28) {
    const boundRadius = radius * 1.4;
    this.paintOnWorld(x, y, boundRadius, (ctx, lx, ly) => {
      const grad = ctx.createRadialGradient(lx, ly, radius * 0.15, lx, ly, radius);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
      grad.addColorStop(0.55, 'rgba(67, 20, 7, 0.55)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(10, 10, 15, 0.75)';
      ctx.beginPath();
      ctx.arc(lx + (Math.random() - 0.5) * 4, ly + (Math.random() - 0.5) * 4, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  render(ctx, cameraX, cameraY, viewWidth, viewHeight) {
    const halfW = viewWidth / 2;
    const halfH = viewHeight / 2;
    const minCx = Math.floor((cameraX - halfW) / this.chunkSize);
    const maxCx = Math.floor((cameraX + halfW) / this.chunkSize);
    const minCy = Math.floor((cameraY - halfH) / this.chunkSize);
    const maxCy = Math.floor((cameraY + halfH) / this.chunkSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const chunk = this.chunks.get(this.getChunkKey(cx, cy));
        if (chunk) {
          chunk.touch();
          ctx.drawImage(chunk.canvas, chunk.worldX, chunk.worldY);
        }
      }
    }
  }

  clear() {
    this.chunks.clear();
  }
}