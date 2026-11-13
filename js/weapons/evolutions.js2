// js/weapons/evolutions.js — 4 гибридных эволюции оружия

import { CONFIG } from '../config.js';
import { state, triggerHitStop, spawnShockwave } from '../state.js';
import { IncineratorShell, CleansingAshZone, HyperionProjectile, StormSporeCloud } from './projectiles.js';

export class VoltHurricane {
  constructor(owner) {
    this.owner = owner;
    this.cfg = CONFIG.WEAPONS.voltHurricane;
    this.currentAngle = 0;
    this.hitCooldowns = new Map();
    this.activeBolts = [];
    this.name = "Volt Hurricane";
    this.isEvolution = true;
    this.slotCost = 1;
  }

  update(dt, enemies, projectiles, spawnParticles) {
    this.currentAngle += this.cfg.orbitSpeed * dt;
    for (let i = this.activeBolts.length - 1; i >= 0; i--) {
      this.activeBolts[i].life -= dt;
      if (this.activeBolts[i].life <= 0) this.activeBolts.splice(i, 1);
    }
    for (const [enemy, timer] of this.hitCooldowns.entries()) {
      if (timer <= dt) this.hitCooldowns.delete(enemy);
      else this.hitCooldowns.set(enemy, timer - dt);
    }

    const count = this.cfg.bladeCount;
    const dmg = this.cfg.damage * (this.owner.godMode ? 15 : 1);
    for (let b = 0; b < count; b++) {
      const bladeAngle = this.currentAngle + (b * (Math.PI * 2) / count);
      const bx = this.owner.x + Math.cos(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const by = this.owner.y + Math.sin(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        if (Math.hypot(bx - enemy.x, by - enemy.y) < 16 + enemy.radius) {
          if (!this.hitCooldowns.has(enemy)) {
            enemy.takeDamage(dmg, bx, by);
            this.hitCooldowns.set(enemy, 0.22);
            if (spawnParticles) spawnParticles(bx, by);
            this.triggerDischarge(bx, by, enemy, enemies, spawnParticles);
          }
        }
      }
    }
  }

  triggerDischarge(fromX, fromY, hitEnemy, enemies, spawnParticles) {
    let current = hitEnemy;
    const hitChain = [hitEnemy];
    const chainDmg = this.cfg.chainDamage * (this.owner.godMode ? 15 : 1);

    for (let i = 0; i < this.cfg.chainTargets; i++) {
      let nextTarget = null;
      let nextDist = this.cfg.chainRange;
      for (const other of enemies) {
        if (!other.alive || hitChain.includes(other)) continue;
        const d = Math.hypot(other.x - current.x, other.y - current.y);
        if (d < nextDist) { nextDist = d; nextTarget = other; }
      }
      if (nextTarget) {
        hitChain.push(nextTarget);
        nextTarget.takeDamage(chainDmg, current.x, current.y);
        if (spawnParticles) spawnParticles(nextTarget.x, nextTarget.y);
        this.activeBolts.push({ fromX: current.x, fromY: current.y, toX: nextTarget.x, toY: nextTarget.y, life: 0.1, maxLife: 0.1 });
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

    ctx.save();
    const count = this.cfg.bladeCount;
    for (let b = 0; b < count; b++) {
      const bladeAngle = this.currentAngle + (b * (Math.PI * 2) / count);
      const bx = this.owner.x + Math.cos(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const by = this.owner.y + Math.sin(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      ctx.translate(bx, by);
      ctx.rotate(this.currentAngle * 6);
      ctx.fillStyle = '#81e6d9';
      ctx.strokeStyle = '#e6fffa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.rotate(-this.currentAngle * 6);
      ctx.translate(-bx, -by);
    }
    ctx.restore();
  }
}

export class BiomassIncinerator {
  constructor(owner) {
    this.owner = owner;
    this.cfg = CONFIG.WEAPONS.biomassIncinerator;
    this.cooldown = 0;
    this.shells = [];
    this.zones = [];
    this.name = "Biomass Incinerator";
    this.isEvolution = true;
    this.slotCost = 1;
  }

  update(dt, enemies, projectiles, spawnParticles) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.cooldown <= 0) {
      const clusterTarget = this.findBestClusterTarget(enemies);
      if (clusterTarget) {
        this.fire(clusterTarget);
        this.cooldown = this.cfg.fireRate;
      }
    }

    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.update(dt, (tx, ty, cfg) => this.detonateShell(tx, ty, cfg, enemies, spawnParticles));
      if (!s.alive) this.shells.splice(i, 1);
    }

    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.update(dt, enemies, this.owner);
      if (!z.alive) this.zones.splice(i, 1);
    }
  }

  findBestClusterTarget(enemies) {
    let best = null;
    let maxWeight = 0;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (d < this.cfg.minRange || d > this.cfg.maxRange) continue;

      let weight = 1;
      for (const other of enemies) {
        if (!other.alive || other === enemy) continue;
        if (Math.hypot(enemy.x - other.x, enemy.y - other.y) <= this.cfg.zoneRadius) weight++;
      }
      if (weight > maxWeight) { maxWeight = weight; best = enemy; }
    }
    return best;
  }

