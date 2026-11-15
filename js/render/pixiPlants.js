// js/render/pixiPlants.js — Рендер кущів і дерев з тінями, Y-sorting і плодами (видимі плоди = готові до збору)

import { SpritePool } from './pixiCore.js';
import { buildPlantTextures } from './plantSprites.js';

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
// Слоти плодів відносно «ніг» рослини (px при повному рості)
const SLOTS = {
  bush: [[-9, -15], [8, -12]],
  tree: [[-12, -40], [10, -43], [1, -30]],
};

export class PixiPlantsRenderer {
  constructor(pixi) {
    this.pixi = pixi;
    this.tex = buildPlantTextures(pixi);
    this.shadowPool = new SpritePool(pixi.shadowLayer);
    this.entityPool = new SpritePool(pixi.entityLayer);
  }

  sync(plants, camera, viewW, viewH, nowSec) {
    this.shadowPool.beginFrame();
    this.entityPool.beginFrame();
    const vl = camera.x - viewW * 0.5 - 80, vr = camera.x + viewW * 0.5 + 80;
    const vt = camera.y - viewH * 0.5 - 100, vb = camera.y + viewH * 0.5 + 100;
    const shadowTex = this.pixi.getTexture('shadow'), circleTex = this.pixi.getTexture('circle');
    const whiteTex = this.pixi.getTexture('white');

    for (let i = 0; i < plants.length; i++) {
      const p = plants[i];
      if (p.x < vl || p.x > vr || p.y < vt || p.y > vb) continue;
      const size = this.tex.size[p.kind];
      const k = 0.3 + 0.7 * smooth(p.growth);          // саджанець → доросла
      const feetY = p.y + (p.isTree ? 6 : 8) * k;

      const sh = this.shadowPool.acquire(shadowTex);
      sh.position.set(p.x, feetY);
      sh.width = (p.isTree ? 46 : 54) * k; sh.height = (p.isTree ? 15 : 18) * k;
      sh.alpha = 0.95;

      const s = this.entityPool.acquire(this.tex[p.kind][p.variant]);
      s.anchor.set(0.5, size.feet / size.h);
      s.position.set(p.x, feetY);
      s.scale.set(k);
      s.zIndex = p.y;

      if (p.mature && p.fruit > 0) {
        const slots = SLOTS[p.kind];
        for (let f = 0; f < p.fruit; f++) {
          const [ox, oy] = slots[f];
          const bob = Math.sin(nowSec * 2.2 + p.fruitPhase + f) * 0.8;
          const fx = p.x + ox, fy = feetY + oy + bob;
          const rim = this.entityPool.acquire(circleTex);
          rim.position.set(fx, fy); rim.width = 10; rim.height = 10; rim.tint = 0x3a0d12; rim.zIndex = p.y + 0.01;
          const fr = this.entityPool.acquire(circleTex);
          fr.position.set(fx, fy); fr.width = 7; fr.height = 7; fr.tint = 0xff5a4a; fr.zIndex = p.y + 0.02;
          const hi = this.entityPool.acquire(whiteTex);
          hi.position.set(fx - 1.5, fy - 1.5); hi.width = 2; hi.height = 2; hi.alpha = 0.85; hi.zIndex = p.y + 0.03;
        }
      }
    }
    this.shadowPool.endFrame();
    this.entityPool.endFrame();
  }
}
