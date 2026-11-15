// js/world/manager.js — Менеджер світу: руїни, гнізда, аутпости, Хаб, колізії, евакуація та телепорт

import { CONFIG, MetaProgression, saveMetaProgression } from '../config.js';
import { state, spawnShockwave } from '../state.js';
import { Telemetry } from '../telemetry.js';
import { endRun } from '../run.js';
import { Landmark, CorePickup } from './structures.js';
import { SanctuaryHub } from './sanctuary.js';
import { EvacBeacon } from './evac.js';
import { renderRadarMinimap } from './minimap.js';
import { TerraformSites } from './terraform.js';
import { generateRunLayout } from './generation.js';

export class WorldManager {
  constructor() {
    this.nests = [];
    this.obstacles = [];
    this.chests = [];
    this.outposts = [];
    const lm = CONFIG.WORLD.landmarkPos;
    this.landmark = new Landmark(lm.x, lm.y);
    this.sanctuary = new SanctuaryHub();
    this.coreDrop = null;
    this.evac = new EvacBeacon(this.landmark);
    this.terraform = new TerraformSites(); // постійні ділянки — до генерації випадкового наповнення

    this._obstacleCellSize = 320;
    this._obstacleGrid = new Map();
    this._wallQueryToken = 0;

    generateRunLayout(this); // випадкове наповнення цього забігу (js/world/generation.js)
    this.initialNestCount = this.nests.length;
  }

  // Поле Пурифаєра знищує ворогів у зоні — але не під час евакуації
  isPurifierFieldActive() {
    return this.landmark.repaired && !this.evac.isActive;
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
    if (state.plants.resolve(circle, dt, target)) collided = true; // тверді дерева (js/plants.js)
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

  // Світ закінчується на межі Кільця 1 — далі контенту немає
  clampToWorldEdge(entity) {
    const edge = CONFIG.WORLD.ring1Radius - (entity.radius || 0);
    const dist = Math.hypot(entity.x, entity.y);
    if (dist > edge) {
      entity.x *= edge / dist;
      entity.y *= edge / dist;
    }
  }

  spawnCore(x, y) { this.coreDrop = new CorePickup(x, y); }

  // Перемога: весь трюм + бонус у Vault, забіг завершено
  completeEvac() {
    const m = Telemetry.metrics;
    const cargo = m.resourcesCollected.techScrap;
    const bonus = CONFIG.EVAC.victoryBonusScrap;
    MetaProgression.bankedTechScrap += cargo + bonus;
    m.resourcesBanked.techScrap += cargo + bonus;
    m.resourcesCollected.techScrap = 0;
    m.evacsCompleted++;
    saveMetaProgression();
    if (state.camera) state.camera.addTrauma(0.8);
    spawnShockwave(this.landmark.x, this.landmark.y, { radius: 30, maxRadius: 700, color: '#bee3f8', speed: 620, lineWidth: 9 });
    Telemetry.recordEvent('EVAC', `Evacuated! Banked ${cargo} + ${bonus} bonus Scrap.`);
    endRun('victory', { banked: cargo + bonus, bonus });
  }

  fastTravelToHubWithTax(player) {
    if (!this.landmark.repaired || this.evac.isActive) return;
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
    this.clampToWorldEdge(player);
    this.sanctuary.update(dt, player, enemyManager);
    for (let i = 0; i < this.outposts.length; i++) this.outposts[i].update(dt, player);

    for (let i = this.nests.length - 1; i >= 0; i--) {
      this.nests[i].update(dt, player, enemyManager);
      const nest = this.nests[i];
      if (!nest.alive) {
        this.nests.splice(i, 1);
        this.terraform.recordNestCleansed(nest.x, nest.y);
      }
    }
    if (this.coreDrop && this.coreDrop.alive) this.coreDrop.update(player);
    if (player.carryingCore && !this.landmark.repaired) {
      if (Math.hypot(player.x - this.landmark.x, player.y - this.landmark.y) < player.radius + this.landmark.radius) {
        this.landmark.repair(player);
        this.terraform.recordPurifierRestored();
      }
    }
    this.terraform.update(dt);
    player.onReclaimedGround = this.terraform.regenPlayer(player, dt);
    if (this.evac.update(dt, player, enemyManager)) this.completeEvac();
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
    this.landmark.render(ctx, this.isPurifierFieldActive());
    this.evac.render(ctx);
    for (const nest of this.nests) nest.render(ctx);
    if (this.coreDrop && this.coreDrop.alive) this.coreDrop.render(ctx);
  }

  renderCompass(ctx, player, canvasWidth) {
    renderRadarMinimap(ctx, this, player, canvasWidth);
  }
}