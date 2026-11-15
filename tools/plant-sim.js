// tools/plant-sim.js — Баланс-симуляція (без god mode): бот-ухилянт б'ється біля одного місця з реальним уроном.
// Запуск у консолі сторінки: const sim = await import('/tools/plant-sim.js'); await sim.compare({ runs: 4 });
// plants:false — не викликаємо state.plants.update (рослини не ростуть і не лікують).

import { state, requestRunRestart } from '/js/state.js';
import { Telemetry } from '/js/telemetry.js';
import { queueLevelUps, updateDraftQueue, selectCard } from '/js/draft.js';
import { updateRobotTracks } from '/js/goreTracks.js';
import { updateFlashes } from '/js/state.js';

const ANCHOR = { x: -2600, y: 1900 };
const DT = 1 / 30;
let W = { _targets: [] };

function steer(P, plantsOn) {
  const p = state.player, k = p.keys;
  let fx = 0, fy = 0, near = 0;
  const es = state.enemyManager.enemies;
  for (let i = 0; i < es.length; i++) {
    const e = es[i];
    if (!e.alive) continue;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
    if (d < 320 && d > 0.1) { const w = (320 - d) / 320; fx += (dx / d) * w * w; fy += (dy / d) * w * w; near++; }
  }
  let tx = 0, ty = 0;
  const ad = Math.hypot(ANCHOR.x - p.x, ANCHOR.y - p.y);
  if (ad > 650) { tx = (ANCHOR.x - p.x) / ad; ty = (ANCHOR.y - p.y) / ad; }
  // Іде до стиглої рослини, коли мало HP (лише в режимі з рослинами)
  let eating = false;
  if (plantsOn && p.health < p.maxHealth * 0.55) {
    let best = null, bd = 1100;
    for (const pl of state.plants.plants) {
      if (pl.fruit <= 0 || !pl.mature) continue;
      const d = Math.hypot(pl.x - p.x, pl.y - p.y);
      if (d < bd) { bd = d; best = pl; }
    }
    if (best) { eating = true; tx = (best.x - p.x) / bd; ty = (best.y - p.y) / bd; P.ateTrips++; }
  }
  let mx = fx * 2.2 + tx * (eating ? 1.6 : 0.8), my = fy * 2.2 + ty * (eating ? 1.6 : 0.8);
  if (near === 0 && ad <= 650) { mx += Math.cos(P.t * 0.4) * 0.6; my += Math.sin(P.t * 0.4) * 0.6; } // кружляє
  k.left = mx < -0.15; k.right = mx > 0.15; k.up = my < -0.15; k.down = my > 0.15;
}

function step(P, plantsOn) {
  const dt = DT, p = state.player, cam = state.camera;
  P.t += dt;
  steer(P, plantsOn);
  p.update(dt);
  state.worldManager.update(dt, p, state.enemyManager);
  state.enemyManager.update(dt, p, cam, 1280, 720, state.worldManager.nests.length);
  const t = W._targets; t.length = 0;
  for (const e of state.enemyManager.enemies) t.push(e);
  for (const n of state.worldManager.nests) t.push(n);
  state.weaponManager.update(dt, t);
  state.gibManager.update(dt, state.decalManager);
  state.corpseManager.update(dt, p);
  updateRobotTracks(state.decalManager, p, dt);
  state.decalManager.update(dt);
  state.fertility.update(dt);
  if (plantsOn) state.plants.update(dt, p);
  updateFlashes(dt);
  const ps = state.pickupManager.pickups;
  for (let i = ps.length - 1; i >= 0; i--) {
    const q = ps[i]; q.update(dt, p);
    if (!q.alive) { if (q.type === 'bio') queueLevelUps(p.addXP(q.value)); ps.splice(i, 1); }
  }
  updateDraftQueue(dt);
  if (state.isDrafting) selectCard(0);
  state.damageTexts.length = 0;
  Telemetry.update(dt);
}

function causeOfDeath() {
  const p = state.player; let best = null, bd = 1e9;
  for (const e of state.enemyManager.enemies) {
    const d = Math.hypot(e.x - p.x, e.y - p.y) - e.radius;
    if (d < bd) { bd = d; best = e; }
  }
  return best ? `${best.isElite ? 'elite ' : ''}${best.typeKey}` : 'unknown';
}

// Сад: імітує стан після кількох хвилин бою на місці — стиглі рослини навколо точки бою
function plantGarden(bushes, trees) {
  const want = [...Array(bushes).fill('bush'), ...Array(trees).fill('tree')];
  let tries = 0;
  while (want.length && tries++ < 400) {
    const a = Math.random() * 6.283, d = 300 + Math.random() * 450;
    const x = ANCHOR.x + Math.cos(a) * d, y = ANCHOR.y + Math.sin(a) * d;
    const pl = state.plants;
    if (pl.plants.some((q) => Math.hypot(q.x - x, q.y - y) < 130)) continue;
    const q = pl.add(want.pop(), x, y);
    q.age = 1e4; q.growth = 1; q.fruit = q.isTree ? 3 : 2;
  }
}

export async function runOnce({ plants, maxSeconds = 1500, garden = null }) {
  state.isPaused = true;
  if (state.runEnd) { state.player.resetRunProgression(); }
  requestRunRestart();
  state.isPaused = true;
  const p = state.player;
  p.x = ANCHOR.x; p.y = ANCHOR.y; state.camera.x = p.x; state.camera.y = p.y;
  if (plants && garden) plantGarden(garden.bushes, garden.trees);
  const P = { t: 0, ateTrips: 0 };
  const origDie = p.die.bind(p);
  let cause = null;
  p.die = (o) => { if (!cause) cause = causeOfDeath(); origDie(o); };
  const st0 = performance.now();
  let steps = 0;
  while (!state.runEnd && P.t < maxSeconds) {
    step(P, plants);
    if (++steps % 600 === 0) await new Promise((r) => setTimeout(r, 0)); // віддаємо потік
  }
  p.die = origDie;
  const pl = state.plants;
  return {
    plants, seconds: Math.round(P.t), died: state.runEnd && state.runEnd.outcome === 'death', cause,
    level: p.level, kills: Telemetry.metrics.kills,
    bushes: pl.bushes, trees: pl.trees, eaten: pl.stats.eaten, healed: pl.stats.healed,
    wallMs: Math.round(performance.now() - st0),
  };
}

export async function compare({ runs = 3, maxSeconds = 1500, garden = null } = {}) {
  const out = [];
  for (let i = 0; i < runs; i++) {
    for (const plants of [false, true]) out.push(await runOnce({ plants, maxSeconds, garden }));
  }
  return out;
}
