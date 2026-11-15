// js/hubLink.js — Зв'язок родючості з Хабом і біомаса забігу.
// Клітинки родючості вище порогу вважаються «з'єднаними», якщо до них можна дійти від Хаба або будь-якої
// відновленої землі (Хаб, Пурифаєр, дикі латки): заливка з 8 сусідами й невеликим допуском розриву.
// Раз на ~2 с перераховуємо зв'язність і додаємо приріст родючості в біомасу: зв'язаний — повна ставка,
// незв'язаний — знижена (м'яке правило). Лише в межах забігу; у сейв біомаса йде в endRun (run.js).

import { CONFIG } from './config.js';
import { state } from './state.js';

export class HubLink {
  constructor(fertility) {
    this.fert = fertility;
    const len = fertility.n * fertility.n;
    this.conn = new Uint8Array(len);        // 1 = клітинка зв'язана з Хабом
    this.parent = new Int32Array(len).fill(-1); // батько в дереві заливки (-1 = джерело)
    this.seedArea = new Int16Array(len).fill(-1); // для джерел: індекс ділянки в terraform.areas
    this.order = new Int32Array(len);       // порядок заливки (від Хаба назовні)
    this.rank = new Int32Array(len);        // позиція клітинки в order
    this.orderLen = 0;
    this.prevF = new Float32Array(len);     // родючість на момент минулого перерахунку
    this.fertile = new Int32Array(len);
    this.acc = 0;
    this.version = 0;                       // росте, коли змінилась зв'язана множина
    this.sig = 0;
    this.biomass = 0;                       // біомаса цього забігу
    this.gainLinked = 0;
    this.gainUnlinked = 0;
    this.linkedF = 0;                       // сума родючості зв'язаних клітинок
    this.totalF = 0;                        // сума родючості «живих» клітинок
    this.stats = { passes: 0, lastMs: 0, maxMs: 0, totalMs: 0 };
  }

  update(dt) {
    this.acc += dt;
    if (this.acc < CONFIG.HUBLINK.interval) return;
    this.acc = 0;
    this.recompute();
  }

  // Центр клітинки в світі (та сама система вузлів, що в Fertility.deposit/at)
  cellX(idx) { return ((idx % this.fert.n) + 0.5) * this.fert.cell - this.fert.R; }
  cellY(idx) { return (((idx / this.fert.n) | 0) + 0.5) * this.fert.cell - this.fert.R; }

  recompute() {
    const t0 = performance.now();
    const H = CONFIG.HUBLINK, fert = this.fert, f = fert.f, n = fert.n, len = f.length;
    const tf = state.worldManager.terraform;
    const conn = this.conn, parent = this.parent, seedArea = this.seedArea, order = this.order;
    const thr = H.fertThreshold, reach = H.gap + 1;
    conn.fill(0); parent.fill(-1); seedArea.fill(-1);

    // 1) «живі» клітинки
    let nf = 0;
    for (let i = 0; i < len; i++) if (f[i] >= thr) this.fertile[nf++] = i;

    // 2) джерела: живі клітинки, що торкаються (з допуском розриву) відновленої землі
    let head = 0, tail = 0;
    const pad = fert.cell * reach;
    for (let k = 0; k < nf; k++) {
      const i = this.fertile[k];
      const ai = tf.areaIndexAt(this.cellX(i), this.cellY(i), pad);
      if (ai < 0) continue;
      conn[i] = 1; seedArea[i] = ai; order[tail++] = i;
    }

    // 3) заливка з 8-сусідством і розривом до gap порожніх клітинок
    while (head < tail) {
      const cur = order[head++];
      const ci = cur % n, cj = (cur / n) | 0;
      for (let dj = -reach; dj <= reach; dj++) {
        const j = cj + dj;
        if (j < 0 || j >= n) continue;
        for (let di = -reach; di <= reach; di++) {
          const i = ci + di;
          if (i < 0 || i >= n || (di === 0 && dj === 0)) continue;
          const idx = j * n + i;
          if (conn[idx] || f[idx] < thr) continue;
          conn[idx] = 1; parent[idx] = cur; order[tail++] = idx;
        }
      }
    }
    this.orderLen = tail;

    // 3b) батько = найближча раніше залита сусідка (спершу кільце 1, потім далі): коротші, органічніші корені
    const rank = this.rank;
    for (let k = 0; k < tail; k++) rank[order[k]] = k;
    for (let k = 0; k < tail; k++) {
      const c = order[k];
      if (parent[c] < 0) continue;
      const ci = c % n, cj = (c / n) | 0;
      let best = -1;
      for (let r = 1; r <= reach && best < 0; r++) {
        let bd = 1e9;
        for (let dj = -r; dj <= r; dj++) {
          const j = cj + dj;
          if (j < 0 || j >= n) continue;
          for (let di = -r; di <= r; di++) {
            const i = ci + di;
            if (i < 0 || i >= n || Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
            const idx = j * n + i;
            if (!conn[idx] || rank[idx] >= k) continue;
            const d = di * di + dj * dj;
            if (d < bd) { bd = d; best = idx; }
          }
        }
      }
      if (best >= 0) parent[c] = best;
    }

    // 4) підпис зв'язаної множини + ділянок: геометрія коренів перебудовується лише при зміні
    let sig = (tail * 2654435761) | 0;
    for (let k = 0; k < tail; k++) sig = (Math.imul(sig, 31) + order[k]) | 0;
    sig = (Math.imul(sig, 31) + tf.areas.length) | 0;
    for (let a = 0; a < tf.areas.length; a++) sig = (Math.imul(sig, 31) + Math.round(tf.areas[a].radius)) | 0;
    if (sig !== this.sig) { this.sig = sig; this.version++; }

    // 5) біомаса: приріст родючості з минулого перерахунку × ставка за зв'язністю клітинки
    const prev = this.prevF, rate = H.disconnectedRate;
    let linkedF = 0, totalF = 0;
    for (let i = 0; i < len; i++) {
      const v = f[i], d = v - prev[i];
      if (d !== 0) {
        prev[i] = v;
        if (conn[i]) this.gainLinked += d; else this.gainUnlinked += d * rate;
      }
      if (v >= thr) { totalF += v; if (conn[i]) linkedF += v; }
    }
    this.linkedF = linkedF; this.totalF = totalF;
    this.biomass = this.gainLinked + this.gainUnlinked;

    const ms = performance.now() - t0;
    const s = this.stats;
    s.passes++; s.lastMs = ms; s.totalMs += ms; if (ms > s.maxMs) s.maxMs = ms;
  }
}
