// js/world/structures.js — Інтерактивні та фізичні структури світу

import { CONFIG, MetaProgression } from '../config.js';
import { state, triggerHitStop, spawnShockwave } from '../state.js';
import { Telemetry } from '../telemetry.js';
import { audio } from '../audio.js';
import { Enemy } from '../enemies/enemy.js';

export class ObstacleWall {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this._queryToken = 0;
  }

  intersectsCircle(cx, cy, r) {
    const nx = Math.max(this.x, Math.min(cx, this.x + this.w));
    const ny = Math.max(this.y, Math.min(cy, this.y + this.h));
    const dx = cx - nx;
    const dy = cy - ny;
    return (dx * dx + dy * dy) < (r * r);
  }

  resolveCircleCollision(circle) {
    const nearestX = Math.max(this.x, Math.min(circle.x, this.x + this.w));
    const nearestY = Math.max(this.y, Math.min(circle.y, this.y + this.h));
    const dx = circle.x - nearestX;
    const dy = circle.y - nearestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < circle.radius * circle.radius) {
      const dist = Math.sqrt(distSq);
      if (dist > 0.001) {
        const overlap = circle.radius - dist;
        circle.x += (dx / dist) * overlap;
        circle.y += (dy / dist) * overlap;
      } else {
        const leftDist = circle.x - this.x;
        const rightDist = (this.x + this.w) - circle.x;
        const topDist = circle.y - this.y;
        const bottomDist = (this.y + this.h) - circle.y;
        const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
        if (minDist === leftDist) circle.x = this.x - circle.radius;
        else if (minDist === rightDist) circle.x = this.x + this.w + circle.radius;
        else if (minDist === topDist) circle.y = this.y - circle.radius;
        else circle.y = this.y + this.h + circle.radius;
      }
      return true;
    }
    return false;
  }

  intersectsPoint(px, py) {
    return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
  }

  intersectsProjectile(p, dt = 0.016) {
    if (!p) return false;
    const r = (p.size || 5) + 1;
    const minX = this.x - r, maxX = this.x + this.w + r;
    const minY = this.y - r, maxY = this.y + this.h + r;
    const dx = (p.vx || 0) * dt, dy = (p.vy || 0) * dt;
    const prevX = p.x - dx, prevY = p.y - dy;
    let tMin = 0, tMax = 1;

    if (Math.abs(dx) < 1e-6) { if (prevX < minX || prevX > maxX) return false; }
    else {
      const inv = 1 / dx;
      let t1 = (minX - prevX) * inv, t2 = (maxX - prevX) * inv;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tMin = Math.max(tMin, t1); tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }

    if (Math.abs(dy) < 1e-6) { if (prevY < minY || prevY > maxY) return false; }
    else {
      const inv = 1 / dy;
      let t1 = (minY - prevY) * inv, t2 = (maxY - prevY) * inv;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tMin = Math.max(tMin, t1); tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
    return true;
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = '#1e2530';
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2.5;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(this.x + 3, this.y + 3, Math.max(2, this.w - 6), Math.max(2, this.h - 6));
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x + 6, this.y + 4);
    ctx.lineTo(this.x + this.w - 6, this.y + this.h - 4);
    ctx.stroke();
    ctx.restore();
  }
}

