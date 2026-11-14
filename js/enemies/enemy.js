// js/enemies/enemy.js — Клас мобів, швидкі телеграфи, колізії стін, Титани та AI

import { CONFIG } from '../config.js';
import { state, triggerHitStop, spawnShockwave } from '../state.js';
import { Telemetry } from '../telemetry.js';

export class Enemy {
  constructor(x, y, typeKey = 'sprout', waveNumber = null) {
    this.x = x;
    this.y = y;
    this.typeKey = typeKey;
    const cfg = CONFIG.ENEMIES.types[typeKey];
    const activeWave = waveNumber !== null ? waveNumber : (state.enemyManager ? state.enemyManager.waveNumber : 1);
    const esc = CONFIG.ENEMIES.WAVE && CONFIG.ENEMIES.WAVE.escalation;
    const waveIdx = Math.max(0, activeWave - 1);
    const hpMult = esc ? 1 + waveIdx * esc.hpPerWave : 1;
    const speedMult = esc ? Math.min(esc.maxSpeedMult, 1 + waveIdx * esc.speedPerWave) : 1;
    const dmgMult = esc ? 1 + waveIdx * esc.damagePerWave : 1;

    this.name = cfg.name;
    this.speedScale = speedMult;
    this.maxHealth = Math.round(cfg.hp * hpMult);
    this.health = this.maxHealth;
    const speedCap = cfg.maxSpeedRatio ? CONFIG.PLAYER.baseSpeed * cfg.maxSpeedRatio : Infinity;
    this.speed = Math.min(cfg.speed * speedMult, speedCap);
    this.damage = Math.round(cfg.damage * dmgMult);
    this.radius = cfg.radius;
    this.color = cfg.color;
    this.outline = cfg.outline;
    this.xpValue = cfg.xpValue;

    this.alive = true;
    this.hitFlashTimer = 0;
    this.currentSlow = 1.0;
    this.sporeSlowTimer = 0;
    this.sporeSlowMult = 1.0;
    this.plasmaBurnTimer = 0;
    this.plasmaBurnDmg = 0;
    this.invulnerable = false;
    this.isTitan = false;
    this.facingAngle = 0;
    this.animState = typeKey === 'warden' ? 'idle' : 'chase';
    this.windupTimer = 0;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.attackHitApplied = false;
    this.isAwakened = false;
    this.chargeCooldown = cfg.chargeCooldown || 2.8;
    this.chargeTimer = 1.5;
    this.isTelegraphing = false;
    this.isCharging = false;
    this.chargeDuration = 0;
    this.chargeVx = 0;
    this.chargeVy = 0;
    this.lastHitSourceX = undefined;
    this.lastHitSourceY = undefined;
  }

