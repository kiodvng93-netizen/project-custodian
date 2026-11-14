// js/player.js — Модуль робота-хранителя: мобільність, дэш, щити і збереження скрапу

import { CONFIG, MetaProgression, saveMetaProgression } from './config.js';
import { state, triggerHitStop, spawnShockwave, requestRunRestart } from './state.js';
import { Telemetry } from './telemetry.js';

export class Player {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 18;
    this.growthScale = 1.0;
    this.facingAngle = 0;

    this.speed = CONFIG.PLAYER.baseSpeed;
    this.maxHealth = CONFIG.PLAYER.baseHealth;
    this.health = this.maxHealth;
    this.maxShieldCharges = CONFIG.PLAYER.baseShieldCharges;
    this.shieldCharges = this.maxShieldCharges;
    this.shieldTimer = 0;
    this.shieldRechargeTime = CONFIG.PLAYER.shieldRechargeTime;

    // Бонуси драфта за забіг — окремо від мета-перків, щоб покупка у Воркшопі їх не стирала
    this.resetRunBonuses();
    this.applyMetaUpgrades(true);

    this.invulnerableTimer = 0;
    this.healthRegenRate = 0.5;
    this.carryingCore = false;
    this.godMode = false;

    const dashCfg = CONFIG.PLAYER.DASH;
    this.dashCooldown = dashCfg.cooldown;
    this.dashTimer = 0;
    this.isDashing = false;
    this.dashTimeLeft = 0;
    this.dashSpeed = dashCfg.speed;
    this.dashDuration = dashCfg.duration;
    this.dashIFrames = dashCfg.iFrames;
    this.dashDirX = 0;
    this.dashDirY = 0;
    this.afterimages = [];

    const cruiseCfg = CONFIG.PLAYER.CRUISE;
    this.cruiseActivationTime = cruiseCfg.activationTime;
    this.cruiseSpeedMultiplier = cruiseCfg.speedMultiplier;
    this.cruiseTimer = 0;
    this.isCruising = false;

