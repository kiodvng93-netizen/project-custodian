// js/world/generation.js — Випадкове наповнення Кільця 1 на один забіг.
// Постійне (однакове щозабігу): Хаб (0,0), Пурифаєр, лігво Вардена, відновлені ділянки (terraform.js).
// Випадкове (нове щозабігу): гнізда, руїни, скрині, аутпости. Відновлену землю воно оминає.

import { CONFIG } from '../config.js';
import { ObstacleWall, LootChest, CorruptedNest } from './structures.js';
import { InsuranceOutpost } from './outpost.js';

export function generateRunLayout(wm) {
  spawnInitialNests(wm);
  const ruinCenters = spawnRuins(wm);
  wm.buildObstacleGrid();
  spawnChests(wm, ruinCenters);
  spawnOutposts(wm);
}

// Точка вільна від постійних об'єктів, відновленої землі та гнізд
export function isClearOfPOIs(wm, x, y, nestPad = 240) {
  const lm = CONFIG.WORLD.landmarkPos;
  const wp = CONFIG.WORLD.wardenPos;
  if (x * x + y * y < 750 * 750) return false;
  if (Math.hypot(x - lm.x, y - lm.y) < 420) return false;
  if (Math.hypot(x - wp.x, y - wp.y) < 450) return false;
  if (wm.terraform.isReclaimed(x, y, 120)) return false;
  for (let i = 0; i < wm.nests.length; i++) {
    if (Math.hypot(x - wm.nests[i].x, y - wm.nests[i].y) < nestPad) return false;
  }
  return true;
}

function spawnInitialNests(wm) {
  const count = CONFIG.WORLD.nestCountRing1;
  const maxDist = CONFIG.WORLD.ring1Radius * 0.9;
  const minDist = 1500;
  const pool = [];
  const poolSize = count * 2;

  for (let i = 0; i < poolSize * 4 && pool.length < poolSize; i++) {
    const band = (i % 3) / 3;
    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + (band + Math.random() * 0.34) * (maxDist - minDist);
    const nx = Math.cos(angle) * dist, ny = Math.sin(angle) * dist;
    if (!isClearOfPOIs(wm, nx, ny, 0)) continue;
    if (pool.some(p => Math.hypot(nx - p.x, ny - p.y) < 1800)) continue;
    pool.push({ x: nx, y: ny });
  }

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }

  const activeCount = Math.min(count, pool.length);
  for (let i = 0; i < activeCount; i++) {
    const pt = pool[i];
    wm.nests.push(new CorruptedNest(pt.x, pt.y));
    if (i % 2 === 0) wm.obstacles.push(new ObstacleWall(pt.x - 70, pt.y - 115, 140, 24));
  }
}

function spawnRuins(wm) {
  const clusterCount = CONFIG.WORLD.ruinsClusterCount;
  const maxDist = CONFIG.WORLD.ring1Radius * 0.92;
  const centers = [];

  for (let c = 0; c < clusterCount; c++) {
    const angle = (c * Math.PI * 2) / clusterCount + (Math.random() - 0.5) * 0.4;
    const dist = 900 + Math.random() * (maxDist - 900);
    const cx = Math.cos(angle) * dist, cy = Math.sin(angle) * dist;
    if (!isClearOfPOIs(wm, cx, cy, 220)) continue;

    const w1 = 90 + Math.random() * 80, h1 = 26 + Math.random() * 10;
    wm.obstacles.push(new ObstacleWall(cx - w1 / 2, cy - h1 / 2, w1, h1));
    const w2 = 26 + Math.random() * 10, h2 = 80 + Math.random() * 70;
    wm.obstacles.push(new ObstacleWall(cx + (Math.random() > 0.5 ? 50 : -50), cy - h2 / 2, w2, h2));
    centers.push({ x: cx, y: cy });
  }

  // Стіни Пурифаєра — постійні
  const lm = wm.landmark;
  wm.obstacles.push(new ObstacleWall(lm.x - 140, lm.y - 120, 280, 28));
  wm.obstacles.push(new ObstacleWall(lm.x - 140, lm.y + 92, 280, 28));
  wm.obstacles.push(new ObstacleWall(lm.x - 140, lm.y - 92, 28, 184));
  return centers;
}

function spawnChests(wm, ruinCenters) {
  const chestChance = CONFIG.WORLD.chestSpawnChance;
  const lm = wm.landmark;
  if (wm.isCircleClearOfWalls(lm.x + 80, lm.y, 24)) wm.chests.push(new LootChest(lm.x + 80, lm.y));

  for (let i = 0; i < ruinCenters.length; i++) {
    if (Math.random() >= chestChance) continue;
    const center = ruinCenters[i];
    for (let attempt = 0; attempt < 10; attempt++) {
      const a = Math.random() * Math.PI * 2, r = 75 + Math.random() * 55;
      const tx = center.x + Math.cos(a) * r, ty = center.y + Math.sin(a) * r;
      if (wm.isCircleClearOfWalls(tx, ty, 28) && isClearOfPOIs(wm, tx, ty, 90)) {
        wm.chests.push(new LootChest(tx, ty));
        break;
      }
    }
  }
}

function spawnOutposts(wm) {
  const count = CONFIG.WORLD.outpostCount;
  const baseAngle = Math.random() * Math.PI * 2;
  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 16; attempt++) {
      const angle = baseAngle + (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.45;
      const dist = 4200 + Math.random() * 4800;
      const ox = Math.cos(angle) * dist, oy = Math.sin(angle) * dist;
      if (wm.isCircleClearOfWalls(ox, oy, 75) && isClearOfPOIs(wm, ox, oy, 320)) {
        wm.outposts.push(new InsuranceOutpost(ox, oy));
        break;
      }
    }
  }
}
