// js/render/pixiEntities.js — Рендер гравця, ворогів, луту та уламків із тінями, спрайтами та Y-sorting

import { state } from '../state.js';
import { SpritePool } from './pixiCore.js';
import { PixiSpriteAtlas } from './pixiSpriteAtlas.js';
import { syncEnemies } from './pixiEnemies.js';

// Робот: піксель листа → світ (≈ 48 px заввишки при growthScale 1); ноги на player.y + ROBOT_FEET
const ROBOT_K = 0.19;  // було 0.21: вороги виросли на 30%, робот трохи менший (хітбокс не змінено)
const ROBOT_FEET = 19;

export class PixiEntitiesRenderer {
  constructor(pixi, atlas = null) {
    this.pixi = pixi;
    this.atlas = atlas || new PixiSpriteAtlas(pixi);
    this.shadowPool = new SpritePool(pixi.shadowLayer);
    this.entityPool = new SpritePool(pixi.entityLayer);
    this.corpsePool = new SpritePool(pixi.corpseLayer);
  }

  // Тіла: кадр «купа решток» зі спрайт-листа (ще фізичні; «вросші» вже намальовані в декалях)
  syncCorpses(corpses, spriteManager, vl, vr, vt, vb) {
    this.corpsePool.beginFrame();
    const fading = state.corpseManager.fading;
    for (let i = 0; i < corpses.length + fading.length; i++) {
      const b = i < corpses.length ? corpses[i] : fading[i - corpses.length];
      const fade = b.dissolveT === undefined ? 1 : 1 - b.dissolveT;
      if (b.x < vl || b.x > vr || b.y < vt || b.y > vb) continue;
      const key = `enemy_${b.typeKey}`;
      const meta = spriteManager && spriteManager.getMeta(key);
      const tex = this.atlas.getCorpseFrame(spriteManager, key, b.variant);
      if (tex) {
        const rect = meta.corpseFrames[b.variant % meta.corpseFrames.length];
        const [w, h] = b.displaySize(rect);
        const s = this.corpsePool.acquire(tex);
        s.position.set(b.x, b.y);
        // розчавлене: ширше, пласкіше, темніше (поки в листах немає окремого кадру)
        const [cx, cy] = b.crushScale();
        s.width = w * cx; s.height = h * cy;
        s.scale.x *= b.flip;
        s.rotation = b.rot;
        if (b.crushed) s.tint = 0xb8a8a8;
        s.alpha = fade;
      } else {
        const s = this.corpsePool.acquire(this.pixi.getTexture('circle'));
        s.position.set(b.x, b.y);
        s.width = b.radius * 2; s.height = b.radius * 1.4;
        s.rotation = b.rot;
        s.tint = 0x3a2a2a;
        s.alpha = fade;
      }
    }
    this.corpsePool.endFrame();
  }

  sync(state, camera, viewW, viewH, nowSec) {
    this.shadowPool.beginFrame();
    this.entityPool.beginFrame();

    const vl = camera.x - viewW * 0.5 - 120;
    const vr = camera.x + viewW * 0.5 + 120;
    const vt = camera.y - viewH * 0.5 - 120;
    const vb = camera.y + viewH * 0.5 + 120;

    if (state.corpseManager) this.syncCorpses(state.corpseManager.corpses, state.spriteManager, vl, vr, vt, vb);
    if (state.pickupManager) this.syncPickups(state.pickupManager.pickups, vl, vr, vt, vb, nowSec);
    if (state.gibManager) this.syncGibs(state.gibManager.gibs, vl, vr, vt, vb);
    if (state.enemyManager) syncEnemies(this, state.enemyManager.enemies, state.spriteManager, vl, vr, vt, vb, nowSec);
    if (state.player) this.syncPlayer(state.player, state.spriteManager, nowSec);

    this.shadowPool.endFrame();
    this.entityPool.endFrame();
  }

