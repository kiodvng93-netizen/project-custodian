// js/weapons/rangedArchetypes.js — Архетипи: Projectile, Mortar, Chain

import { CONFIG } from '../config.js';
import { state, spawnShockwave } from '../state.js';
import { Projectile, MortarShell } from './projectiles.js';

function findNearestTarget(x, y, range, fallbackList, exclude = null) {
  let closest = null;
  let closestDist = range;
  const grid = state.enemyManager && state.enemyManager.grid;

  const checkList = (list) => {
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      if (!t || !t.alive || (exclude && exclude.has(t))) continue;
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < closestDist) {
        closestDist = d;
        closest = t;
      }
    }
  };

  if (grid) {
    checkList(grid.getNearby(x, y, range + 35));
    if (state.worldManager && state.worldManager.nests) checkList(state.worldManager.nests);
  } else if (fallbackList) {
    checkList(fallbackList);
  }
  return closest;
}

export class ProjectileWeapon {
  constructor(owner, cfg) {
    this.owner = owner;
    this.cfg = cfg;
    this.name = cfg.name;
    this.isEvolution = Boolean(cfg.isEvolution);
    this.cooldown = 0;
    this.salvoTimer = 0;
    this.orbitAngle = 0;
  }

  getOrigin() {
    if (!this.cfg.orbitOffsetRadius) return { x: this.owner.x, y: this.owner.y };
    const r = this.cfg.orbitOffsetRadius * this.owner.growthScale;
    return {
      x: this.owner.x + Math.cos(this.orbitAngle) * r,
      y: this.owner.y + Math.sin(this.orbitAngle) * r
    };
  }

  update(dt, enemies, ctxData) {
    if (this.cfg.orbitOffsetRadius) this.orbitAngle += 1.2 * dt;
    if (this.cooldown > 0) this.cooldown -= dt;

    const origin = this.getOrigin();
    const mult = this.owner.godMode ? 15 : 1;

    if (this.cooldown <= 0) {
      const target = findNearestTarget(origin.x, origin.y, this.cfg.range, enemies);
      if (target) {
        const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
        const speed = this.cfg.projectileSpeed;
        ctxData.projectiles.push(new Projectile(
          origin.x, origin.y,
          Math.cos(angle) * speed, Math.sin(angle) * speed,
          this.cfg.damage * mult, this.cfg.range,
          { size: this.cfg.projectileSize, pierce: this.cfg.pierce, color: this.cfg.color }
        ));
        this.cooldown = this.cfg.fireRate;
      }
    }

    if (this.cfg.salvoCooldown) {
      this.salvoTimer += dt;
      if (this.salvoTimer >= this.cfg.salvoCooldown) {
        this.salvoTimer = 0;
        spawnShockwave(origin.x, origin.y, { radius: 15, maxRadius: 140, color: '#63b3ed', speed: 440, lineWidth: 4.5 });
        if (state.camera) state.camera.addTrauma(CONFIG.JUICE.trauma.hyperionSalvo || 0.32);

        const count = this.cfg.salvoCount || 12;
        const speed = this.cfg.projectileSpeed * 0.85;
        const dmg = (this.cfg.salvoDamage || this.cfg.damage) * mult;
        for (let i = 0; i < count; i++) {
          const a = (i * Math.PI * 2) / count;
          ctxData.projectiles.push(new Projectile(
            origin.x, origin.y, Math.cos(a) * speed, Math.sin(a) * speed,
            dmg, 280, { size: 7, pierce: 1, color: this.cfg.color }
          ));
        }
      }
    }
  }

  render(ctx) {
    if (!this.cfg.orbitOffsetRadius) return;
    const origin = this.getOrigin();
    ctx.save();
    ctx.translate(origin.x, origin.y);
    ctx.rotate(this.orbitAngle + Math.PI / 2);
    ctx.fillStyle = '#1a365d';
    ctx.strokeStyle = '#63b3ed';
    ctx.lineWidth = 2;
    ctx.fillRect(-10, -10, 20, 20);
    ctx.strokeRect(-10, -10, 20, 20);
    ctx.restore();
  }
}

