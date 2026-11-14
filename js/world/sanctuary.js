// js/world/sanctuary.js — Механіки Хаба: резерв лікування, турелі без луту, здача скрапу та «Гнів Улья»

import { CONFIG, MetaProgression, saveMetaProgression } from '../config.js';
import { state, triggerHitStop, spawnShockwave } from '../state.js';
import { Telemetry } from '../telemetry.js';
import { Enemy } from '../enemies/enemy.js';

export class SanctuaryHub {
  constructor() {
    this.maxHealPool = CONFIG.HUB.maxHealPool;
    this.healPool = this.maxHealPool;
    this.healDepletedLogged = false;

    this.turretTimer = 0;
    this.turretBeams = [];

    this.campTimer = 0;
    this.wrathWarning = false;
    this.wrathTriggered = false;
    this.domeBroken = false;
    this.tremorTimer = 0;
    this.reinforceTimer = 0;
  }

  depositScrap(player) {
    if (this.domeBroken) return false;
    if (Math.hypot(player.x, player.y) >= CONFIG.HUB.radius) return false;
    const scrap = Telemetry.metrics.resourcesCollected.techScrap;
    if (scrap <= 0) return false;

    MetaProgression.bankedTechScrap += scrap;
    Telemetry.metrics.resourcesBanked.techScrap += scrap;
    Telemetry.metrics.resourcesCollected.techScrap = 0;
    saveMetaProgression();

    if (state.camera) state.camera.addTrauma(0.22);
    spawnShockwave(0, 0, { radius: 18, maxRadius: 150, color: '#ecc94b', speed: 340, lineWidth: 4.5 });
    Telemetry.recordEvent('BANK', `Deposited +${scrap} Tech Scrap into Sanctuary Vault!`);
    return true;
  }

  update(dt, player, enemyManager) {
    for (let i = this.turretBeams.length - 1; i >= 0; i--) {
      this.turretBeams[i].life -= dt;
      if (this.turretBeams[i].life <= 0) this.turretBeams.splice(i, 1);
    }

    const hubCfg = CONFIG.HUB;
    const distToHub = Math.hypot(player.x, player.y);

    // 1. Лікування в куполі Хаба з обмеженим запасом на забіг
    if (!this.domeBroken && distToHub <= hubCfg.radius && this.healPool > 0 && player.health < player.maxHealth) {
      const amount = Math.min(hubCfg.healRate * dt, player.maxHealth - player.health, this.healPool);
      if (amount > 0) {
        player.heal(amount);
        this.healPool = Math.max(0, this.healPool - amount);
        if (this.healPool <= 0 && !this.healDepletedLogged) {
          this.healDepletedLogged = true;
          Telemetry.recordEvent('SANCTUARY', 'Hub Dome bio-repair reserve depleted!');
        }
      }
    }

    // 2. Оборонні турелі Хаба (нуль луту при вбивстві!)
    if (!this.domeBroken && enemyManager) {
      this.turretTimer -= dt;
      if (this.turretTimer <= 0) {
        this.turretTimer = hubCfg.turretFireRate;
        this.fireTurrets(enemyManager);
      }
    }

    // 3. Anti-Camping («Гнів Улья» на 2.5–3 хв відсиджування)
    if (this.wrathTriggered) {
      this.reinforceTimer += dt;
      if (this.reinforceTimer >= 7.0) {
        this.reinforceTimer = 0;
        this.spawnTitanRing(player, enemyManager, 6, 460);
      }
      return;
    }

    if (distToHub <= hubCfg.campZoneRadius) {
      this.campTimer += dt;
    } else if (distToHub >= hubCfg.campDecayZone && this.campTimer > 0) {
      this.campTimer = Math.max(0, this.campTimer - dt * hubCfg.campDecayRate);
      if (this.campTimer < hubCfg.campGraceTime * 0.85) this.wrathWarning = false;
    }

    if (this.campTimer >= hubCfg.enrageTime) {
      this.triggerHiveWrath(player, enemyManager);
    } else if (this.campTimer >= hubCfg.campGraceTime) {
      if (!this.wrathWarning) {
        this.wrathWarning = true;
        Telemetry.recordEvent('WARNING', 'SEISMIC ALARM: Leave Sanctuary before Hive Wrath strikes!');
      }
      this.tremorTimer -= dt;
      if (this.tremorTimer <= 0) {
        this.tremorTimer = 1.8;
        if (state.camera) state.camera.addTrauma(0.24);
        spawnShockwave(0, 0, { radius: 40, maxRadius: hubCfg.radius + 45, color: '#e53e3e', speed: 240, lineWidth: 3.5 });
      }
    }
  }

