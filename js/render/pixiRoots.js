// js/render/pixiRoots.js — Світні корені від Хаба вздовж зв'язаної родючості (кеш Graphics).
// Геометрія перебудовується лише коли змінилась зв'язана множина (hubLink.version); кадр = лише
// м'яке мерехтіння alpha контейнера. Малюється під Хабом/спорудами й під кров'ю, тихим контрастом.

import { Container, Graphics } from 'pixi.js';
import { CONFIG } from '../config.js';
import { hubClearRadius } from '../hubClear.js';

// Дешевий детермінований хеш 0..1 (стабільна форма коренів між перебудовами)
function h01(a, b) {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const WIDTH_BUCKETS = 3;

export class PixiRootsRenderer {
  constructor(pixi) {
    this.layer = new Container();
    // Індекс 2: після тайла пустки й трави ділянок, але перед Хабом і аурою — арт Хаба лягає зверху
    pixi.bgLayer.addChildAt(this.layer, Math.min(2, pixi.bgLayer.children.length));
    this.glow = new Graphics();
    this.core = new Graphics();
    this.layer.addChild(this.glow, this.core);
    this.version = -1;
    this.link = null;
    this.stats = { rebuilds: 0, lastMs: 0, segments: 0 };
  }

  sync(link, terraform, nowSec) {
    if (link !== this.link) { this.link = link; this.version = -1; }
    if (link.version !== this.version) {
      this.version = link.version;
      this.rebuild(link, terraform);
    }
    // Повільне «дихання» світіння — єдина робота кадру
    this.layer.alpha = 0.8 + 0.2 * Math.sin(nowSec * 1.3);
  }

  rebuild(link, terraform) {
    const t0 = performance.now();
    const { order, parent, seedArea } = link;
    const len = link.orderLen, cell = link.fert.cell;
    const hubR = hubClearRadius();
    const areas = terraform.areas;
    const maxCells = CONFIG.HUBLINK.maxVeinCells;

    // Вага гілки = кількість клітинок у піддереві (рахуємо від листків до кореня)
    const sub = new Uint16Array(link.conn.length);
    for (let k = len - 1; k >= 0; k--) {
      const c = order[k];
      sub[c] += 1;
      if (parent[c] >= 0) sub[parent[c]] += sub[c];
    }

    const paths = [];
    for (let b = 0; b < WIDTH_BUCKETS; b++) paths.push([]);
    const dots = [];
    let segs = 0;
    // Найближчі до Хаба клітинки лишаються (порядок заливки), далі — до ліміту
    for (let k = 0; k < len && segs < maxCells; k++) {
      const c = order[k];
      const jx = (h01(c, 1) - 0.5) * cell * 0.5, jy = (h01(c, 2) - 0.5) * cell * 0.5;
      const cx = link.cellX(c) + jx, cy = link.cellY(c) + jy;
      if (cx * cx + cy * cy < hubR * hubR) continue; // захищена зона Хаба
      let px, py;
      if (parent[c] >= 0) {
        const p = parent[c];
        px = link.cellX(p) + (h01(p, 1) - 0.5) * cell * 0.5;
        py = link.cellY(p) + (h01(p, 2) - 0.5) * cell * 0.5;
      } else {
        // Джерело: корінь тягнеться до краю арту відновленої ділянки (для Хаба — до чистої зони)
        const a = areas[seedArea[c]];
        const dx = cx - a.x, dy = cy - a.y, d = Math.hypot(dx, dy) || 1;
        const stop = a.id === 'hub' ? hubR : a.radius * 0.7;
        if (d <= stop) continue;
        px = a.x + (dx / d) * stop; py = a.y + (dy / d) * stop;
      }
      const mx = (px + cx) / 2, my = (py + cy) / 2;
      const sl = Math.hypot(cx - px, cy - py) || 1;
      const bend = (h01(c, 3) - 0.5) * sl * 0.6;
      const qx = mx - ((cy - py) / sl) * bend, qy = my + ((cx - px) / sl) * bend;
      const w = Math.min(WIDTH_BUCKETS - 1, Math.floor(Math.log2(sub[c] + 1) / 2.2));
      paths[w].push(px, py, qx, qy, cx, cy);
      // Бічна гілочка від середини сегмента (не в кожного): корінь виглядає живим, а не лінією
      if (h01(c, 4) < 0.65) {
        const side = h01(c, 5) < 0.5 ? -1 : 1, tl = sl * (0.3 + h01(c, 6) * 0.35);
        const nx = -(cy - py) / sl * side, ny = (cx - px) / sl * side;
        const ex = mx + nx * tl + (cx - px) / sl * tl * 0.5, ey = my + ny * tl + (cy - py) / sl * tl * 0.5;
        paths[0].push(mx, my, mx + nx * tl * 0.4, my + ny * tl * 0.4, ex, ey);
      }
      if (sub[c] === 1) dots.push(cx, cy); // кінчики гілок — маленькі «бруньки»
      segs++;
    }

    const glow = this.glow, core = this.core;
    glow.clear(); core.clear();
    for (let b = 0; b < WIDTH_BUCKETS; b++) {
      const arr = paths[b];
      if (arr.length === 0) continue;
      const w = 1.8 + b * 1.4;
      for (let i = 0; i < arr.length; i += 6) glow.moveTo(arr[i], arr[i + 1]).quadraticCurveTo(arr[i + 2], arr[i + 3], arr[i + 4], arr[i + 5]);
      glow.stroke({ width: w * 4.5, color: 0x48bb78, alpha: 0.12, cap: 'round', join: 'round' });
      for (let i = 0; i < arr.length; i += 6) core.moveTo(arr[i], arr[i + 1]).quadraticCurveTo(arr[i + 2], arr[i + 3], arr[i + 4], arr[i + 5]);
      core.stroke({ width: w, color: 0xa6f0c0, alpha: 0.4, cap: 'round', join: 'round' });
    }
    for (let i = 0; i < dots.length; i += 2) core.circle(dots[i], dots[i + 1], 2.4);
    if (dots.length) core.fill({ color: 0xc6f6d5, alpha: 0.3 });

    const s = this.stats;
    s.rebuilds++; s.lastMs = performance.now() - t0; s.segments = segs;
  }
}
