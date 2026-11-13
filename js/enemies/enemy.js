// js/enemies/enemy.js — Клас мобів та AI поведінка боса Warden

import { CONFIG } from '../config.js';
import { state, triggerHitStop, spawnShockwave } from '../state.js';
import { Telemetry } from '../telemetry.js';

export class Enemy {
  constructor(x, y, typeKey = 'sprout') {
    this.x = x;
    this.y = y;
    this.typeKey = typeKey;
    const cfg = CONFIG.ENEMIES.types[typeKey];

    this.name = cfg.name;
    this.maxHealth = cfg.hp;
    this.health = this.maxHealth;
    this.speed = cfg.speed;
    this.damage = cfg.damage;
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

    this.isAwakened = false;
    this.chargeCooldown = 4.5;
    this.chargeTimer = 2.0;
    this.isTelegraphing = false;
    this.isCharging = false;
    this.chargeDuration = 0;
    this.chargeVx = 0;
    this.chargeVy = 0;
    this.lastHitSourceX = undefined;
    this.lastHitSourceY = undefined;
  }

  takeDamage(amount, sourceX, sourceY) {
    if (!this.alive) return;
    this.health -= amount;
    this.hitFlashTimer = 0.12;
    if (sourceX !== undefined && sourceY !== undefined) {
      this.lastHitSourceX = sourceX;
      this.lastHitSourceY = sourceY;
    }

    if (this.typeKey === 'warden' && !this.isAwakened) {
      this.isAwakened = true;
      Telemetry.recordEvent('BOSS', 'Hive Warden provoked!');
    }

    Telemetry.metrics.damageDealt += amount;

    const displayDamage = Math.round(amount);
    if (state.damageTexts && displayDamage > 0) {
      state.damageTexts.push({
        x: this.x + (Math.random() - 0.5) * 14,
        y: this.y - this.radius - 6,
        text: displayDamage,
        life: 0.55
      });
    }

    if (this.health <= 0) {
      this.alive = false;
      if (state.gibManager) state.gibManager.spawnForEnemy(this, this.lastHitSourceX, this.lastHitSourceY);

      if (state.decalManager) {
        if (this.typeKey === 'sprout') state.decalManager.addSplatter(this.x, this.y, { type: 'slime', radius: 15, count: 6 });
        else if (this.typeKey === 'stalker') state.decalManager.addSplatter(this.x, this.y, { type: 'corrupt', radius: 24, count: 10 });
        else if (this.typeKey === 'dasher') {
          const moveAngle = Math.atan2(this.chargeVy || 0, this.chargeVx || 0);
          state.decalManager.addSplatter(this.x, this.y, { type: 'amber', radius: 17, dirX: Math.cos(moveAngle), dirY: Math.sin(moveAngle), count: 8 });
        } else if (this.typeKey === 'warden') {
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

      if (state.pickupManager) state.pickupManager.spawn(this.x, this.y, 'bio', this.xpValue);
    }
  }

  update(dt, player, enemies) {
    if (!this.alive) return;
    if (state.worldManager && state.worldManager.landmark && state.worldManager.landmark.repaired) {
      if (Math.hypot(this.x - state.worldManager.landmark.x, this.y - state.worldManager.landmark.y) < CONFIG.WORLD.terraformedRadius) {
        this.alive = false;
        return;
      }
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distSq = dx * dx + dy * dy;

    if (this.plasmaBurnTimer > 0) {
      this.plasmaBurnTimer -= dt;
      this.takeDamage((this.plasmaBurnDmg || 8) * dt);
      if (!this.alive) return;
    }

    if (this.typeKey === 'warden') {
      this.updateWardenAI(dt, player, Math.sqrt(distSq), dx, dy);
      return;
    }

    if (distSq > 1) {
      const effectiveSpeed = this.speed * (this.currentSlow || 1.0);
      const dist = Math.sqrt(distSq);
      let vx = (dx / dist) * effectiveSpeed;
      let vy = (dy / dist) * effectiveSpeed;

      const neighbors = (state.enemyManager && state.enemyManager.grid)
        ? state.enemyManager.grid.getNearby(this.x, this.y, this.radius * 2.5)
        : enemies;

      for (let i = 0; i < neighbors.length; i++) {
        const other = neighbors[i];
        if (other === this || !other.alive) continue;
        const ox = this.x - other.x;
        const oy = this.y - other.y;
        const oDistSq = ox * ox + oy * oy;
        const minDist = this.radius + other.radius;

        if (oDistSq > 0 && oDistSq < minDist * minDist) {
          const oDist = Math.sqrt(oDistSq);
          const push = ((minDist - oDist) / minDist) * 75;
          vx += (ox / oDist) * push;
          vy += (oy / oDist) * push;
        }
      }
      this.x += vx * dt;
      this.y += vy * dt;
    }

    if (distSq < Math.pow(this.radius + player.radius, 2)) player.takeDamage(this.damage);
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
  }

  updateWardenAI(dt, player, dist, dx, dy) {
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (!this.isAwakened) {
      if (dist < CONFIG.WORLD.wardenAggroRadius) {
        this.isAwakened = true;
        Telemetry.recordEvent('BOSS', 'Hive Warden awakened in lair!');
      } else return;
    }

    if (this.isCharging) {
      this.x += this.chargeVx * dt;
      this.y += this.chargeVy * dt;
      this.chargeDuration -= dt;
      if (dist < this.radius + player.radius) player.takeDamage(this.damage * 1.3);
      if (this.chargeDuration <= 0) this.isCharging = false;
      return;
    }

    if (this.isTelegraphing) {
      this.chargeDuration -= dt;
      if (this.chargeDuration <= 0) {
        this.isTelegraphing = false;
        this.isCharging = true;
        this.chargeDuration = 1.1;
        const cSpeed = CONFIG.ENEMIES.types.warden.chargeSpeed;
        const a = Math.atan2(player.y - this.y, player.x - this.x);
        this.chargeVx = Math.cos(a) * cSpeed;
        this.chargeVy = Math.sin(a) * cSpeed;
        if (state.enemyManager && state.enemyManager.enemies.length < CONFIG.ENEMIES.maxActive) {
          state.enemyManager.enemies.push(new Enemy(this.x + 30, this.y, 'dasher'));
          state.enemyManager.enemies.push(new Enemy(this.x - 30, this.y, 'dasher'));
        }
      }
      return;
    }

    this.chargeTimer += dt;
    if (this.chargeTimer >= this.chargeCooldown && dist < 700) {
      this.chargeTimer = 0;
      this.isTelegraphing = true;
      this.chargeDuration = 0.7;
      return;
    }

    if (dist > 1) {
      const effectiveSpeed = this.speed * (this.currentSlow || 1.0);
      this.x += (dx / dist) * effectiveSpeed * dt;
      this.y += (dy / dist) * effectiveSpeed * dt;
    }
    if (dist < this.radius + player.radius) player.takeDamage(this.damage);
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : this.color;
    ctx.strokeStyle = this.outline;
    ctx.lineWidth = 2;

    if (this.typeKey === 'dasher') {
      ctx.beginPath();
      ctx.moveTo(this.radius * 1.3, 0); ctx.lineTo(-this.radius, -this.radius); ctx.lineTo(-this.radius * 0.4, 0); ctx.lineTo(-this.radius, this.radius);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (this.typeKey === 'warden') {
      if (!this.isAwakened) ctx.fillStyle = '#441837';
      else if (this.isTelegraphing) ctx.fillStyle = Math.floor(performance.now() / 80) % 2 === 0 ? '#fc8181' : '#e53e3e';
      else if (this.isCharging) ctx.fillStyle = '#ff0055';

      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = this.radius + (this.isCharging ? 5 : 0);
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#f687b3';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      const statusText = !this.isAwakened ? 'HIVE WARDEN [DORMANT]' : this.isCharging ? '!! CHARGE !!' : 'HIVE WARDEN (ELITE)';
      ctx.fillText(statusText, 0, -this.radius - 14);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }

    if (this.health < this.maxHealth) {
      const barW = this.radius * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-this.radius, -this.radius - 8, barW, 3);
      ctx.fillStyle = '#fc8181';
      ctx.fillRect(-this.radius, -this.radius - 8, barW * (this.health / this.maxHealth), 3);
    }
    ctx.restore();
  }
}