// js/corpses.js — Тіла ворогів (кадр «купа решток» зі спрайт-листа). Відлітають від удару, їх штовхає
// робот (dash — далеко) і вороги, при ковзанні мажуть кров. Через CORPSES.interactiveTime тіло
// «вростає» в землю: малюється в чанк декалей назавжди і більше нічого не коштує щокадру.
// Так після бою лишаються купи тіл.

import { CONFIG } from './config.js';
import { state } from './state.js';
import { BLOOD, bloodFor, paintSmear } from './gore.js';

const SCALE_BY_TYPE = { sprout: 3.0, stalker: 2.9, dasher: 3.0, warden: 3.2 };

class Corpse {
  constructor(enemy, dirX, dirY, power) {
    const c = CONFIG.CORPSES;
    this.x = enemy.x;
    this.y = enemy.y;
    this.typeKey = enemy.typeKey;
    this.isElite = enemy.isElite;
    this.radius = enemy.radius;
    this.color = enemy.color;
    this.blood = bloodFor(enemy);
    this.variant = Math.random() < 0.5 ? 0 : 1;   // один із двох кадрів решток
    this.flip = Math.random() < 0.5 ? -1 : 1;     // дзеркально для різноманіття
    const kick = c.knockback * (0.7 + Math.random() * 0.6) * power;
    this.vx = dirX * kick;
    this.vy = dirY * kick;
    this.rot = (Math.random() - 0.5) * 0.5;
    this.spin = 0;
    this.age = 0;
    this.smearDist = 0;
  }

  // Ширина/висота відображення (в світових пікселях) для кадру решток
  displaySize(rect) {
    const w = this.radius * (SCALE_BY_TYPE[this.typeKey] || 3) * CONFIG.CORPSES.sizeMult * (this.isElite ? 1.15 : 1);
    return [w, rect ? w * (rect[3] / rect[2]) : w * 0.8];
  }
}

export class CorpseManager {
  constructor() {
    this.corpses = [];
    this._frame = 0;
  }

  spawn(enemy, dirX = 0, dirY = 0, power = 1) {
    if (enemy.isTitan) return;
    const c = CONFIG.CORPSES;
    // Ліміт «живих» (фізичних) тіл: найстаріше одразу вростає в землю
    if (this.corpses.length >= c.maxActive) this.bake(this.corpses.shift());
    this.corpses.push(new Corpse(enemy, dirX, dirY, power));
  }

  // Назавжди малюємо тіло в чанк декалей (над кров'ю, під усім живим)
  bake(b) {
    const decals = state.decalManager;
    if (!decals) return;
    const sm = state.spriteManager;
    const key = `enemy_${b.typeKey}`;
    const meta = sm && sm.getMeta(key);
    const src = sm && sm.getSource(key);
    if (!src || !meta || !meta.corpseFrames) {
      paintSmear(decals, b.x, b.y, b.blood, b.radius * 1.6);
      return;
    }
    const rect = meta.corpseFrames[b.variant % meta.corpseFrames.length];
    const [w, h] = b.displaySize(rect);
    decals.paintOnWorld(b.x, b.y, Math.max(w, h) * 0.6, (ctx, lx, ly) => {
      ctx.translate(lx, ly);
      ctx.rotate(b.rot);
      ctx.scale(b.flip, 1);
      ctx.drawImage(src, rect[0], rect[1], rect[2], rect[3], -w / 2, -h / 2, w, h);
    });
  }

  update(dt, player, enemyManager, decals) {
    const c = CONFIG.CORPSES;
    const friction = Math.pow(c.friction, dt * 60);
    const checkEnemies = (this._frame++ % c.enemyPushInterval) === 0;
    const grid = enemyManager && enemyManager.grid;

    for (let i = this.corpses.length - 1; i >= 0; i--) {
      const b = this.corpses[i];
      b.age += dt;
      const speed0 = Math.hypot(b.vx, b.vy);
      if (b.age >= c.interactiveTime && speed0 < 2) {
        this.bake(b);
        this.corpses.splice(i, 1);
        continue;
      }

      // Робот штовхає (dash відкидає далеко)
      const px = b.x - player.x, py = b.y - player.y;
      const minD = b.radius * 0.8 + player.radius;
      const dSq = px * px + py * py;
      if (dSq < minD * minD && dSq > 0.01) {
        const d = Math.sqrt(dSq);
        const nx = px / d, ny = py / d;
        b.x = player.x + nx * minD;
        b.y = player.y + ny * minD;
        const along = Math.max(0, player.vx * nx + player.vy * ny);
        b.vx += nx * (along * c.playerPush + 40);
        b.vy += ny * (along * c.playerPush + 40);
        b.spin += (Math.random() - 0.5) * 3;
      }

      // Вороги розштовхують тіла (рідше, через сітку)
      if (checkEnemies && grid) {
        const near = grid.getNearby(b.x, b.y, b.radius + 40);
        for (let j = 0; j < near.length; j++) {
          const e = near[j];
          if (!e.alive) continue;
          const ex = b.x - e.x, ey = b.y - e.y;
          const md = b.radius * 0.7 + e.radius;
          const eSq = ex * ex + ey * ey;
          if (eSq < md * md && eSq > 0.01) {
            const d = Math.sqrt(eSq);
            b.x += (ex / d) * (md - d) * 0.5;
            b.y += (ey / d) * (md - d) * 0.5;
          }
        }
      }

      // Ковзання з тертям і кров'яним слідом
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > 2) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vx *= friction;
        b.vy *= friction;
        b.rot += b.spin * dt;
        b.spin *= friction;
        b.smearDist += speed * dt;
        if (speed > 30 && b.smearDist >= c.smearStep) {
          b.smearDist = 0;
          paintSmear(decals, b.x, b.y, b.blood, b.radius * 0.7);
        }
      } else {
        b.vx = 0; b.vy = 0;
      }
    }
  }

  clear() {
    this.corpses.length = 0;
  }

  // Canvas 2D fallback (без Pixi): кадр решток або темний еліпс
  render(ctx) {
    const sm = state.spriteManager;
    for (const b of this.corpses) {
      const key = `enemy_${b.typeKey}`;
      const meta = sm && sm.getMeta(key);
      const src = sm && sm.getSource(key);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      if (src && meta && meta.corpseFrames) {
        const rect = meta.corpseFrames[b.variant % meta.corpseFrames.length];
        const [w, h] = b.displaySize(rect);
        ctx.scale(b.flip, 1);
        ctx.drawImage(src, rect[0], rect[1], rect[2], rect[3], -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = `rgba(${BLOOD[b.blood].dark.join(', ')}, 0.85)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, b.radius, b.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
