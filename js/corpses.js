// js/corpses.js — Тіла ворогів (кадр «купа решток» зі спрайт-листа). Коротко відлітають від
// смертельного удару, далі лежать нерухомо. Два стани: перші CORPSES.interactiveTime секунд робот
// може розчавити тіло наїздом (сплющується, бризкає кров'ю, гусениці брудняться) — тоді воно одразу
// «вростає» в землю розчавленим. Не розчавлене вростає як є. Так після бою лишаються купи тіл.

import { CONFIG } from './config.js';
import { state } from './state.js';
import { BLOOD, bloodFor, paintSmear, paintGibSplat } from './gore.js';
import { registerFreshPool } from './goreTracks.js';
import { inHubClear } from './hubClear.js';

// Візуальне збільшення ворогів (лише малюнок; радіус/хітбокс не змінюється)
export const ENEMY_VISUAL_BOOST = 1.3;
const SCALE_BY_TYPE = { sprout: 3.0, stalker: 2.9, dasher: 3.0, warden: 3.2 };

class Corpse {
  constructor(enemy, dirX, dirY, power) {
    this.x = enemy.x;
    this.y = enemy.y;
    this.typeKey = enemy.typeKey;
    this.isElite = enemy.isElite;
    this.radius = enemy.radius;
    this.color = enemy.color;
    this.blood = bloodFor(enemy);
    this.variant = Math.random() < 0.5 ? 0 : 1;   // один із двох кадрів решток
    this.flip = Math.random() < 0.5 ? -1 : 1;     // дзеркально для різноманіття
    const kick = CONFIG.CORPSES.knockback * (0.7 + Math.random() * 0.6) * power;
    this.vx = dirX * kick;
    this.vy = dirY * kick;
    this.smearDist = 0;
    this.rot = (Math.random() - 0.5) * 0.5;
    this.age = 0;
    this.crushed = false;
    this.crushT = 0;      // 0..1 — анімація сплющення
    this.crushAngle = 0;  // курс робота в момент наїзду: тіло розпливається поперек
  }

  // Масштаб відображення: ціле — 1×1; розчавлене — ширше й пласке, з легким «відскоком»
  crushScale() {
    if (!this.crushed) return [1, 1];
    const t = Math.min(1, this.crushT);
    const k = 1 - Math.pow(1 - t, 3);
    const bounce = Math.sin(t * Math.PI) * 0.08;
    const c = CONFIG.CORPSES;
    return [1 + (c.crushWiden - 1) * k + bounce, 1 - (1 - c.crushFlatten) * k - bounce];
  }

  // Ширина/висота відображення (в світових пікселях) для кадру решток
  displaySize(rect) {
    const w = this.radius * (SCALE_BY_TYPE[this.typeKey] || 3) * ENEMY_VISUAL_BOOST * CONFIG.CORPSES.sizeMult * (this.isElite ? 1.15 : 1);
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
    // У зоні Хаба тіло не лишається взагалі
    if (inHubClear(enemy.x, enemy.y, enemy.radius)) return;
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
    const [sx, sy] = b.crushScale();
    decals.paintOnWorld(b.x, b.y, Math.max(w * sx, h) * 0.6, (ctx, lx, ly) => {
      ctx.translate(lx, ly);
      ctx.rotate(b.rot);
      ctx.scale(b.flip * sx, sy);
      // розчавлене темніше (поки немає окремого кадру «розчавлене» в листі)
      if (b.crushed) ctx.filter = 'brightness(0.72) saturate(0.85)';
      ctx.drawImage(src, rect[0], rect[1], rect[2], rect[3], -w / 2, -h / 2, w, h);
    });
  }

  // Наїзд робота: тіло сплющується, кров бризкає в боки від гусениць, гусениці брудняться
  crush(b, player) {
    const c = CONFIG.CORPSES;
    b.crushed = true;
    b.crushT = 0;
    const heading = Math.atan2(player.vy, player.vx);
    b.crushAngle = heading;
    const decals = state.decalManager;
    const r = b.radius * c.crushSplat;
    // дві хвилі крові — в обидва боки, перпендикулярно до руху
    for (const side of [-1, 1]) {
      const a = heading + side * Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      paintGibSplat(decals, b.x + Math.cos(a) * r * 0.4, b.y + Math.sin(a) * r * 0.4, r * 0.55, a, b.blood, 1.3);
    }
    paintGibSplat(decals, b.x, b.y, r * 0.7, heading, b.blood, 0.8);
    registerFreshPool(b.x, b.y, b.radius * 1.6, b.blood);
    if (state.camera) state.camera.addTrauma(c.crushTrauma);
  }

  update(dt, player) {
    const c = CONFIG.CORPSES;
    const moving = player.vx * player.vx + player.vy * player.vy > c.crushMinSpeed * c.crushMinSpeed;
    for (let i = this.corpses.length - 1; i >= 0; i--) {
      const b = this.corpses[i];
      b.age += dt;
      // тіло, відкинуте ударом у зону Хаба, зникає без запікання
      if (inHubClear(b.x, b.y)) { this.corpses.splice(i, 1); continue; }
      if (b.crushed) {
        b.crushT += dt / c.crushTime;
        if (b.crushT >= 1) { this.bake(b); this.corpses.splice(i, 1); }
        continue;
      }
      if (b.age >= c.interactiveTime) { this.bake(b); this.corpses.splice(i, 1); continue; }
      // короткий відліт від удару з кров'яним слідом, потім тіло нерухоме
      if (b.vx !== 0 || b.vy !== 0) {
        const speed = Math.hypot(b.vx, b.vy);
        if (speed < 4) { b.vx = 0; b.vy = 0; }
        else {
          b.x += b.vx * dt; b.y += b.vy * dt;
          const f = Math.pow(c.friction, dt * 60);
          b.vx *= f; b.vy *= f;
          b.smearDist += speed * dt;
          if (speed > 30 && b.smearDist >= c.smearStep) { b.smearDist = 0; paintSmear(state.decalManager, b.x, b.y, b.blood, b.radius * 0.7); }
        }
      }
      if (!moving) continue;
      const dx = b.x - player.x, dy = b.y - player.y, rr = b.radius * c.crushRadiusMult + player.radius * 0.6;
      if (dx * dx + dy * dy < rr * rr) this.crush(b, player);
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
        const [sx, sy] = b.crushScale();
        ctx.scale(b.flip * sx, sy);
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
