// js/world/terraformPatches.js — Дикі латки відновленої землі: де їх ставити і скільки має бути.
// Латка з'являється там, де очищено гніздо (кожні PATCHES.nestsPerPatch гнізд), і лишається назавжди.

import { CONFIG, MetaProgression } from '../config.js';

// Скільки латок заслужено за всі очищені гнізда
export function earnedPatchCount() {
  const p = CONFIG.TERRAFORM.PATCHES;
  return Math.min(p.maxPatches, Math.floor(MetaProgression.world.nestsCleansed / p.nestsPerPatch));
}

// Точка годиться: в межах Кільця, далеко від Хаба, Пурифаєра, лігва й інших латок
function isValidSpot(x, y, r, patches) {
  const p = CONFIG.TERRAFORM.PATCHES;
  const lm = CONFIG.WORLD.landmarkPos, wp = CONFIG.WORLD.wardenPos;
  if (Math.hypot(x, y) + r > CONFIG.WORLD.ring1Radius * 0.94) return false;
  if (Math.hypot(x, y) < p.minDistHub) return false;
  if (Math.hypot(x - lm.x, y - lm.y) < p.minDistPurifier) return false;
  if (Math.hypot(x - wp.x, y - wp.y) < p.minDistWarden) return false;
  for (let i = 0; i < patches.length; i++) {
    if (Math.hypot(x - patches[i].x, y - patches[i].y) < p.minDistPatch) return false;
  }
  return true;
}

function patchRadius(rnd) {
  const p = CONFIG.TERRAFORM.PATCHES;
  return Math.round(p.radiusMin + rnd() * (p.radiusMax - p.radiusMin));
}

// Латка біля (x, y): спершу саме там, потім кільцями все далі; null — місця немає
export function placePatchNear(x, y, patches, rnd) {
  const r = patchRadius(rnd);
  if (isValidSpot(x, y, r, patches)) return { x, y, r, seed: Math.floor(rnd() * 1e6) + 1 };
  for (let ring = 1; ring <= 6; ring++) {
    for (let k = 0; k < 10; k++) {
      const a = rnd() * Math.PI * 2, d = ring * 350;
      const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
      if (isValidSpot(px, py, r, patches)) return { x: px, y: py, r, seed: Math.floor(rnd() * 1e6) + 1 };
    }
  }
  return null;
}

// Випадкова точка по Кільцю (для латок, заслужених до появи цієї системи)
export function placePatchAnywhere(patches, rnd) {
  const ring = CONFIG.WORLD.ring1Radius;
  for (let k = 0; k < 200; k++) {
    const a = rnd() * Math.PI * 2;
    const d = CONFIG.TERRAFORM.PATCHES.minDistHub + rnd() * (ring * 0.85 - CONFIG.TERRAFORM.PATCHES.minDistHub);
    const spot = placePatchNear(Math.cos(a) * d, Math.sin(a) * d, patches, rnd);
    if (spot) return spot;
  }
  return null;
}
