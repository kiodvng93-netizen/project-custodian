// js/pickups.js — Лут (Bio-Essence, Tech Scrap) і магнітний підбір (ES Module)

import { CONFIG } from './config.js';
import { Telemetry } from './telemetry.js';
import { state, spawnFlash } from './state.js';
import { audio } from './audio.js';

export class Pickup {
  constructor(x, y, type = 'bio', value = 1) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 50;
    this.vy = (Math.random() - 0.5) * 50;
    this.type = type;
    this.value = value;
    this.radius = 6;
    this.alive = true;
    this.isMagnetized = false;
    this.homingSpeed = 220;
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= CONFIG.PLAYER.pickupRadius) {
      this.isMagnetized = true;
    }

    if (this.isMagnetized) {
      const angle = Math.atan2(dy, dx);
      this.homingSpeed = Math.min(
        this.homingSpeed + CONFIG.PICKUPS.magnetAcceleration * dt * 1.5,
        1050
      );

      this.vx = Math.cos(angle) * this.homingSpeed;
      this.vy = Math.sin(angle) * this.homingSpeed;

      const stepDistance = this.homingSpeed * dt;
      if (dist <= stepDistance + this.radius + player.radius) {
        this.collect();
        return;
      }
    } else {
      const friction = Math.pow(0.90, dt * 60);
      this.vx *= friction;
      this.vy *= friction;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  collect() {
    this.alive = false;
    if (this.type === 'fruit') {
      // Плід: лікує робота (шлях player.heal), зелене «+N» і спалах
      const p = state.player, before = p.health;
      p.heal(this.value);
      const gained = Math.round(p.health - before);
      state.plants.onEaten(gained);
      state.damageTexts.push({ x: p.x, y: p.y - p.radius - 18, text: `+${gained} HP`, life: 1.0, color: '#9ae6b4' });
      spawnFlash(p.x, p.y, { radius: 34, tint: 0x9ae6b4, life: 0.28 });
      audio.play('fruit_eaten');
    } else if (this.type === 'bio') {
      Telemetry.metrics.resourcesCollected.bioEssence += this.value;
      Telemetry.recordEvent('LOOT', `+${this.value} Bio-Essence collected!`);
      audio.play('xp_pickup', { x: this.x, y: this.y });
    } else {
      Telemetry.metrics.resourcesCollected.techScrap += this.value;
      Telemetry.recordEvent('LOOT', `+${this.value} Tech Scrap collected!`);
      audio.play('scrap_pickup', { x: this.x, y: this.y });
    }
  }

  render(ctx, spriteManager = null) {
    const spriteKey = this.type === 'bio' ? 'pickup_bio' : 'pickup_tech';
    if (spriteManager && spriteManager.drawCentered(ctx, spriteKey, this.x, this.y, 18)) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    const pulse = Math.sin(performance.now() / 200) * 1.5;

    if (this.type === 'bio') {
      ctx.fillStyle = '#48bb78';
      ctx.strokeStyle = '#9ae6b4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -this.radius - pulse);
      ctx.lineTo(this.radius + pulse, 0);
      ctx.lineTo(0, this.radius + pulse);
      ctx.lineTo(-this.radius - pulse, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ecc94b';
      ctx.fillRect(-this.radius / 2, -this.radius / 2, this.radius, this.radius);
    }

    ctx.restore();
  }
}

export class PickupManager {
  constructor() {
    this.pickups = [];
  }

  spawn(x, y, type = 'bio', val = 1) {
    this.pickups.push(new Pickup(x, y, type, val));
  }

  // Плід з рослини: одразу летить до робота, лікує на value HP
  spawnFruit(x, y, heal) {
    const p = new Pickup(x, y, 'fruit', heal);
    p.isMagnetized = true;
    p.homingSpeed = 240;
    p.radius = 5;
    this.pickups.push(p);
  }

  hasFruit() {
    for (let i = 0; i < this.pickups.length; i++) if (this.pickups[i].type === 'fruit' && this.pickups[i].alive) return true;
    return false;
  }

  vacuumInRadius(x, y, radius = 900) {
    const rSq = radius * radius;
    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      if (!p.alive) continue;
      const dx = p.x - x;
      const dy = p.y - y;
      if (dx * dx + dy * dy <= rSq) {
        p.isMagnetized = true;
        p.homingSpeed = Math.max(p.homingSpeed, 520);
      }
    }
  }

  update(dt, player) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      this.pickups[i].update(dt, player);
      if (!this.pickups[i].alive) {
        this.pickups.splice(i, 1);
      }
    }
  }

  render(ctx, spriteManager = null) {
    for (let i = 0; i < this.pickups.length; i++) {
      this.pickups[i].render(ctx, spriteManager);
    }
  }
}