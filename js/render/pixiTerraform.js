// js/render/pixiTerraform.js — Трава відновлених ділянок у PixiJS (над тайлом пустки, під Хабом і декалями)

import { Container, Sprite } from 'pixi.js';
import { getReclaimedCanvas, reclaimedWorldSize } from './reclaimedGround.js';

export class PixiTerraformRenderer {
  constructor(pixi) {
    this.pixi = pixi;
    this.layer = new Container();
    // Індекс 1: одразу після TilingSprite пустки (pixiWorld додає його першим)
    pixi.bgLayer.addChildAt(this.layer, Math.min(1, pixi.bgLayer.children.length));
    this.entries = new Map(); // id ділянки → { sprite, key }
  }

  // Нова стадія → нова текстура, стара звільняється
  sync(terraform) {
    for (let i = 0; i < terraform.areas.length; i++) {
      const site = terraform.areas[i];
      const canvas = getReclaimedCanvas(site);
      let entry = this.entries.get(site.id);
      if (!canvas) {
        if (entry) entry.sprite.visible = false;
        continue;
      }
      const key = `terraform_${site.id}_${site.stage}`;
      if (!entry || entry.key !== key) {
        const tex = this.pixi.getCanvasTexture(key, canvas);
        tex.source.scaleMode = 'nearest';
        if (!entry) {
          entry = { sprite: new Sprite(tex), key };
          entry.sprite.anchor.set(0.5);
          this.layer.addChild(entry.sprite);
          this.entries.set(site.id, entry);
        } else {
          this.pixi.releaseCanvasTexture(entry.key);
          entry.sprite.texture = tex;
          entry.key = key;
        }
      }
      const size = reclaimedWorldSize(site, canvas, terraform.displayRadius(site));
      entry.sprite.visible = true;
      entry.sprite.position.set(site.x, site.y);
      entry.sprite.width = size;
      entry.sprite.height = size;
    }
  }
}
