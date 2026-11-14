// js/weapons/meleeArchetypes.js — Архетипи: Orbital, Cone, Aura

import { state } from '../state.js';

function collectTargets(x, y, radius, fallbackList, out) {
  out.length = 0;
  const grid = state.enemyManager && state.enemyManager.grid;
  if (grid) {
    const nearby = grid.getNearby(x, y, radius + 35);
    for (let i = 0; i < nearby.length; i++) out.push(nearby[i]);
    if (state.worldManager && state.worldManager.nests) {
      const nests = state.worldManager.nests;
      for (let i = 0; i < nests.length; i++) out.push(nests[i]);
    }
  } else if (fallbackList) {
    for (let i = 0; i < fallbackList.length; i++) out.push(fallbackList[i]);
  }
}

export class OrbitalWeapon {
  constructor(owner, cfg) {
    this.owner = owner;
    this.cfg = cfg;
    this.name = cfg.name;
    this.isEvolution = Boolean(cfg.isEvolution);
    this.currentAngle = 0;
    this.fireTimer = 0;
    this.hitCooldowns = new Map();
    this.activeBeams = [];
    this._targets = [];
    this._chainHit = new Set();
  }

  update(dt, enemies, ctxData) {
    this.currentAngle += this.cfg.orbitSpeed * dt;
    for (const [enemy, timer] of this.hitCooldowns.entries()) {
      if (timer <= dt) this.hitCooldowns.delete(enemy);
      else this.hitCooldowns.set(enemy, timer - dt);
    }
    for (let i = this.activeBeams.length - 1; i >= 0; i--) {
      this.activeBeams[i].life -= dt;
      if (this.activeBeams[i].life <= 0) this.activeBeams.splice(i, 1);
    }

    let canFireLaser = false;
    if (this.cfg.subAttack === 'laser') {
      this.fireTimer += dt;
      if (this.fireTimer >= this.cfg.fireRate) {
        this.fireTimer = 0;
        canFireLaser = true;
      }
    }

    const mult = this.owner.godMode ? 15 : 1;
    const count = this.cfg.count || 1;
    const orbitR = this.cfg.orbitRadius * this.owner.growthScale;

    for (let b = 0; b < count; b++) {
      const a = this.currentAngle + (b * Math.PI * 2) / count;
      const bx = this.owner.x + Math.cos(a) * orbitR;
      const by = this.owner.y + Math.sin(a) * orbitR;

      const queryR = canFireLaser ? Math.max(this.cfg.hitRadius, this.cfg.firingRange) : this.cfg.hitRadius;
      collectTargets(bx, by, queryR, enemies, this._targets);

      let nearestLaser = null;
      let nearestLaserDist = this.cfg.firingRange || 0;

      for (let i = 0; i < this._targets.length; i++) {
        const enemy = this._targets[i];
        if (!enemy.alive) continue;
        const d = Math.hypot(bx - enemy.x, by - enemy.y);

        if (d < this.cfg.hitRadius + enemy.radius) {
          if (this.cfg.pushbackDamage) {
            enemy.takeDamage(this.cfg.pushbackDamage * mult * dt * 2.5, bx, by);
            if (!enemy.alarmThresholds && d > 0) {
              enemy.x += ((enemy.x - bx) / d) * (this.cfg.pushForce || 90) * dt;
              enemy.y += ((enemy.y - by) / d) * (this.cfg.pushForce || 90) * dt;
            }
          } else if (!this.hitCooldowns.has(enemy)) {
            enemy.takeDamage(this.cfg.damage * mult, bx, by);
            this.hitCooldowns.set(enemy, this.cfg.hitCooldown || 0.25);
            ctxData.spawnParticles(bx, by);
            if (this.cfg.subAttack === 'chain') this.triggerChain(enemy, enemies, mult, ctxData);
          }
        }

        if (canFireLaser && d < nearestLaserDist) {
          nearestLaserDist = d;
          nearestLaser = enemy;
        }
      }

      if (canFireLaser && nearestLaser) {
        nearestLaser.takeDamage(this.cfg.damage * mult, bx, by);
        ctxData.spawnParticles(nearestLaser.x, nearestLaser.y);
        this.activeBeams.push({ fromX: bx, fromY: by, toX: nearestLaser.x, toY: nearestLaser.y, color: 'rgba(246, 173, 85,', life: 0.08, maxLife: 0.08 });
      }
    }
  }

