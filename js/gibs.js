// js/gibs.js — Фізичні уламки ворогів із запіканням у декалі (ES Module)

import { CONFIG } from './config.js';
import { state } from './state.js';
import { BLOOD, bloodFor, paintSmear } from './gore.js';

// Колір панцира (шматки тіла) за типом ворога
const SHELL_COLOR = { sprout: '#2b5d34', stalker: '#5c1a1a', dasher: '#b35a14', warden: '#4a1942' };

export class Gib {
  constructor(x, y, vx, vy, options = {}) {
    const cfg = CONFIG.GIBS || { friction: 0.88, gravity: -480 };
    this.x = x;
    this.y = y;
    this.z = 2 + Math.random() * 8;
    this.vx = vx;
    this.vy = vy;
    this.vz = 90 + Math.random() * 140;
    this.gravity = cfg.gravity;
    this.friction = cfg.friction;

    this.angle = Math.random() * Math.PI * 2;
    this.angularVelocity = (Math.random() - 0.5) * 16;

    this.size = options.size || (4 + Math.random() * 6);
    this.color = options.color || '#48bb78';
    this.outline = options.outline || '#276749';
    this.shape = options.shape || 'chunk';
    this.type = options.type || 'slime';

    this.alive = true;
    this.bouncesLeft = 2;
    this.stoppedTimer = 0;
  }

  update(dt, decalManager) {
    if (!this.alive) return;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const f = Math.pow(this.friction, dt * 60);
    this.vx *= f;
    this.vy *= f;
    this.angularVelocity *= f;
    this.angle += this.angularVelocity * dt;

    this.vz += this.gravity * dt;
    this.z += this.vz * dt;

    if (this.z <= 0) {
      this.z = 0;
      if (this.bouncesLeft > 0 && Math.abs(this.vz) > 40) {
        this.vz = -this.vz * 0.35;
        this.bouncesLeft--;
        this.vx *= 0.65;
        this.vy *= 0.65;

        if (decalManager) {
          decalManager.addSplatter(this.x, this.y, { type: this.type, radius: this.size * 0.9, dirX: this.vx, dirY: this.vy, power: 0.8 });
        }
      } else {
        this.vz = 0;
        const groundSpeed = Math.hypot(this.vx, this.vy);
        // Ковзаючи по землі, уламок лишає кривавий мазок
        this.smearDist = (this.smearDist || 0) + groundSpeed * dt;
        if (decalManager && groundSpeed > 25 && this.smearDist >= CONFIG.GIBS.smearStep) {
          this.smearDist = 0;
          paintSmear(decalManager, this.x, this.y, this.type, this.size);
        }
        if (groundSpeed < 8) {
          this.stoppedTimer += dt;
          if (this.stoppedTimer >= 0.15) {
            this.bakePermanentDecal(decalManager);
            this.alive = false;
          }
        }
      }
    }
  }

  bakePermanentDecal(decalManager) {
    if (!decalManager) return;
    decalManager.paintOnWorld(this.x, this.y, this.size * 1.5, (ctx, lx, ly) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.outline;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.75, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  render(ctx) {
    if (!this.alive) return;

    const shadowScale = Math.max(0.2, 1 - (this.z / 90));
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * shadowScale})`;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.size * shadowScale, (this.size * 0.5) * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, this.y - this.z);
    ctx.rotate(this.angle);

    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.outline;
    ctx.lineWidth = 1.2;

    if (this.shape === 'shard') {
      ctx.beginPath();
      ctx.moveTo(this.size * 1.4, 0);
      ctx.lineTo(-this.size * 0.8, -this.size * 0.6);
      ctx.lineTo(-this.size * 0.4, 0);
      ctx.lineTo(-this.size * 0.8, this.size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.shape === 'plate') {
      ctx.beginPath();
      ctx.rect(-this.size * 0.7, -this.size * 0.5, this.size * 1.4, this.size);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class GibManager {
  constructor() {
    this.gibs = [];
    this.maxGibs = (CONFIG.GIBS && CONFIG.GIBS.maxActive) || 140;
  }

  spawnForEnemy(enemy, sourceX, sourceY) {
    let fatalAngle = Math.random() * Math.PI * 2;
    if (sourceX !== undefined && sourceY !== undefined) {
      fatalAngle = Math.atan2(enemy.y - sourceY, enemy.x - sourceX);
    }

    // Колір уламків = колір крові ворога (gore.js); темні шматки «тіла» + яскраві краплі
    const type = bloodFor(enemy);
    const pal = BLOOD[type];
    const shell = SHELL_COLOR[enemy.typeKey] || enemy.color;
    let count = 5, baseSpeed = 220, shape = 'chunk';
    if (enemy.typeKey === 'sprout') { count = 6; baseSpeed = 240; }
    else if (enemy.typeKey === 'stalker') { count = 9; baseSpeed = 270; shape = 'plate'; }
    else if (enemy.typeKey === 'dasher') { count = 7; baseSpeed = 340; shape = 'shard'; }
    else if (enemy.typeKey === 'warden') { count = 24; baseSpeed = 420; shape = 'plate'; }
    if (enemy.isElite) count += 4;
    count = Math.round(count * ((CONFIG.GIBS && CONFIG.GIBS.countMult) || 1));

    for (let i = 0; i < count; i++) {
      if (this.gibs.length >= this.maxGibs) {
        const oldest = this.gibs.shift();
        if (state.decalManager) oldest.bakePermanentDecal(state.decalManager);
      }

      const spread = 0.95;
      const angle = fatalAngle + (Math.random() - 0.5) * spread;
      const speed = baseSpeed * (0.6 + Math.random() * 0.9);

      // Кожен третій — шматок панцира, решта — згустки крові
      const isShell = i % 3 === 0;
      this.gibs.push(new Gib(enemy.x, enemy.y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
        size: (enemy.radius * (isShell ? 0.3 : 0.24)) + Math.random() * 3,
        color: isShell ? shell : pal.hex,
        outline: `rgb(${pal.dark.join(', ')})`,
        shape: isShell ? shape : 'chunk',
        type
      }));
    }
  }

  update(dt, decalManager = state.decalManager) {
    for (let i = this.gibs.length - 1; i >= 0; i--) {
      const g = this.gibs[i];
      g.update(dt, decalManager);
      if (!g.alive) {
        this.gibs.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (let i = 0; i < this.gibs.length; i++) {
      this.gibs[i].render(ctx);
    }
  }

  clear() {
    this.gibs = [];
  }
}