  syncPlayer(player, spriteManager, nowSec) {
    const shadowTex = this.pixi.getTexture('shadow');
    const ringTex = this.pixi.getTexture('ring');
    const whiteTex = this.pixi.getTexture('white');
    const gScale = player.growthScale || 1;

    // М'яке блакитне світло навколо робота (від антени): він найяскравіший на екрані
    const pulse = 0.5 + 0.5 * Math.sin(nowSec * 3);
    const halo = this.shadowPool.acquire(this.pixi.getTexture('glow'));
    halo.position.set(player.x, player.y + player.radius * 0.1);
    halo.width = player.radius * (9 + pulse * 0.8) * gScale;
    halo.height = player.radius * (7.5 + pulse * 0.6) * gScale;
    halo.tint = 0x5fd8ff;
    halo.alpha = 0.42 + pulse * 0.08;
    halo.blendMode = 'add';

    const sh = this.shadowPool.acquire(shadowTex);
    sh.position.set(player.x, player.y + player.radius * 0.72);
    sh.width = player.radius * 2.0;
    sh.height = player.radius * 0.8;
    sh.alpha = 0.85;

    for (let i = 0; i < player.afterimages.length; i++) {
      const g = player.afterimages[i];
      const ghost = this.entityPool.acquire(ringTex);
      ghost.position.set(g.x, g.y);
      ghost.width = g.radius * 2; ghost.height = g.radius * 2;
      ghost.tint = 0x63b3ed;
      ghost.alpha = g.alpha * 0.7;
      ghost.zIndex = g.y - 0.1;
    }

    const blinkAlpha = (player.invulnerableTimer > 0 && Math.floor(nowSec * 16.6) % 2 === 0) ? 0.45 : 1.0;

    if (player.shieldCharges > 0) {
      const sr = this.entityPool.acquire(ringTex);
      sr.position.set(player.x, player.y);
      const d = (player.radius + 7) * 2;
      sr.width = d; sr.height = d;
      sr.tint = 0x4299e1;
      sr.alpha = blinkAlpha * 0.85;
      sr.zIndex = player.y - 0.02;
    }

    if (player.carryingCore) {
      const cr = this.entityPool.acquire(ringTex);
      cr.position.set(player.x, player.y);
      const d = (player.radius + 12) * 2;
      cr.width = d; cr.height = d;
      cr.tint = 0xecc94b;
      cr.zIndex = player.y - 0.03;
    }

    if (player.godMode) {
      const gr = this.entityPool.acquire(ringTex);
      gr.position.set(player.x, player.y);
      const d = (player.radius + 15) * 2;
      gr.width = d; gr.height = d;
      gr.tint = 0xffd700;
      gr.zIndex = player.y - 0.04;
    }

    const frame = this.atlas.getRobotFrame(spriteManager, player, nowSec);
    if (frame) {
      // Пропорції кадру зберігаємо (раніше квадрат 54×54 розтягував робота вшир)
      const s = this.entityPool.acquire(frame.tex);
      const k = ROBOT_K * gScale;
      s.anchor.set(0.5, 1);
      s.position.set(player.x, player.y + ROBOT_FEET * gScale + frame.bob);
      s.scale.set(k * frame.flip, k);
      s.alpha = blinkAlpha;
      s.zIndex = player.y;
      // Тонкий блакитний обвід позаду — відділяє робота від натовпу
      const rimSil = this.atlas.getSilhouette(spriteManager, 'robot', frame.row, frame.col);
      if (rimSil) {
        const rim = this.entityPool.acquire(rimSil);
        rim.anchor.set(0.5, 1);
        rim.position.copyFrom(s.position);
        rim.scale.set(s.scale.x * 1.1, s.scale.y * 1.1);
        rim.tint = 0x7fe6ff;
        rim.alpha = 0.55 * blinkAlpha;
        rim.zIndex = player.y - 0.01;
      }
      // Спалах отриманого удару: червоно-білий силует поверх
      if (player.hurtFlash > 0) {
        const sil = this.atlas.getSilhouette(spriteManager, 'robot', frame.row, frame.col);
        if (sil) {
          const f = this.entityPool.acquire(sil);
          f.anchor.set(0.5, 1);
          f.position.copyFrom(s.position);
          f.scale.copyFrom(s.scale);
          f.tint = 0xff5a5a;
          f.alpha = Math.min(1, player.hurtFlash / 0.2) * 0.8;
          f.zIndex = player.y + 0.001;
        }
      }
    } else {
      const s = this.entityPool.acquire(this.pixi.getTexture('hex'));
      s.position.set(player.x, player.y);
      s.width = player.radius * 2; s.height = player.radius * 2;
      s.rotation = player.facingAngle;
      s.tint = player.godMode ? 0xd69e2e : 0x2b6cb0;
      s.alpha = blinkAlpha;
      s.zIndex = player.y;
    }

    if (player.isCruising) {
      const flame = this.entityPool.acquire(this.pixi.getTexture('circle'));
      const dist = player.radius * 0.9;
      flame.position.set(player.x - Math.cos(player.facingAngle) * dist, player.y - Math.sin(player.facingAngle) * dist);
      const fs = 10 + Math.random() * 8;
      flame.width = fs; flame.height = fs;
      flame.tint = Math.random() > 0.5 ? 0xf6ad55 : 0xed8936;
      flame.zIndex = player.y - 0.01;
    }

    const w = 38 * gScale;
    const by = player.y - player.radius - 12;
    const hpBg = this.entityPool.acquire(whiteTex);
    hpBg.position.set(player.x, by);
    hpBg.width = w + 2; hpBg.height = 6;
    hpBg.tint = 0x000000; hpBg.alpha = 0.65;
    hpBg.zIndex = player.y + 0.05;

    const ratio = Math.max(0, player.health / player.maxHealth);
    const hpFill = this.entityPool.acquire(whiteTex);
    hpFill.position.set(player.x - (w * 0.5) * (1 - ratio), by);
    hpFill.width = Math.max(0.1, w * ratio); hpFill.height = 4;
    hpFill.tint = ratio > 0.5 ? 0x48bb78 : 0xf56565;
    hpFill.zIndex = player.y + 0.06;

    for (let i = 0; i < player.maxShieldCharges; i++) {
      const pip = this.entityPool.acquire(whiteTex);
      pip.position.set(player.x - w * 0.5 + 3 + i * 9, by - 7);
      pip.width = 6; pip.height = 6;
      pip.tint = i < player.shieldCharges ? 0x4299e1 : 0x4a5568;
      pip.zIndex = player.y + 0.06;
    }
  }

