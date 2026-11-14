// js/world/manager.js — Менеджер світу: руїни, гнізда, аутпости, Хаб, колізії, загрози Кільця 2+ та телепорт

import { CONFIG, MetaProgression, saveMetaProgression } from '../config.js';
import { state } from '../state.js';
import { Telemetry } from '../telemetry.js';
import { ObstacleWall, LootChest, Landmark, CorePickup, CorruptedNest } from './structures.js';
import { SanctuaryHub } from './sanctuary.js';
import { InsuranceOutpost } from './outpost.js';
import { RingHazardManager } from './hazards.js';
import { renderRadarMinimap } from './minimap.js';

export class WorldManager {
  constructor() {
    this.nests = [];
    this.obstacles = [];
    this.chests = [];
    this.outposts = [];
    const lm = CONFIG.WORLD.landmarkPos;
    this.landmark = new Landmark(lm.x, lm.y);
    this.sanctuary = new SanctuaryHub();
    this.hazards = new RingHazardManager();
    this.coreDrop = null;
    this.transferActive = false;
    this.transferTimer = 0;
    this.transferTotalTime = 25.0;

    this._obstacleCellSize = 320;
    this._obstacleGrid = new Map();
    this._wallQueryToken = 0;
    this._ruinCenters = [];

    this.spawnInitialNests();
    this.spawnRuins();
    this.buildObstacleGrid();
    this.spawnChests();
    this.spawnOutposts();
  }

  isClearOfPOIs(x, y, nestPad = 240) {
    const lm = CONFIG.WORLD.landmarkPos;
    const wp = CONFIG.WORLD.wardenPos;
    if (x * x + y * y < 750 * 750) return false;
    if (Math.hypot(x - lm.x, y - lm.y) < 420) return false;
    if (Math.hypot(x - wp.x, y - wp.y) < 450) return false;
    for (let i = 0; i < this.nests.length; i++) {
      if (Math.hypot(x - this.nests[i].x, y - this.nests[i].y) < nestPad) return false;
    }
    return true;
  }

  spawnInitialNests() {
    const count = CONFIG.WORLD.nestCountRing1;
    const maxDist = CONFIG.WORLD.ring1Radius * 0.9;
    const minDist = 1500;
    const pool = [];
    const poolSize = count * 2;

    for (let i = 0; i < poolSize * 4 && pool.length < poolSize; i++) {
      const band = (i % 3) / 3;
      const angle = Math.random() * Math.PI * 2;
      const dist = minDist + (band + Math.random() * 0.34) * (maxDist - minDist);
      const nx = Math.cos(angle) * dist, ny = Math.sin(angle) * dist;
      if (!this.isClearOfPOIs(nx, ny, 0)) continue;
      if (pool.some(p => Math.hypot(nx - p.x, ny - p.y) < 1800)) continue;
      pool.push({ x: nx, y: ny });
    }

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }

