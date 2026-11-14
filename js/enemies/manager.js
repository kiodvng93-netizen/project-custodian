// js/enemies/manager.js — Менеджер синусоїдальних хвиль ворогів, засідок та стрес-тестів

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
    this.rearCapTimer = 0;
    this.elapsedRunTime = 0;

    this.waveNumber = 1;
    this.waveTimer = 0;
    this.wavePhase = 'surge';
    this.waveIntensity = 0.55;
    this.breatherTimeLeft = 0;
    this.ambushTriggeredInWave = false;

    this._rearBuffer = [];
    this._removeIndices = new Set();
    this.despawnRadius = CONFIG.ENEMIES.despawnRadius;
    this.spawnWarden();
  }

  triggerStressTestSwarm(player) {
    const count = 65;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const dist = 140 + Math.random() * 85;
      this.enemies.push(new Enemy(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist, 'sprout', this.waveNumber));
    }
  }

  spawnWarden() {
    const pos = CONFIG.WORLD.wardenPos;
    this.enemies.push(new Enemy(pos.x, pos.y, 'warden', 1));
  }

  updateWaveCycle(dt, player, canvasWidth, canvasHeight) {
    const waveCfg = CONFIG.ENEMIES.WAVE;
    this.waveTimer += dt;

    if (this.waveTimer >= waveCfg.cycleDuration) {
      this.waveTimer -= waveCfg.cycleDuration;
      this.waveNumber++;
      this.ambushTriggeredInWave = false;
      Telemetry.recordEvent('WAVE', `Wave ${this.waveNumber} incoming!`);
    }

    const surgeEnd = waveCfg.surgeDuration;
    const ebbEnd = surgeEnd + waveCfg.ebbDuration;

    if (this.waveTimer < surgeEnd) {
      this.wavePhase = 'surge';
      this.waveIntensity = 0.55 + 0.45 * Math.sin((this.waveTimer / surgeEnd) * Math.PI * 0.75);
      this.breatherTimeLeft = 0;

      if (!this.ambushTriggeredInWave && this.waveTimer >= waveCfg.ambushTriggerTime) {
        this.ambushTriggeredInWave = true;
        this.triggerAmbushSwarm(player, canvasWidth, canvasHeight);
      }
    } else if (this.waveTimer < ebbEnd) {
      this.wavePhase = 'ebb';
      this.waveIntensity = 0.87 * Math.cos(((this.waveTimer - surgeEnd) / waveCfg.ebbDuration) * Math.PI * 0.5);
      this.breatherTimeLeft = 0;
    } else {
      if (this.wavePhase !== 'breather') {
        Telemetry.recordEvent('WAVE', `Breather window (${Math.round(waveCfg.cycleDuration - ebbEnd)}s)`);
      }
      this.wavePhase = 'breather';
      this.waveIntensity = 0;
      this.breatherTimeLeft = Math.max(0, waveCfg.cycleDuration - this.waveTimer);
    }
  }

  // Спавн одразу за краєм екрана; радіус деспавну завжди далі за спавн, інакше на великих екранах вороги зникали в наступному кадрі
  getSpawnDistance(canvasWidth, canvasHeight, margin = 90) {
    return Math.hypot(canvasWidth / 2, canvasHeight / 2) + margin;
  }

  update(dt, player, camera, canvasWidth, canvasHeight, activeNestsCount = CONFIG.WORLD.nestCountRing1) {
    this.despawnRadius = Math.max(CONFIG.ENEMIES.despawnRadius, this.getSpawnDistance(canvasWidth, canvasHeight) + 400);
    this.grid.clear();
    for (let i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].alive) this.grid.insert(this.enemies[i]);
    }

    this.elapsedRunTime += dt;
    this.updateWaveCycle(dt, player, canvasWidth, canvasHeight);

    const cfg = CONFIG.ENEMIES;
    const waveCfg = cfg.WAVE;
    const isExtractionAlert = Boolean(player.carryingCore || (state.worldManager && state.worldManager.evac.isActive));
    const progress = Math.min(1.0, this.elapsedRunTime / cfg.rampTimeSeconds);
    const nestRatio = Math.min(1.0, activeNestsCount / Math.max(1, CONFIG.WORLD.nestCountRing1));
    const nestMult = 0.75 + nestRatio * 0.75;

    if (this.wavePhase !== 'breather') {
      const pressure = Math.min(1.0, this.waveIntensity * (0.7 + 0.3 * progress));
      const baseInterval = waveCfg.maxInterval - pressure * (waveCfg.maxInterval - waveCfg.minInterval);
      const currentInterval = (baseInterval / nestMult) * (isExtractionAlert ? 0.55 : 1.0);

      this.spawnTimer += dt;
      if (this.spawnTimer >= currentInterval) {
        this.spawnTimer = 0;
        if (this.enemies.length < cfg.maxActive) {
          const packCount = 3 + Math.floor(pressure * 4 + Math.min(4, (this.waveNumber - 1) * 0.7));
          this.spawnDirectionalWave(player, canvasWidth, canvasHeight, packCount);
        }
      }
    } else if (isExtractionAlert) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= waveCfg.breatherAlertInterval) {
        this.spawnTimer = 0;
        if (this.enemies.length < cfg.maxActive) this.spawnDirectionalWave(player, canvasWidth, canvasHeight, 3);
      }
    } else {
      this.spawnTimer = 0;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, player, this.enemies);
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (e.typeKey !== 'warden' && !e.isTitan && (dx * dx + dy * dy) > this.despawnRadius * this.despawnRadius) e.alive = false;
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
    this._rearBuffer.length = 0;

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.typeKey === 'warden' || e.isTitan) continue;
      let diff = Math.abs(Math.atan2(e.y - player.y, e.x - player.x) - moveAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff > (115 * Math.PI) / 180) {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        this._rearBuffer.push({ index: i, distSq: dx * dx + dy * dy });
      }
    }

    const maxRear = CONFIG.ENEMIES.maxRearChasers;
    if (this._rearBuffer.length > maxRear) {
      this._rearBuffer.sort((a, b) => b.distSq - a.distSq);
      this._removeIndices.clear();
      const removeCount = this._rearBuffer.length - maxRear;
      for (let i = 0; i < removeCount; i++) this._removeIndices.add(this._rearBuffer[i].index);

      let writeIdx = 0;
      for (let i = 0; i < this.enemies.length; i++) {
        if (!this._removeIndices.has(i)) this.enemies[writeIdx++] = this.enemies[i];
      }
      this.enemies.length = writeIdx;
    }
  }

  isInsideTerraformedZone(x, y) {
    if (!state.worldManager || !state.worldManager.isPurifierFieldActive()) return false;
    const lm = state.worldManager.landmark;
    const r = CONFIG.WORLD.terraformedRadius;
    return (x - lm.x) * (x - lm.x) + (y - lm.y) * (y - lm.y) < r * r;
  }

  spawnDirectionalWave(player, canvasWidth, canvasHeight, count = 3) {
    const cfg = CONFIG.ENEMIES;
    if (player.x * player.x + player.y * player.y < cfg.hubSafeRadius * cfg.hubSafeRadius && this.enemies.length > 25) return;

    const isMoving = Math.hypot(player.vx, player.vy) > 10;
    const moveAngle = isMoving ? Math.atan2(player.vy, player.vx) : Math.random() * Math.PI * 2;
    const headingAway = (player.x * player.vx + player.y * player.vy) >= 0;
    const spawnDist = this.getSpawnDistance(canvasWidth, canvasHeight, 90);

    for (let i = 0; i < count; i++) {
      if (this.enemies.length >= cfg.maxActive) break;
      let spawnAngle = Math.random() * Math.PI * 2;
      if (isMoving && headingAway) spawnAngle = Math.random() < 0.7 ? moveAngle + (Math.random() - 0.5) * 1.8 : spawnAngle;
      else if (isMoving && !headingAway) spawnAngle = Math.random() < 0.75 ? (moveAngle + Math.PI) + (Math.random() - 0.5) * 1.8 : spawnAngle;

      const x = player.x + Math.cos(spawnAngle) * spawnDist;
      const y = player.y + Math.sin(spawnAngle) * spawnDist;
      if (this.isInsideTerraformedZone(x, y)) continue;

      const roll = Math.random();
      const type = roll < 0.22 ? 'dasher' : roll < 0.44 ? 'stalker' : 'sprout';
      this.enemies.push(new Enemy(x, y, type, this.waveNumber));
    }
  }

  triggerAmbushSwarm(player, canvasWidth, canvasHeight) {
    Telemetry.recordEvent('SURGE', `Wave ${this.waveNumber} Ambush surrounding!`);
    const count = Math.min(32, 14 + (this.waveNumber - 1) * 3);
    const spawnDist = this.getSpawnDistance(canvasWidth, canvasHeight, 80);

    for (let i = 0; i < count; i++) {
      if (this.enemies.length >= CONFIG.ENEMIES.maxActive) break;
      const angle = (i * Math.PI * 2) / count;
      const x = player.x + Math.cos(angle) * spawnDist;
      const y = player.y + Math.sin(angle) * spawnDist;
      if (this.isInsideTerraformedZone(x, y)) continue;
      this.enemies.push(new Enemy(x, y, i % 4 === 0 ? 'dasher' : 'sprout', this.waveNumber));
    }
  }

  render(ctx) {
    for (const enemy of this.enemies) enemy.render(ctx);
  }
}