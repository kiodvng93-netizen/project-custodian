// js/weapons/projectiles.js — Снаряды, мины, плазменные и споровые зоны

import { state } from '../state.js';

export class Projectile {
  constructor(x, y, vx, vy, damage, range) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.maxRange = range;
    this.size = 5;
    this.alive = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (Math.hypot(this.x - this.startX, this.y - this.startY) >= this.maxRange) {
      this.alive = false;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.strokeStyle = '#63b3ed';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.02, this.y - this.vy * 0.02);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class MortarShell {
  constructor(startX, startY, targetX, targetY, impactDamage, cloudRadius, cfg) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.x = startX;
    this.y = startY;
    this.impactDamage = impactDamage;
    this.cloudRadius = cloudRadius;
    this.cfg = cfg;
    this.flightTime = cfg.flightDuration;
    this.progress = 0;
    this.alive = true;
    this.peakHeight = 75;
  }

  update(dt, onDetonate) {
    this.progress += dt / this.flightTime;
    if (this.progress >= 1.0) {
      this.progress = 1.0;
      this.alive = false;
      onDetonate(this.targetX, this.targetY, this.impactDamage, this.cloudRadius, this.cfg);
      return;
    }
    this.x = this.startX + (this.targetX - this.startX) * this.progress;
    this.y = this.startY + (this.targetY - this.startY) * this.progress;
  }

