// js/weapons/targeting.js — Пошук найближчої цілі (вороги через SpatialGrid + гнізда)

import { state } from '../state.js';

export function findNearestTarget(x, y, range, fallbackList, exclude = null) {
  let closest = null;
  let closestDist = range;
  const grid = state.enemyManager && state.enemyManager.grid;

  const checkList = (list) => {
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      if (!t || !t.alive || (exclude && exclude.has(t))) continue;
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < closestDist) {
        closestDist = d;
        closest = t;
      }
    }
  };

  if (grid) {
    checkList(grid.getNearby(x, y, range + 35));
    if (state.worldManager && state.worldManager.nests) checkList(state.worldManager.nests);
  } else if (fallbackList) {
    checkList(fallbackList);
  }
  return closest;
}
