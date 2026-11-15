// js/plants.js — Рослини, що лікують: кущі (прохідні) та дрібні дерева (тверді) на родючій землі.
// З'являються там, де клітинки сітки родючості (fertility.js) пройшли пороги CONFIG.FERTILITY.bush/tree,
// повільно ростуть і відновлюють плоди; плід лікує робота (pickups.js → Pickup.collect).
// Лише в межах забігу (скидається в startNewRun). Малюнок — render/pixiPlants.js.

import { CONFIG } from './config.js';
import { state } from './state.js';
import { inHubClear } from './hubClear.js';

const SOLID_CELL = 128;   // сітка пошуку для колізій і відстаней
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const cellKey = (cx, cy) => (cx + 4000) * 10000 + (cy + 4000);

export class Plant {
  constructor(kind, x, y, variant) {
    this.kind = kind;
    this.x = x; this.y = y;
    this.variant = variant;
    this.age = 0;
    this.growth = 0;      // 0..1
    this.fruit = 0;
    this.fruitT = 0;
    this.cd = 0;          // затримка між плодами
    this.fruitPhase = Math.random() * 6.28;
  }
  get isTree() { return this.kind === 'tree'; }
  get mature() { return this.growth >= 1; }
  // Поточний радіус твердого стовбура (дерево тверде, коли трохи виросло)
  get solidRadius() {
    return this.isTree && this.growth >= 0.3 ? CONFIG.PLANTS.treeRadius * (0.5 + 0.5 * smooth(this.growth)) : 0;
  }
}

export class PlantManager {
  constructor() {
    this.plants = [];
    this.grid = new Map();       // усі рослини: клітинка SOLID_CELL → масив
    this.cellCount = new Map();  // `${idx}:${kind}` → кількість у клітинці родючості
    this.areaCount = new Map();
    this.trees = 0; this.bushes = 0;
    this.ripe = 0;               // дозрілих плодів на карті
    this.scanAcc = 0;
    this.scanCursor = 0;
    this.stats = { eaten: 0, healed: 0, spawned: 0 };
  }

  // ---- Спавн ----
  update(dt, player) {
    const P = CONFIG.PLANTS;
    this.scanAcc += dt;
    if (this.scanAcc >= P.scanInterval) { this.scanAcc = 0; this.scan(player); }
    let ripe = 0;
    for (let i = 0; i < this.plants.length; i++) {
      const p = this.plants[i];
      if (p.growth < 1) {
        p.age += dt; p.growth = Math.min(1, p.age / P.growSeconds[p.kind]);
        if (p.growth >= 1) p.fruitT = P.regrowSeconds[p.kind] * 0.5; // перший плід швидше за наступні
      }
      else if (p.fruit < P.maxFruit[p.kind] && this.ripe < P.totalFruitCap) {
        p.fruitT += dt;
        if (p.fruitT >= P.regrowSeconds[p.kind]) { p.fruitT = 0; p.fruit++; }
      }
      if (p.cd > 0) p.cd -= dt;
      ripe += p.fruit;
    }
    this.ripe = ripe;
    this.tryEat(player);
  }

  // Прохід по частині сітки родючості (бюджетно) і спроба посадити рослину
  scan(player) {
    const P = CONFIG.PLANTS, F = CONFIG.FERTILITY, fert = state.fertility;
    const len = fert.f.length;
    let spawned = 0;
    for (let k = 0; k < P.cellsPerScan; k++) {
      const idx = this.scanCursor;
      this.scanCursor = (this.scanCursor + 1) % len;
      const f = fert.f[idx];
      if (f < F.bush.fert || fert.g[idx] < F.bush.at) continue;
      if (Math.random() > P.spawnChance) continue;
      const wantTree = f >= F.tree.fert && fert.g[idx] >= F.tree.at && this.trees < P.maxTrees && Math.random() < 0.5;
      const kind = wantTree ? 'tree' : 'bush';
      if (this.plantInCell(idx, kind, fert, player)) { if (++spawned >= P.spawnPerScan) break; }
    }
  }

  plantInCell(idx, kind, fert, player) {
    const P = CONFIG.PLANTS;
    if (kind === 'bush' ? this.bushes >= P.maxBushes : this.trees >= P.maxTrees) return false;
    const ck = `${idx}:${kind}`;
    if ((this.cellCount.get(ck) || 0) >= P.perCell[kind]) return false;
    const n = fert.n, c = fert.cell;
    const cx = (idx % n) * c - fert.R, cy = ((idx / n) | 0) * c - fert.R;
    for (let t = 0; t < 4; t++) {
      const x = cx + (Math.random() - 0.5) * c, y = cy + (Math.random() - 0.5) * c;
      if (!this.canPlant(kind, x, y, player)) continue;
      const ak = this.areaKey(x, y, kind);
      if ((this.areaCount.get(ak) || 0) >= P.perArea[kind]) return false;
      this.add(kind, x, y);
      this.cellCount.set(ck, (this.cellCount.get(ck) || 0) + 1);
      this.areaCount.set(ak, (this.areaCount.get(ak) || 0) + 1);
      return true;
    }
    return false;
  }

