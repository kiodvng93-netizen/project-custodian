// js/draft.js — Черга підвищень рівня і драфт карток
// Рівні нараховуються одразу, а вікна драфту відкриваються не частіше ніж раз на DRAFT.minInterval
// секунд ігрового часу. Інакше велика купа XP (вакуум гнізда) давала 8–10 вікон поспіль.

import { CONFIG } from './config.js';
import { state } from './state.js';
import { Telemetry } from './telemetry.js';
import { generateDraftCards } from './weapons/upgrades.js';

let cooldown = 0;

export function resetDraftQueue() {
  cooldown = 0;
  state.pendingLevelUps = 0;
  state.isDrafting = false;
  state.draftCards = [];
}

export function queueLevelUps(count) {
  if (count > 0 && !state.runEnd) state.pendingLevelUps += count;
}

// Викликається щокадру з ігровим dt (поза паузою, Воркшопом і екраном підсумку)
export function updateDraftQueue(dt) {
  if (state.isDrafting || state.runEnd) return;
  if (cooldown > 0) cooldown -= dt;
  if (state.pendingLevelUps <= 0 || cooldown > 0) return;
  openDraft();
}

function openDraft() {
  state.pendingLevelUps--;
  state.isDrafting = true;
  state.timeScale = CONFIG.DRAFT.bulletTimeScale;
  state.draftCards = generateDraftCards(state.weaponManager, 3);
  Telemetry.recordEvent('LEVEL', `Upgrade draft (Level ${state.player.level}, ${state.pendingLevelUps} queued)`);
}

export function selectCard(index) {
  if (!state.isDrafting || !state.draftCards[index]) return;
  const card = state.draftCards[index];
  card.apply();
  state.player.grow();
  state.isDrafting = false;
  state.draftCards = [];
  state.timeScale = 1.0;
  cooldown = CONFIG.DRAFT.minInterval;
  Telemetry.recordEvent('UPGRADE', `Equipped: ${card.title}`);
}