  render(ctx) {
    const currentGroundY = this.y;
    const arcOffset = Math.sin(this.progress * Math.PI) * this.peakHeight;
    const drawY = currentGroundY - arcOffset;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(this.x, currentGroundY, 6 * (1 - this.progress * 0.3), 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38a169';
    ctx.strokeStyle = '#68d391';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, drawY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export class SporeCloud {
  constructor(x, y, radius, duration, dotDamage, tickRate, slowFactor) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.duration = duration;
    this.dotDamage = dotDamage;
    this.tickRate = tickRate;
    this.tickTimer = 0;
    this.slowFactor = slowFactor;
    this.alive = true;
  }

  update(dt, enemies) {
    this.duration -= dt;
    if (this.duration <= 0) {
      this.alive = false;
      return;
    }

    this.tickTimer += dt;
    const doTick = this.tickTimer >= this.tickRate;
    if (doTick) this.tickTimer = 0;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist <= this.radius + enemy.radius) {
        enemy.sporeSlowTimer = 0.25;
        enemy.sporeSlowMult = this.slowFactor;
        if (doTick) enemy.takeDamage(this.dotDamage, this.x, this.y);
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const fadeAlpha = Math.min(1.0, this.duration / 0.5) * 0.32;
    const pulse = Math.sin(performance.now() / 200) * 3;

    ctx.fillStyle = `rgba(56, 161, 105, ${fadeAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(104, 211, 145, ${fadeAlpha * 1.8})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export class IncineratorShell {
  constructor(startX, startY, targetX, targetY, cfg) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.x = startX;
    this.y = startY;
    this.cfg = cfg;
    this.flightTime = cfg.flightDuration;
    this.progress = 0;
    this.alive = true;
    this.peakHeight = 85;
  }

  update(dt, onDetonate) {
    this.progress += dt / this.flightTime;
    if (this.progress >= 1.0) {
      this.progress = 1.0;
      this.alive = false;
      onDetonate(this.targetX, this.targetY, this.cfg);
      return;
    }
    this.x = this.startX + (this.targetX - this.startX) * this.progress;
    this.y = this.startY + (this.targetY - this.startY) * this.progress;
  }

  render(ctx) {
    const currentGroundY = this.y;
    const arcOffset = Math.sin(this.progress * Math.PI) * this.peakHeight;
    const drawY = currentGroundY - arcOffset;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(this.x, currentGroundY, 8 * (1 - this.progress * 0.3), 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dd6b20';
    ctx.strokeStyle = '#fbd38d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(this.x, drawY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export class CleansingAshZone {
  constructor(x, y, cfg) {
    this.x = x;
    this.y = y;
    this.cfg = cfg;
    this.duration = cfg.zoneDuration;
    this.radius = cfg.zoneRadius;
    this.alive = true;
  }

  update(dt, enemies, player) {
    this.duration -= dt;
    if (this.duration <= 0) {
      this.alive = false;
      return;
    }

    const dmg = this.cfg.zoneDamage * (player.godMode ? 15 : 1);
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (d <= this.radius + enemy.radius) {
        enemy.takeDamage(dmg * dt, this.x, this.y);
        enemy.sporeSlowTimer = 0.2;
        enemy.sporeSlowMult = this.cfg.slowFactor;
      }
    }

    if (Math.hypot(player.x - this.x, player.y - this.y) <= this.radius + player.radius) {
      player.heal(this.cfg.healPerSec * dt);
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const fadeAlpha = Math.min(1.0, this.duration / 0.6) * 0.38;
    const pulse = Math.sin(performance.now() / 150) * 4;

    ctx.fillStyle = `rgba(221, 107, 32, ${fadeAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(246, 224, 94, ${fadeAlpha * 1.8})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export class HyperionProjectile {
  constructor(x, y, vx, vy, damage, range, maxPierce) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.maxRange = range;
    this.size = 7;
    this.pierceLeft = maxPierce;
    this.hitEnemies = new Set();
    this.alive = true;
  }

  update(dt, enemies, spawnParticles) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (Math.hypot(this.x - this.startX, this.y - this.startY) >= this.maxRange) {
      this.alive = false;
      return;
    }

    if (state.worldManager && state.worldManager.obstacles) {
      for (const wall of state.worldManager.obstacles) {
        if (Math.abs(wall.x - this.x) < 200 && Math.abs(wall.y - this.y) < 200) {
          if (wall.intersectsProjectile ? wall.intersectsProjectile(this, dt) : wall.intersectsPoint(this.x, this.y)) {
            this.alive = false;
            if (spawnParticles) spawnParticles(this.x, this.y);
            return;
          }
        }
      }
    }

    for (const enemy of enemies) {
      if (!enemy.alive || this.hitEnemies.has(enemy)) continue;
      const d = Math.hypot(this.x - enemy.x, this.y - enemy.y);
      if (d <= this.size + enemy.radius) {
        enemy.takeDamage(this.damage, this.x - this.vx, this.y - this.vy);
        this.hitEnemies.add(enemy);
        if (spawnParticles) spawnParticles(this.x, this.y);
        this.pierceLeft--;
        if (this.pierceLeft <= 0) {
          this.alive = false;
          break;
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.strokeStyle = '#63b3ed';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.03, this.y - this.vy * 0.03);
    ctx.stroke();

    ctx.fillStyle = '#ebf8ff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class StormSporeCloud {
  constructor(x, y, cfg, isGodMode = false) {
    this.x = x;
    this.y = y;
    this.cfg = cfg;
    this.isGodMode = isGodMode;
    this.duration = cfg.cloudDuration;
    this.radius = cfg.cloudRadius;
    this.dotTimer = 0;
    this.chainTimer = 0;
    this.activeArcs = [];
    this.alive = true;
  }

  update(dt, enemies, player, spawnParticles) {
    this.duration -= dt;
    if (this.duration <= 0) {
      this.alive = false;
      return;
    }

    for (let i = this.activeArcs.length - 1; i >= 0; i--) {
      this.activeArcs[i].life -= dt;
      if (this.activeArcs[i].life <= 0) this.activeArcs.splice(i, 1);
    }

    this.dotTimer += dt;
    const doDot = this.dotTimer >= this.cfg.dotTickRate;
    if (doDot) this.dotTimer = 0;

    const dotDmg = this.cfg.dotDamage * (this.isGodMode ? 15 : 1);
    const trapped = [];
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.radius + enemy.radius) {
        enemy.sporeSlowTimer = 0.2;
        enemy.sporeSlowMult = this.cfg.slowFactor;
        trapped.push(enemy);
        if (doDot) enemy.takeDamage(dotDmg, this.x, this.y);
      }
    }

    if (Math.hypot(player.x - this.x, player.y - this.y) <= this.radius + player.radius) {
      if (player.shieldCharges < player.maxShieldCharges) player.shieldTimer += dt * 0.35;
    }

    this.chainTimer += dt;
    if (this.chainTimer >= this.cfg.chainInterval && trapped.length > 0) {
      this.chainTimer = 0;
      const source = trapped[Math.floor(Math.random() * trapped.length)];
      let target = null;
      let targetDist = 170;

      for (const enemy of enemies) {
        if (!enemy.alive || enemy === source) continue;
        const d = Math.hypot(enemy.x - source.x, enemy.y - source.y);
        if (d < targetDist) {
          targetDist = d;
          target = enemy;
        }
      }

      if (target) {
        target.takeDamage(this.cfg.chainDamage * (this.isGodMode ? 15 : 1), source.x, source.y);
        if (spawnParticles) spawnParticles(target.x, target.y);
        this.activeArcs.push({ fromX: source.x, fromY: source.y, toX: target.x, toY: target.y, life: 0.12, maxLife: 0.12 });
      }
    }
  }

  render(ctx) {
    for (const arc of this.activeArcs) {
      const alpha = arc.life / arc.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(129, 230, 217, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arc.fromX, arc.fromY);
      ctx.lineTo(arc.toX, arc.toY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    const fadeAlpha = Math.min(1.0, this.duration / 0.6) * 0.35;
    ctx.fillStyle = `rgba(72, 187, 120, ${fadeAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}