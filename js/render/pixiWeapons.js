// js/render/pixiWeapons.js — Рендер 6 архетипів зброї, снарядів, зон та ефектів у PixiJS v8

import { SpritePool } from './pixiCore.js';
import { PixiSpriteAtlas } from './pixiSpriteAtlas.js';

function parseParticleTint(colorStr) {
  if (!colorStr) return 0x63b3ed;
  if (colorStr.includes('246')) return 0xf6ad55;
  if (colorStr.includes('104')) return 0x68d391;
  return 0x63b3ed;
}

export class PixiWeaponsRenderer {
  constructor(pixi, atlas = null) {
    this.pixi = pixi;
    this.atlas = atlas || new PixiSpriteAtlas(pixi);
    this.groundPool = new SpritePool(pixi.shadowLayer);
    this.fxPool = new SpritePool(pixi.fxLayer);
    this.sawTex = this.bakeSawTexture();
  }

  bakeSawTexture() {
    return this.pixi.bakeTexture('saw_blade', (g) => {
      const pts = [];
      const teeth = 8;
      for (let i = 0; i < teeth * 2; i++) {
        const a = (i * Math.PI) / teeth;
        const r = i % 2 === 0 ? 28 : 18;
        pts.push(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.poly(pts).fill(0xffffff).stroke({ width: 3, color: 0xe2e8f0 });
      g.circle(0, 0, 7).fill(0x4a5568);
    });
  }

  drawBeam(x1, y1, x2, y2, thickness, tint, alpha) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 0.5) return;

    const s = this.fxPool.acquire(this.pixi.getTexture('white'));
    s.position.set(x1 + dx * 0.5, y1 + dy * 0.5);
    s.width = len;
    s.height = thickness;
    s.rotation = Math.atan2(dy, dx);
    s.tint = tint;
    s.alpha = alpha;
    s.blendMode = 'add';
  }

  sync(state, camera, viewW, viewH, nowSec) {
    this.groundPool.beginFrame();
    this.fxPool.beginFrame();

    const vl = camera.x - viewW * 0.5 - 160;
    const vr = camera.x + viewW * 0.5 + 160;
    const vt = camera.y - viewH * 0.5 - 160;
    const vb = camera.y + viewH * 0.5 + 160;

    const wm = state.weaponManager;
    const sm = state.spriteManager;
    if (wm) {
      this.syncZones(wm.zones, vl, vr, vt, vb, nowSec);
      this.syncShells(wm.mortarShells, sm, nowSec);
      this.syncProjectiles(wm.projectiles, vl, vr, vt, vb);
      this.syncWeaponSlots(wm.slots, sm, nowSec);
      this.syncParticles(wm.particles, vl, vr, vt, vb);
    }

    if (state.shockwaves) {
      this.syncShockwaves(state.shockwaves);
    }

    this.groundPool.endFrame();
    this.fxPool.endFrame();
  }