    const activeCount = Math.min(count, pool.length);
    for (let i = 0; i < activeCount; i++) {
      const pt = pool[i];
      this.nests.push(new CorruptedNest(pt.x, pt.y));
      if (i % 2 === 0) this.obstacles.push(new ObstacleWall(pt.x - 70, pt.y - 115, 140, 24));
    }
  }

  spawnRuins() {
    const clusterCount = CONFIG.WORLD.ruinsClusterCount || 40;
    const maxDist = CONFIG.WORLD.ring1Radius * 0.92;

    for (let c = 0; c < clusterCount; c++) {
      const angle = (c * Math.PI * 2) / clusterCount + (Math.random() - 0.5) * 0.4;
      const dist = 900 + Math.random() * (maxDist - 900);
      const cx = Math.cos(angle) * dist, cy = Math.sin(angle) * dist;
      if (!this.isClearOfPOIs(cx, cy, 220)) continue;

      const w1 = 90 + Math.random() * 80, h1 = 26 + Math.random() * 10;
      this.obstacles.push(new ObstacleWall(cx - w1 / 2, cy - h1 / 2, w1, h1));
      const w2 = 26 + Math.random() * 10, h2 = 80 + Math.random() * 70;
      this.obstacles.push(new ObstacleWall(cx + (Math.random() > 0.5 ? 50 : -50), cy - h2 / 2, w2, h2));
      this._ruinCenters.push({ x: cx, y: cy });
    }

    const lm = this.landmark;
    this.obstacles.push(new ObstacleWall(lm.x - 140, lm.y - 120, 280, 28));
    this.obstacles.push(new ObstacleWall(lm.x - 140, lm.y + 92, 280, 28));
    this.obstacles.push(new ObstacleWall(lm.x - 140, lm.y - 92, 28, 184));
  }

  spawnChests() {
    const chestChance = CONFIG.WORLD.chestSpawnChance || 0.65;
    const lm = this.landmark;
    if (this.isCircleClearOfWalls(lm.x + 80, lm.y, 24)) this.chests.push(new LootChest(lm.x + 80, lm.y));

    for (let i = 0; i < this._ruinCenters.length; i++) {
      if (Math.random() >= chestChance) continue;
      const center = this._ruinCenters[i];
      for (let attempt = 0; attempt < 10; attempt++) {
        const a = Math.random() * Math.PI * 2, r = 75 + Math.random() * 55;
        const tx = center.x + Math.cos(a) * r, ty = center.y + Math.sin(a) * r;
        if (this.isCircleClearOfWalls(tx, ty, 28) && this.isClearOfPOIs(tx, ty, 90)) {
          this.chests.push(new LootChest(tx, ty));
          break;
        }
      }
    }
  }

  spawnOutposts() {
    const count = CONFIG.WORLD.outpostCount || 3;
    const baseAngle = Math.random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      for (let attempt = 0; attempt < 16; attempt++) {
        const angle = baseAngle + (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.45;
        const dist = 4200 + Math.random() * 4800;
        const ox = Math.cos(angle) * dist, oy = Math.sin(angle) * dist;
        if (this.isCircleClearOfWalls(ox, oy, 75) && this.isClearOfPOIs(ox, oy, 320)) {
          this.outposts.push(new InsuranceOutpost(ox, oy));
          break;
        }
      }
    }
  }

  buildObstacleGrid() {
    this._obstacleGrid.clear();
    const cellSize = this._obstacleCellSize;
    for (let i = 0; i < this.obstacles.length; i++) {
      const wall = this.obstacles[i];
      const minCx = Math.floor(wall.x / cellSize), maxCx = Math.floor((wall.x + wall.w) / cellSize);
      const minCy = Math.floor(wall.y / cellSize), maxCy = Math.floor((wall.y + wall.h) / cellSize);
      for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cy = minCy; cy <= maxCy; cy++) {
          const key = (cx + 50000) * 100000 + (cy + 50000);
          let bucket = this._obstacleGrid.get(key);
          if (!bucket) { bucket = []; this._obstacleGrid.set(key, bucket); }
          bucket.push(wall);
        }
      }
    }
  }

  isCircleClearOfWalls(x, y, radius = 28) {
    const cellSize = this._obstacleCellSize;
    const minCx = Math.floor((x - radius) / cellSize), maxCx = Math.floor((x + radius) / cellSize);
    const minCy = Math.floor((y - radius) / cellSize), maxCy = Math.floor((y + radius) / cellSize);
    const token = ++this._wallQueryToken;
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const bucket = this._obstacleGrid.get((cx + 50000) * 100000 + (cy + 50000));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const wall = bucket[i];
          if (wall._queryToken === token) continue;
          wall._queryToken = token;
          if (wall.intersectsCircle(x, y, radius)) return false;
        }
      }
    }
    return true;
  }

  intersectsProjectileObstacles(p, dt = 0.016) {
    const cellSize = this._obstacleCellSize;
    const dx = (p.vx || 0) * dt, dy = (p.vy || 0) * dt;
    const prevX = p.x - dx, prevY = p.y - dy, r = (p.size || 5) + 2;
    const minCx = Math.floor((Math.min(prevX, p.x) - r) / cellSize), maxCx = Math.floor((Math.max(prevX, p.x) + r) / cellSize);
    const minCy = Math.floor((Math.min(prevY, p.y) - r) / cellSize), maxCy = Math.floor((Math.max(prevY, p.y) + r) / cellSize);
    const token = ++this._wallQueryToken;
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const bucket = this._obstacleGrid.get((cx + 50000) * 100000 + (cy + 50000));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const wall = bucket[i];
          if (wall._queryToken === token) continue;
          wall._queryToken = token;
          if (wall.intersectsProjectile(p, dt)) return true;
        }
      }
    }
    return false;
  }

  resolveCircleObstacles(circle, dt = 0, target = null) {
    const cellSize = this._obstacleCellSize, r = circle.radius || 15;
    const minCx = Math.floor((circle.x - r) / cellSize), maxCx = Math.floor((circle.x + r) / cellSize);
    const minCy = Math.floor((circle.y - r) / cellSize), maxCy = Math.floor((circle.y + r) / cellSize);
    const token = ++this._wallQueryToken;
    let collided = false;
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const bucket = this._obstacleGrid.get((cx + 50000) * 100000 + (cy + 50000));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const wall = bucket[i];
          if (wall._queryToken === token) continue;
          wall._queryToken = token;
          if (wall.resolveCircleCollision(circle)) {
            collided = true;
            if (dt > 0 && target) this.nudgeAroundWall(circle, wall, dt, target);
          }
        }
      }
    }
    return collided;
  }

  nudgeAroundWall(circle, wall, dt, target) {
    const centerX = wall.x + wall.w * 0.5, centerY = wall.y + wall.h * 0.5;
    const spd = (circle.speed || 100) * 0.6 * dt;
    if (wall.w >= wall.h) {
      if (circle.x >= wall.x && circle.x <= wall.x + wall.w && (circle.y - centerY) * (target.y - centerY) < 0) {
        circle.x += (circle.x >= centerX ? 1 : -1) * spd;
      }
    } else if (circle.y >= wall.y && circle.y <= wall.y + wall.h && (circle.x - centerX) * (target.x - centerX) < 0) {
      circle.y += (circle.y >= centerY ? 1 : -1) * spd;
    }
  }

  spawnCore(x, y) { this.coreDrop = new CorePickup(x, y); }

  startRemoteTransfer() {
    if (this.transferActive || !this.landmark.repaired) return;
    this.transferActive = true;
    this.transferTimer = this.transferTotalTime;
    if (state.camera) state.camera.addTrauma(0.5);
    Telemetry.recordEvent('SURGE', 'Scrap Transfer started! 25s Survival Surge!');
  }

  completeRemoteTransfer() {
    this.transferActive = false;
    const m = Telemetry.metrics;
    const scrapSecured = m.resourcesCollected.techScrap;
    MetaProgression.bankedTechScrap += scrapSecured;
    m.resourcesBanked.techScrap += scrapSecured;
    m.resourcesCollected.techScrap = 0;
    saveMetaProgression();
    if (state.camera) state.camera.addTrauma(0.6);
    Telemetry.recordEvent('BANK', `Secured +${scrapSecured} Tech Scrap in Sanctuary Vault!`);
  }

  fastTravelToHubWithTax(player) {
    if (!this.landmark.repaired) return;
    const dist = Math.hypot(player.x, player.y);
    const taxRate = Math.min(CONFIG.ECONOMY.maxDistanceTax, (dist / 1000) * CONFIG.ECONOMY.distanceTaxRatePer1000px);
    const m = Telemetry.metrics;
    const scrapKept = Math.floor(m.resourcesCollected.techScrap * (1 - taxRate));
    MetaProgression.bankedTechScrap += scrapKept;
    m.resourcesBanked.techScrap += scrapKept;
    m.resourcesCollected.techScrap = 0;
    saveMetaProgression();
    player.x = 0; player.y = 0;
    Telemetry.recordEvent('TRAVEL', `Fast traveled home! Banked ${scrapKept} Scrap (Tax: ${Math.round(taxRate * 100)}%).`);
  }

  update(dt, player, enemyManager) {
    this.resolveCircleObstacles(player);
    this.sanctuary.update(dt, player, enemyManager);
    for (let i = 0; i < this.outposts.length; i++) this.outposts[i].update(dt, player);

    for (let i = this.nests.length - 1; i >= 0; i--) {
      this.nests[i].update(dt, player, enemyManager);
      if (!this.nests[i].alive) this.nests.splice(i, 1);
    }
    if (this.coreDrop && this.coreDrop.alive) this.coreDrop.update(player);
    if (player.carryingCore && !this.landmark.repaired) {
      if (Math.hypot(player.x - this.landmark.x, player.y - this.landmark.y) < player.radius + this.landmark.radius) {
        this.landmark.repair(player);
      }
    }
    if (this.transferActive) {
      this.transferTimer -= dt;
      if (this.transferTimer <= 0) this.completeRemoteTransfer();
    }
  }

  render(ctx) {
    const viewLeft = state.camera ? state.camera.x - window.innerWidth / 2 - 100 : -2000;
    const viewRight = state.camera ? state.camera.x + window.innerWidth / 2 + 100 : 2000;
    const viewTop = state.camera ? state.camera.y - window.innerHeight / 2 - 100 : -2000;
    const viewBottom = state.camera ? state.camera.y + window.innerHeight / 2 + 100 : 2000;
    for (const wall of this.obstacles) {
      if (wall.x + wall.w >= viewLeft && wall.x <= viewRight && wall.y + wall.h >= viewTop && wall.y <= viewBottom) wall.render(ctx);
    }
    for (const chest of this.chests) {
      if (chest.x >= viewLeft && chest.x <= viewRight && chest.y >= viewTop && chest.y <= viewBottom) chest.render(ctx);
    }
    this.sanctuary.renderOverlay(ctx);
    for (let i = 0; i < this.outposts.length; i++) this.outposts[i].render(ctx);
    this.landmark.render(ctx);
    for (const nest of this.nests) nest.render(ctx);
    if (this.coreDrop && this.coreDrop.alive) this.coreDrop.render(ctx);
  }

  renderCompass(ctx, player, canvasWidth) {
    renderRadarMinimap(ctx, this, player, canvasWidth);
  }
}