// js/world/evac.js — Маяк евакуації: фінал забігу біля відновленого Пурифаєра

import { CONFIG } from '../config.js';
import { state, spawnShockwave } from '../state.js';
import { Telemetry } from '../telemetry.js';
import { Enemy } from '../enemies/enemy.js';

export class EvacBeacon {
  constructor(landmark) {
    this.landmark = landmark;
    this.state = 'idle'; // 'idle' | 'active' | 'complete'
    this.totalTime = CONFIG.EVAC.duration;
    this.timer = this.totalTime;
    this.holdRadius = CONFIG.WORLD.terraformedRadius;
    this.playerInZone = false;
    this.ambushTimer = 0;
  }

  get isActive() {
    return this.state === 'active';
  }

  isPlayerInRange(player) {
    return Math.hypot(player.x - this.landmark.x, player.y - this.landmark.y) <= this.holdRadius;
  }

  canCall(player) {
    return this.state === 'idle' && this.landmark.repaired && this.isPlayerInRange(player);
  }

  // Поле Пурифаєра вимикається — вся енергія йде в маяк, вороги заходять у зону
  call(player, enemyManager) {
    if (!this.canCall(player)) return false;
    this.state = 'active';
    this.timer = this.totalTime;
    this.ambushTimer = 0;
    this.playerInZone = true;
    Telemetry.metrics.evacsCalled++;
    if (state.camera) state.camera.addTrauma(0.5);
    spawnShockwave(this.landmark.x, this.landmark.y, { radius: 20, maxRadius: this.holdRadius + 120, color: '#63b3ed', speed: 460, lineWidth: 6 });
    Telemetry.recordEvent('EVAC', `Evac called! Hold the beacon for ${this.totalTime}s.`);
    this.spawnAmbush(enemyManager);
    return true;
  }

  spawnAmbush(enemyManager) {
    if (!enemyManager) return;
    const count = CONFIG.EVAC.ambushCount;
    const r = CONFIG.EVAC.ambushRadius;
    const offset = Math.random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      if (enemyManager.enemies.length >= CONFIG.ENEMIES.maxActive) break;
      const a = offset + (i * Math.PI * 2) / count;
      const type = i % 4 === 0 ? 'stalker' : i % 3 === 0 ? 'dasher' : 'sprout';
      enemyManager.enemies.push(new Enemy(this.landmark.x + Math.cos(a) * r, this.landmark.y + Math.sin(a) * r, type));
    }
  }

  // Повертає true у кадрі, коли евакуація завершилась
  update(dt, player, enemyManager) {
    if (!this.isActive) return false;
    this.playerInZone = this.isPlayerInRange(player);

    this.ambushTimer += dt;
    if (this.ambushTimer >= CONFIG.EVAC.ambushInterval) {
      this.ambushTimer = 0;
      this.spawnAmbush(enemyManager);
    }

    if (!this.playerInZone) return false;
    this.timer -= dt;
    if (this.timer > 0) return false;
    this.timer = 0;
    this.state = 'complete';
    return true;
  }

  render(ctx) {
    if (!this.isActive) return;
    const { x, y } = this.landmark;
    const pulse = Math.sin(performance.now() / 160) * 4;
    ctx.save();
    ctx.fillStyle = this.playerInZone ? 'rgba(99, 179, 237, 0.10)' : 'rgba(229, 62, 62, 0.12)';
    ctx.beginPath();
    ctx.arc(x, y, this.holdRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.playerInZone ? '#63b3ed' : '#fc8181';
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Промінь маяка
    ctx.strokeStyle = 'rgba(190, 227, 248, 0.55)';
    ctx.lineWidth = 6 + pulse;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 260);
    ctx.stroke();
    ctx.restore();
  }
}
