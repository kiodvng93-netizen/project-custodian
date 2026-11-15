// js/hubClear.js — Захищена зона Хаба: кров, гіби, сліди й купи тіл не малюються над ним (ES Module)

import { CONFIG } from './config.js';
import { state } from './state.js';

// Радіус чистої зони: більше з радіуса споруди й поточної (виросшої) ділянки Хаба, плюс запас
export function hubClearRadius() {
  const hubSite = state.worldManager.terraform.sites[0];
  return Math.max(CONFIG.HUB.radius, hubSite.radius) + CONFIG.HUB.clearMargin;
}

export function inHubClear(x, y, pad = 0) {
  const r = hubClearRadius() + pad;
  return x * x + y * y < r * r;
}
