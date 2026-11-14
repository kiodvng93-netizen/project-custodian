// js/weapons/projectiles.js — Універсальні снаряди, мортирні міни та наземні зони

import { state, spawnShockwave } from '../state.js';

export class Projectile {
  constructor(x, y, vx, vy, damage, range, options = {}) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.maxRange = range;
    this.size = options.size || 5;
    this.pierceLeft = options.pierce || 1;
    this.color = options.color || '#63b3ed';
    this.armorPiercing = Boolean(options.armorPiercing);
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

    if (state.worldManager && state.worldManager.intersectsProjectileObstacles(this, dt)) {
      this.alive = false;
      if (spawnParticles) spawnParticles(this.x, this.y);
      return;
    }

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.alive || this.hitEnemies.has(enemy)) continue;

      if (Math.hypot(this.x - enemy.x, this.y - enemy.y) <= this.size + enemy.radius) {
        const prevArmorFlash = enemy.armorFlashTimer || 0;
        enemy.takeDamage(this.damage, this.x - this.vx, this.y - this.vy, false, this.armorPiercing);
        if (!this.armorPiercing && enemy.armorFlashTimer > prevArmorFlash) {
          spawnShockwave(this.x, this.y, { radius: 4, maxRadius: 22, color: '#90cdf4', speed: 170, lineWidth: 2 });
        }
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
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size >= 7 ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.025, this.y - this.vy * 0.025);
    ctx.stroke();

    ctx.fillStyle = this.size >= 7 ? '#ebf8ff' : '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class MortarShell {
  constructor(startX, startY, targetX, targetY, cfg, damageMult = 1) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.x = startX;
    this.y = startY;
    this.cfg = cfg;
    this.damageMult = damageMult;
    this.flightTime = cfg.flightDuration || 0.8;
    this.progress = 0;
    this.peakHeight = cfg.theme === 'ash' ? 85 : 75;
    this.alive = true;
  }

  update(dt, onDetonate) {
    this.progress += dt / this.flightTime;
    if (this.progress >= 1.0) {
      this.progress = 1.0;
      this.alive = false;
      onDetonate(this.targetX, this.targetY, this.cfg, this.damageMult);
      return;
    }
    this.x = this.startX + (this.targetX - this.startX) * this.progress;
    this.y = this.startY + (this.targetY - this.startY) * this.progress;
  }

  render(ctx) {
    const arcOffset = Math.sin(this.progress * Math.PI) * this.peakHeight;
    const drawY = this.y - arcOffset;
    const isAsh = this.cfg.theme === 'ash';
    const isStorm = this.cfg.theme === 'storm';

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, (isAsh ? 8 : 6) * (1 - this.progress * 0.3), isAsh ? 4 : 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isAsh ? '#dd6b20' : isStorm ? '#319795' : '#38a169';
    ctx.strokeStyle = isAsh ? '#fbd38d' : isStorm ? '#81e6d9' : '#68d391';
    ctx.lineWidth = isAsh ? 2.5 : 2;
    ctx.beginPath();
    ctx.arc(this.x, drawY, isAsh ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export class GroundZone {
  constructor(x, y, cfg, damageMult = 1) {
    this.x = x;
    this.y = y;
    this.cfg = cfg;
    this.damageMult = damageMult;
    this.radius = cfg.zoneRadius || 65;
    this.duration = cfg.zoneDuration || 3.2;
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

    let doDotTick = false;
    if (this.cfg.dotTickRate) {
      this.dotTimer += dt;
      if (this.dotTimer >= this.cfg.dotTickRate) {
        this.dotTimer = 0;
        doDotTick = true;
      }
    }

    const candidates = (state.enemyManager && state.enemyManager.grid)
      ? [...state.enemyManager.grid.getNearby(this.x, this.y, this.radius + 35), ...(state.worldManager ? state.worldManager.nests : [])]
      : enemies;

    const trapped = [];
    const rSq = (this.radius + 28);

    for (let i = 0; i < candidates.length; i++) {
      const enemy = candidates[i];
      if (!enemy || !enemy.alive) continue;
      if (Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.radius + enemy.radius) {
        if (this.cfg.slowFactor) {
          enemy.sporeSlowTimer = 0.25;
          enemy.sporeSlowMult = this.cfg.slowFactor;
        }
        if (this.cfg.zoneDamage) {
          enemy.takeDamage(this.cfg.zoneDamage * this.damageMult * dt, this.x, this.y, false, true);
        } else if (doDotTick && this.cfg.dotDamage) {
          enemy.takeDamage(this.cfg.dotDamage * this.damageMult, this.x, this.y, false, true);
        }
        if (this.cfg.chainDamage) trapped.push(enemy);
      }
    }

    if (player && Math.hypot(player.x - this.x, player.y - this.y) <= this.radius + player.radius) {
      if (this.cfg.healPerSec) player.heal(this.cfg.healPerSec * dt);
      if (this.cfg.shieldBoost && player.shieldCharges < player.maxShieldCharges) {
        player.shieldTimer += dt * this.cfg.shieldBoost;
      }
    }

    if (this.cfg.chainDamage && trapped.length > 0) {
      this.chainTimer += dt;
      if (this.chainTimer >= (this.cfg.chainInterval || 0.5)) {
        this.chainTimer = 0;
        const source = trapped[Math.floor(Math.random() * trapped.length)];
        let target = null;
        let minDist = rSq + 140;

        for (let i = 0; i < candidates.length; i++) {
          const e = candidates[i];
          if (!e.alive || e === source) continue;
          const d = Math.hypot(e.x - source.x, e.y - source.y);
          if (d < 170 && d < minDist) { minDist = d; target = e; }
        }

        if (target) {
          target.takeDamage(this.cfg.chainDamage * this.damageMult, source.x, source.y, false, true);
          if (spawnParticles) spawnParticles(target.x, target.y);
          this.activeArcs.push({ fromX: source.x, fromY: source.y, toX: target.x, toY: target.y, life: 0.12, maxLife: 0.12 });
        }
      }
    }
  }

  render(ctx) {
    for (const arc of this.activeArcs) {
      ctx.save();
      ctx.strokeStyle = `rgba(129, 230, 217, ${arc.life / arc.maxLife})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arc.fromX, arc.fromY);
      ctx.lineTo(arc.toX, arc.toY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    const fadeAlpha = Math.min(1.0, this.duration / 0.5) * 0.35;
    const isAsh = this.cfg.theme === 'ash';
    const pulse = Math.sin(performance.now() / (isAsh ? 150 : 200)) * 3;

    ctx.fillStyle = isAsh ? `rgba(221, 107, 32, ${fadeAlpha})` : `rgba(56, 161, 105, ${fadeAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isAsh ? `rgba(246, 224, 94, ${fadeAlpha * 1.8})` : `rgba(104, 211, 145, ${fadeAlpha * 1.8})`;
    ctx.lineWidth = isAsh ? 2 : 1.5;
    ctx.setLineDash(isAsh ? [8, 8] : [4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}