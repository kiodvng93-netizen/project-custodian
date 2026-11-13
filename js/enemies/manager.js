// js/enemies/manager.js — Менеджер спавну хвиль ворогів, засідок та стрес-тестів

import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { Telemetry } from '../telemetry.js';
import { SpatialGrid } from './grid.js';
import { Enemy } from './enemy.js';

export class EnemyManager {
  constructor() {
    this.enemies = [];
    this.grid = new SpatialGrid(CONFIG.SPATIAL_GRID ? CONFIG.SPATIAL_GRID.cellSize : 140);
    this.spawnTimer = 0;
    this.swarmTimer = 0;
    this.rearCapTimer = 0;
    this.elapsedRunTime = 0;
    this.spawnWarden();
  }

  triggerStressTestSwarm(player) {
    const count = 65;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const dist = 140 + Math.random() * 85;
      this.enemies.push(new Enemy(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist, 'sprout'));
    }
  }

  spawnWarden() {
    const pos = CONFIG.WORLD.wardenPos;
    this.enemies.push(new Enemy(pos.x, pos.y, 'warden'));
  }

  update(dt, player, camera, canvasWidth, canvasHeight, activeNestsCount = 7) {
    this.grid.clear();
    for (let i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].alive) this.grid.insert(this.enemies[i]);
    }

    this.elapsedRunTime += dt;
    const cfg = CONFIG.ENEMIES;
    const progress = Math.min(1.0, this.elapsedRunTime / cfg.rampTimeSeconds);
    const nestMult = 0.6 + (activeNestsCount / 7) * 0.4;
    const surgeMultiplier = (player.carryingCore || (state.worldManager && state.worldManager.transferActive)) ? 0.5 : 1.0;
    const currentInterval = ((cfg.initialSpawnInterval - (progress * (cfg.initialSpawnInterval - cfg.minimumSpawnInterval))) / nestMult) * surgeMultiplier;

    this.spawnTimer += dt;
    if (this.spawnTimer >= currentInterval) {
      this.spawnTimer = 0;
      if (this.enemies.length < cfg.maxActive) {
        this.spawnDirectionalWave(player, canvasWidth, canvasHeight, 2 + Math.floor(progress * 4));
      }
    }

    this.swarmTimer += dt;
    if (this.swarmTimer >= cfg.swarmInterval) {
      this.swarmTimer = 0;
      this.triggerAmbushSwarm(player, canvasWidth, canvasHeight);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, player, this.enemies);
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (e.typeKey !== 'warden' && (dx * dx + dy * dy) > cfg.despawnRadius * cfg.despawnRadius) {
        e.alive = false;
      }
      if (!e.alive) this.enemies.splice(i, 1);
    }

    this.rearCapTimer += dt;
    if (this.rearCapTimer >= 0.25) {
      this.rearCapTimer = 0;
      this.enforceRearChaserCap(player);
    }
  }

  enforceRearChaserCap(player) {
    if (Math.hypot(player.vx, player.vy) <= 10) return;
    const moveAngle = Math.atan2(player.vy, player.vx);
    const rearEnemies = [];

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.typeKey === 'warden') continue;
      let diff = Math.abs(Math.atan2(e.y - player.y, e.x - player.x) - moveAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff > (115 * Math.PI) / 180) {
        rearEnemies.push({ index: i, distSq: Math.pow(e.x - player.x, 2) + Math.pow(e.y - player.y, 2) });
      }
    }

    const maxRear = CONFIG.ENEMIES.maxRearChasers;
    if (rearEnemies.length > maxRear) {
      rearEnemies.sort((a, b) => b.distSq - a.distSq);
      const removeIndices = new Set(rearEnemies.slice(0, rearEnemies.length - maxRear).map(r => r.index));
      this.enemies = this.enemies.filter((_, idx) => !removeIndices.has(idx));
    }
  }

  spawnDirectionalWave(player, canvasWidth, canvasHeight, count = 3) {
    const cfg = CONFIG.ENEMIES;
    if (player.x * player.x + player.y * player.y < cfg.hubSafeRadius * cfg.hubSafeRadius && this.enemies.length > 25) return;

    const isMoving = Math.hypot(player.vx, player.vy) > 10;
    const moveAngle = isMoving ? Math.atan2(player.vy, player.vx) : Math.random() * Math.PI * 2;
    const headingAway = (player.x * player.vx + player.y * player.vy) >= 0;
    const spawnDist = Math.hypot(canvasWidth / 2, canvasHeight / 2) + 90;

    for (let i = 0; i < count; i++) {
      if (this.enemies.length >= cfg.maxActive) break;
      let spawnAngle = Math.random() * Math.PI * 2;
      if (isMoving && headingAway) spawnAngle = Math.random() < 0.7 ? moveAngle + (Math.random() - 0.5) * 1.8 : spawnAngle;
      else if (isMoving && !headingAway) spawnAngle = Math.random() < 0.75 ? (moveAngle + Math.PI) + (Math.random() - 0.5) * 1.8 : spawnAngle;

      const x = player.x + Math.cos(spawnAngle) * spawnDist;
      const y = player.y + Math.sin(spawnAngle) * spawnDist;

      if (state.worldManager && state.worldManager.landmark && state.worldManager.landmark.repaired) {
        const lm = state.worldManager.landmark;
        if (Math.pow(x - lm.x, 2) + Math.pow(y - lm.y, 2) < Math.pow(CONFIG.WORLD.terraformedRadius, 2)) continue;
      }

      const roll = Math.random();
      const type = roll < 0.18 ? 'dasher' : roll < 0.38 ? 'stalker' : 'sprout';
      this.enemies.push(new Enemy(x, y, type));
    }
  }

  triggerAmbushSwarm(player, canvasWidth, canvasHeight) {
    Telemetry.recordEvent('SURGE', 'Swarm Ambush surrounding!');
    const count = 16;
    const spawnDist = Math.hypot(canvasWidth / 2, canvasHeight / 2) + 80;

    for (let i = 0; i < count; i++) {
      if (this.enemies.length >= CONFIG.ENEMIES.maxActive) break;
      const angle = (i * Math.PI * 2) / count;
      this.enemies.push(new Enemy(player.x + Math.cos(angle) * spawnDist, player.y + Math.sin(angle) * spawnDist, i % 4 === 0 ? 'dasher' : 'sprout'));
    }
  }

  render(ctx) {
    for (const enemy of this.enemies) enemy.render(ctx);
  }
}