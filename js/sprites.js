class SpriteManager {
  constructor() {
    this.images = {};
    this.processedCanvases = {};
    this.patterns = {};
    this.loadedCount = 0;
    this.totalCount = 0;
    this.isReady = false;

    this.manifest = {
      robot: ['assets/sprites/robot.png'],
      tile_wasteland: ['assets/tiles/tile_wasteland.png', 'assets/sprites/tile_wasteland.png'],
      tile_hub: ['assets/tiles/tile_hub.png', 'assets/sprites/tile_hub.png'],
    };

    this.loadAll();
  }

  loadAll() {
    const keys = Object.keys(this.manifest);
    this.totalCount = keys.length;

    for (const key of keys) {
      this.tryLoadPaths(key, this.manifest[key], 0);
    }
  }

  tryLoadPaths(key, paths, index) {
    if (index >= paths.length) {
      console.warn(`[SpriteManager] All paths failed for: ${key}`);
      this.loadedCount++;
      if (this.loadedCount >= this.totalCount) this.isReady = true;
      return;
    }

    const currentPath = paths[index];
    const img = new Image();
    img.src = currentPath;

    img.onload = () => {
      this.images[key] = img;
      this.processImage(key, img);
      this.loadedCount++;
      if (this.loadedCount >= this.totalCount) {
        this.isReady = true;
      }
    };

    img.onerror = () => {
      // Пробуем альтернативный путь (например, если лежит в assets/sprites/)
      this.tryLoadPaths(key, paths, index + 1);
    };
  }

  processImage(key, img) {
    if (!img.width || !img.height) return;

    if (key.startsWith('tile_')) {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.width;
      offCanvas.height = img.height;
      const ctx = offCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      this.processedCanvases[key] = offCanvas;
      return;
    }

    try {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.width;
      offCanvas.height = img.height;
      const ctx = offCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 240 && g > 240 && b > 240) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      this.processedCanvases[key] = offCanvas;
    } catch (e) {
      this.processedCanvases[key] = img;
    }
  }

  getPattern(ctx, key) {
    try {
      if (!this.patterns[key] && this.processedCanvases[key]) {
        const src = this.processedCanvases[key];
        if (src.width > 0 && src.height > 0) {
          this.patterns[key] = ctx.createPattern(src, 'repeat');
        }
      }
      return this.patterns[key] || null;
    } catch (e) {
      return null;
    }
  }

  drawRobot(ctx, player, animTime) {
    try {
      const src = this.processedCanvases['robot'];
      if (!src || !src.width || !src.height) return false;

      const imgW = src.width;
      const imgH = src.height;
      const rowH = imgH / 4;
      const isMoving = Math.hypot(player.vx, player.vy) > 10;

      let col = 0;
      let row = 0;

      if (isMoving) {
        row = 3;
        const colW = imgW / 8;
        const normAngle = (player.facingAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const dirMap = [2, 1, 0, 7, 6, 5, 4, 3];
        const octant = Math.round(normAngle / (Math.PI / 4)) % 8;
        col = dirMap[octant];

        const bobbing = Math.sin(animTime * 14) * 1.5;
        const drawSize = 54;

        ctx.drawImage(
          src,
          col * colW, row * rowH, colW, rowH,
          -drawSize / 2, -drawSize / 2 - 6 + bobbing, drawSize, drawSize
        );
        return true;
      } else {
        row = 0;
        const colW = imgW / 7;
        col = Math.floor(animTime * 3) % 4;
        const drawSize = 54;

        ctx.drawImage(
          src,
          col * colW, row * rowH, colW, rowH,
          -drawSize / 2, -drawSize / 2 - 6, drawSize, drawSize
        );
        return true;
      }
    } catch (e) {
      return false;
    }
  }
}

window.SpriteManager = SpriteManager;