    this.level = 1;
    this.xp = 0;
    this.xpToNext = 4;
    this.keys = { up: false, down: false, left: false, right: false };
    this.bindInputs();
  }

  resetRunBonuses() {
    this.runSpeedMult = 1.0;
    this.runBonusHealth = 0;
    this.runBonusShields = 0;
  }

  // Перераховує статы з бази + мета-перків + бонусів драфта поточного забігу
  applyMetaUpgrades(isFirstSpawn = false) {
    const perks = MetaProgression.perks;
    const prevMaxHp = this.maxHealth || CONFIG.PLAYER.baseHealth;
    const hpRatio = isFirstSpawn ? 1.0 : (this.health / prevMaxHp);

    this.speed = Math.round((CONFIG.PLAYER.baseSpeed + (perks.engineSpeed * 8)) * this.runSpeedMult);
    this.maxHealth = CONFIG.PLAYER.baseHealth + (perks.chassisArmor * 15) + this.runBonusHealth;
    this.health = isFirstSpawn ? this.maxHealth : Math.min(this.maxHealth, this.maxHealth * hpRatio);
    this.maxShieldCharges = CONFIG.PLAYER.baseShieldCharges + this.runBonusShields;
    if (isFirstSpawn) {
      this.shieldCharges = this.maxShieldCharges;
      this.shieldTimer = 0;
    } else {
      this.shieldCharges = Math.min(this.shieldCharges, this.maxShieldCharges);
    }
    this.shieldRechargeTime = Math.max(12.0, CONFIG.PLAYER.shieldRechargeTime - (perks.shieldCapacitor * 2.0));
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      this.handleKey(e.code, true);
      if (e.code === 'Space') {
        e.preventDefault();
        if (!state.isPaused && !state.isDrafting && !state.isWorkshopOpen) this.triggerDash();
      }
    });
    window.addEventListener('keyup', (e) => this.handleKey(e.code, false));
    // Після alt-tab keyup не приходить — скидаємо всі напрямки
    window.addEventListener('blur', () => this.releaseKeys());
  }

  releaseKeys() {
    this.keys.up = this.keys.down = this.keys.left = this.keys.right = false;
  }

  handleKey(code, pressed) {
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = pressed;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = pressed;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = pressed;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = pressed;
  }

  triggerDash() {
    if (this.dashTimer > 0 || this.isDashing) return;
    let dx = 0, dy = 0;
    if (this.keys.left) dx -= 1;
    if (this.keys.right) dx += 1;
    if (this.keys.up) dy -= 1;
    if (this.keys.down) dy += 1;

    if (dx === 0 && dy === 0) {
      dx = Math.cos(this.facingAngle);
      dy = Math.sin(this.facingAngle);
    } else {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
    }

    this.isDashing = true;
    this.dashTimeLeft = this.dashDuration;
    this.dashTimer = this.dashCooldown;
    this.dashDirX = dx;
    this.dashDirY = dy;
    this.invulnerableTimer = Math.max(this.invulnerableTimer, this.dashIFrames);

    if (state.camera) state.camera.addTrauma(CONFIG.JUICE.trauma.dash || 0.2);
    spawnShockwave(this.x, this.y, { radius: 8, maxRadius: 55, color: '#63b3ed', speed: 280, lineWidth: 3.5 });
  }

  addXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.25) + 2;
      return true;
    }
    return false;
  }

  grow() {
    this.growthScale = Math.min(1.35, this.growthScale + 0.04);
    this.radius = 18 * this.growthScale;
  }

  takeDamage(amount = 20) {
    if (this.godMode || this.invulnerableTimer > 0) return;

    if (this.shieldCharges > 0) {
      this.shieldCharges--;
      this.invulnerableTimer = CONFIG.PLAYER.invulnOnShieldBreak;
      this.shieldTimer = 0;
      Telemetry.metrics.shieldHitsAbsorbed++;
      this.pushCrowdBack(80, 160);
      spawnShockwave(this.x, this.y, { radius: 15, maxRadius: 150, color: '#4299e1', speed: 420, lineWidth: 6 });
      if (state.camera) state.camera.addTrauma(CONFIG.JUICE.trauma.shieldBreak);
      triggerHitStop(CONFIG.JUICE.hitStop.shieldBreak);
      return;
    }

    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = CONFIG.PLAYER.invulnOnDamage;
    Telemetry.metrics.damageTaken += amount;
    this.pushCrowdBack(CONFIG.PLAYER.pushbackRadius, CONFIG.PLAYER.pushbackForce);
    if (state.camera) state.camera.addTrauma(CONFIG.JUICE.trauma.playerHit);
    triggerHitStop(CONFIG.JUICE.hitStop.playerHit);

    if (this.health <= 0) this.die();
  }

  pushCrowdBack(radius, force) {
    if (!state.enemyManager) return;
    for (const e of state.enemyManager.enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x, dy = e.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < radius + e.radius) {
        e.x += (dx / d) * force * 0.15;
        e.y += (dy / d) * force * 0.15;
      }
    }
  }

  heal(amount = 15) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  die() {
    Telemetry.metrics.deaths++;
    const unbanked = Telemetry.metrics.resourcesCollected.techScrap;
    const rates = CONFIG.ECONOMY.deathLossRates || [0.50, 0.40, 0.25];
    const rank = Math.min(rates.length - 1, (MetaProgression.perks && MetaProgression.perks.cargoSecurity) || 0);
    const lossRate = rates[rank];
    const lost = Math.floor(unbanked * lossRate);
    const saved = Math.max(0, unbanked - lost);

    if (saved > 0) {
      MetaProgression.bankedTechScrap += saved;
      Telemetry.metrics.resourcesBanked.techScrap += saved;
      saveMetaProgression();
    }

    Telemetry.metrics.resourcesLostOnDeath.techScrap += lost;
    Telemetry.metrics.resourcesCollected.techScrap = 0;
    Telemetry.metrics.resourcesCollected.bioEssence = 0;
    Telemetry.recordEvent('DEATH', `Robot destroyed! Saved ${saved} Scrap, lost ${lost} (${Math.round(lossRate * 100)}%).`);
    this.resetRunProgression();
    requestRunRestart();
  }

  resetRunProgression() {
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.level = 1; this.xp = 0; this.xpToNext = 4;
    this.growthScale = 1.0; this.radius = 18;
    this.resetRunBonuses();
    this.applyMetaUpgrades(true);
    this.healthRegenRate = 0.5;
    this.carryingCore = false;
    this.invulnerableTimer = 1.5;
    this.dashTimer = 0;
    this.isDashing = false;
    this.cruiseTimer = 0;
    this.isCruising = false;
    this.afterimages.length = 0;
  }

  update(dt) {
    let mx = 0, my = 0;
    if (this.keys.left) mx -= 1;
    if (this.keys.right) mx += 1;
    if (this.keys.up) my -= 1;
    if (this.keys.down) my += 1;

    if (mx !== 0 && my !== 0) { mx *= 0.7071; my *= 0.7071; }
    const isMoving = mx !== 0 || my !== 0;

    if (isMoving && this.invulnerableTimer <= 0) {
      this.cruiseTimer += dt;
      this.isCruising = this.cruiseTimer >= this.cruiseActivationTime;
    } else {
      this.cruiseTimer = 0; this.isCruising = false;
    }

    const currentSpeed = this.speed * (this.isCruising ? this.cruiseSpeedMultiplier : 1.0);
    this.vx = mx * currentSpeed;
    this.vy = my * currentSpeed;

    if (this.dashTimer > 0) this.dashTimer -= dt;
    if (this.isDashing) {
      this.dashTimeLeft -= dt;
      this.vx = this.dashDirX * this.dashSpeed;
      this.vy = this.dashDirY * this.dashSpeed;
      this.afterimages.push({ x: this.x, y: this.y, radius: this.radius, alpha: 0.6 });
      if (this.dashTimeLeft <= 0) this.isDashing = false;
    }

    const prevX = this.x, prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    Telemetry.metrics.distanceTraveled += Math.round(Math.hypot(this.x - prevX, this.y - prevY));
    if (isMoving) this.facingAngle = Math.atan2(my, mx);

    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].alpha -= dt * 3.5;
      if (this.afterimages[i].alpha <= 0) this.afterimages.splice(i, 1);
    }

    if (this.shieldCharges < this.maxShieldCharges) {
      this.shieldTimer += dt;
      if (this.shieldTimer >= this.shieldRechargeTime) {
        this.shieldCharges++;
        this.shieldTimer = 0;
      }
    }
    if (this.health < this.maxHealth) this.health = Math.min(this.maxHealth, this.health + this.healthRegenRate * dt);
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
  }

  render(ctx) {
    for (const ghost of this.afterimages) {
      ctx.save();
      ctx.translate(ghost.x, ghost.y);
      ctx.strokeStyle = `rgba(99, 179, 237, ${ghost.alpha * 0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, ghost.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.invulnerableTimer > 0 && Math.floor(performance.now() / 60) % 2 === 0) ctx.globalAlpha = 0.45;
    if (this.godMode) {
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 15, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.carryingCore) {
      ctx.strokeStyle = '#ecc94b'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.shieldCharges > 0) {
      ctx.strokeStyle = '#4299e1'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 7, 0, Math.PI * 2); ctx.stroke();
    }

    let renderedSprite = false;
    if (state.spriteManager) renderedSprite = state.spriteManager.drawRobot(ctx, this, performance.now() / 1000);

    if (!renderedSprite) {
      ctx.save();
      ctx.rotate(this.facingAngle);
      ctx.fillStyle = this.godMode ? '#d69e2e' : '#2b6cb0';
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const px = Math.cos(a) * this.radius, py = Math.sin(a) * this.radius;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    if (this.isCruising) {
      ctx.save();
      const flameDist = this.radius * 0.9;
      ctx.fillStyle = Math.random() > 0.5 ? '#f6ad55' : '#ed8936';
      ctx.beginPath();
      ctx.arc(-Math.cos(this.facingAngle) * flameDist, -Math.sin(this.facingAngle) * flameDist, 5 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    this.renderHUD(ctx);
  }

  renderHUD(ctx) {
    const w = 38 * this.growthScale;
    const bx = this.x - w / 2;
    const by = this.y - this.radius - 14;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(bx - 1, by - 1, w + 2, 6);
    ctx.fillStyle = this.health / this.maxHealth > 0.5 ? '#48bb78' : '#f56565';
    ctx.fillRect(bx, by, w * (this.health / this.maxHealth), 4);

    for (let i = 0; i < this.maxShieldCharges; i++) {
      ctx.fillStyle = i < this.shieldCharges ? '#4299e1' : '#4a5568';
      ctx.fillRect(bx + i * 9, by - 7, 6, 6);
    }
  }
}