// js/render/pixiCore.js — Ядро рендеру PixiJS v8: шари сцени, камера, пул і кеш текстур

import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js';

export class SpritePool {
  constructor(parentContainer) {
    this.parent = parentContainer;
    this.items = [];
    this.cursor = 0;
  }

  beginFrame() {
    this.cursor = 0;
  }

  acquire(texture) {
    let sprite = this.items[this.cursor];
    if (!sprite) {
      sprite = new Sprite(texture || Texture.WHITE);
      sprite.anchor.set(0.5);
      this.items.push(sprite);
      this.parent.addChild(sprite);
    } else if (texture && sprite.texture !== texture) {
      sprite.texture = texture;
    }

    sprite.visible = true;
    sprite.alpha = 1;
    sprite.tint = 0xffffff;
    sprite.rotation = 0;
    sprite.scale.set(1);
    sprite.anchor.set(0.5);
    sprite.blendMode = 'normal';
    sprite.zIndex = 0;
    this.cursor++;
    return sprite;
  }

  endFrame() {
    for (let i = this.cursor; i < this.items.length; i++) {
      this.items[i].visible = false;
    }
  }
}

export class PixiCore {
  constructor() {
    this.app = null;
    this.ready = false;

    this.worldRoot = null;
    this.bgLayer = null;
    this.decalLayer = null;
    this.corpseLayer = null;
    this.shadowLayer = null;
    this.entityLayer = null;
    this.fxLayer = null;

    this.textures = new Map();
    this.canvasTextures = new Map();
  }

  async init(containerEl) {
    if (this.ready) return;

    this.app = new Application();
    await this.app.init({
      resizeTo: window,
      backgroundColor: '#12151c',
      preference: 'webgl',
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoStart: false,
      sharedTicker: false,
    });

    this.app.canvas.className = 'pixi-layer';
    if (containerEl) containerEl.prepend(this.app.canvas);

    this.worldRoot = new Container();
    this.bgLayer = new Container();
    this.decalLayer = new Container();
    this.corpseLayer = new Container(); // тіла ворогів: над кров'ю, під тінями й живими
    this.shadowLayer = new Container();
    this.entityLayer = new Container();
    this.entityLayer.sortableChildren = true;
    this.fxLayer = new Container();

    this.worldRoot.addChild(
      this.bgLayer,
      this.decalLayer,
      this.corpseLayer,
      this.shadowLayer,
      this.entityLayer,
      this.fxLayer
    );
    this.app.stage.addChild(this.worldRoot);

    this.bakeCoreTextures();
    this.ready = true;
  }

  bakeTexture(key, drawFn) {
    const g = new Graphics();
    drawFn(g);
    const tex = this.app.renderer.generateTexture({ target: g, antialias: true, resolution: 2 });
    g.destroy();
    this.textures.set(key, tex);
    return tex;
  }

  bakeCoreTextures() {
    this.textures.set('white', Texture.WHITE);

    this.bakeTexture('circle', (g) => {
      g.circle(0, 0, 32).fill(0xffffff);
    });

    this.bakeTexture('circle_outline', (g) => {
      g.circle(0, 0, 30).fill(0xffffff).stroke({ width: 4, color: 0xe2e8f0 });
    });

    this.bakeTexture('ring', (g) => {
      g.circle(0, 0, 30).stroke({ width: 4, color: 0xffffff });
    });

    // М'яка двошарова тінь під ноги об'єктів
    this.bakeTexture('shadow', (g) => {
      g.ellipse(0, 0, 24, 10).fill({ color: 0x000000, alpha: 0.12 });
      g.ellipse(0, 0, 17, 7).fill({ color: 0x000000, alpha: 0.16 });
    });

    // М'яке сяйво (аури, підсвітка): концентричні кола з малою прозорістю ≈ радіальний градієнт
    this.bakeTexture('glow', (g) => {
      for (let i = 10; i >= 1; i--) g.circle(0, 0, 3.2 * i).fill({ color: 0xffffff, alpha: 0.1 });
    });

    this.bakeTexture('diamond', (g) => {
      g.poly([0, -24, 24, 0, 0, 24, -24, 0]).fill(0xffffff).stroke({ width: 3, color: 0x9ae6b4 });
    });

    this.bakeTexture('hex', (g) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        pts.push(Math.cos(a) * 28, Math.sin(a) * 28);
      }
      g.poly(pts).fill(0xffffff).stroke({ width: 3, color: 0xe2e8f0 });
    });

    this.bakeTexture('octagon', (g) => {
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        pts.push(Math.cos(a) * 28, Math.sin(a) * 28);
      }
      g.poly(pts).fill(0xffffff).stroke({ width: 3, color: 0xf687b3 });
    });

    this.bakeTexture('triangle', (g) => {
      g.poly([26, 0, -20, -20, -8, 0, -20, 20]).fill(0xffffff).stroke({ width: 3, color: 0xfbd38d });
    });
  }

  getTexture(key) {
    return this.textures.get(key) || Texture.WHITE;
  }

  getCanvasTexture(key, canvasEl, forceUpdate = false) {
    if (!canvasEl) return null;
    let tex = this.canvasTextures.get(key);
    if (!tex) {
      tex = Texture.from(canvasEl);
      this.canvasTextures.set(key, tex);
    } else if (forceUpdate && tex.source) {
      tex.source.update();
    }
    return tex;
  }

  releaseCanvasTexture(key) {
    const tex = this.canvasTextures.get(key);
    if (!tex) return;
    tex.destroy(true);
    this.canvasTextures.delete(key);
  }

  updateCamera(camera, viewW, viewH) {
    if (!this.ready || !camera) return;
    this.worldRoot.position.set(viewW * 0.5 + camera.shakeX, viewH * 0.5 + camera.shakeY);
    this.worldRoot.rotation = camera.shakeAngle || 0;
    this.worldRoot.pivot.set(camera.x, camera.y);
  }

  render() {
    if (!this.ready) return;
    this.app.render();
  }

  destroy() {
    for (const tex of this.textures.values()) {
      if (tex !== Texture.WHITE) tex.destroy(true);
    }
    this.textures.clear();

    for (const tex of this.canvasTextures.values()) {
      tex.destroy(true);
    }
    this.canvasTextures.clear();

    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
    this.ready = false;
  }
}