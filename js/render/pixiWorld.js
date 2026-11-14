// js/render/pixiWorld.js — Рендер світу, декалів та структур у PixiJS v8

import { Graphics, Sprite, TilingSprite } from 'pixi.js';
import { CONFIG } from '../config.js';
import { SpritePool } from './pixiCore.js';
import { PixiSpriteAtlas } from './pixiSpriteAtlas.js';

export class PixiWorldRenderer {
  constructor(pixi, atlas = null) {
    this.pixi = pixi;
    this.atlas = atlas || new PixiSpriteAtlas(pixi);
    this.spriteManager = null;

    this.bgTile = null;
    this.bgUsingSprite = false;
    this.ringGraphic = null;
    this.hubGraphic = null;
    this.hubSprite = null;
    this.landmarkAura = null;

    this.decalPool = new SpritePool(pixi.decalLayer);
    this.shadowPool = new SpritePool(pixi.shadowLayer);
    this.entityPool = new SpritePool(pixi.entityLayer);
    this.gridTex = null;

    this.initStaticBackground();
  }

  initStaticBackground() {
    this.gridTex = this.pixi.bakeTexture('world_grid_64', (g) => {
      const s = CONFIG.WORLD.tileGridSize || 64;
      g.rect(0, 0, s, s).fill(0x12151c);
      g.moveTo(0, 0).lineTo(s, 0).stroke({ width: 1, color: 0x2d3748, alpha: 0.4 });
      g.moveTo(0, 0).lineTo(0, s).stroke({ width: 1, color: 0x2d3748, alpha: 0.4 });
    });

    this.bgTile = new TilingSprite({ texture: this.gridTex, width: 2048, height: 2048 });
    this.pixi.bgLayer.addChild(this.bgTile);

    this.ringGraphic = new Graphics();
    this.ringGraphic.circle(0, 0, CONFIG.WORLD.ring1Radius).stroke({ width: 4, color: 0xed8936, alpha: 0.55 });
    this.pixi.bgLayer.addChild(this.ringGraphic);

    this.hubGraphic = new Graphics();
    this.hubGraphic.circle(0, 0, 180).fill({ color: 0x48bb78, alpha: 0.15 }).stroke({ width: 3, color: 0x48bb78 });
    this.hubGraphic.circle(0, 0, 16).fill(0x48bb78);
    this.pixi.bgLayer.addChild(this.hubGraphic);

    this.landmarkAura = new Graphics();
    this.landmarkAura.visible = false;
    this.pixi.bgLayer.addChild(this.landmarkAura);
  }

  syncBackground(camera, viewW, viewH, spriteManager) {
    this.spriteManager = spriteManager;

    if (!this.bgUsingSprite && spriteManager && spriteManager.has('tile_wasteland')) {
      const tex = this.pixi.getCanvasTexture('tile_wasteland', spriteManager.getSource('tile_wasteland'));
      if (tex) {
        this.bgTile.texture = tex;
        this.bgUsingSprite = true;
      }
    }

    if (!this.hubSprite && spriteManager && spriteManager.has('tile_hub')) {
      const hubTex = this.pixi.getCanvasTexture('tile_hub', spriteManager.getSource('tile_hub'));
      if (hubTex) {
        this.hubSprite = new Sprite(hubTex);
        this.hubSprite.anchor.set(0.5);
        this.hubSprite.width = 360;
        this.hubSprite.height = 360;
        this.pixi.bgLayer.addChildAt(this.hubSprite, 2);
      }
    }

    const pad = 120;
    const w = viewW + pad * 2;
    const h = viewH + pad * 2;
    const left = camera.x - w * 0.5;
    const top = camera.y - h * 0.5;

    this.bgTile.position.set(left, top);
    this.bgTile.width = w;
    this.bgTile.height = h;
    this.bgTile.tilePosition.set(-left, -top);
  }

