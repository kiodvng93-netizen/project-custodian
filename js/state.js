// js/state.js — Централизованное изолированное состояние забега

export const state = {
  // Системные флаги
  isPaused: false,
  isDrafting: false,
  isWorkshopOpen: false,
  timeScale: 1.0,
  pendingLevelUps: 0,
  hitStopTimer: 0,

  // Сущности и менеджеры
  player: null,
  camera: null,
  enemyManager: null,
  worldManager: null,
  weaponManager: null,
  pickupManager: null,
  decalManager: null,
  gibManager: null,
  spriteManager: null,

  // Динамические списки эффектов кадра
  shockwaves: [],
  damageTexts: [],
  draftCards: [],
};

// Хелперы мутации состояния эффектов
export function triggerHitStop(duration) {
  state.hitStopTimer = Math.max(state.hitStopTimer, duration);
}

export function spawnShockwave(x, y, options = {}) {
  if (window.Shockwave) {
    state.shockwaves.push(new window.Shockwave(x, y, options));
  }
}

export function addDamageText(x, y, text) {
  state.damageTexts.push({
    x: x + (Math.random() - 0.5) * 14,
    y: y,
    text: Math.round(text),
    life: 0.55
  });
  if (state.damageTexts.length > 60) {
    state.damageTexts.shift();
  }
}

// Временный переходный мост для совместимости со старыми вызовами
window.triggerHitStop = triggerHitStop;
window.spawnShockwave = spawnShockwave;
window.gameState = state;