  fire(target) {
    this.shells.push(new IncineratorShell(this.owner.x, this.owner.y, target.x, target.y, this.cfg));
  }

  detonateShell(x, y, cfg, enemies, spawnParticles) {
    let killCount = 0;
    const impactDmg = cfg.impactDamage * (this.owner.godMode ? 15 : 1);
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (Math.hypot(enemy.x - x, enemy.y - y) <= cfg.zoneRadius + enemy.radius) {
        const wasAlive = enemy.alive;
        enemy.takeDamage(impactDmg, x, y);
        if (wasAlive && !enemy.alive) killCount++;
      }
    }

    const isMultiKill = killCount >= 3;
    const bonusScale = isMultiKill ? Math.min(1.7, 1.0 + (killCount * 0.09)) : 1.0;
    spawnShockwave(x, y, { radius: 14, maxRadius: (cfg.zoneRadius * 1.4) * bonusScale, color: isMultiKill ? '#fed7aa' : '#f6ad55', speed: 380 * bonusScale, lineWidth: 7 });

    if (state.camera) state.camera.addTrauma(0.44);
    triggerHitStop(0.038);

    if (state.decalManager) {
      state.decalManager.addScorch(x, y, cfg.zoneRadius * 0.75 * bonusScale);
      state.decalManager.addSplatter(x, y, { type: 'amber', radius: cfg.zoneRadius * 0.45 * bonusScale, count: 14 + killCount * 2 });
    }
    this.zones.push(new CleansingAshZone(x, y, cfg));
    if (spawnParticles) {
      for (let i = 0; i < 20; i++) spawnParticles(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
    }
  }

  render(ctx) {
    for (const z of this.zones) z.render(ctx);
    for (const s of this.shells) s.render(ctx);
  }
}

export class HyperionTurret {
  constructor(owner) {
    this.owner = owner;
    this.cfg = CONFIG.WEAPONS.hyperionTurret;
    this.cooldown = 0;
    this.salvoTimer = 0;
    this.orbitAngle = 0;
    this.projectiles = [];
    this.name = "Hyperion Turret";
    this.isEvolution = true;
    this.slotCost = 1;
  }

