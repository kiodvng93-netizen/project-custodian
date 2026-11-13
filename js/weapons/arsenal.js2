// js/weapons/arsenal.js — 6 базовых видов оружия

import { CONFIG } from '../config.js';
import { Projectile, MortarShell } from './projectiles.js';

export class TechBlaster {
  constructor(owner) {
    this.owner = owner;
    this.cooldown = 0;
    this.cfg = CONFIG.WEAPONS.blaster;
    this.name = "Tech Blaster";
  }

  update(dt, enemies, projectiles) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.cooldown <= 0) {
      const target = this.findNearestEnemy(enemies);
      if (target) {
        this.fire(target, projectiles);
        this.cooldown = this.cfg.fireRate;
      }
    }
  }

  findNearestEnemy(enemies) {
    let closestEnemy = null;
    let closestDist = this.cfg.range;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestEnemy = enemy;
      }
    }
    return closestEnemy;
  }

  fire(target, projectiles) {
    const angle = Math.atan2(target.y - this.owner.y, target.x - this.owner.x);
    const vx = Math.cos(angle) * this.cfg.projectileSpeed;
    const vy = Math.sin(angle) * this.cfg.projectileSpeed;
    const dmg = this.cfg.damage * (this.owner.godMode ? 15 : 1);
    projectiles.push(new Projectile(this.owner.x, this.owner.y, vx, vy, dmg, this.cfg.range));
  }

  render() {}
}

export class ScrapSaw {
  constructor(owner) {
    this.owner = owner;
    this.cfg = CONFIG.WEAPONS.saw;
    this.currentAngle = 0;
    this.hitCooldowns = new Map();
    this.name = "Scrap Saw";
  }

