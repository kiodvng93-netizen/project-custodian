// js/world/hazards.js — Зони слизу/павутиння Кільця 2+, візуалізація фронтальної броні та HUD

import { CONFIG } from '../config.js';

function hash01(ix, iy, seed = 0) {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class RingHazardManager {
  constructor() {
    this._patch = { x: 0, y: 0, radius: 0, type: 'slime' };
    this._sample = { inHazard: false, type: null, slowFactor: 0 };
  }

  getCellPatch(cx, cy, out) {
    const cfg = CONFIG.HAZARDS;
    const cellSize = cfg.cellSize;
    const px = (cx + 0.5) * cellSize + (hash01(cx, cy, 1) - 0.5) * cellSize * 0.45;
    const py = (cy + 0.5) * cellSize + (hash01(cx, cy, 2) - 0.5) * cellSize * 0.45;
    const dist = Math.hypot(px, py);

    if (dist <= CONFIG.WORLD.ring1Radius + 140) return false;

    const chance = dist > CONFIG.WORLD.ring2Radius ? cfg.ring3SpawnChance : cfg.ring2SpawnChance;
    if (hash01(cx, cy, 3) >= chance) return false;

    out.x = px;
    out.y = py;
    out.radius = cfg.minRadius + hash01(cx, cy, 4) * (cfg.maxRadius - cfg.minRadius);
    out.type = hash01(cx, cy, 5) < 0.5 ? 'slime' : 'web';
    return true;
  }

  sampleAt(x, y) {
    const res = this._sample;
    res.inHazard = false;
    res.type = null;
    res.slowFactor = 0;

    const ring1 = CONFIG.WORLD.ring1Radius;
    if (x * x + y * y <= ring1 * ring1) return res;

    const cellSize = CONFIG.HAZARDS.cellSize;
    const baseCx = Math.floor(x / cellSize);
    const baseCy = Math.floor(y / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (!this.getCellPatch(baseCx + dx, baseCy + dy, this._patch)) continue;
        const ox = x - this._patch.x;
        const oy = y - this._patch.y;
        const r = this._patch.radius;
        if (ox * ox + oy * oy <= r * r) {
          res.inHazard = true;
          res.type = this._patch.type;
          res.slowFactor = CONFIG.HAZARDS.slimeSlowFactor;
          return res;
        }
      }
    }
    return res;
  }

  renderWorldOverlay(ctx, enemyManager, camera, viewW, viewH) {
    const camDist = Math.hypot(camera.x, camera.y);
    const ring1 = CONFIG.WORLD.ring1Radius;
    const viewDiag = Math.hypot(viewW, viewH) * 0.65;

    if (Math.abs(camDist - ring1) < viewDiag + 200) {
      ctx.save();
      ctx.strokeStyle = 'rgba(237, 137, 54, 0.55)';
      ctx.lineWidth = 4;
      ctx.setLineDash([18, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, ring1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    if (camDist + viewDiag > ring1) {
      const cfg = CONFIG.HAZARDS;
      const cellSize = cfg.cellSize;
      const pad = cfg.maxRadius + 40;
      const minCx = Math.floor((camera.x - viewW * 0.5 - pad) / cellSize);
      const maxCx = Math.floor((camera.x + viewW * 0.5 + pad) / cellSize);
      const minCy = Math.floor((camera.y - viewH * 0.5 - pad) / cellSize);
      const maxCy = Math.floor((camera.y + viewH * 0.5 + pad) / cellSize);

      ctx.save();
      for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cy = minCy; cy <= maxCy; cy++) {
          if (!this.getCellPatch(cx, cy, this._patch)) continue;
          const p = this._patch;
          if (p.type === 'slime') {
            ctx.fillStyle = 'rgba(72, 187, 120, 0.16)';
            ctx.strokeStyle = 'rgba(104, 211, 145, 0.42)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'rgba(154, 230, 180, 0.20)';
            ctx.beginPath();
            ctx.arc(p.x - p.radius * 0.25, p.y - p.radius * 0.2, p.radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(160, 174, 192, 0.13)';
            ctx.strokeStyle = 'rgba(226, 232, 240, 0.38)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = 'rgba(226, 232, 240, 0.24)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let s = 0; s < 6; s++) {
              const a = (s * Math.PI) / 3;
              ctx.moveTo(p.x - Math.cos(a) * p.radius, p.y - Math.sin(a) * p.radius);
              ctx.lineTo(p.x + Math.cos(a) * p.radius, p.y + Math.sin(a) * p.radius);
            }
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    if (!enemyManager || !enemyManager.enemies) return;
    const halfArc = CONFIG.ENEMIES.ARMOR.frontHalfAngle;
    const halfW = viewW * 0.5 + 80;
    const halfH = viewH * 0.5 + 80;

    ctx.save();
    for (let i = 0; i < enemyManager.enemies.length; i++) {
      const e = enemyManager.enemies[i];
      if (!e.alive || !e.hasFrontalArmor) continue;
      if (Math.abs(e.x - camera.x) > halfW || Math.abs(e.y - camera.y) > halfH) continue;

      const flash = e.armorFlashTimer > 0;
      ctx.strokeStyle = flash ? '#ffffff' : '#90cdf4';
      ctx.lineWidth = flash ? 4.5 : 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius + 5, e.facingAngle - halfArc, e.facingAngle + halfArc);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderHazardHUD(ctx, canvas, player) {
    const dist = Math.hypot(player.x, player.y);
    const inRing2 = dist > CONFIG.WORLD.ring1Radius;
    if (!inRing2 && !player.inSlimeZone) return;

    const w = 310;
    const h = player.inSlimeZone ? 40 : 24;
    const x = canvas.width / 2 - w / 2;
    const y = 94;

    ctx.save();
    ctx.fillStyle = 'rgba(13, 16, 23, 0.85)';
    ctx.strokeStyle = player.inSlimeZone ? '#68d391' : '#ed8936';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    ctx.textAlign = 'center';
    ctx.font = 'bold 11px monospace';
    const ringLabel = dist > CONFIG.WORLD.ring2Radius ? 'RING 3: DEEP HIVE' : 'RING 2: OUTER MIRE (ARMORED FOES)';
    ctx.fillStyle = '#fbd38d';
    ctx.fillText(ringLabel, canvas.width / 2, y + 16);

    if (player.inSlimeZone) {
      const pct = Math.round((1 - (player.currentTerrainMult || 1)) * 100);
      const tag = player.currentHazardType === 'web' ? 'CHITIN WEB' : 'TOXIC SLIME';
      ctx.fillStyle = pct > 0 ? '#9ae6b4' : '#63b3ed';
      ctx.fillText(pct > 0 ? `${tag}: -${pct}% SPEED` : `${tag}: CLEATS IMMUNE`, canvas.width / 2, y + 32);
    }
    ctx.restore();
  }
}