// js/fertility.js — Родючість забігу: груба сітка, куди смерті ворогів «вносять добриво».
// З часом клітинки вище порогів проходять стадії мох → трава → квіти, які малюються в groundCover.js.
// Лише в межах забігу (скидається в startNewRun, у сейв не йде). Геймплейного ефекту поки немає:
// state.fertility.at(x, y) відкрито для наступних слайсів (плоди, зв'язок із Хабом, реакція Вулика).

import { CONFIG } from './config.js';
import { state } from './state.js';
import { inHubClear } from './hubClear.js';

// Дешевий гладкий value-noise 0..1 (хеш у вузлах сітки + згладжена інтерполяція)
function hash2(ix, iy) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

export class Fertility {
  constructor(cover) {
    const F = CONFIG.FERTILITY;
    this.cover = cover;
    this.cell = F.cellSize;
    this.R = CONFIG.WORLD.ring1Radius;
    this.n = Math.ceil((this.R * 2) / this.cell) + 1;
    const len = this.n * this.n;
    this.f = new Float32Array(len);       // родючість клітинки
    this.g = new Float32Array(len);       // накопичений «час росту»
    this.last = new Float32Array(len);    // момент останнього обходу
    this.painted = [new Uint8Array(len), new Uint8Array(len), new Uint8Array(len)]; // мох, трава, квіти
    this.isActive = new Uint8Array(len);
    this.active = [];                     // індекси клітинок, що ростуть
    this.cursor = 0;
    this.t = 0;
    this.acc = 0;
    this.rnd = Math.random;
    this.stats = { marks: 0, visits: 0, paintMs: 0 };
  }

  // Вага смерті: за типом, ×еліта; Титан і Вартовий — важкі
  weightOf(enemy) {
    const F = CONFIG.FERTILITY;
    if (enemy.isTitan) return F.titanWeight;
    const w = F.deathWeight[enemy.typeKey] || 1;
    return enemy.isElite ? w * F.eliteMult : w;
  }

  // Білінійний розподіл ваги між чотирма найближчими клітинками — м'яка пляма без квадратів
  addDeath(enemy) {
    if (inHubClear(enemy.x, enemy.y)) return;
    this.deposit(enemy.x, enemy.y, this.weightOf(enemy));
  }

  deposit(x, y, w) {
    const F = CONFIG.FERTILITY, n = this.n;
    const u = (x + this.R) / this.cell - 0.5, v = (y + this.R) / this.cell - 0.5;
    const i0 = Math.floor(u), j0 = Math.floor(v), fx = u - i0, fy = v - j0;
    for (let k = 0; k < 4; k++) {
      const i = i0 + (k & 1), j = j0 + (k >> 1);
      if (i < 0 || j < 0 || i >= n || j >= n) continue;
      const wk = w * ((k & 1) ? fx : 1 - fx) * ((k >> 1) ? fy : 1 - fy);
      const idx = j * n + i;
      this.f[idx] = Math.min(F.maxPerCell, this.f[idx] + wk);
      if (!this.isActive[idx] && this.f[idx] >= F.moss.fert) {
        this.isActive[idx] = 1;
        this.last[idx] = this.t;
        this.active.push(idx);
      }
    }
  }

  // Родючість у точці (білінійно), для наступних слайсів
  at(x, y) {
    const n = this.n;
    const u = (x + this.R) / this.cell - 0.5, v = (y + this.R) / this.cell - 0.5;
    const i0 = Math.floor(u), j0 = Math.floor(v), fx = u - i0, fy = v - j0;
    let s = 0;
    for (let k = 0; k < 4; k++) {
      const i = i0 + (k & 1), j = j0 + (k >> 1);
      if (i < 0 || j < 0 || i >= n || j >= n) continue;
      s += this.f[j * n + i] * ((k & 1) ? fx : 1 - fx) * ((k >> 1) ? fy : 1 - fy);
    }
    return s;
  }

  update(dt) {
    this.t += dt;
    this.acc += dt;
    const F = CONFIG.FERTILITY;
    if (this.acc < F.tickInterval) return;
    this.acc = 0;
    const t0 = performance.now();
    let budget = Math.min(F.cellsPerTick, this.active.length);
    while (budget-- > 0 && this.active.length > 0) {
      if (this.cursor >= this.active.length) this.cursor = 0;
      const idx = this.active[this.cursor];
      if (this.visit(idx)) {
        // клітинка дозріла: прибираємо зі списку (swap-remove), курсор лишається
        this.isActive[idx] = 0;
        const lastIdx = this.active.pop();
        if (this.cursor < this.active.length) this.active[this.cursor] = lastIdx;
      } else this.cursor++;
    }
    this.stats.paintMs += performance.now() - t0;
  }

  // Росте одну клітинку; повертає true, коли всі шари домальовані до максимуму
  visit(idx) {
    const F = CONFIG.FERTILITY, n = this.n;
    this.stats.visits++;
    const f = this.f[idx];
    this.g[idx] += (this.t - this.last[idx]) * clamp(f / F.rateRef, 0.25, 2);
    this.last[idx] = this.t;
    const g = this.g[idx];
    const layers = [F.moss, F.grass, F.flower];
    let done = true;
    for (let L = 0; L < 3; L++) {
      const cfg = layers[L];
      const painted = this.painted[L];
      if (painted[idx] >= cfg.max) continue;
      done = false;
      if (f < cfg.fert) continue;
      const target = Math.ceil(cfg.max * smooth((g - cfg.at) / cfg.span));
      let burst = F.marksPerVisit;
      while (painted[idx] < target && burst-- > 0) {
        painted[idx]++;
        this.tryMark(L, idx % n, (idx / n) | 0, cfg);
      }
    }
    return done;
  }

  // Один мазок у випадковій точці клітинки; м'який край — поріг родючості зсунуто шумом
  tryMark(L, i, j, cfg) {
    const F = CONFIG.FERTILITY, c = this.cell, rnd = this.rnd;
    const x = (i + rnd()) * c - this.R - c * 0.5, y = (j + rnd()) * c - this.R - c * 0.5;
    const k = 1 / F.noiseScale;
    const nz = noise2(x * k, y * k);
    // шар трави/квітів додатково кучкується (ще нижча частота), квіти — лише в «грудках» трави
    const lump = noise2(x * k * 0.5 + 40, y * k * 0.5 + 40);
    if (L >= 1 && lump < (L === 2 ? 0.5 : 0.22)) return;
    if (this.at(x, y) < cfg.fert * (1 - F.edgeNoise * 0.5 + F.edgeNoise * nz)) return;
    if (inHubClear(x, y, 12)) return;
    if (state.worldManager.terraform.isReclaimed(x, y, 6)) return;
    this.stats.marks++;
    if (L === 0) this.cover.mossBlob(x, y, rnd);
    else if (L === 1) this.cover.grassTuft(x, y, rnd);
    else this.cover.flower(x, y, rnd);
  }
}