  // Фолбек без спрайт-листа: прості фігури
  syncEnemyFallback(e) {
    const tex = e.typeKey === 'dasher'
      ? this.pixi.getTexture('triangle')
      : e.typeKey === 'warden' ? this.pixi.getTexture('octagon') : this.pixi.getTexture('circle_outline');
    const s = this.entityPool.acquire(tex);
    const boost = (e.typeKey === 'warden' && e.isCharging) ? 1.18 : 1.0;
    s.position.set(e.x, e.y);
    s.width = e.radius * 2 * boost;
    s.height = e.radius * 2 * boost;
    s.tint = e.hitFlashTimer > 0 ? 0xffffff : e.isTitan ? 0xff0055 : e.isElite ? 0xecc94b : e.color;
    s.zIndex = e.y;
  }

  syncPickups(pickups, vl, vr, vt, vb, nowSec) {
    const shadowTex = this.pixi.getTexture('shadow');
    const diamondTex = this.pixi.getTexture('diamond');
    const whiteTex = this.pixi.getTexture('white');
    const pulse = Math.sin(nowSec * 5) * 1.5;

    for (let i = 0; i < pickups.length; i++) {
      const p = pickups[i];
      if (!p.alive || p.x < vl || p.x > vr || p.y < vt || p.y > vb) continue;

      const sh = this.shadowPool.acquire(shadowTex);
      sh.position.set(p.x, p.y + 5);
      sh.width = 10; sh.height = 4;
      sh.alpha = 0.6;

      const s = this.entityPool.acquire(p.type === 'bio' ? diamondTex : whiteTex);
      s.position.set(p.x, p.y);
      const sz = p.type === 'bio' ? (p.radius + pulse) * 2 : p.radius;
      s.width = sz; s.height = sz;
      s.tint = p.type === 'bio' ? 0x48bb78 : 0xecc94b;
      s.zIndex = p.y;
    }
  }

  syncGibs(gibs, vl, vr, vt, vb) {
    const shadowTex = this.pixi.getTexture('shadow');
    const circleTex = this.pixi.getTexture('circle'); // без білого контуру — інакше «конфетті»
    const whiteTex = this.pixi.getTexture('white');
    const triTex = this.pixi.getTexture('triangle');

    for (let i = 0; i < gibs.length; i++) {
      const g = gibs[i];
      if (!g.alive || g.x < vl || g.x > vr || g.y < vt || g.y > vb) continue;

      const shadowScale = Math.max(0.2, 1 - g.z / 90);
      const sh = this.shadowPool.acquire(shadowTex);
      sh.position.set(g.x, g.y);
      sh.width = g.size * 1.5 * shadowScale;
      sh.height = g.size * 0.7 * shadowScale;
      sh.alpha = shadowScale * 0.7;

      // Кувиркання: висота спрайта «дихає» з фазою перевороту (фейкове 3D)
      const tex = g.shape === 'shard' ? triTex : g.shape === 'plate' ? whiteTex : circleTex;
      const s = this.entityPool.acquire(tex);
      s.position.set(g.x, g.y - g.z);
      s.width = g.size * 1.6;
      s.height = (g.shape === 'plate' ? g.size : g.size * 1.6) * g.flip;
      s.rotation = g.angle;
      s.tint = g.color;
      s.zIndex = g.y;
    }
  }
}