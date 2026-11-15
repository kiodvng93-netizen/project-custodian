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
    this.cargoAlert = 0; // 0..1, з незданого скрапу (оновлюється щокадру, читає HUD)
    this.activeCap = CONFIG.ENEMIES.OPENING.startActiveCap; // ліміт живих для спавну хвиль/засідок
    this.openingPackScale = CONFIG.ENEMIES.OPENING.startPackScale;
    this.spawnWarden();
  }

  // Розгін на старті: частота спавну і ліміт живих ворогів ростуть від стартових до повних
  // за OPENING.duration. Повертає множник частоти спавну.
  updateOpeningRamp() {
    const o = CONFIG.ENEMIES.OPENING;
    const t = Math.min(1, this.elapsedRunTime / o.duration);
    this.activeCap = Math.round(o.startActiveCap + (CONFIG.ENEMIES.maxActive - o.startActiveCap) * t * t);
    this.openingPackScale = o.startPackScale + (1 - o.startPackScale) * t;
    return o.startSpawnRate + (1 - o.startSpawnRate) * t;
  }

  // Тривога Вулика: частка від CARGO_PRESSURE.fullAlertScrap незданого скрапу
  updateCargoAlert() {
    const cargo = Telemetry.metrics.resourcesCollected.techScrap;
    this.cargoAlert = Math.min(1, cargo / CONFIG.CARGO_PRESSURE.fullAlertScrap);
  }

  // Новий ворог хвилі/засідки; з тривогою частина стає елітою
  createWaveEnemy(x, y, type) {
    const enemy = new Enemy(x, y, type, this.waveNumber);
    if (Math.random() < this.cargoAlert * CONFIG.CARGO_PRESSURE.maxEliteChance) enemy.makeElite();
    return enemy;
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

  // Тривалості фаз поточної хвилі: рано ebb і breather короткі, далі ростуть
  wavePhaseDurations() {
    const w = CONFIG.ENEMIES.WAVE;
    const idx = this.waveNumber - 1;
    const ebb = w.ebbByWave[Math.min(idx, w.ebbByWave.length - 1)];
    const breather = w.breatherByWave[Math.min(idx, w.breatherByWave.length - 1)];
    return { ebb, cycle: w.surgeDuration + ebb + breather };
  }

  updateWaveCycle(dt, player, canvasWidth, canvasHeight) {
    const waveCfg = CONFIG.ENEMIES.WAVE;
    this.waveTimer += dt;

    let durations = this.wavePhaseDurations();
    if (this.waveTimer >= durations.cycle) {
      this.waveTimer -= durations.cycle;
      this.waveNumber++;
      this.ambushTriggeredInWave = false;
      Telemetry.recordEvent('WAVE', `Wave ${this.waveNumber} incoming!`);
      durations = this.wavePhaseDurations();
    }

    const surgeEnd = waveCfg.surgeDuration;
    const ebbEnd = surgeEnd + durations.ebb;

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
      this.waveIntensity = 0.87 * Math.cos(((this.waveTimer - surgeEnd) / durations.ebb) * Math.PI * 0.5);
      this.breatherTimeLeft = 0;
    } else {
      if (this.wavePhase !== 'breather') {
        Telemetry.recordEvent('WAVE', `Breather window (${Math.round(durations.cycle - ebbEnd)}s)`);
      }
      this.wavePhase = 'breather';
      this.waveIntensity = 0;
      this.breatherTimeLeft = Math.max(0, durations.cycle - this.waveTimer);
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
    const cargoCfg = CONFIG.CARGO_PRESSURE;
    this.updateCargoAlert();
    const isExtractionAlert = Boolean(player.carryingCore || (state.worldManager && state.worldManager.evac.isActive));
    const progress = Math.min(1.0, this.elapsedRunTime / cfg.rampTimeSeconds);
    const nestRatio = Math.min(1.0, activeNestsCount / Math.max(1, CONFIG.WORLD.nestCountRing1));
    const nestMult = 0.75 + nestRatio * 0.75;
    const cargoRateMult = 1 + this.cargoAlert * cargoCfg.maxSpawnRateBonus;
    const openingRateMult = this.updateOpeningRamp();

    if (this.wavePhase !== 'breather') {
      const pressure = Math.min(1.0, this.waveIntensity * (0.7 + 0.3 * progress));
      const baseInterval = waveCfg.maxInterval - pressure * (waveCfg.maxInterval - waveCfg.minInterval);
      const currentInterval = (baseInterval / nestMult / cargoRateMult / openingRateMult) * (isExtractionAlert ? 0.55 : 1.0);

      this.spawnTimer += dt;
      if (this.spawnTimer >= currentInterval) {
        this.spawnTimer = 0;
        if (this.enemies.length < this.activeCap) {
          const fullPack = 3 + Math.floor(pressure * 4 + Math.min(4, (this.waveNumber - 1) * 0.7) + this.cargoAlert * cargoCfg.maxExtraPack);
          const packCount = Math.max(1, Math.round(fullPack * this.openingPackScale));
          this.spawnDirectionalWave(player, canvasWidth, canvasHeight, packCount);
        }
      }
    } else if (isExtractionAlert || this.cargoAlert >= cargoCfg.breatherTrickleAlert) {
      // Перепочинку немає, коли несеш Ядро, евакуюєшся або трюм переповнений
      this.spawnTimer += dt;
      if (this.spawnTimer >= waveCfg.breatherAlertInterval) {
        this.spawnTimer = 0;
        if (this.enemies.length < this.activeCap) this.spawnDirectionalWave(player, canvasWidth, canvasHeight, 3);
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

  // Хвилі не спавняться на постійно відновленій землі й у полі Пурифаєра цього забігу
  isInsideTerraformedZone(x, y) {
    const wm = state.worldManager;
    if (wm.terraform.isReclaimed(x, y)) return true;
    if (!wm.isPurifierFieldActive()) return false;
    const lm = wm.landmark;
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
      if (this.enemies.length >= this.activeCap) break;
      let spawnAngle = Math.random() * Math.PI * 2;
      if (isMoving && headingAway) spawnAngle = Math.random() < 0.7 ? moveAngle + (Math.random() - 0.5) * 1.8 : spawnAngle;
      else if (isMoving && !headingAway) spawnAngle = Math.random() < 0.75 ? (moveAngle + Math.PI) + (Math.random() - 0.5) * 1.8 : spawnAngle;

      const x = player.x + Math.cos(spawnAngle) * spawnDist;
      const y = player.y + Math.sin(spawnAngle) * spawnDist;
      if (this.isInsideTerraformedZone(x, y)) continue;

      const roll = Math.random();
      const type = roll < 0.22 ? 'dasher' : roll < 0.44 ? 'stalker' : 'sprout';
      this.enemies.push(this.createWaveEnemy(x, y, type));
    }
  }

  triggerAmbushSwarm(player, canvasWidth, canvasHeight) {
    Telemetry.recordEvent('SURGE', `Wave ${this.waveNumber} Ambush surrounding!`);
    const o = CONFIG.ENEMIES.OPENING;
    const openingT = Math.min(1, this.elapsedRunTime / o.duration);
    const fullCount = Math.min(32, 14 + (this.waveNumber - 1) * 3);
    const count = Math.max(4, Math.round(fullCount * (o.ambushStartScale + (1 - o.ambushStartScale) * openingT)));
    const spawnDist = this.getSpawnDistance(canvasWidth, canvasHeight, 80);

    // Кільце з проломом: засідка — тест на реакцію, а не гарантована смерть
    const gap = (CONFIG.ENEMIES.WAVE.ambushGapDegrees * Math.PI) / 180;
    const arc = Math.PI * 2 - gap;
    const start = Math.random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      if (this.enemies.length >= this.activeCap) break;
      const angle = start + gap / 2 + (arc * i) / Math.max(1, count - 1);
      const x = player.x + Math.cos(angle) * spawnDist;
      const y = player.y + Math.sin(angle) * spawnDist;
      if (this.isInsideTerraformedZone(x, y)) continue;
      this.enemies.push(this.createWaveEnemy(x, y, i % 4 === 0 ? 'dasher' : 'sprout'));
    }
  }

  render(ctx) {
    for (const enemy of this.enemies) enemy.render(ctx);
  }
}