  areaKey(x, y, kind) {
    const a = CONFIG.PLANTS.areaSize;
    return `${Math.floor(x / a)},${Math.floor(y / a)}:${kind}`;
  }

  // Місце вільне: світ, Хаб, споруди, стіни, робот, інші рослини, достатня родючість
  canPlant(kind, x, y, player) {
    const P = CONFIG.PLANTS, W = CONFIG.WORLD, F = CONFIG.FERTILITY, wm = state.worldManager;
    if (Math.hypot(x, y) > W.ring1Radius - 200) return false;
    if (inHubClear(x, y, 90)) return false;
    if (state.fertility.at(x, y) < F[kind].fert * 0.7) return false;
    if (Math.hypot(x - player.x, y - player.y) < P.minPlayerDist) return false;
    const lm = wm.landmark, wp = W.wardenPos;
    if (Math.hypot(x - lm.x, y - lm.y) < lm.radius + 190) return false;
    if (Math.hypot(x - wp.x, y - wp.y) < 260) return false;
    for (let i = 0; i < wm.nests.length; i++) if (Math.hypot(x - wm.nests[i].x, y - wm.nests[i].y) < wm.nests[i].radius + 120) return false;
    for (let i = 0; i < wm.chests.length; i++) if (Math.hypot(x - wm.chests[i].x, y - wm.chests[i].y) < 80) return false;
    for (let i = 0; i < wm.outposts.length; i++) if (Math.hypot(x - wm.outposts[i].x, y - wm.outposts[i].y) < wm.outposts[i].captureRadius + 70) return false;
    if (!wm.isCircleClearOfWalls(x, y, 55)) return false;
    const sp = P.spacing[kind], g = this.grid;
    const i0 = Math.floor(x / SOLID_CELL), j0 = Math.floor(y / SOLID_CELL);
    for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) {
      const b = g.get(cellKey(i, j));
      if (!b) continue;
      for (let q = 0; q < b.length; q++) if (Math.hypot(x - b[q].x, y - b[q].y) < sp) return false;
    }
    return true;
  }

  add(kind, x, y) {
    const p = new Plant(kind, x, y, (Math.random() * 3) | 0);
    this.plants.push(p);
    const key = cellKey(Math.floor(x / SOLID_CELL), Math.floor(y / SOLID_CELL));
    let b = this.grid.get(key);
    if (!b) { b = []; this.grid.set(key, b); }
    b.push(p);
    if (kind === 'tree') this.trees++; else this.bushes++;
    this.stats.spawned++;
    return p;
  }

  // ---- Колізії: тверді стовбури виштовхують коло (робот, вороги); снаряди ігнорують ----
  // target — куди йде коло: невеликий боковий поштовх, щоб не застрягати на лобовому підході
  resolve(circle, dt = 0, target = null) {
    if (this.trees === 0) return false;
    const r = circle.radius || 15;
    const i0 = Math.floor((circle.x - r - 14) / SOLID_CELL), i1 = Math.floor((circle.x + r + 14) / SOLID_CELL);
    const j0 = Math.floor((circle.y - r - 14) / SOLID_CELL), j1 = Math.floor((circle.y + r + 14) / SOLID_CELL);
    let hit = false;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const b = this.grid.get(cellKey(i, j));
      if (!b) continue;
      for (let q = 0; q < b.length; q++) {
        const p = b[q], sr = p.solidRadius;
        if (sr === 0) continue;
        const dx = circle.x - p.x, dy = circle.y - p.y, min = r + sr, d2 = dx * dx + dy * dy;
        if (d2 >= min * min) continue;
        const d = Math.sqrt(d2) || 0.001;
        const nx = dx / d, ny = dy / d;
        circle.x = p.x + nx * min; circle.y = p.y + ny * min;
        hit = true;
        if (dt > 0 && target) {
          const side = (nx * (target.y - circle.y) - ny * (target.x - circle.x)) >= 0 ? 1 : -1;
          const s = (circle.speed || 100) * 0.5 * dt;
          circle.x += -ny * side * s; circle.y += nx * side * s;
        }
      }
    }
    return hit;
  }

  // ---- Плоди ----
  healAmount(player) { return Math.max(1, Math.round(player.maxHealth * CONFIG.PLANTS.healFrac)); }

  // Робот поруч зі стиглою рослиною й бракує здоров'я — плід летить до нього (магніт, як у інших підбірок)
  tryEat(player) {
    if (player.health <= 0 || state.pickupManager.hasFruit()) return;
    const P = CONFIG.PLANTS, heal = this.healAmount(player);
    if (player.maxHealth - player.health < heal * P.minMissingFrac) return;
    for (let i = 0; i < this.plants.length; i++) {
      const p = this.plants[i];
      if (p.fruit <= 0 || p.cd > 0 || !p.mature) continue;
      const reach = (p.isTree ? P.treeRadius : P.bushRadius) + player.radius + P.magnetRadius;
      if (Math.hypot(p.x - player.x, p.y - player.y) > reach) continue;
      p.fruit--; p.cd = P.pickCooldown;
      state.pickupManager.spawnFruit(p.x, p.y - (p.isTree ? 30 : 12), heal);
      return; // один плід за кадр
    }
  }

  onEaten(heal) { this.stats.eaten++; this.stats.healed += heal; }
}