export class LootChest {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.CHESTS.radius || 16;
    this.opened = false;
  }

  open(player) {
    if (this.opened) return;
    this.opened = true;

    const chestCfg = CONFIG.CHESTS;
    if (state.camera) state.camera.addTrauma(CONFIG.JUICE.trauma.chestOpen || 0.30);
    spawnShockwave(this.x, this.y, { radius: 10, maxRadius: 80, color: '#ecc94b', speed: 280, lineWidth: 4 });
    audio.play('chest_open', { x: this.x, y: this.y });

    if (state.pickupManager) {
      const scrapCount = chestCfg.minScrap + Math.floor(Math.random() * (chestCfg.maxScrap - chestCfg.minScrap + 1));
      for (let i = 0; i < scrapCount; i++) {
        state.pickupManager.spawn(this.x + (Math.random() - 0.5) * 24, this.y + (Math.random() - 0.5) * 24, 'tech', 1);
      }
      const bioCount = chestCfg.minBio + Math.floor(Math.random() * (chestCfg.maxBio - chestCfg.minBio + 1));
      for (let i = 0; i < bioCount; i++) {
        state.pickupManager.spawn(this.x + (Math.random() - 0.5) * 24, this.y + (Math.random() - 0.5) * 24, 'bio', 3);
      }
    }

    if (player.shieldCharges < player.maxShieldCharges) player.shieldCharges = player.maxShieldCharges;
    Telemetry.recordEvent('LOOT', 'Supply Cache cracked open! Tech Scrap acquired.');
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.opened) {
      ctx.fillStyle = '#2d3748'; ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 1.5;
      ctx.fillRect(-12, -8, 24, 16); ctx.strokeRect(-12, -8, 24, 16);
    } else {
      const pulse = Math.sin(performance.now() / 200) * 2;
      ctx.fillStyle = '#b7791f'; ctx.strokeStyle = '#f6e05e'; ctx.lineWidth = 2;
      ctx.fillRect(-14, -10, 28, 20); ctx.strokeRect(-14, -10, 28, 20);
      ctx.fillStyle = '#fefcbf';
      ctx.beginPath(); ctx.arc(0, 0, 4 + pulse * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f6e05e'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText('[E] CACHE', 0, -14);
    }
    ctx.restore();
  }
}

