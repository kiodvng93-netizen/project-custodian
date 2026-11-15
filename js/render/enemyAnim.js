// js/render/enemyAnim.js — Вибір кадру й процедурної пози ворога (без PixiJS, чиста логіка)
// Листи ворогів: ряд 0 — idle, 1 — ходьба, 2 — атака (кадри 0–3), 3 — 8 напрямків S, SW, W, NW, N, NE, E, SE.
// Ворог, що йде до камери (південна половина), грає анімовану ходьбу; що йде вбік/від камери —
// статичний кадр напрямку + процедурна хода (підскок, сплющення, перевалювання).

import { CONFIG } from '../config.js';

// walkRow — анімована ходьба «до камери»; sideRow — анімація вбік (у листі дивиться ліворуч)
const ANIM = {
  sprout:  { fps: 11, walkRow: 1, gait: 2.6, waddle: 0.07 },
  stalker: { fps: 9,  walkRow: 1, gait: 2.0, waddle: 0.05 },
  dasher:  { fps: 16, walkRow: 0, sideRow: 1, gait: 0, waddle: 0, hover: 0.55 },
  warden:  { fps: 7,  walkRow: 1, gait: 1.4, waddle: 0.035 },
};
// октант екрана (0 = E, 2 = S, 4 = W, 6 = N) → колонка ряду напрямків
const DIR_COL = [6, 7, 0, 1, 2, 3, 4, 5];

// Згладжений курс лише для рендеру: розштовхування в натовпі смикає facingAngle щокадру,
// і без згладжування кадри напрямку мерехтіли б
function smoothFacing(e, nowSec) {
  const dt = Math.min(0.1, Math.max(0, nowSec - (e.renderFacingT || nowSec)));
  e.renderFacingT = nowSec;
  if (e.renderFacing === undefined) { e.renderFacing = e.facingAngle; return e.renderFacing; }
  let d = e.facingAngle - e.renderFacing;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  e.renderFacing += d * Math.min(1, dt * (e.isCharging || e.animState === 'attack' ? 30 : 7));
  return e.renderFacing;
}

function octantOf(angle) {
  const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return Math.round(norm / (Math.PI / 4)) % 8;
}

// → { row, col, flip, bob, sx, sy, rot, hover } — bob/hover у частках радіуса (мінус = вгору)
export function enemyPose(e, nowSec) {
  const def = ANIM[e.typeKey] || ANIM.sprout;
  const t = nowSec + (e.animSeed || 0);
  const pose = { row: def.walkRow, col: 0, flip: 1, bob: 0, sx: 1, sy: 1, rot: 0, hover: def.hover || 0 };
  const facing = smoothFacing(e, nowSec);
  const faceRight = Math.cos(facing) > 0.2;

  if (def.hover) pose.bob = Math.sin(t * 7) * 0.1;

  // Сплячий Наглядач: idle + повільне «дихання»
  if (e.typeKey === 'warden' && !e.isAwakened && !e.isTitan) {
    pose.row = 0;
    pose.col = Math.floor(t * 4);
    pose.sy = 1 + Math.sin(t * 1.8) * 0.02;
    return pose;
  }

  // Атаки: замах (кадри 0–1) → удар (2–3)
  if (e.typeKey === 'stalker' && (e.animState === 'windup' || e.animState === 'attack')) {
    const sCfg = CONFIG.ENEMIES.types.stalker;
    pose.row = 2;
    pose.col = e.animState === 'windup' ? (e.windupTimer > sCfg.windupTime * 0.5 ? 0 : 1) : (e.attackTimer > sCfg.attackDuration * 0.5 ? 2 : 3);
    pose.flip = faceRight ? -1 : 1;
    if (e.animState === 'windup') { pose.sx = 1.06; pose.sy = 0.93; } // присідає перед стрибком
    else { pose.sx = 0.94; pose.sy = 1.07; }
    return pose;
  }
  if (e.typeKey === 'warden' && e.isTelegraphing) {
    pose.row = 2;
    pose.col = Math.floor(t * 10) % 2; // заряджає ядро
    pose.flip = faceRight ? -1 : 1;
    pose.sx = 1.04; pose.sy = 0.96;
    return pose;
  }

  const baseSpeed = (CONFIG.ENEMIES.types[e.typeKey] || CONFIG.ENEMIES.types.sprout).speed;
  const pace = Math.max(0.6, Math.min(1.8, (e.speed * (e.currentSlow || 1)) / baseSpeed)) * (e.isCharging ? 2.2 : 1);
  const oct = octantOf(facing);
  const frame = Math.floor(t * def.fps * pace);

  // Літун: вбік — анімований ряд збоку (дзеркало праворуч), до камери — тріпотіння idle
  if (def.sideRow !== undefined && oct !== 2 && oct !== 6) {
    pose.row = def.sideRow;
    pose.col = frame;
    pose.flip = (oct <= 1 || oct === 7) ? -1 : 1;
    pose.rot = Math.sin(facing) * 0.15 * -pose.flip;
    return pose;
  }

  // Хода: підскок + сплющення на кожен крок
  const step = Math.abs(Math.sin(t * def.gait * Math.PI * pace));
  if (def.gait) {
    pose.bob = -step * 0.06;
    pose.sy = 1 - (1 - step) * 0.05;
    pose.sx = 1 + (1 - step) * 0.04;
  }

  if (oct >= 1 && oct <= 3 && def.sideRow === undefined) {
    pose.row = def.walkRow;
    pose.col = frame;
    return pose;
  }
  if (oct === 2) { // літун до камери
    pose.row = def.walkRow;
    pose.col = frame;
    return pose;
  }
  // Вбік або від камери: кадр напрямку + перевалювання з боку на бік
  pose.row = 3;
  pose.col = DIR_COL[oct];
  pose.rot = Math.sin(t * def.gait * Math.PI * pace) * def.waddle;
  if (e.isCharging) pose.rot += Math.cos(facing) * 0.12; // нахил у ривок
  return pose;
}
