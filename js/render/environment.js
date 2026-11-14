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

  ctx.strokeStyle = 'rgba(237, 137, 54, 0.55)';
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 16]);
  ctx.beginPath();
  ctx.arc(0, 0, CONFIG.WORLD.ring1Radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function renderSanctuaryHub(ctx, spriteManager, sanctuary = null) {
  const broken = sanctuary && sanctuary.domeBroken;
  const radius = CONFIG.HUB.radius;
  ctx.save();
  let drawn = false;
  if (!broken && spriteManager) {
    try {
      const hubPattern = spriteManager.getPattern(ctx, 'tile_hub');
      if (hubPattern) {
        ctx.fillStyle = hubPattern;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        drawn = true;
      }
    } catch (e) {}
  }

  if (!drawn) {
    ctx.fillStyle = broken ? 'rgba(229, 62, 62, 0.14)' : 'rgba(72, 187, 120, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = broken ? '#e53e3e' : '#48bb78';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = broken ? '#e53e3e' : '#48bb78';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#a0aec0';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(broken ? 'SANCTUARY GATE [BREACHED]' : 'SANCTUARY GATE (0, 0)', 0, 36);
  ctx.restore();
}