  update(dt, enemies, projectiles, spawnParticles) {
    this.currentAngle += this.cfg.orbitSpeed * dt;
    for (const [enemy, timer] of this.hitCooldowns.entries()) {
      if (timer <= dt) this.hitCooldowns.delete(enemy);
      else this.hitCooldowns.set(enemy, timer - dt);
    }

    const dmg = this.cfg.damage * (this.owner.godMode ? 15 : 1);
    for (let b = 0; b < this.cfg.bladeCount; b++) {
      const bladeAngle = this.currentAngle + (b * (Math.PI * 2) / this.cfg.bladeCount);
      const bx = this.owner.x + Math.cos(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const by = this.owner.y + Math.sin(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(bx - enemy.x, by - enemy.y);
        if (dist < this.cfg.bladeRadius + enemy.radius) {
          if (!this.hitCooldowns.has(enemy)) {
            enemy.takeDamage(dmg, this.owner.x, this.owner.y);
            this.hitCooldowns.set(enemy, 0.28);
            if (spawnParticles) spawnParticles(bx, by);
          }
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    for (let b = 0; b < this.cfg.bladeCount; b++) {
      const bladeAngle = this.currentAngle + (b * (Math.PI * 2) / this.cfg.bladeCount);
      const bx = this.owner.x + Math.cos(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const by = this.owner.y + Math.sin(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      ctx.translate(bx, by);
      ctx.rotate(this.currentAngle * 4);
      ctx.fillStyle = '#cbd5e0';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      const teeth = 8;
      for (let i = 0; i < teeth * 2; i++) {
        const a = (i * Math.PI) / teeth;
        const r = i % 2 === 0 ? this.cfg.bladeRadius : this.cfg.bladeRadius * 0.65;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4a5568';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(-this.currentAngle * 4);
      ctx.translate(-bx, -by);
    }
    ctx.restore();
  }
}

export class BioSporeMortar {
  constructor(owner) {
    this.owner = owner;
    this.cfg = CONFIG.WEAPONS.mortar;
    this.cooldown = 0;
    this.name = "Bio-Spore Mortar";
  }

  update(dt, enemies, shells) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.cooldown <= 0) {
      const clusterTarget = this.findBestClusterTarget(enemies);
      if (clusterTarget) {
        this.fire(clusterTarget, shells);
        this.cooldown = this.cfg.fireRate;
      }
    }
  }

  findBestClusterTarget(enemies) {
    let bestTarget = null;
    let maxClusterWeight = 0;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (d < this.cfg.minRange || d > this.cfg.maxRange) continue;

      let localWeight = 1;
      for (const other of enemies) {
        if (!other.alive || other === enemy) continue;
        if (Math.hypot(enemy.x - other.x, enemy.y - other.y) <= this.cfg.cloudRadius) localWeight++;
      }
      if (localWeight > maxClusterWeight) {
        maxClusterWeight = localWeight;
        bestTarget = enemy;
      }
    }
    return bestTarget;
  }

  fire(target, shells) {
    const dmg = this.cfg.damage * (this.owner.godMode ? 15 : 1);
    shells.push(new MortarShell(this.owner.x, this.owner.y, target.x, target.y, dmg, this.cfg.cloudRadius, this.cfg));
  }

  render() {}
}

export class TeslaArc {
  constructor(owner) {
    this.owner = owner;
    this.cfg = CONFIG.WEAPONS.tesla;
    this.cooldown = 0;
    this.activeBolts = [];
    this.name = "Tesla Arc";
  }

  update(dt, enemies, projectiles, spawnParticles) {
    if (this.cooldown > 0) this.cooldown -= dt;
    for (let i = this.activeBolts.length - 1; i >= 0; i--) {
      this.activeBolts[i].life -= dt;
      if (this.activeBolts[i].life <= 0) this.activeBolts.splice(i, 1);
    }

    if (this.cooldown <= 0) {
      const primaryTarget = this.findInitialTarget(enemies);
      if (primaryTarget) {
        this.triggerChainDischarge(primaryTarget, enemies, spawnParticles);
        this.cooldown = this.cfg.cooldown;
      }
    }
  }

  findInitialTarget(enemies) {
    let closest = null;
    let closestDist = this.cfg.initialRange;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }
    return closest;
  }

  triggerChainDischarge(initialTarget, enemies, spawnParticles) {
    const hitChain = [initialTarget];
    let current = initialTarget;
    const baseDmg = this.cfg.damage * (this.owner.godMode ? 15 : 1);

    initialTarget.takeDamage(baseDmg, this.owner.x, this.owner.y);
    if (spawnParticles) spawnParticles(initialTarget.x, initialTarget.y);

    this.activeBolts.push({ fromX: this.owner.x, fromY: this.owner.y, toX: initialTarget.x, toY: initialTarget.y, life: 0.12, maxLife: 0.12 });

    for (let step = 1; step < this.cfg.chainCount; step++) {
      let nextTarget = null;
      let nextDist = this.cfg.chainRange;
      for (const enemy of enemies) {
        if (!enemy.alive || hitChain.includes(enemy)) continue;
        const d = Math.hypot(enemy.x - current.x, enemy.y - current.y);
        if (d < nextDist) { nextDist = d; nextTarget = enemy; }
      }

      if (nextTarget) {
        hitChain.push(nextTarget);
        nextTarget.takeDamage(baseDmg * 0.9, current.x, current.y);
        if (spawnParticles) spawnParticles(nextTarget.x, nextTarget.y);
        this.activeBolts.push({ fromX: current.x, fromY: current.y, toX: nextTarget.x, toY: nextTarget.y, life: 0.12, maxLife: 0.12 });
        current = nextTarget;
      } else break;
    }
  }

  render(ctx) {
    for (const bolt of this.activeBolts) {
      const alpha = bolt.life / bolt.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(129, 230, 217, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bolt.fromX, bolt.fromY);
      ctx.lineTo(bolt.toX, bolt.toY);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export class AegisDrones {
  constructor(owner) {
    this.owner = owner;
    this.cfg = CONFIG.WEAPONS.drone;
    this.currentAngle = 0;
    this.fireTimer = 0;
    this.laserBeams = [];
    this.name = "Aegis Drones";
  }

  update(dt, enemies, projectiles, spawnParticles) {
    this.currentAngle += this.cfg.orbitSpeed * dt;
    this.fireTimer += dt;
    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      this.laserBeams[i].life -= dt;
      if (this.laserBeams[i].life <= 0) this.laserBeams.splice(i, 1);
    }

    const canFire = this.fireTimer >= this.cfg.fireRate;
    if (canFire) this.fireTimer = 0;
    const count = this.cfg.droneCount;
    const dmg = this.cfg.damage * (this.owner.godMode ? 15 : 1);

    for (let i = 0; i < count; i++) {
      const droneAngle = this.currentAngle + (i * (Math.PI * 2) / count);
      const dx = this.owner.x + Math.cos(droneAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const dy = this.owner.y + Math.sin(droneAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        if (Math.hypot(dx - enemy.x, dy - enemy.y) < 20 + enemy.radius) {
          enemy.takeDamage(this.cfg.pushbackDamage * dt * 2.5, dx, dy);
          if (!enemy.alarmThresholds) {
            const pushAngle = Math.atan2(enemy.y - dy, enemy.x - dx);
            enemy.x += Math.cos(pushAngle) * 90 * dt;
            enemy.y += Math.sin(pushAngle) * 90 * dt;
          }
        }
      }

      if (canFire) {
        let nearestEnemy = null;
        let nearestDist = this.cfg.firingRange;
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const dist = Math.hypot(dx - enemy.x, dy - enemy.y);
          if (dist < nearestDist) { nearestDist = dist; nearestEnemy = enemy; }
        }
        if (nearestEnemy) {
          nearestEnemy.takeDamage(dmg, dx, dy);
          if (spawnParticles) spawnParticles(nearestEnemy.x, nearestEnemy.y);
          this.laserBeams.push({ fromX: dx, fromY: dy, toX: nearestEnemy.x, toY: nearestEnemy.y, life: 0.08, maxLife: 0.08 });
        }
      }
    }
  }

  render(ctx) {
    for (const beam of this.laserBeams) {
      const alpha = beam.life / beam.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(246, 173, 85, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(beam.fromX, beam.fromY);
      ctx.lineTo(beam.toX, beam.toY);
      ctx.stroke();
      ctx.restore();
    }

    const count = this.cfg.droneCount;
    for (let i = 0; i < count; i++) {
      const droneAngle = this.currentAngle + (i * (Math.PI * 2) / count);
      const dx = this.owner.x + Math.cos(droneAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const dy = this.owner.y + Math.sin(droneAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(droneAngle + Math.PI / 2);
      ctx.fillStyle = '#2d3748';
      ctx.strokeStyle = '#ed8936';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -7); ctx.lineTo(6, 6); ctx.lineTo(0, 3); ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }
}

export class PlasmaPurifier {
  constructor(owner) {
    this.owner = owner;
    this.cfg = CONFIG.WEAPONS.flamer;
    this.particles = [];
    this.spawnTimer = 0;
    this.name = "Plasma Purifier";
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

    const halfSpread = this.cfg.spreadAngle / 2;
    const currentRangeSq = Math.pow(this.cfg.range * this.owner.growthScale, 2);
    const dmg = this.cfg.damage * (this.owner.godMode ? 15 : 1);

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x - this.owner.x;
      const dy = enemy.y - this.owner.y;
      if (dx * dx + dy * dy <= currentRangeSq) {
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
    for (const p of this.particles) {
      const ratio = p.life / p.maxLife;
      ctx.fillStyle = ratio > 0.6 ? `rgba(255, 255, 255, ${ratio})` : `rgba(246, 173, 85, ${ratio * 0.9})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - ratio * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}