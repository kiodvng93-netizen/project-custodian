// js/decals.js — Чанкова система декалів (сліди слизу, олії, опіків) (ES Module)

import { CONFIG } from './config.js';
import { paintSplatter } from './gore.js';

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
    this.uploadIntervalMs = CONFIG.DECALS.textureUploadInterval * 1000;
    this.chunks = new Map();
    // Викликається з ключем чанку при витісненні/очищенні — рендерер звільняє свою текстуру
    this.onEvict = null;
  }

  evictChunk(key) {
    this.chunks.delete(key);
    if (this.onEvict) this.onEvict(key);
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
        if (oldestKey) this.evictChunk(oldestKey);
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

  // Сумісна обгортка: type = ключ палітри крові з gore.js (slime/corrupt/ichor/venom/amber/oil)
  addSplatter(x, y, options = {}) {
    paintSplatter(this, x, y, {
      blood: options.type || 'slime',
      radius: options.radius || 18,
      dirX: options.dirX || 0,
      dirY: options.dirY || 0,
      power: options.power || 1,
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
    for (const key of [...this.chunks.keys()]) this.evictChunk(key);
  }
}