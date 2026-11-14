// js/sprites.js — Реєстр спрайтів і текстур (підтримка часткових асетів + підготовка під PixiJS)

export const SPRITE_MANIFEST = {
  robot: {
    paths: ['assets/sprites/robot.png'],
    chromaKeyWhite: true,
    meta: { cols: 7, moveCols: 8, rows: 4, drawSize: 54 }
  },
  tile_wasteland: {
    paths: ['assets/tiles/tile_wasteland.png', 'assets/sprites/tile_wasteland.png'],
    chromaKeyWhite: false
  },
  tile_hub: {
    paths: ['assets/tiles/tile_hub.png', 'assets/sprites/tile_hub.png'],
    chromaKeyWhite: false
  },

  // Вороги та бос
  enemy_sprout:      { paths: ['assets/sprites/enemy_sprout.png'],      chromaKeyWhite: true, meta: { cols: 6, rows: 4 } },
  enemy_dasher:      { paths: ['assets/sprites/enemy_dasher.png'],      chromaKeyWhite: true, meta: { cols: 6, rows: 4 } },
  enemy_stalker:     { paths: ['assets/sprites/enemy_stalker.png'],     chromaKeyWhite: true, meta: { cols: 6, rows: 4 } },
  enemy_warden:      { paths: ['assets/sprites/boss_warden.png'],       chromaKeyWhite: true, meta: { cols: 6, rows: 4 } },

  // Світ та інтерактивні об'єкти
  chest:             { paths: ['assets/sprites/chest.png'],             chromaKeyWhite: true, meta: { cols: 4, rows: 3 } },
  monument:          { paths: ['assets/sprites/monument.png'],          chromaKeyWhite: true, meta: { cols: 4, rows: 3 } },
  nest:              { paths: ['assets/sprites/nest.png'],              chromaKeyWhite: true, meta: { cols: 4, rows: 3 } },
  core:              { paths: ['assets/sprites/core.png'],              chromaKeyWhite: true, meta: { cols: 4, rows: 1 } },

  // Зброя та снаряди
  saws:              { paths: ['assets/sprites/saws.png'],              chromaKeyWhite: true, meta: { cols: 8, rows: 2 } },
  mortar_shell:      { paths: ['assets/sprites/mortar_shell.png'],      chromaKeyWhite: true, meta: { cols: 4, rows: 1 } },
  incinerator_shell: { paths: ['assets/sprites/incinerator_shell.png'], chromaKeyWhite: true, meta: { cols: 4, rows: 1 } },
};

export class SpriteManager {
  constructor(manifest = SPRITE_MANIFEST) {
    this.manifest = manifest;
    this.images = {};
    this.processedCanvases = {};
    this.patterns = {};
    this.failedKeys = new Set();
    this.loadedCount = 0;
    this.totalCount = 0;
    this.isReady = false;

    this.loadAll();
  }

  loadAll() {
    const keys = Object.keys(this.manifest);
    this.totalCount = keys.length;
    if (this.totalCount === 0) {
      this.isReady = true;
      return;
    }

    for (const key of keys) {
      this.tryLoadPaths(key, this.manifest[key], 0);
    }
  }

  tryLoadPaths(key, entry, index) {
    const paths = entry.paths || [];
    if (index >= paths.length) {
      this.failedKeys.add(key);
      console.warn(`[SpriteManager] Missing asset: ${key}`);
      this.markAssetDone();
      return;
    }

    const img = new Image();
    img.src = paths[index];

    img.onload = () => {
      this.images[key] = img;
      this.processImage(key, img, entry);
      this.markAssetDone();
    };

    img.onerror = () => {
      this.tryLoadPaths(key, entry, index + 1);
    };
  }

  markAssetDone() {
    this.loadedCount++;
    if (this.loadedCount >= this.totalCount) {
      this.isReady = true;
    }
  }

  processImage(key, img, entry) {
    if (!img.width || !img.height) return;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = img.width;
    offCanvas.height = img.height;
    const ctx = offCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    if (!entry.chromaKeyWhite) {
      this.processedCanvases[key] = offCanvas;
      return;
    }

    try {
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a === 0) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);

        // Вирізаємо нейтральний білий/світло-сірий фон із м'яким згладжуванням країв
        if (max - min < 26) {
          if (min >= 235) {
            data[i + 3] = 0;
          } else if (min > 205) {
            data[i + 3] = Math.min(a, Math.round(((235 - min) / 30) * 255));
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
      this.processedCanvases[key] = offCanvas;
    } catch (e) {
      this.processedCanvases[key] = img;
    }
  }

  has(key) {
    const src = this.processedCanvases[key];
    return Boolean(src && src.width > 0 && src.height > 0);
  }

  getSource(key) {
    return this.has(key) ? this.processedCanvases[key] : null;
  }

  getMeta(key) {
    return (this.manifest[key] && this.manifest[key].meta) || null;
  }

  getPattern(ctx, key) {
    try {
      if (!this.patterns[key] && this.has(key)) {
        this.patterns[key] = ctx.createPattern(this.processedCanvases[key], 'repeat');
      }
      return this.patterns[key] || null;
    } catch (e) {
      return null;
    }
  }

  drawCentered(ctx, key, x, y, drawSize, angle = 0) {
    const src = this.getSource(key);
    if (!src) return false;

    ctx.save();
    ctx.translate(x, y);
    if (angle !== 0) ctx.rotate(angle);
    ctx.drawImage(src, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    ctx.restore();
    return true;
  }

  drawRobot(ctx, player, animTime) {
    const src = this.getSource('robot');
    if (!src) return false;

    const meta = this.getMeta('robot') || { cols: 7, moveCols: 8, rows: 4, drawSize: 54 };
    const rowH = src.height / meta.rows;
    const isMoving = Math.hypot(player.vx, player.vy) > 10;
    const drawSize = meta.drawSize * (player.growthScale || 1);

    if (isMoving) {
      const row = 3;
      const colW = src.width / meta.moveCols;
      const normAngle = ((player.facingAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const dirMap = [2, 1, 0, 7, 6, 5, 4, 3];
      const octant = Math.round(normAngle / (Math.PI / 4)) % 8;
      const col = dirMap[octant];
      const bobbing = Math.sin(animTime * 14) * 1.5;

      ctx.drawImage(
        src,
        col * colW, row * rowH, colW, rowH,
        -drawSize / 2, -drawSize / 2 - 6 + bobbing, drawSize, drawSize
      );
      return true;
    }

    const row = 0;
    const colW = src.width / meta.cols;
    const col = Math.floor(animTime * 3) % 4;

    ctx.drawImage(
      src,
      col * colW, row * rowH, colW, rowH,
      -drawSize / 2, -drawSize / 2 - 6, drawSize, drawSize
    );
    return true;
  }
}