export class MortarWeapon {
  constructor(owner, cfg) {
    this.owner = owner;
    this.cfg = cfg;
    this.name = cfg.name;
    this.isEvolution = Boolean(cfg.isEvolution);
    this.cooldown = 0;
  }

  update(dt, enemies, ctxData) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.cooldown > 0) return;

    const target = this.findBestClusterTarget(enemies);
    if (target) {
      const mult = this.owner.godMode ? 15 : 1;
      ctxData.shells.push(new MortarShell(this.owner.x, this.owner.y, target.x, target.y, this.cfg, mult));
      this.cooldown = this.cfg.fireRate;
    }
  }

  findBestClusterTarget(enemies) {
    const grid = state.enemyManager && state.enemyManager.grid;
    const pool = grid
      ? grid.getNearby(this.owner.x, this.owner.y, this.cfg.maxRange)
      : enemies;

    let best = null;
    let maxWeight = 0;
    for (let i = 0; i < pool.length; i++) {
      const e = pool[i];
      if (!e.alive) continue;
      const d = Math.hypot(e.x - this.owner.x, e.y - this.owner.y);
      if (d < this.cfg.minRange || d > this.cfg.maxRange) continue;

      let weight = 1;
      if (grid) {
        const neighbors = grid.getNearby(e.x, e.y, this.cfg.zoneRadius);
        for (let j = 0; j < neighbors.length; j++) {
          if (neighbors[j].alive && Math.hypot(e.x - neighbors[j].x, e.y - neighbors[j].y) <= this.cfg.zoneRadius) weight++;
        }
      }
      if (weight > maxWeight) {
        maxWeight = weight;
        best = e;
      }
    }
    return best;
  }

  render() {}
}

export class ChainWeapon {
  constructor(owner, cfg) {
    this.owner = owner;
    this.cfg = cfg;
    this.name = cfg.name;
    this.isEvolution = Boolean(cfg.isEvolution);
    this.cooldown = 0;
    this.activeBolts = [];
    this.hitSet = new Set();
  }

  update(dt, enemies, ctxData) {
    if (this.cooldown > 0) this.cooldown -= dt;
    for (let i = this.activeBolts.length - 1; i >= 0; i--) {
      this.activeBolts[i].life -= dt;
      if (this.activeBolts[i].life <= 0) this.activeBolts.splice(i, 1);
    }

    if (this.cooldown > 0) return;

    const first = findNearestTarget(this.owner.x, this.owner.y, this.cfg.range, enemies);
    if (!first) return;

    this.hitSet.clear();
    this.hitSet.add(first);
    const dmg = this.cfg.damage * (this.owner.godMode ? 15 : 1);

    first.takeDamage(dmg, this.owner.x, this.owner.y);
    ctxData.spawnParticles(first.x, first.y);
    this.activeBolts.push({ fromX: this.owner.x, fromY: this.owner.y, toX: first.x, toY: first.y, life: 0.12, maxLife: 0.12 });

    let current = first;
    for (let step = 1; step < this.cfg.chainCount; step++) {
      const next = findNearestTarget(current.x, current.y, this.cfg.chainRange, enemies, this.hitSet);
      if (!next) break;
      this.hitSet.add(next);
      next.takeDamage(dmg * 0.9, current.x, current.y);
      ctxData.spawnParticles(next.x, next.y);
      this.activeBolts.push({ fromX: current.x, fromY: current.y, toX: next.x, toY: next.y, life: 0.12, maxLife: 0.12 });
      current = next;
    }
    this.cooldown = this.cfg.fireRate;
  }

  render(ctx) {
    for (let i = 0; i < this.activeBolts.length; i++) {
      const bolt = this.activeBolts[i];
      ctx.save();
      ctx.strokeStyle = `rgba(129, 230, 217, ${bolt.life / bolt.maxLife})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bolt.fromX, bolt.fromY);
      ctx.lineTo(bolt.toX, bolt.toY);
      ctx.stroke();
      ctx.restore();
    }
  }
}