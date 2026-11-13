// js/world/manager.js — Менеджер світу: спавн руїн, гнізд, компас і телепорт

import { CONFIG, MetaProgression, saveMetaProgression } from '../config.js';
import { state } from '../state.js';
import { Telemetry } from '../telemetry.js';
import { ObstacleWall, LootChest, Landmark, CorePickup, CorruptedNest } from './structures.js';

export class WorldManager {
  constructor() {
    this.nests = [];
    this.obstacles = [];
    this.chests = [];
    const lm = CONFIG.WORLD.landmarkPos;
    this.landmark = new Landmark(lm.x, lm.y);
    this.coreDrop = null;
    this.transferActive = false;
    this.transferTimer = 0;
    this.transferTotalTime = 25.0;

    this.spawnInitialNests();
    this.spawnRuinsAndChests();
  }

  spawnInitialNests() {
    const count = CONFIG.WORLD.nestCountRing1;
    const maxDist = CONFIG.WORLD.ring1Radius * 0.9;

    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.4;
      const dist = 1500 + Math.random() * (maxDist - 1500);
      const nx = Math.cos(angle) * dist;
      const ny = Math.sin(angle) * dist;
      this.nests.push(new CorruptedNest(nx, ny));

      if (i % 2 === 0) {
        this.obstacles.push(new ObstacleWall(nx - 70, ny - 60, 140, 24));
      }
    }
  }

  spawnRuinsAndChests() {
    const clusterCount = CONFIG.WORLD.ruinsClusterCount || 180;
    const chestChance = CONFIG.WORLD.chestSpawnChance || 0.65;
    const maxDist = CONFIG.WORLD.ring1Radius * 0.92;

    for (let c = 0; c < clusterCount; c++) {
      const angle = (c * Math.PI * 2) / clusterCount + (Math.random() - 0.5) * 0.4;
      const dist = 1100 + Math.random() * (maxDist - 1100);
      const cx = Math.cos(angle) * dist;
      const cy = Math.sin(angle) * dist;

      const w1 = 90 + Math.random() * 80;
      const h1 = 26 + Math.random() * 10;
      this.obstacles.push(new ObstacleWall(cx - w1 / 2, cy - h1 / 2, w1, h1));

      const w2 = 26 + Math.random() * 10;
      const h2 = 80 + Math.random() * 70;
      this.obstacles.push(new ObstacleWall(cx + (Math.random() > 0.5 ? 50 : -50), cy - h2 / 2, w2, h2));

      if (Math.random() < chestChance) {
        this.chests.push(new LootChest(cx + (Math.random() - 0.5) * 60, cy + (Math.random() - 0.5) * 60));
      }
    }

    const lm = this.landmark;
    this.obstacles.push(new ObstacleWall(lm.x - 140, lm.y - 120, 280, 28));
    this.obstacles.push(new ObstacleWall(lm.x - 140, lm.y + 92, 280, 28));
    this.obstacles.push(new ObstacleWall(lm.x - 140, lm.y - 92, 28, 184));
    this.chests.push(new LootChest(lm.x + 80, lm.y));
  }

  spawnCore(x, y) {
    this.coreDrop = new CorePickup(x, y);
  }

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

    player.x = 0;
    player.y = 0;

    Telemetry.recordEvent('TRAVEL', `Fast traveled home! Banked ${scrapKept} Scrap (Tax: ${Math.round(taxRate * 100)}%).`);
  }

  update(dt, player, enemyManager) {
    for (const wall of this.obstacles) {
      wall.resolveCircleCollision(player);
    }

    for (let i = this.nests.length - 1; i >= 0; i--) {
      this.nests[i].update(dt, player, enemyManager);
      if (!this.nests[i].alive) {
        this.nests.splice(i, 1);
      }
    }

    if (this.coreDrop && this.coreDrop.alive) {
      this.coreDrop.update(player);
    }

    if (player.carryingCore && !this.landmark.repaired) {
      if (Math.hypot(player.x - this.landmark.x, player.y - this.landmark.y) < player.radius + this.landmark.radius) {
        this.landmark.repair(player);
      }
    }

    if (this.transferActive) {
      this.transferTimer -= dt;
      if (this.transferTimer <= 0) {
        this.completeRemoteTransfer();
      }
    }
  }

  render(ctx) {
    const viewLeft = state.camera ? state.camera.x - window.innerWidth / 2 - 100 : -2000;
    const viewRight = state.camera ? state.camera.x + window.innerWidth / 2 + 100 : 2000;
    const viewTop = state.camera ? state.camera.y - window.innerHeight / 2 - 100 : -2000;
    const viewBottom = state.camera ? state.camera.y + window.innerHeight / 2 + 100 : 2000;

    for (const wall of this.obstacles) {
      if (wall.x + wall.w >= viewLeft && wall.x <= viewRight && wall.y + wall.h >= viewTop && wall.y <= viewBottom) {
        wall.render(ctx);
      }
    }
    for (const chest of this.chests) {
      if (chest.x >= viewLeft && chest.x <= viewRight && chest.y >= viewTop && chest.y <= viewBottom) {
        chest.render(ctx);
      }
    }
    this.landmark.render(ctx);
    for (const nest of this.nests) {
      nest.render(ctx);
    }
    if (this.coreDrop && this.coreDrop.alive) {
      this.coreDrop.render(ctx);
    }
  }

  renderCompass(ctx, player, canvasWidth, canvasHeight) {
    let target = null;
    let label = '';
    let color = '#e53e3e';

    if (player.carryingCore && !this.landmark.repaired) {
      target = this.landmark;
      label = 'DELIVER CORE:';
      color = '#48bb78';
    } else if (this.coreDrop && this.coreDrop.alive) {
      target = this.coreDrop;
      label = 'PICKUP CORE:';
      color = '#ecc94b';
    } else if (!this.landmark.repaired) {
      const warden = state.enemyManager ? state.enemyManager.enemies.find(e => e.typeKey === 'warden' && e.alive) : null;
      if (warden) {
        target = warden;
        label = warden.isAwakened ? 'HIVE WARDEN:' : 'WARDEN LAIR:';
        color = '#f687b3';
      } else {
        target = this.landmark;
        label = 'MONUMENT:';
        color = '#cbd5e0';
      }
    } else {
      let closestDist = Infinity;
      for (const nest of this.nests) {
        const d = Math.hypot(nest.x - player.x, nest.y - player.y);
        if (d < closestDist) {
          closestDist = d;
          target = nest;
        }
      }
      label = 'NEST:';
      color = '#e53e3e';
    }

    if (!target) return;

    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const dist = Math.round(Math.hypot(target.x - player.x, target.y - player.y));
    const indicatorDist = 120;
    const indX = canvasWidth / 2 + Math.cos(angle) * indicatorDist;
    const indY = canvasHeight / 2 + Math.sin(angle) * indicatorDist;

    ctx.save();
    ctx.translate(indX, indY);
    ctx.rotate(angle);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = color;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${label} ${dist}m`, canvasWidth / 2, canvasHeight / 2 + 36);
  }
}