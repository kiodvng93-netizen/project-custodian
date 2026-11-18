// js/world/outpost.js — Польові аутпости страхування здобичі (швидка 12с оборона)

import { CONFIG, MetaProgression, saveMetaProgression } from '../config.js';
import { state, spawnShockwave } from '../state.js';
import { Telemetry } from '../telemetry.js';
import { audio } from '../audio.js';
import { Enemy } from '../enemies/enemy.js';

export class InsuranceOutpost {
  constructor(x, y) {
    const cfg = CONFIG.OUTPOST;
    this.x = x;
    this.y = y;
    this.radius = cfg.radius;
    this.captureRadius = cfg.captureRadius;
    this.totalTime = cfg.defenseDuration;
    this.timer = this.totalTime;
    this.state = 'idle'; // 'idle' | 'active' | 'secured'
    this.playerInZone = false;
  }

  activate(player, enemyManager) {
    if (this.state !== 'idle') return false;
    this.state = 'active';
    this.timer = this.totalTime;
    this.playerInZone = true;

    if (state.camera) state.camera.addTrauma(0.35);
    spawnShockwave(this.x, this.y, { radius: 18, maxRadius: 240, color: '#63b3ed', speed: 400, lineWidth: 5 });
    Telemetry.recordEvent('OUTPOST', `Scrap Insurance active! Hold point for ${Math.round(this.totalTime)}s!`);
    audio.play('outpost_start', { x: this.x, y: this.y });

    if (enemyManager && enemyManager.enemies.length < CONFIG.ENEMIES.maxActive) {
      const count = CONFIG.OUTPOST.ambushCount || 8;
      for (let i = 0; i < count; i++) {
        const a = (i * Math.PI * 2) / count;
        const type = i % 4 === 0 ? 'stalker' : i % 2 === 0 ? 'dasher' : 'sprout';
        enemyManager.enemies.push(new Enemy(this.x + Math.cos(a) * 380, this.y + Math.sin(a) * 380, type));
      }
    }
    return true;
  }

  update(dt, player) {
    if (this.state !== 'active') return;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    this.playerInZone = dist <= this.captureRadius;

    if (this.playerInZone) {
      this.timer -= dt;
      if (this.timer <= 0) this.complete(player);
    }
  }

  complete(player) {
    this.state = 'secured';
    this.timer = 0;

    const cfg = CONFIG.OUTPOST;
    const carried = Telemetry.metrics.resourcesCollected.techScrap;
    const bonus = Math.max(cfg.minBonusScrap, Math.ceil(carried * cfg.bonusRate));
    const totalBanked = carried + bonus;

    MetaProgression.bankedTechScrap += totalBanked;
    Telemetry.metrics.resourcesBanked.techScrap += totalBanked;
    Telemetry.metrics.resourcesCollected.techScrap = 0;
    saveMetaProgression();

    player.heal(cfg.healReward || 20);
    if (player.shieldCharges < player.maxShieldCharges) player.shieldCharges++;

    if (state.camera) state.camera.addTrauma(0.45);
    spawnShockwave(this.x, this.y, { radius: 20, maxRadius: 280, color: '#48bb78', speed: 460, lineWidth: 6 });
    audio.play('outpost_captured');
    Telemetry.recordEvent('BANK', `Outpost secured! Banked ${carried} + ${bonus} bonus = +${totalBanked} Scrap!`);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const pulse = Math.sin(performance.now() / 240) * 3;

    if (this.state === 'active') {
      ctx.fillStyle = this.playerInZone ? 'rgba(99, 179, 237, 0.14)' : 'rgba(229, 62, 62, 0.16)';
      ctx.beginPath(); ctx.arc(0, 0, this.captureRadius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = this.playerInZone ? '#63b3ed' : '#fc8181';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]);
    } else if (this.state === 'idle') {
      ctx.strokeStyle = 'rgba(99, 179, 237, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.arc(0, 0, this.captureRadius, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = this.state === 'secured' ? '#1c4532' : this.state === 'active' ? '#1a365d' : '#1e293b';
    ctx.strokeStyle = this.state === 'secured' ? '#48bb78' : '#63b3ed';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = this.state === 'secured' ? '#68d391' : this.state === 'active' ? '#ecc94b' : '#90cdf4';
    ctx.beginPath(); ctx.arc(0, 0, 10 + (this.state === 'active' ? pulse * 0.6 : 0), 0, Math.PI * 2); ctx.fill();

    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.state === 'secured' ? '#9ae6b4' : '#90cdf4';
    const tag = this.state === 'secured' ? 'OUTPOST [SECURED]' : this.state === 'active' ? `DEFENDING ${Math.ceil(this.timer)}s` : 'INSURANCE OUTPOST';
    ctx.fillText(tag, 0, this.radius + 16);
    ctx.restore();
  }
}

export function renderOutpostHUD(ctx, canvas, worldManager, player) {
  if (!worldManager || !worldManager.outposts) return;
  let near = null;
  for (let i = 0; i < worldManager.outposts.length; i++) {
    const o = worldManager.outposts[i];
    if (o.state === 'secured') continue;
    const d = Math.hypot(player.x - o.x, player.y - o.y);
    if (o.state === 'active' && d < o.captureRadius + 240) { near = o; break; }
    if (o.state === 'idle' && d <= o.captureRadius) { near = o; break; }
  }
  if (!near) return;

  const w = 440, h = 54, x = canvas.width / 2 - w / 2, y = canvas.height - 135;
  ctx.save();
  ctx.fillStyle = 'rgba(13, 16, 23, 0.88)';
  ctx.strokeStyle = near.state === 'active' ? (near.playerInZone ? '#63b3ed' : '#fc8181') : '#ecc94b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  ctx.textAlign = 'center';

  if (near.state === 'idle') {
    const carried = Telemetry.metrics.resourcesCollected.techScrap;
    const bonus = Math.max(CONFIG.OUTPOST.minBonusScrap, Math.ceil(carried * CONFIG.OUTPOST.bonusRate));
    ctx.fillStyle = '#ecc94b'; ctx.font = 'bold 12px monospace';
    ctx.fillText(`[E] INSURE SCRAP AT OUTPOST (HOLD ${Math.round(near.totalTime)}s)`, canvas.width / 2, y + 22);
    ctx.fillStyle = '#90cdf4'; ctx.font = '11px monospace';
    ctx.fillText(`SECURES ${carried} SCRAP + ${bonus} RISK BONUS`, canvas.width / 2, y + 40);
  } else {
    const ratio = Math.max(0, 1 - near.timer / near.totalTime);
    ctx.fillStyle = near.playerInZone ? '#90cdf4' : '#fc8181';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(near.playerInZone ? `OUTPOST DEFENSE: ${near.timer.toFixed(1)}s REMAINING` : '⚠ RETURN TO OUTPOST RING TO RESUME!', canvas.width / 2, y + 20);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x + 24, y + 30, w - 48, 10);
    ctx.fillStyle = near.playerInZone ? '#63b3ed' : '#e53e3e';
    ctx.fillRect(x + 24, y + 30, (w - 48) * ratio, 10);
  }
  ctx.restore();
}