  fireTurrets(enemyManager) {
    const range = CONFIG.HUB.defenseRange;
    const pool = enemyManager.grid
      ? enemyManager.grid.getNearby(0, 0, range + 35)
      : enemyManager.enemies;

    let shotsLeft = CONFIG.HUB.turretTargetsPerShot || 2;
    const rangeSq = range * range;

    for (let i = 0; i < pool.length && shotsLeft > 0; i++) {
      const e = pool[i];
      if (!e || !e.alive || e.invulnerable) continue;
      const dSq = e.x * e.x + e.y * e.y;
      if (dSq > rangeSq) continue;

      const d = Math.sqrt(dSq) || 1;
      e.x += (e.x / d) * 18;
      e.y += (e.y / d) * 18;
      e.takeDamage(CONFIG.HUB.turretDamage, 0, 0, true);
      this.turretBeams.push({ x1: 0, y1: 0, x2: e.x, y2: e.y, life: 0.14, maxLife: 0.14 });
      shotsLeft--;
    }
  }

  triggerHiveWrath(player, enemyManager) {
    this.wrathTriggered = true;
    this.domeBroken = true;
    this.wrathWarning = false;

    if (state.camera) state.camera.addTrauma(0.95);
    triggerHitStop(0.10);
    spawnShockwave(0, 0, { radius: 30, maxRadius: 560, color: '#ff0055', speed: 520, lineWidth: 10 });
    Telemetry.recordEvent('BOSS', 'HIVE WRATH: Sanctuary Dome shattered! Invulnerable Titans incoming!');

    this.spawnTitanRing(player, enemyManager, 14, 480);
  }

  spawnTitanRing(player, enemyManager, count = 14, ringRadius = 480) {
    if (!enemyManager) return;
    // Титани не деспавняться й ігнорують maxActive — тримаємо стелю живих
    let alive = 0;
    for (const e of enemyManager.enemies) if (e.isTitan && e.alive) alive++;
    count = Math.min(count, CONFIG.HUB.maxTitans - alive);
    for (let i = 0; i < count; i++) {
      const a = (i * Math.PI * 2) / count;
      const titan = new Enemy(player.x + Math.cos(a) * ringRadius, player.y + Math.sin(a) * ringRadius, 'warden');
      titan.isTitan = true;
      titan.invulnerable = true;
      titan.isAwakened = true;
      titan.animState = 'chase';
      titan.name = 'Abyssal Titan';
      titan.speed = 245;
      titan.damage = 95;
      titan.radius = 36;
      titan.color = '#2d0a1e';
      titan.outline = '#ff0055';
      titan.xpValue = 0;
      titan.maxHealth = 999999;
      titan.health = 999999;
      enemyManager.enemies.push(titan);
    }
  }

  renderOverlay(ctx) {
    for (let i = 0; i < this.turretBeams.length; i++) {
      const b = this.turretBeams[i];
      ctx.save();
      ctx.strokeStyle = `rgba(104, 211, 145, ${b.life / b.maxLife})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.domeBroken) {
      ctx.save();
      ctx.strokeStyle = 'rgba(229, 62, 62, 0.75)';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, CONFIG.HUB.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
}