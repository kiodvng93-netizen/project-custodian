// js/run.js — Кінець забігу (евакуація / знищення / відміна) і старт нового

import { state, requestRunRestart } from './state.js';
import { Telemetry } from './telemetry.js';
import { MetaProgression } from './config.js';

const INPUT_LOCK_MS = 900; // щоб затиснутий Space/E не пропустив екран підсумку

// outcome: 'victory' | 'death' | 'abort'
export function endRun(outcome, { banked = 0, lost = 0, bonus = 0 } = {}) {
  if (state.runEnd) return;
  const wm = state.worldManager;
  // Біомаса йде в сейв при будь-якому результаті (і смерть залишає слід у світі)
  state.hubLink.recompute();
  const biomassGained = Math.round(state.hubLink.biomass * 10) / 10;
  wm.terraform.addBiomass(biomassGained);
  state.runEnd = {
    outcome,
    banked,
    lost,
    bonus,
    timeSec: Telemetry.metrics.runDurationSeconds,
    kills: Telemetry.metrics.kills,
    level: state.player.level,
    wave: state.enemyManager.waveNumber,
    nestsCleansed: wm.initialNestCount - wm.nests.length,
    nestsTotal: wm.initialNestCount,
    biomassGained,
    biomassTotal: MetaProgression.world.biomass,
    terraform: wm.terraform.summary(),
    shownAt: performance.now(),
  };
  state.isDrafting = false;
  state.draftCards = [];
  state.pendingLevelUps = 0;
  state.isWorkshopOpen = false;
  state.isPaused = false;
  state.timeScale = 1.0;
  Telemetry.recordEvent('RUN', `Run ended: ${outcome.toUpperCase()}`);
}

export function canLeaveRunEnd() {
  return Boolean(state.runEnd) && performance.now() - state.runEnd.shownAt >= INPUT_LOCK_MS;
}

export function startNewRun() {
  if (!canLeaveRunEnd()) return;
  state.player.resetRunProgression();
  requestRunRestart();
}