  syncZones(zones, vl, vr, vt, vb, nowSec) {
    const circleTex = this.pixi.getTexture('circle');
    const ringTex = this.pixi.getTexture('ring');

    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      if (!z.alive) continue;

      if (z.x + z.radius >= vl && z.x - z.radius <= vr && z.y + z.radius >= vt && z.y - z.radius <= vb) {
        const isAsh = z.cfg.theme === 'ash';
        const fade = Math.min(1.0, z.duration / 0.5);
        const pulse = Math.sin(nowSec * (isAsh ? 6.6 : 5)) * 3;

        const fill = this.groundPool.acquire(circleTex);
        fill.position.set(z.x, z.y);
        const d = (z.radius + pulse) * 2;
        fill.width = d; fill.height = d;
        fill.tint = isAsh ? 0xdd6b20 : 0x38a169;
        fill.alpha = fade * 0.35;

        const ring = this.groundPool.acquire(ringTex);
        ring.position.set(z.x, z.y);
        ring.width = z.radius * 2; ring.height = z.radius * 2;
        ring.tint = isAsh ? 0xf6e05e : 0x68d391;
        ring.alpha = fade * 0.65;
      }

      if (z.activeArcs) {
        for (let j = 0; j < z.activeArcs.length; j++) {
          const a = z.activeArcs[j];
          this.drawBeam(a.fromX, a.fromY, a.toX, a.toY, 2, 0x81e6d9, a.life / a.maxLife);
        }
      }
    }
  }

  syncShells(shells, spriteManager, nowSec) {
    const shadowTex = this.pixi.getTexture('shadow');
    const circleTex = this.pixi.getTexture('circle_outline');

    for (let i = 0; i < shells.length; i++) {
      const s = shells[i];
      if (!s.alive) continue;
      const isAsh = s.cfg.theme === 'ash';
      const isStorm = s.cfg.theme === 'storm';

      const sh = this.groundPool.acquire(shadowTex);
      sh.position.set(s.x, s.y);
      const sw = (isAsh ? 16 : 12) * (1 - s.progress * 0.3);
      sh.width = sw; sh.height = sw * 0.5;

      const arcOffset = Math.sin(s.progress * Math.PI) * s.peakHeight;
      const drawY = s.y - arcOffset;
      const spriteKey = isAsh ? 'incinerator_shell' : 'mortar_shell';

      if (spriteManager && spriteManager.has(spriteKey)) {
        const tex = this.atlas.getFrame(spriteManager, spriteKey, 0, Math.floor(nowSec * 12) % 4);
        const body = this.fxPool.acquire(tex);
        body.position.set(s.x, drawY);
        const sz = isAsh ? 34 : 32;
        body.width = sz; body.height = sz;

        const vx = s.targetX - s.startX;
        const vy = (s.targetY - s.startY) - Math.cos(s.progress * Math.PI) * Math.PI * s.peakHeight;
        body.rotation = Math.atan2(vy, vx) + (isAsh ? Math.PI * 0.25 : 0);
      } else {
        const body = this.fxPool.acquire(circleTex);
        body.position.set(s.x, drawY);
        const sz = isAsh ? 16 : 12;
        body.width = sz; body.height = sz;
        body.tint = isAsh ? 0xdd6b20 : isStorm ? 0x319795 : 0x38a169;
      }
    }
  }

  syncProjectiles(projectiles, vl, vr, vt, vb) {
    const whiteTex = this.pixi.getTexture('white');
    const circleTex = this.pixi.getTexture('circle');

    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.alive || p.x < vl || p.x > vr || p.y < vt || p.y > vb) continue;

      const tx = p.vx * 0.025;
      const ty = p.vy * 0.025;
      const tLen = Math.hypot(tx, ty);
      if (tLen > 0.5) {
        const trail = this.fxPool.acquire(whiteTex);
        trail.position.set(p.x - tx * 0.5, p.y - ty * 0.5);
        trail.width = tLen;
        trail.height = p.size >= 7 ? 3.5 : 2.5;
        trail.rotation = Math.atan2(ty, tx);
        trail.tint = p.color || 0x63b3ed;
        trail.blendMode = 'add';
      }

      const head = this.fxPool.acquire(circleTex);
      head.position.set(p.x, p.y);
      head.width = p.size * 2;
      head.height = p.size * 2;
      head.tint = p.size >= 7 ? 0xebf8ff : 0xffffff;
    }
  }

  syncWeaponSlots(slots, spriteManager, nowSec) {
    const whiteTex = this.pixi.getTexture('white');
    const circleTex = this.pixi.getTexture('circle');
    const ringTex = this.pixi.getTexture('ring');
    const triTex = this.pixi.getTexture('triangle');
    const hasSaws = spriteManager && spriteManager.has('saws');

    for (let i = 0; i < slots.length; i++) {
      const w = slots[i];
      const arch = w.cfg && w.cfg.archetype;

      if (arch === 'projectile' && w.cfg.orbitOffsetRadius) {
        const o = w.getOrigin();
        const border = this.fxPool.acquire(whiteTex);
        border.position.set(o.x, o.y);
        border.width = 20; border.height = 20;
        border.rotation = w.orbitAngle + Math.PI * 0.5;
        border.tint = 0x63b3ed;

        const inner = this.fxPool.acquire(whiteTex);
        inner.position.set(o.x, o.y);
        inner.width = 16; inner.height = 16;
        inner.rotation = w.orbitAngle + Math.PI * 0.5;
        inner.tint = 0x1a365d;
      } else if (arch === 'chain' && w.activeBolts) {
        for (let b = 0; b < w.activeBolts.length; b++) {
          const bolt = w.activeBolts[b];
          this.drawBeam(bolt.fromX, bolt.fromY, bolt.toX, bolt.toY, 2.5, 0x81e6d9, bolt.life / bolt.maxLife);
        }
      } else if (arch === 'orbital') {
        if (w.activeBeams) {
          for (let b = 0; b < w.activeBeams.length; b++) {
            const beam = w.activeBeams[b];
            this.drawBeam(beam.fromX, beam.fromY, beam.toX, beam.toY, 2.5, parseParticleTint(beam.color), beam.life / beam.maxLife);
          }
        }
        const count = w.cfg.count || 1;
        const orbitR = w.cfg.orbitRadius * w.owner.growthScale;
        for (let b = 0; b < count; b++) {
          const a = w.currentAngle + (b * Math.PI * 2) / count;
          const bx = w.owner.x + Math.cos(a) * orbitR;
          const by = w.owner.y + Math.sin(a) * orbitR;

          if (w.cfg.visual === 'drone') {
            const d = this.fxPool.acquire(triTex);
            d.position.set(bx, by);
            d.width = 14; d.height = 14;
            d.rotation = a;
            d.tint = 0xed8936;
          } else if (hasSaws) {
            const isVolt = w.cfg.visual === 'volt_saw';
            const col = Math.floor(nowSec * 24 + b) % 8;
            const saw = this.fxPool.acquire(this.atlas.getFrame(spriteManager, 'saws', isVolt ? 1 : 0, col));
            saw.position.set(bx, by);
            const sz = (isVolt ? 14 : w.cfg.hitRadius * 1.25) * 2;
            saw.width = sz; saw.height = sz;
          } else {
            const isVolt = w.cfg.visual === 'volt_saw';
            const saw = this.fxPool.acquire(this.sawTex);
            saw.position.set(bx, by);
            const sz = (isVolt ? 12 : w.cfg.hitRadius) * 2;
            saw.width = sz; saw.height = sz;
            saw.rotation = w.currentAngle * (isVolt ? 6 : 4);
            saw.tint = isVolt ? 0x81e6d9 : 0xcbd5e0;
          }
        }
      } else if (arch === 'cone' && w.particles) {
        for (let pIdx = 0; pIdx < w.particles.length; pIdx++) {
          const p = w.particles[pIdx];
          const ratio = p.life / p.maxLife;
          const s = this.fxPool.acquire(circleTex);
          s.position.set(p.x, p.y);
          const d = p.size * 2 * (1 - ratio * 0.3);
          s.width = d; s.height = d;
          s.tint = ratio > 0.6 ? 0xffffff : 0xf6ad55;
          s.alpha = ratio * 0.9;
          s.blendMode = 'add';
        }
      } else if (arch === 'aura') {
        const r = w.cfg.radius * w.owner.growthScale;
        const baseRing = this.groundPool.acquire(ringTex);
        baseRing.position.set(w.owner.x, w.owner.y);
        baseRing.width = r * 2; baseRing.height = r * 2;
        baseRing.tint = 0x9f7aea;
        baseRing.alpha = 0.25;

        if (w.ringAlpha > 0) {
          const fill = this.groundPool.acquire(circleTex);
          fill.position.set(w.owner.x, w.owner.y);
          fill.width = w.ringRadius * 2; fill.height = w.ringRadius * 2;
          fill.tint = 0x9f7aea;
          fill.alpha = w.ringAlpha * 0.22;

          const pulseRing = this.groundPool.acquire(ringTex);
          pulseRing.position.set(w.owner.x, w.owner.y);
          pulseRing.width = w.ringRadius * 2; pulseRing.height = w.ringRadius * 2;
          pulseRing.tint = 0xd6bcfa;
          pulseRing.alpha = w.ringAlpha;
        }
      }
    }
  }

  syncParticles(particles, vl, vr, vt, vb) {
    const whiteTex = this.pixi.getTexture('white');
    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      if (pt.x < vl || pt.x > vr || pt.y < vt || pt.y > vb) continue;
      const s = this.fxPool.acquire(whiteTex);
      s.position.set(pt.x, pt.y);
      s.width = 3; s.height = 3;
      s.tint = parseParticleTint(pt.color);
      s.alpha = Math.max(0, pt.life / pt.maxLife);
      s.blendMode = 'add';
    }
  }

  syncShockwaves(shockwaves) {
    const ringTex = this.pixi.getTexture('ring');
    for (let i = 0; i < shockwaves.length; i++) {
      const sw = shockwaves[i];
      if (!sw.alive) continue;
      const s = this.fxPool.acquire(ringTex);
      s.position.set(sw.x, sw.y);
      s.width = sw.radius * 2;
      s.height = sw.radius * 2;
      s.tint = sw.color || 0x68d391;
      s.alpha = sw.alpha;
      s.blendMode = 'add';
    }
  }
}