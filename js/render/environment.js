// js/render/environment.js — Отрисовка окружения, процедурной сетки и Хаба

import { CONFIG } from '../config.js';

export function renderWorldGrid(ctx, canvas, camera, spriteManager) {
  const viewLeft = camera.x - canvas.width / 2 - 100;
  const viewRight = camera.x + canvas.width / 2 + 100;
  const viewTop = camera.y - canvas.height / 2 - 100;
  const viewBottom = camera.y + canvas.height / 2 + 100;
  const w = viewRight - viewLeft;
  const h = viewBottom - viewTop;

  let drawn = false;
  if (spriteManager) {
    try {
      const pattern = spriteManager.getPattern(ctx, 'tile_wasteland');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(viewLeft, viewTop, w, h);
        drawn = true;
      }
    } catch (e) {}
  }

  if (!drawn) {
    ctx.fillStyle = '#12151c';
    ctx.fillRect(viewLeft, viewTop, w, h);

    const gridSize = CONFIG.WORLD.tileGridSize || 64;
    ctx.strokeStyle = 'rgba(45, 55, 72, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(viewLeft / gridSize) * gridSize; x <= viewRight; x += gridSize) {
      ctx.moveTo(x, viewTop);
      ctx.lineTo(x, viewBottom);
    }
    for (let y = Math.floor(viewTop / gridSize) * gridSize; y <= viewBottom; y += gridSize) {
      ctx.moveTo(viewLeft, y);
      ctx.lineTo(viewRight, y);
    }
    ctx.stroke();
  }

  // Граница текущего кольца биома
  ctx.strokeStyle = 'rgba(237, 137, 54, 0.55)';
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 16]);
  ctx.beginPath();
  ctx.arc(0, 0, CONFIG.WORLD.ring1Radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function renderSanctuaryHub(ctx, spriteManager) {
  ctx.save();
  let drawn = false;
  if (spriteManager) {
    try {
      const hubPattern = spriteManager.getPattern(ctx, 'tile_hub');
      if (hubPattern) {
        ctx.fillStyle = hubPattern;
        ctx.beginPath();
        ctx.arc(0, 0, 180, 0, Math.PI * 2);
        ctx.fill();
        drawn = true;
      }
    } catch (e) {}
  }

  if (!drawn) {
    ctx.fillStyle = 'rgba(72, 187, 120, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, 180, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#48bb78';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#48bb78';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#a0aec0';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SANCTUARY GATE (0, 0)', 0, 36);
  ctx.restore();
}