  triggerChain(first, enemies, mult, ctxData) {
    this._chainHit.clear();
    this._chainHit.add(first);
    let current = first;
    const dmg = (this.cfg.chainDamage || 20) * mult;
    const list = [];

    for (let step = 0; step < (this.cfg.chainTargets || 3); step++) {
      collectTargets(current.x, current.y, this.cfg.chainRange || 150, enemies, list);
      let next = null;
      let nextDist = this.cfg.chainRange || 150;
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (!e.alive || this._chainHit.has(e)) continue;
        const d = Math.hypot(e.x - current.x, e.y - current.y);
        if (d < nextDist) { nextDist = d; next = e; }
      }
      if (!next) break;
      this._chainHit.add(next);
      next.takeDamage(dmg, current.x, current.y);
      ctxData.spawnParticles(next.x, next.y);
      this.activeBeams.push({ fromX: current.x, fromY: current.y, toX: next.x, toY: next.y, color: 'rgba(129, 230, 217,', life: 0.1, maxLife: 0.1 });
      current = next;
    }
  }

  render(ctx) {
    for (let i = 0; i < this.activeBeams.length; i++) {
      const b = this.activeBeams[i];
      ctx.save();
      ctx.strokeStyle = `${b.color} ${b.life / b.maxLife})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(b.fromX, b.fromY);
      ctx.lineTo(b.toX, b.toY);
      ctx.stroke();
      ctx.restore();
    }

    const count = this.cfg.count || 1;
    const orbitR = this.cfg.orbitRadius * this.owner.growthScale;
    for (let i = 0; i < count; i++) {
      const a = this.currentAngle + (i * Math.PI * 2) / count;
      const bx = this.owner.x + Math.cos(a) * orbitR;
      const by = this.owner.y + Math.sin(a) * orbitR;
      ctx.save();
      ctx.translate(bx, by);
      if (this.cfg.visual === 'drone') {
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = '#2d3748';
        ctx.strokeStyle = '#ed8936';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -7); ctx.lineTo(6, 6); ctx.lineTo(0, 3); ctx.lineTo(-6, 6);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (this.cfg.visual === 'volt_saw') {
        ctx.rotate(this.currentAngle * 6);
        ctx.fillStyle = '#81e6d9';
        ctx.strokeStyle = '#e6fffa';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.rotate(this.currentAngle * 4);
        ctx.fillStyle = '#cbd5e0';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const rOut = this.cfg.hitRadius;
        for (let t = 0; t < 16; t++) {
          const ta = (t * Math.PI) / 8;
          const tr = t % 2 === 0 ? rOut : rOut * 0.65;
          if (t === 0) ctx.moveTo(Math.cos(ta) * tr, Math.sin(ta) * tr);
          else ctx.lineTo(Math.cos(ta) * tr, Math.sin(ta) * tr);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
  }
}

export class ConeWeapon {
  constructor(owner, cfg) {
    this.owner = owner;
    this.cfg = cfg;
    this.name = cfg.name;
    this.particles = [];
    this.spawnTimer = 0;
    this._targets = [];
  }

  update(dt, enemies) {
    this.spawnTimer += dt;
    const baseAngle = this.owner.facingAngle;

    if (this.spawnTimer >= 0.03) {
      this.spawnTimer = 0;
      for (let i = 0; i < 3; i++) {
        const spread = (Math.random() - 0.5) * this.cfg.spreadAngle;
        const speed = 190 + Math.random() * 120;
        this.particles.push({
          x: this.owner.x + Math.cos(baseAngle) * (this.owner.radius * 0.7),
          y: this.owner.y + Math.sin(baseAngle) * (this.owner.radius * 0.7),
          vx: Math.cos(baseAngle + spread) * speed,
          vy: Math.sin(baseAngle + spread) * speed,
          life: 0.38, maxLife: 0.38, size: 4 + Math.random() * 5
        });
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    const range = this.cfg.range * this.owner.growthScale;
    const rangeSq = range * range;
    const halfSpread = this.cfg.spreadAngle / 2;
    const dmg = this.cfg.damage * (this.owner.godMode ? 15 : 1);

    collectTargets(this.owner.x, this.owner.y, range, enemies, this._targets);
    for (let i = 0; i < this._targets.length; i++) {
      const enemy = this._targets[i];
      if (!enemy.alive) continue;
      const dx = enemy.x - this.owner.x;
      const dy = enemy.y - this.owner.y;
      if (dx * dx + dy * dy <= rangeSq) {
        let diff = Math.abs(Math.atan2(dy, dx) - baseAngle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff <= halfSpread) {
          enemy.takeDamage(dmg * dt, this.owner.x, this.owner.y);
          enemy.plasmaBurnTimer = this.cfg.burnDuration;
          enemy.plasmaBurnDmg = this.cfg.burnDamage;
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const ratio = p.life / p.maxLife;
      ctx.fillStyle = ratio > 0.6 ? `rgba(255, 255, 255, ${ratio})` : `rgba(246, 173, 85, ${ratio * 0.9})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - ratio * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class AuraWeapon {
  constructor(owner, cfg) {
    this.owner = owner;
    this.cfg = cfg;
    this.name = cfg.name;
    this.pulseTimer = 0;
    this.ringAlpha = 0;
    this.ringRadius = 0;
    this._targets = [];
  }

  update(dt, enemies) {
    if (this.ringAlpha > 0) this.ringAlpha = Math.max(0, this.ringAlpha - dt * 2.5);
    this.pulseTimer += dt;
    if (this.pulseTimer < this.cfg.fireRate) return;

    this.pulseTimer = 0;
    const radius = this.cfg.radius * this.owner.growthScale;
    this.ringRadius = radius;
    this.ringAlpha = 0.75;

    const dmg = this.cfg.damage * (this.owner.godMode ? 15 : 1);
    collectTargets(this.owner.x, this.owner.y, radius, enemies, this._targets);

    for (let i = 0; i < this._targets.length; i++) {
      const enemy = this._targets[i];
      if (!enemy.alive) continue;
      const dx = enemy.x - this.owner.x;
      const dy = enemy.y - this.owner.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= radius + enemy.radius) {
        enemy.takeDamage(dmg, this.owner.x, this.owner.y);
        if (this.cfg.slowFactor) {
          enemy.sporeSlowTimer = 0.35;
          enemy.sporeSlowMult = this.cfg.slowFactor;
        }
        if (this.cfg.pushForce && !enemy.alarmThresholds && dist > 1) {
          enemy.x += (dx / dist) * this.cfg.pushForce * 0.12;
          enemy.y += (dy / dist) * this.cfg.pushForce * 0.12;
        }
      }
    }
  }

  render(ctx) {
    const r = this.cfg.radius * this.owner.growthScale;
    ctx.save();
    ctx.strokeStyle = 'rgba(159, 122, 234, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.owner.x, this.owner.y, r, 0, Math.PI * 2);
    ctx.stroke();

    if (this.ringAlpha > 0) {
      ctx.fillStyle = `rgba(159, 122, 234, ${this.ringAlpha * 0.22})`;
      ctx.strokeStyle = `rgba(214, 188, 250, ${this.ringAlpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.owner.x, this.owner.y, this.ringRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}