  takeDamage(amount, sourceX, sourceY, suppressLoot = false) {
    if (!this.alive) return;
    if (this.invulnerable) { this.hitFlashTimer = 0.06; return; }
    this.health -= amount;
    this.hitFlashTimer = 0.12;
    if (sourceX !== undefined && sourceY !== undefined) {
      this.lastHitSourceX = sourceX;
      this.lastHitSourceY = sourceY;
    }
    if (this.typeKey === 'warden' && !this.isAwakened) {
      this.isAwakened = true;
      this.animState = 'chase';
      Telemetry.recordEvent('BOSS', 'Hive Warden provoked!');
    }
    Telemetry.metrics.damageDealt += amount;
    const displayDamage = Math.round(amount);
    if (state.damageTexts && displayDamage > 0) {
      state.damageTexts.push({ x: this.x + (Math.random() - 0.5) * 14, y: this.y - this.radius - 6, text: displayDamage, life: 0.55 });
    }
    if (this.health <= 0) {
      this.alive = false;
      if (state.gibManager) state.gibManager.spawnForEnemy(this, this.lastHitSourceX, this.lastHitSourceY);
      if (state.decalManager) {
        if (this.typeKey === 'sprout') state.decalManager.addSplatter(this.x, this.y, { type: 'slime', radius: 15, count: 6 });
        else if (this.typeKey === 'stalker') state.decalManager.addSplatter(this.x, this.y, { type: 'corrupt', radius: 24, count: 10 });
        else if (this.typeKey === 'dasher') state.decalManager.addSplatter(this.x, this.y, { type: 'amber', radius: 17, dirX: Math.cos(this.facingAngle), dirY: Math.sin(this.facingAngle), count: 8 });
        else if (this.typeKey === 'warden') {
          state.decalManager.addSplatter(this.x, this.y, { type: 'oil', radius: 46, count: 20 });
          state.decalManager.addSplatter(this.x, this.y, { type: 'corrupt', radius: 36, count: 16 });
          state.decalManager.addScorch(this.x, this.y, 48);
        }
      }
      Telemetry.metrics.kills++;
      Telemetry.recordEvent('KILL', `${this.name} destroyed!`);
      if (this.typeKey === 'warden') {
        spawnShockwave(this.x, this.y, { radius: 25, maxRadius: 280, color: '#f687b3', speed: 420, lineWidth: 9 });
        if (state.camera) state.camera.addTrauma(CONFIG.JUICE.trauma.wardenKill);
        triggerHitStop(CONFIG.JUICE.hitStop.wardenKill);
        if (state.worldManager) state.worldManager.spawnCore(this.x, this.y);
      } else if (this.typeKey === 'stalker') {
        spawnShockwave(this.x, this.y, { radius: 10, maxRadius: 75, color: '#fc8181', speed: 280, lineWidth: 3.5 });
        if (state.camera) state.camera.addTrauma(CONFIG.JUICE.trauma.stalkerKill);
        triggerHitStop(CONFIG.JUICE.hitStop.stalkerKill);
      }
      if (state.pickupManager && !suppressLoot) state.pickupManager.spawn(this.x, this.y, 'bio', this.xpValue);
    }
  }