  syncDecals(decalManager, camera, viewW, viewH) {
    this.decalPool.beginFrame();
    if (decalManager) {
      const cs = decalManager.chunkSize;
      const halfW = viewW * 0.5 + 64;
      const halfH = viewH * 0.5 + 64;
      const minCx = Math.floor((camera.x - halfW) / cs);
      const maxCx = Math.floor((camera.x + halfW) / cs);
      const minCy = Math.floor((camera.y - halfH) / cs);
      const maxCy = Math.floor((camera.y + halfH) / cs);

      for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cy = minCy; cy <= maxCy; cy++) {
          const key = decalManager.getChunkKey(cx, cy);
          const chunk = decalManager.chunks.get(key);
          if (!chunk) continue;
          chunk.touch();

          const tex = this.pixi.getCanvasTexture(`decal_${key}`, chunk.canvas, chunk.needsTextureUpdate);
          chunk.needsTextureUpdate = false;
          if (!tex) continue;

          const s = this.decalPool.acquire(tex);
          s.position.set(chunk.worldX + cs * 0.5, chunk.worldY + cs * 0.5);
        }
      }
    }
    this.decalPool.endFrame();
  }

  syncStructures(worldManager, camera, viewW, viewH, nowSec, spriteManager = this.spriteManager) {
    this.shadowPool.beginFrame();
    this.entityPool.beginFrame();

    if (!worldManager) {
      this.shadowPool.endFrame();
      this.entityPool.endFrame();
      return;
    }

    const vl = camera.x - viewW * 0.5 - 140;
    const vr = camera.x + viewW * 0.5 + 140;
    const vt = camera.y - viewH * 0.5 - 140;
    const vb = camera.y + viewH * 0.5 + 140;

    const shadowTex = this.pixi.getTexture('shadow');
    const whiteTex = this.pixi.getTexture('white');
    const circleTex = this.pixi.getTexture('circle_outline');

    for (let i = 0; i < worldManager.obstacles.length; i++) {
      const wall = worldManager.obstacles[i];
      if (wall.x + wall.w < vl || wall.x > vr || wall.y + wall.h < vt || wall.y > vb) continue;

      const cx = wall.x + wall.w * 0.5;
      const cy = wall.y + wall.h * 0.5;
      const zBottom = wall.y + wall.h;

      const sh = this.shadowPool.acquire(whiteTex);
      sh.position.set(cx + 4, cy + 6);
      sh.width = wall.w; sh.height = wall.h;
      sh.tint = 0x000000; sh.alpha = 0.25;

      const border = this.entityPool.acquire(whiteTex);
      border.position.set(cx, cy);
      border.width = wall.w; border.height = wall.h;
      border.tint = 0x4a5568;
      border.zIndex = zBottom;

      const inner = this.entityPool.acquire(whiteTex);
      inner.position.set(cx, cy);
      inner.width = Math.max(2, wall.w - 6); inner.height = Math.max(2, wall.h - 6);
      inner.tint = 0x1e2530;
      inner.zIndex = zBottom + 0.01;
    }

    const hasChest = spriteManager && spriteManager.has('chest');
    for (let i = 0; i < worldManager.chests.length; i++) {
      const c = worldManager.chests[i];
      if (c.x < vl || c.x > vr || c.y < vt || c.y > vb) continue;

      const sh = this.shadowPool.acquire(shadowTex);
      sh.position.set(c.x, c.y + 8);
      sh.width = 34; sh.height = 13;

      if (hasChest) {
        const tex = this.atlas.getFrame(spriteManager, 'chest', c.opened ? 2 : 0, Math.floor(nowSec * 3.5 + i) % 4);
        const s = this.entityPool.acquire(tex);
        s.position.set(c.x, c.y - 4);
        s.width = 46; s.height = 46;
        s.zIndex = c.y;
      } else {
        const body = this.entityPool.acquire(whiteTex);
        body.position.set(c.x, c.y);
        body.width = c.opened ? 24 : 28; body.height = c.opened ? 16 : 20;
        body.tint = c.opened ? 0x2d3748 : 0xb7791f;
        body.zIndex = c.y;
      }
    }

    const lm = worldManager.landmark;
    if (lm) {
      if (lm.repaired && !this.landmarkAura.visible) {
        this.landmarkAura.clear();
        this.landmarkAura
          .circle(lm.x, lm.y, CONFIG.WORLD.terraformedRadius)
          .fill({ color: 0x48bb78, alpha: 0.12 })
          .stroke({ width: 2.5, color: 0x48bb78 });
        this.landmarkAura.visible = true;
      } else if (!lm.repaired) {
        this.landmarkAura.visible = false;
      }

      const sh = this.shadowPool.acquire(shadowTex);
      sh.position.set(lm.x, lm.y + 20);
      sh.width = lm.radius * 2.0; sh.height = lm.radius * 0.85;

      if (spriteManager && spriteManager.has('monument')) {
        const row = lm.repaired ? 2 : 0;
        const col = Math.floor(nowSec * (lm.repaired ? 5 : 2)) % 4;
        const s = this.entityPool.acquire(this.atlas.getFrame(spriteManager, 'monument', row, col));
        s.position.set(lm.x, lm.y - 14);
        s.width = 120; s.height = 120;
        s.zIndex = lm.y;
      } else {
        const base = this.entityPool.acquire(circleTex);
        base.position.set(lm.x, lm.y);
        base.width = lm.radius * 2; base.height = lm.radius * 2;
        base.tint = lm.repaired ? 0x1c4532 : 0x2d3748;
        base.zIndex = lm.y;
      }
    }

    const hasNest = spriteManager && spriteManager.has('nest');
    for (let i = 0; i < worldManager.nests.length; i++) {
      const n = worldManager.nests[i];
      if (!n.alive || n.x < vl || n.x > vr || n.y < vt || n.y > vb) continue;

      const sh = this.shadowPool.acquire(shadowTex);
      sh.position.set(n.x, n.y + 16);
      sh.width = n.radius * 2.1; sh.height = n.radius * 0.85;

      const ratio = Math.max(0, n.health / n.maxHealth);
      if (hasNest) {
        const row = ratio > 0.5 ? 0 : 1;
        const col = Math.floor(nowSec * 4 + i) % 4;
        const s = this.entityPool.acquire(this.atlas.getFrame(spriteManager, 'nest', row, col));
        s.position.set(n.x, n.y - 8);
        s.width = n.radius * 2.6; s.height = n.radius * 2.6;
        s.tint = n.hitFlashTimer > 0 ? 0xff9999 : 0xffffff;
        s.zIndex = n.y;
      } else {
        const body = this.entityPool.acquire(circleTex);
        body.position.set(n.x, n.y);
        body.width = n.radius * 2; body.height = n.radius * 2;
        body.tint = n.hitFlashTimer > 0 ? 0xffffff : 0x4a1525;
        body.zIndex = n.y;
      }

      const barY = n.y - n.radius * (hasNest ? 1.4 : 1.0) - 8;
      const barBg = this.entityPool.acquire(whiteTex);
      barBg.position.set(n.x, barY);
      barBg.width = 46; barBg.height = 5;
      barBg.tint = 0x000000; barBg.alpha = 0.65;
      barBg.zIndex = n.y + 0.03;

      const barFill = this.entityPool.acquire(whiteTex);
      barFill.position.set(n.x - 23 * (1 - ratio), barY);
      barFill.width = Math.max(0.1, 46 * ratio); barFill.height = 5;
      barFill.tint = 0xe53e3e;
      barFill.zIndex = n.y + 0.04;
    }

    if (worldManager.coreDrop && worldManager.coreDrop.alive) {
      const cd = worldManager.coreDrop;
      const sh = this.shadowPool.acquire(shadowTex);
      sh.position.set(cd.x, cd.y + 8);
      sh.width = 28; sh.height = 12;

      if (spriteManager && spriteManager.has('core')) {
        const tex = this.atlas.getFrame(spriteManager, 'core', 0, Math.floor(nowSec * 6) % 4);
        const s = this.entityPool.acquire(tex);
        s.position.set(cd.x, cd.y - 2);
        s.width = 38; s.height = 38;
        s.zIndex = cd.y;
      } else {
        const core = this.entityPool.acquire(whiteTex);
        core.position.set(cd.x, cd.y);
        core.width = cd.radius * 2; core.height = cd.radius * 2;
        core.tint = 0xd69e2e;
        core.rotation = nowSec * 1.4;
        core.zIndex = cd.y;
      }
    }

    this.shadowPool.endFrame();
    this.entityPool.endFrame();
  }
}