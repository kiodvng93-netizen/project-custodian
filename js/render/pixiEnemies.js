// js/render/pixiEnemies.js — Рендер ворогів: кадри з автонарізки з правильними пропорціями,
// анімація за станом (enemyAnim.js), тіні, білий спалах удару, контури еліти й Титанів.

import { enemyPose } from './enemyAnim.js';
import { ENEMY_VISUAL_BOOST as VB } from '../corpses.js';

// Розмір кадру ряду 0 (ширина клітинки) = радіус × це
const SCALE = { warden: 3.2, stalker: 2.9, sprout: 3.0, dasher: 3.0 };
const FEET = 0.8;          // ноги спрайта на e.y + радіус × FEET (біля тіні)
const TITAN_SCALE = 1.3;   // Титан помітно більший за Наглядача

function outline(pool, tex, s, z, tint, alpha, grow) {
  const o = pool.acquire(tex);
  o.anchor.set(0.5, 1);
  o.position.copyFrom(s.position);
  o.rotation = s.rotation;
  o.scale.set(s.scale.x * grow, s.scale.y * grow);
  o.tint = tint;
  o.alpha = alpha;
  o.zIndex = z;
  return o;
}

export function syncEnemies(r, enemies, spriteManager, vl, vr, vt, vb, nowSec) {
  const { pixi, atlas, shadowPool, entityPool } = r;
  const shadowTex = pixi.getTexture('shadow');
  const glowTex = pixi.getTexture('glow');
  const whiteTex = pixi.getTexture('white');

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.alive || e.x < vl || e.x > vr || e.y < vt || e.y > vb) continue;

    const key = `enemy_${e.typeKey}`;
    const pose = enemyPose(e, nowSec);
    const tex = atlas.getSliced(spriteManager, key, pose.row, pose.col);
    if (!tex) { r.syncEnemyFallback(e); continue; }

    const ref = atlas.getSliced(spriteManager, key, 0, 0).frame.width;
    const boost = (e.typeKey === 'warden' && e.isCharging) ? 1.12 : 1.0;
    const k = (e.radius * (SCALE[e.typeKey] || 3) * VB * boost * (e.isTitan ? TITAN_SCALE : 1)) / ref;
    const feetY = e.y + e.radius * FEET;
    const lift = (pose.hover + pose.bob) * e.radius;

    // Тінь: під літуном менша й блідніша, бо він висить у повітрі
    const sh = shadowPool.acquire(shadowTex);
    const air = Math.max(0, -lift) / e.radius;
    sh.position.set(e.x, feetY - e.radius * 0.12);
    sh.width = e.radius * VB * (e.isTitan ? 2.3 : 1.6) * (1 - air * 0.35);
    sh.height = e.radius * VB * (e.isTitan ? 0.85 : 0.6) * (1 - air * 0.35);
    sh.alpha = (e.isTitan ? 1 : 0.8) * (1 - air * 0.3);

    if (e.isTitan) {
      // Пульсуюча багряна аура на землі — Титана видно здалеку й не сплутати з Наглядачем
      const pulse = 0.5 + 0.5 * Math.sin(nowSec * 5 + e.animSeed);
      const aura = shadowPool.acquire(glowTex);
      aura.position.set(e.x, feetY - e.radius * 0.2);
      aura.width = e.radius * VB * (4.2 + pulse * 0.8);
      aura.height = e.radius * VB * (2.0 + pulse * 0.4);
      aura.tint = 0xff0044;
      aura.alpha = 0.45 + pulse * 0.3;
      aura.blendMode = 'add';
    } else if (e.isElite) {
      const ring = shadowPool.acquire(pixi.getTexture('ring'));
      ring.position.set(e.x, feetY - e.radius * 0.15);
      ring.width = e.radius * VB * 2.4;
      ring.height = e.radius * VB;
      ring.tint = 0xf6e05e;
      ring.alpha = 0.8;
    }

    const s = entityPool.acquire(tex);
    s.anchor.set(0.5, 1);
    s.position.set(e.x, feetY + lift);
    s.scale.set(k * pose.flip * pose.sx, k * pose.sy);
    s.rotation = pose.rot;
    s.zIndex = e.y;

    const sil = atlas.getSilhouette(spriteManager, key, pose.row, pose.col);
    if (e.isTitan) {
      // темно-багряне тіло + світний червоний контур
      s.tint = 0x9a3a4a;
      if (sil) {
        const pulse = 0.5 + 0.5 * Math.sin(nowSec * 6 + e.animSeed);
        outline(entityPool, sil, s, e.y - 0.001, 0xff1a4a, 0.55 + pulse * 0.35, 1.07).blendMode = 'add';
      }
    } else if (e.isElite) {
      s.tint = 0xffe2a8;
      if (sil) outline(entityPool, sil, s, e.y - 0.001, 0xf6c945, 0.85, 1.06);
    } else if (e.typeKey === 'warden' && !e.isAwakened) {
      s.tint = 0x8a8aa8;
    }

    // Телеграф атаки: червоне миготіння силуетом поверх спрайта
    if (sil && e.isTelegraphing) {
      const on = Math.floor(nowSec * 14) % 2 === 0;
      outline(entityPool, sil, s, e.y + 0.001, 0xff3b3b, on ? 0.5 : 0.18, 1);
    }
    // Спалах удару: білий силует, гасне за 0.12 с
    if (sil && e.hitFlashTimer > 0) {
      outline(entityPool, sil, s, e.y + 0.002, 0xffffff, Math.min(1, e.hitFlashTimer / 0.12) * 0.85, 1);
    }

    if (e.health < e.maxHealth && !e.invulnerable) {
      const barW = e.radius * VB * 2;
      const by = feetY + lift - tex.frame.height * k * 0.92 - 4;
      const bg = entityPool.acquire(whiteTex);
      bg.position.set(e.x, by);
      bg.width = barW; bg.height = 3;
      bg.tint = 0x000000; bg.alpha = 0.6;
      bg.zIndex = e.y + 0.02;

      const ratio = Math.max(0, e.health / e.maxHealth);
      const fill = entityPool.acquire(whiteTex);
      fill.position.set(e.x - (barW * 0.5) * (1 - ratio), by);
      fill.width = Math.max(0.1, barW * ratio); fill.height = 3;
      fill.tint = 0xfc8181;
      fill.zIndex = e.y + 0.03;
    }
  }
}