  moveWithSeparation(dt, dx, dy, dist, enemies) {
    if (dist <= 1) return;
    const effectiveSpeed = this.speed * (this.currentSlow || 1.0);
    let vx = (dx / dist) * effectiveSpeed;
    let vy = (dy / dist) * effectiveSpeed;
    const neighbors = (state.enemyManager && state.enemyManager.grid) ? state.enemyManager.grid.getNearby(this.x, this.y, this.radius * 2.5) : enemies;
    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this || !other.alive) continue;
      const ox = this.x - other.x, oy = this.y - other.y, oDistSq = ox * ox + oy * oy, minDist = this.radius + other.radius;
      if (oDistSq > 0 && oDistSq < minDist * minDist) {
        const oDist = Math.sqrt(oDistSq), push = ((minDist - oDist) / minDist) * 75;
        vx += (ox / oDist) * push;
        vy += (oy / oDist) * push;
      }
    }
    this.x += vx * dt;
    this.y += vy * dt;
    if (vx * vx + vy * vy > 4) this.facingAngle = Math.atan2(vy, vx);
  }

  update(dt, player, enemies) {
    if (!this.alive) return;
    if (!this.isTitan && state.worldManager && state.worldManager.isPurifierFieldActive()) {
      if (Math.hypot(this.x - state.worldManager.landmark.x, this.y - state.worldManager.landmark.y) < CONFIG.WORLD.terraformedRadius) {
        this.alive = false;
        return;
      }
    }
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (!this.invulnerable && this.plasmaBurnTimer > 0) {
      this.plasmaBurnTimer -= dt;
      this.takeDamage((this.plasmaBurnDmg || 8) * dt);
      if (!this.alive) return;
    }
    const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy);
    if (this.isTitan) {
      if (dist > 1) {
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
        this.facingAngle = Math.atan2(dy, dx);
      }
      if (dist < this.radius + player.radius) player.takeDamage(this.damage);
      return;
    }
    if (this.typeKey === 'warden') { this.updateWardenAI(dt, player, dist, dx, dy); return; }
    if (this.typeKey === 'stalker') { this.updateStalkerAI(dt, player, dist, dx, dy, enemies); return; }
    this.animState = 'chase';
    this.moveWithSeparation(dt, dx, dy, dist, enemies);
    if (state.worldManager) state.worldManager.resolveCircleObstacles(this, dt, player);
    const cdx = player.x - this.x, cdy = player.y - this.y, rSum = this.radius + player.radius;
    if (cdx * cdx + cdy * cdy < rSum * rSum) player.takeDamage(this.damage);
  }

  updateStalkerAI(dt, player, dist, dx, dy, enemies) {
    const sCfg = CONFIG.ENEMIES.types.stalker;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.animState === 'windup') {
      this.windupTimer -= dt;
      this.isTelegraphing = true;
      const creep = this.speed * 0.25 * (this.currentSlow || 1.0);
      this.x += Math.cos(this.facingAngle) * creep * dt;
      this.y += Math.sin(this.facingAngle) * creep * dt;
      if (state.worldManager) state.worldManager.resolveCircleObstacles(this, dt, player);
      if (this.windupTimer > sCfg.windupTime * 0.45 && dist > 1) this.facingAngle = Math.atan2(dy, dx);
      if (Math.hypot(player.x - this.x, player.y - this.y) < this.radius + player.radius) player.takeDamage(this.damage);
      if (this.windupTimer <= 0) {
        this.isTelegraphing = false;
        this.animState = 'attack';
        this.attackTimer = sCfg.attackDuration;
        this.attackHitApplied = false;
        this.chargeVx = Math.cos(this.facingAngle) * sCfg.lungeSpeed * this.speedScale;
        this.chargeVy = Math.sin(this.facingAngle) * sCfg.lungeSpeed * this.speedScale;
      }
      return;
    }
    if (this.animState === 'attack') {
      this.x += this.chargeVx * dt;
      this.y += this.chargeVy * dt;
      if (state.worldManager) state.worldManager.resolveCircleObstacles(this, dt, player);
      this.attackTimer -= dt;
      if (!this.attackHitApplied && Math.hypot(player.x - this.x, player.y - this.y) < this.radius + player.radius + 6) {
        player.takeDamage(this.damage * 1.25);
        this.attackHitApplied = true;
      }
      if (this.attackTimer <= 0) { this.animState = 'chase'; this.attackCooldown = sCfg.attackCooldown; }
      return;
    }
    this.isTelegraphing = false;
    if (this.attackCooldown <= 0 && dist <= sCfg.attackRange) {
      this.animState = 'windup';
      this.isTelegraphing = true;
      this.windupTimer = sCfg.windupTime;
      this.facingAngle = Math.atan2(dy, dx);
      spawnShockwave(this.x, this.y, { radius: this.radius * 0.7, maxRadius: this.radius + 26, color: '#fc8181', speed: 160, lineWidth: 2.5 });
      return;
    }
    this.moveWithSeparation(dt, dx, dy, dist, enemies);
    if (state.worldManager) state.worldManager.resolveCircleObstacles(this, dt, player);
    if (Math.hypot(player.x - this.x, player.y - this.y) < this.radius + player.radius) player.takeDamage(this.damage);
  }

  updateWardenAI(dt, player, dist, dx, dy) {
    const wCfg = CONFIG.ENEMIES.types.warden;
    if (!this.isAwakened) {
      this.animState = 'idle';
      if (dist < CONFIG.WORLD.wardenAggroRadius) {
        this.isAwakened = true;
        this.animState = 'chase';
        Telemetry.recordEvent('BOSS', 'Hive Warden awakened in lair!');
      } else return;
    }
    if (this.isCharging) {
      this.animState = 'attack';
      this.x += this.chargeVx * dt;
      this.y += this.chargeVy * dt;
      if (state.worldManager) state.worldManager.resolveCircleObstacles(this, dt, player);
      this.chargeDuration -= dt;
      if (Math.hypot(player.x - this.x, player.y - this.y) < this.radius + player.radius) player.takeDamage(this.damage * 1.3);
      if (this.chargeDuration <= 0) { this.isCharging = false; this.animState = 'chase'; }
      return;
    }
    if (this.isTelegraphing) {
      this.animState = 'windup';
      this.chargeDuration -= dt;
      if (this.chargeDuration > wCfg.aimLockTime && dist > 1) this.facingAngle = Math.atan2(dy, dx);
      if (this.chargeDuration <= 0) {
        this.isTelegraphing = false; this.isCharging = true; this.animState = 'attack';
        this.chargeDuration = wCfg.chargeDuration;
        this.chargeVx = Math.cos(this.facingAngle) * wCfg.chargeSpeed * this.speedScale;
        this.chargeVy = Math.sin(this.facingAngle) * wCfg.chargeSpeed * this.speedScale;
        if (state.enemyManager && state.enemyManager.enemies.length < CONFIG.ENEMIES.maxActive) {
          state.enemyManager.enemies.push(new Enemy(this.x + 30, this.y, 'dasher'));
          state.enemyManager.enemies.push(new Enemy(this.x - 30, this.y, 'dasher'));
        }
      }
      return;
    }
    this.animState = 'chase';
    this.chargeTimer += dt;
    if (this.chargeTimer >= this.chargeCooldown && dist < 700) {
      this.chargeTimer = 0; this.isTelegraphing = true; this.animState = 'windup';
      this.chargeDuration = wCfg.windupTime; this.facingAngle = Math.atan2(dy, dx);
      spawnShockwave(this.x, this.y, { radius: this.radius, maxRadius: this.radius + 55, color: '#f687b3', speed: 210, lineWidth: 3.5 });
      return;
    }
    if (dist > 1) {
      const effectiveSpeed = this.speed * (this.currentSlow || 1.0);
      this.x += (dx / dist) * effectiveSpeed * dt;
      this.y += (dy / dist) * effectiveSpeed * dt;
      this.facingAngle = Math.atan2(dy, dx);
      if (state.worldManager) state.worldManager.resolveCircleObstacles(this, dt, player);
    }
    if (Math.hypot(player.x - this.x, player.y - this.y) < this.radius + player.radius) player.takeDamage(this.damage);
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.isTelegraphing) {
      ctx.save();
      ctx.strokeStyle = this.typeKey === 'warden' ? 'rgba(246, 135, 179, 0.55)' : 'rgba(252, 129, 129, 0.55)';
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(this.facingAngle) * (this.radius + 36), Math.sin(this.facingAngle) * (this.radius + 36));
      ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : this.color;
    ctx.strokeStyle = this.isTelegraphing ? '#feb2b2' : this.outline;
    ctx.lineWidth = this.isTelegraphing ? 3 : 2;
    if (this.typeKey === 'dasher') {
      ctx.save(); ctx.rotate(this.facingAngle); ctx.beginPath();
      ctx.moveTo(this.radius * 1.3, 0); ctx.lineTo(-this.radius, -this.radius); ctx.lineTo(-this.radius * 0.4, 0); ctx.lineTo(-this.radius, this.radius);
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    } else if (this.typeKey === 'warden') {
      if (!this.isAwakened) ctx.fillStyle = '#441837';
      else if (this.isTelegraphing) ctx.fillStyle = Math.floor(performance.now() / 80) % 2 === 0 ? '#fc8181' : '#e53e3e';
      else if (this.isCharging) ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4, r = this.radius + (this.isCharging ? 5 : 0);
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (!this.invulnerable && this.health < this.maxHealth) {
      const barW = this.radius * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-this.radius, -this.radius - 8, barW, 3);
      ctx.fillStyle = '#fc8181'; ctx.fillRect(-this.radius, -this.radius - 8, barW * (this.health / this.maxHealth), 3);
    }
    ctx.restore();
  }
}