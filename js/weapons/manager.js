// js/weapons/manager.js — Менеджер арсеналу на 6 архетипах та еволюцій

import { CONFIG } from '../config.js';
import { state, triggerHitStop, spawnShockwave } from '../state.js';
import { Telemetry } from '../telemetry.js';
import { WEAPON_ARCHETYPES, EVOLUTIONS, createRunWeaponConfigs } from './catalog.js';
import { GroundZone } from './projectiles.js';
import { ProjectileWeapon, MortarWeapon, ChainWeapon } from './rangedArchetypes.js';
import { OrbitalWeapon, ConeWeapon, AuraWeapon } from './meleeArchetypes.js';

export class WeaponManager {
  constructor(owner) {
    this.owner = owner;
    this.maxSlots = 6;
    this.runConfigs = createRunWeaponConfigs();
    this.slots = [this.createWeapon('blaster')];
    this.projectiles = [];
    this.mortarShells = [];
    this.zones = [];
    this.particles = [];
    this._updateCtx = {
      projectiles: this.projectiles,
      shells: this.mortarShells,
      spawnParticles: (x, y) => this.spawnImpactParticles(x, y)
    };
  }

  getConfig(key) {
    return this.runConfigs[key] || null;
  }

  createWeapon(key) {
    const cfg = this.runConfigs[key];
    if (!cfg) return null;

    switch (cfg.archetype) {
      case WEAPON_ARCHETYPES.PROJECTILE: return new ProjectileWeapon(this.owner, cfg);
      case WEAPON_ARCHETYPES.MORTAR:     return new MortarWeapon(this.owner, cfg);
      case WEAPON_ARCHETYPES.ORBITAL:    return new OrbitalWeapon(this.owner, cfg);
      case WEAPON_ARCHETYPES.CHAIN:      return new ChainWeapon(this.owner, cfg);
      case WEAPON_ARCHETYPES.CONE:       return new ConeWeapon(this.owner, cfg);
      case WEAPON_ARCHETYPES.AURA:       return new AuraWeapon(this.owner, cfg);
      default:                           return null;
    }
  }

  hasWeapon(name) {
    const target = name.toLowerCase().trim();
    return this.slots.some(w => w.name.toLowerCase().trim() === target);
  }

  addWeaponByKey(key) {
    if (this.slots.length >= this.maxSlots) return false;
    const weapon = this.createWeapon(key);
    if (!weapon) return false;
    this.slots.push(weapon);
    return true;
  }

  evolveWeapons(evolutionKey) {
    const evo = EVOLUTIONS[evolutionKey];
    if (!evo || !evo.ingredients.every(name => this.hasWeapon(name))) return false;

    const lowerIngredients = evo.ingredients.map(n => n.toLowerCase().trim());
    this.slots = this.slots.filter(w => !lowerIngredients.includes(w.name.toLowerCase().trim()));

    const evolved = this.createWeapon(evo.resultKey);
    if (evolved) this.slots.push(evolved);

    Telemetry.recordEvent('EVOLUTION', `WEAPON EVOLVED: ${evo.name}! Slot compressed.`);
    return true;
  }

  reset() {
    this.runConfigs = createRunWeaponConfigs();
    this.slots = [this.createWeapon('blaster')];
    this.projectiles.length = 0;
    this.mortarShells.length = 0;
    this.zones.length = 0;
    this.particles.length = 0;
  }

  update(dt, enemies) {
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy.sporeSlowTimer > 0) {
        enemy.sporeSlowTimer -= dt;
        enemy.currentSlow = enemy.sporeSlowMult || 0.55;
      } else {
        enemy.currentSlow = 1.0;
      }
    }

    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i].update(dt, enemies, this._updateCtx);
    }

    for (let i = this.mortarShells.length - 1; i >= 0; i--) {
      const shell = this.mortarShells[i];
      shell.update(dt, (tx, ty, cfg, mult) => this.detonateShell(tx, ty, cfg, mult, enemies));
      if (!shell.alive) this.mortarShells.splice(i, 1);
    }

    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.update(dt, enemies, this.owner, this._updateCtx.spawnParticles);
      if (!z.alive) this.zones.splice(i, 1);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, enemies, this._updateCtx.spawnParticles);
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

  detonateShell(x, y, cfg, mult, enemies) {
    const radius = cfg.zoneRadius || 65;
    const impactDmg = cfg.damage * mult;
    const grid = state.enemyManager && state.enemyManager.grid;
    let killCount = 0;

    const applyHit = (list) => {
      for (let i = 0; i < list.length; i++) {
        const enemy = list[i];
        if (!enemy.alive) continue;
        if (Math.hypot(enemy.x - x, enemy.y - y) <= radius + enemy.radius) {
          const wasAlive = enemy.alive;
          enemy.takeDamage(impactDmg, x, y);
          if (wasAlive && !enemy.alive) killCount++;
        }
      }
    };

    if (grid) {
      applyHit(grid.getNearby(x, y, radius + 35));
      if (state.worldManager && state.worldManager.nests) applyHit(state.worldManager.nests);
    } else {
      applyHit(enemies);
    }

    const isAsh = cfg.theme === 'ash';
    const isMultiKill = killCount >= 3;
    const bonusScale = isMultiKill ? Math.min(1.65, 1.0 + killCount * 0.08) : 1.0;

    spawnShockwave(x, y, {
      radius: isAsh ? 14 : 10,
      maxRadius: radius * (isAsh ? 1.4 : 1.3) * bonusScale,
      color: isAsh ? (isMultiKill ? '#fed7aa' : '#f6ad55') : (isMultiKill ? '#9ae6b4' : '#48bb78'),
      speed: (isAsh ? 380 : 340) * bonusScale,
      lineWidth: 7
    });

    if (state.camera) state.camera.addTrauma(isAsh ? CONFIG.JUICE.trauma.incineratorExplosion : CONFIG.JUICE.trauma.mortarExplosion);
    triggerHitStop(isAsh ? CONFIG.JUICE.hitStop.incineratorExplosion : CONFIG.JUICE.hitStop.mortarExplosion);

    if (state.decalManager) {
      state.decalManager.addScorch(x, y, radius * (isAsh ? 0.75 : 0.45) * bonusScale);
      state.decalManager.addSplatter(x, y, {
        type: isAsh ? 'amber' : 'slime',
        radius: radius * (isAsh ? 0.45 : 0.6) * bonusScale,
        count: 12 + killCount * 2
      });
    }

    this.zones.push(new GroundZone(x, y, cfg, mult));
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 120;
      this.particles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 0.42, maxLife: 0.42, color: isAsh ? 'rgba(246, 173, 85,' : 'rgba(104, 211, 145,' });
    }
  }

  spawnImpactParticles(x, y) {
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 100;
      this.particles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 0.2, maxLife: 0.2, color: 'rgba(99, 179, 237,' });
    }
  }

  render(ctx) {
    for (let i = 0; i < this.zones.length; i++) this.zones[i].render(ctx);
    for (let i = 0; i < this.mortarShells.length; i++) this.mortarShells[i].render(ctx);
    for (let i = 0; i < this.projectiles.length; i++) this.projectiles[i].render(ctx);
    for (let i = 0; i < this.slots.length; i++) this.slots[i].render(ctx);

    for (let i = 0; i < this.particles.length; i++) {
      const pt = this.particles[i];
      const alpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = `${pt.color} ${alpha})`;
      ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
    }
  }
}