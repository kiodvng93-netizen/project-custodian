// js/weapons/manager.js — Менеджер слотов арсенала, авто-стрельбы и эволюций

import { CONFIG } from '../config.js';
import { state, triggerHitStop, spawnShockwave } from '../state.js';
import { SporeCloud } from './projectiles.js';
import { TechBlaster, ScrapSaw, BioSporeMortar, TeslaArc, AegisDrones, PlasmaPurifier } from './arsenal.js';
import { VoltHurricane, BiomassIncinerator, HyperionTurret, StormSpore } from './evolutions.js';

export class WeaponManager {
  constructor(owner) {
    this.owner = owner;
    this.slots = [new TechBlaster(owner)];
    this.maxSlots = 6;
    this.projectiles = [];
    this.mortarShells = [];
    this.sporeClouds = [];
    this.particles = [];
  }

  hasWeapon(name) {
    return this.slots.some(w => w.name.toLowerCase().trim() === name.toLowerCase().trim());
  }

  addWeapon(weaponInstance) {
    if (this.slots.length < this.maxSlots) {
      this.slots.push(weaponInstance);
      return true;
    }
    return false;
  }

  evolveWeapons(evolutionKey) {
    const evo = CONFIG.EVOLUTIONS[evolutionKey];
    if (!evo) return false;

    const hasAll = evo.ingredients.every(name => this.hasWeapon(name));
    if (!hasAll) return false;

    const lowerIngredients = evo.ingredients.map(n => n.toLowerCase().trim());
    this.slots = this.slots.filter(w => !lowerIngredients.includes(w.name.toLowerCase().trim()));

    if (evo.resultWeapon === 'Volt Hurricane') this.slots.push(new VoltHurricane(this.owner));
    else if (evo.resultWeapon === 'Biomass Incinerator') this.slots.push(new BiomassIncinerator(this.owner));
    else if (evo.resultWeapon === 'Hyperion Turret') this.slots.push(new HyperionTurret(this.owner));
    else if (evo.resultWeapon === 'Storm Spore') this.slots.push(new StormSpore(this.owner));

    if (window.Telemetry) {
      window.Telemetry.recordEvent('EVOLUTION', `WEAPON EVOLVED: ${evo.name}! Slot compressed.`);
    }
    return true;
  }

  reset() {
    this.slots = [new TechBlaster(this.owner)];
    this.projectiles = [];
    this.mortarShells = [];
    this.sporeClouds = [];
    this.particles = [];
  }

  update(dt, enemies) {
    for (const enemy of enemies) {
      if (enemy.sporeSlowTimer && enemy.sporeSlowTimer > 0) {
        enemy.sporeSlowTimer -= dt;
        enemy.currentSlow = enemy.sporeSlowMult || 0.55;
      } else {
        enemy.currentSlow = 1.0;
      }
    }

    for (const weapon of this.slots) {
      if (weapon instanceof ScrapSaw || weapon instanceof TeslaArc || weapon instanceof AegisDrones ||
          weapon instanceof VoltHurricane || weapon instanceof BiomassIncinerator ||
          weapon instanceof HyperionTurret || weapon instanceof StormSpore) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else if (weapon instanceof BioSporeMortar) {
        weapon.update(dt, enemies, this.mortarShells);
      } else if (weapon instanceof PlasmaPurifier) {
        weapon.update(dt, enemies);
      } else {
        weapon.update(dt, enemies, this.projectiles);
      }
    }

    for (let i = this.mortarShells.length - 1; i >= 0; i--) {
      const shell = this.mortarShells[i];
      shell.update(dt, (tx, ty, impactDmg, cloudRadius, cfg) => {
        this.detonateSporeShell(tx, ty, impactDmg, cloudRadius, cfg, enemies);
      });
      if (!shell.alive) this.mortarShells.splice(i, 1);
    }

    for (let i = this.sporeClouds.length - 1; i >= 0; i--) {
      const cloud = this.sporeClouds[i];
      cloud.update(dt, enemies);
      if (!cloud.alive) this.sporeClouds.splice(i, 1);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);

      let hitWall = false;
      if (state.worldManager && state.worldManager.obstacles) {
        for (const wall of state.worldManager.obstacles) {
          if (Math.abs(wall.x - p.x) < 220 && Math.abs(wall.y - p.y) < 220) {
            if (wall.intersectsProjectile ? wall.intersectsProjectile(p, dt) : wall.intersectsPoint(p.x, p.y)) {
              p.alive = false;
              this.spawnImpactParticles(p.x, p.y);
              hitWall = true;
              break;
            }
          }
        }
      }

      if (hitWall) {
        this.projectiles.splice(i, 1);
        continue;
      }

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        if (Math.hypot(p.x - enemy.x, p.y - enemy.y) < p.size + enemy.radius) {
          enemy.takeDamage(p.damage, p.x - p.vx, p.y - p.vy);
          this.spawnImpactParticles(p.x, p.y);
          p.alive = false;
          break;
        }
      }

      if (!p.alive) this.projectiles.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  detonateSporeShell(x, y, impactDmg, radius, cfg, enemies) {
    let killCount = 0;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (Math.hypot(enemy.x - x, enemy.y - y) <= radius + enemy.radius) {
        const wasAlive = enemy.alive;
        enemy.takeDamage(impactDmg, x, y);
        if (wasAlive && !enemy.alive) killCount++;
      }
    }

    const isMultiKill = killCount >= 3;
    const bonusScale = isMultiKill ? Math.min(1.6, 1.0 + (killCount * 0.08)) : 1.0;
    spawnShockwave(x, y, { radius: 10, maxRadius: (radius * 1.3) * bonusScale, color: isMultiKill ? '#9ae6b4' : '#48bb78', speed: 340 * bonusScale, lineWidth: 7 });

    if (state.camera) state.camera.addTrauma(0.34);
    triggerHitStop(0.028);

    if (state.decalManager) {
      state.decalManager.addSplatter(x, y, { type: 'slime', radius: radius * 0.6 * bonusScale, count: 12 + killCount * 2 });
      state.decalManager.addScorch(x, y, radius * 0.45 * bonusScale);
    }

    this.sporeClouds.push(new SporeCloud(x, y, radius, cfg.cloudDuration, cfg.dotDamage * (this.owner.godMode ? 15 : 1), cfg.dotTickRate, cfg.slowFactor));
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.45, maxLife: 0.45, color: 'rgba(104, 211, 145,' });
    }
  }

  spawnImpactParticles(x, y) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 100;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.2, maxLife: 0.2, color: 'rgba(99, 179, 237,' });
    }
  }

  render(ctx) {
    for (const cloud of this.sporeClouds) cloud.render(ctx);
    for (const shell of this.mortarShells) shell.render(ctx);
    for (const p of this.projectiles) p.render(ctx);
    for (const w of this.slots) w.render(ctx);

    for (const pt of this.particles) {
      const alpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color.endsWith(',') ? `${pt.color} ${alpha})` : pt.color;
      ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
    }
  }
}