  update(dt, enemies, globalProjectiles, spawnParticles) {
    this.orbitAngle += 1.2 * dt;
    if (this.cooldown > 0) this.cooldown -= dt;
    this.salvoTimer += dt;

    const tx = this.owner.x + Math.cos(this.orbitAngle) * (60 * this.owner.growthScale);
    const ty = this.owner.y + Math.sin(this.orbitAngle) * (60 * this.owner.growthScale);

    if (this.cooldown <= 0) {
      const target = this.findNearestEnemy(tx, ty, enemies);
      if (target) {
        this.fire(tx, ty, target);
        this.cooldown = this.cfg.fireRate;
      }
    }

    if (this.salvoTimer >= this.cfg.salvoCooldown) {
      this.salvoTimer = 0;
      this.triggerSalvo(tx, ty);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, enemies, spawnParticles);
      if (!p.alive) this.projectiles.splice(i, 1);
    }
  }

  findNearestEnemy(fromX, fromY, enemies) {
    let nearest = null;
    let minDist = this.cfg.range;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - fromX, enemy.y - fromY);
      if (d < minDist) { minDist = d; nearest = enemy; }
    }
    return nearest;
  }

  fire(fromX, fromY, target) {
    const angle = Math.atan2(target.y - fromY, target.x - fromX);
    const vx = Math.cos(angle) * this.cfg.projectileSpeed;
    const vy = Math.sin(angle) * this.cfg.projectileSpeed;
    const dmg = this.cfg.damage * (this.owner.godMode ? 15 : 1);
    this.projectiles.push(new HyperionProjectile(fromX, fromY, vx, vy, dmg, this.cfg.range, this.cfg.pierceCount));
  }

  triggerSalvo(fromX, fromY) {
    spawnShockwave(fromX, fromY, { radius: 15, maxRadius: 140, color: '#63b3ed', speed: 440, lineWidth: 4.5 });
    if (state.camera) state.camera.addTrauma(0.32);

    const count = this.cfg.salvoCount;
    const dmg = this.cfg.salvoDamage * (this.owner.godMode ? 15 : 1);
    for (let i = 0; i < count; i++) {
      const a = (i * Math.PI * 2) / count;
      this.projectiles.push(new HyperionProjectile(
        fromX, fromY, Math.cos(a) * (this.cfg.projectileSpeed * 0.85), Math.sin(a) * (this.cfg.projectileSpeed * 0.85), dmg, 280, 1
      ));
    }
  }

  render(ctx) {
    for (const p of this.projectiles) p.render(ctx);
    const tx = this.owner.x + Math.cos(this.orbitAngle) * (60 * this.owner.growthScale);
    const ty = this.owner.y + Math.sin(this.orbitAngle) * (60 * this.owner.growthScale);

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(this.orbitAngle + Math.PI / 2);
    ctx.fillStyle = '#1a365d';
    ctx.strokeStyle = '#63b3ed';
    ctx.lineWidth = 2;
    ctx.fillRect(-10, -10, 20, 20);
    ctx.strokeRect(-10, -10, 20, 20);
    ctx.restore();
  }
}

export class StormSpore {
  constructor(owner) {
    this.owner = owner;
    this.cfg = CONFIG.WEAPONS.stormSpore;
    this.cooldown = 0;
    this.shells = [];
    this.clouds = [];
    this.name = "Storm Spore";
    this.isEvolution = true;
    this.slotCost = 1;
  }

  update(dt, enemies, globalProjectiles, spawnParticles) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.cooldown <= 0) {
      const target = this.findClusterTarget(enemies);
      if (target) {
        this.fire(target);
        this.cooldown = this.cfg.fireRate;
      }
    }

    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.update(dt, (tx, ty, cfg) => this.detonateShell(tx, ty, cfg, enemies, spawnParticles));
      if (!s.alive) this.shells.splice(i, 1);
    }
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const c = this.clouds[i];
      c.update(dt, enemies, this.owner, spawnParticles);
      if (!c.alive) this.clouds.splice(i, 1);
    }
  }

  findClusterTarget(enemies) {
    let best = null;
    let maxWeight = 0;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (d < this.cfg.minRange || d > this.cfg.maxRange) continue;

      let weight = 1;
      for (const other of enemies) {
        if (!other.alive || other === enemy) continue;
        if (Math.hypot(enemy.x - other.x, enemy.y - other.y) <= this.cfg.cloudRadius) weight++;
      }
      if (weight > maxWeight) { maxWeight = weight; best = enemy; }
    }
    return best;
  }

  fire(target) {
    this.shells.push(new IncineratorShell(this.owner.x, this.owner.y, target.x, target.y, this.cfg));
  }

  detonateShell(x, y, cfg, enemies, spawnParticles) {
    const impactDmg = cfg.impactDamage * (this.owner.godMode ? 15 : 1);
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (Math.hypot(enemy.x - x, enemy.y - y) <= cfg.cloudRadius + enemy.radius) {
        enemy.takeDamage(impactDmg, x, y);
      }
    }
    this.clouds.push(new StormSporeCloud(x, y, cfg, this.owner.godMode));
    if (spawnParticles) {
      for (let i = 0; i < 16; i++) spawnParticles(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
    }
  }

  render(ctx) {
    for (const c of this.clouds) c.render(ctx);
    for (const s of this.shells) s.render(ctx);
  }
}