export class Landmark {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 48;
    this.repaired = false;
  }

  repair(player) {
    if (this.repaired) return;
    this.repaired = true;
    player.carryingCore = false;
    if (state.camera) state.camera.addTrauma(0.65);
    triggerHitStop(0.08);
    Telemetry.recordEvent('TERRAFORM', 'Biosphere Purifier restored! Safe haven created.');
    audio.play('purifier_restored');
    Telemetry.metrics.resourcesCollected.techScrap += 5;

    if (state.pickupManager) {
      for (let i = 0; i < 8; i++) {
        state.pickupManager.spawn(this.x + (Math.random() - 0.5) * 60, this.y + (Math.random() - 0.5) * 60, 'bio', 3);
      }
    }
  }

  render(ctx, fieldActive = this.repaired) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const pulse = Math.sin(performance.now() / 300) * 4;
    if (fieldActive) {
      const auraR = CONFIG.WORLD.terraformedRadius;
      ctx.fillStyle = 'rgba(72, 187, 120, 0.12)';
      ctx.beginPath(); ctx.arc(0, 0, auraR + pulse, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#48bb78'; ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 6]); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = this.repaired ? '#1c4532' : '#2d3748';
    ctx.strokeStyle = this.repaired ? '#68d391' : '#718096';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = this.repaired ? '#48bb78' : '#e53e3e';
    ctx.beginPath(); ctx.arc(0, 0, 16 + (this.repaired ? pulse * 0.5 : 0), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.repaired ? '#9ae6b4' : '#cbd5e0';
    ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
    ctx.fillText(this.repaired ? 'BIOSPHERE PURIFIER [ONLINE]' : 'PURIFIER [NEEDS CORE]', 0, this.radius + 20);
    ctx.restore();
  }
}

export class CorePickup {
  constructor(x, y) {
    this.x = x; this.y = y; this.radius = 12; this.alive = true;
  }

  update(player) {
    if (!this.alive) return;
    if (Math.hypot(player.x - this.x, player.y - this.y) < player.radius + this.radius) {
      this.alive = false;
      player.carryingCore = true;
      Telemetry.recordEvent('OBJECTIVE', 'Purifier Core retrieved! Deliver to Landmark.');
      audio.play('core_picked');
    }
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    const pulse = Math.sin(performance.now() / 180) * 3;
    ctx.fillStyle = 'rgba(236, 201, 75, 0.3)';
    ctx.beginPath(); ctx.arc(0, 0, this.radius + 8 + pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d69e2e'; ctx.strokeStyle = '#faf089'; ctx.lineWidth = 2;
    ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('CORE', 0, 4);
    ctx.restore();
  }
}

export class CorruptedNest {
  constructor(x, y) {
    this.x = x; this.y = y;
    const nestCfg = CONFIG.NEST;
    this.radius = nestCfg.radius;
    this.maxHealth = nestCfg.maxHealth;
    this.health = this.maxHealth;
    this.alive = true;
    this.spawnTimer = 0;
    this.spawnInterval = nestCfg.spawnInterval;
    this.hitFlashTimer = 0;
    this.defenseSwarmCount = nestCfg.defenseSwarmCount;
    this.alarmThresholds = [...nestCfg.alarmThresholds];
  }

  takeDamage(amount) {
    if (!this.alive) return;
    const prevRatio = this.health / this.maxHealth;
    this.health -= amount;
    this.hitFlashTimer = 0.12;

    const displayDamage = Math.round(amount);
    if (state.damageTexts && displayDamage > 0) {
      state.damageTexts.push({ x: this.x + (Math.random() - 0.5) * 16, y: this.y - this.radius - 8, text: displayDamage, life: 0.55 });
    }

    const currentRatio = this.health / this.maxHealth;
    for (let i = 0; i < this.alarmThresholds.length; i++) {
      const th = this.alarmThresholds[i];
      if (prevRatio > th && currentRatio <= th) {
        this.triggerDefenseSwarm();
        this.alarmThresholds.splice(i, 1);
        break;
      }
    }

    if (this.health <= 0) {
      this.alive = false;
      if (state.camera) state.camera.addTrauma(CONFIG.JUICE.trauma.nestDestroy || 0.5);
      triggerHitStop(CONFIG.JUICE.hitStop.nestDestroy || 0.06);
      spawnShockwave(this.x, this.y, { radius: 24, maxRadius: 620, color: '#68d391', speed: 780, lineWidth: 6.5 });

      if (state.decalManager) {
        state.decalManager.addScorch(this.x, this.y, 45);
        state.decalManager.addSplatter(this.x, this.y, { type: 'corrupt', radius: 40, count: 18 });
      }
      Telemetry.recordEvent('WORLD', 'Corrupted Nest Cleansed! Loot vacuum triggered.');
      audio.play('nest_destroyed', { x: this.x, y: this.y });

      if (state.pickupManager) {
        for (let i = 0; i < 6; i++) {
          state.pickupManager.spawn(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30, 'bio', 2);
        }
        const bonusScrap = (MetaProgression.perks && MetaProgression.perks.naniteScavenge > 0) ? 1 : 0;
        for (let i = 0; i < 2 + bonusScrap; i++) {
          state.pickupManager.spawn(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30, 'tech', 1);
        }
        state.pickupManager.vacuumInRadius(this.x, this.y, 900);
      }
    }
  }

  triggerDefenseSwarm() {
    if (state.camera) state.camera.addTrauma(CONFIG.JUICE.trauma.nestAlarm || 0.35);
    triggerHitStop(CONFIG.JUICE.hitStop.nestAlarm || 0.04);
    spawnShockwave(this.x, this.y, { radius: 15, maxRadius: 110, color: '#e53e3e', speed: 300, lineWidth: 5 });
    audio.play('nest_alarm', { x: this.x, y: this.y });

    if (state.enemyManager && state.enemyManager.enemies.length < CONFIG.ENEMIES.maxActive) {
      const count = this.defenseSwarmCount || 7;
      for (let i = 0; i < count; i++) {
        const a = (i * Math.PI * 2) / count;
        const ex = this.x + Math.cos(a) * (this.radius + 20);
        const ey = this.y + Math.sin(a) * (this.radius + 20);
        state.enemyManager.enemies.push(new Enemy(ex, ey, i % 3 === 0 ? 'dasher' : 'sprout'));
      }
    }
  }

  update(dt, player, enemyManager) {
    if (!this.alive) return;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (Math.hypot(player.x - this.x, player.y - this.y) < 750) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        if (enemyManager.enemies.length < CONFIG.ENEMIES.maxActive) {
          enemyManager.enemies.push(new Enemy(this.x + 40, this.y, 'stalker'));
        }
      }
    }
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    const pulse = Math.sin(performance.now() / 250) * 3;
    ctx.fillStyle = 'rgba(112, 38, 52, 0.25)';
    ctx.beginPath(); ctx.arc(0, 0, this.radius + 14 + pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : '#4a1525';
    ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fc8181';
    ctx.beginPath(); ctx.arc(0, 0, 10 + pulse * 0.5, 0, Math.PI * 2); ctx.fill();
    const barW = 46;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-barW / 2, -this.radius - 12, barW, 5);
    ctx.fillStyle = '#e53e3e';
    ctx.fillRect(-barW / 2, -this.radius - 12, barW * (this.health / this.maxHealth), 5);
    ctx.restore();
  }
}