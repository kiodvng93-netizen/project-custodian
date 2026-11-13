// js/state.js — Централізований ізольований стан забігу (Single Source of Truth)

export class Shockwave {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.radius = options.radius || 12;
    this.maxRadius = options.maxRadius || 95;
    this.speed = options.speed || 320;
    this.color = options.color || '#68d391';
    this.lineWidth = options.lineWidth || 4.5;
    this.alpha = 1.0;
    this.alive = true;
  }

  update(dt) {
    this.radius += this.speed * dt;
    this.alpha = Math.max(0, 1 - (this.radius / this.maxRadius));
    if (this.radius >= this.maxRadius || this.alpha <= 0) this.alive = false;
  }

  render(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.lineWidth = Math.max(1, this.lineWidth * this.alpha);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export const state = {
  isPaused: false,
  isDrafting: false,
  isWorkshopOpen: false,
  timeScale: 1.0,
  pendingLevelUps: 0,
  hitStopTimer: 0,

  player: null,
  camera: null,
  enemyManager: null,
  worldManager: null,
  weaponManager: null,
  pickupManager: null,
  decalManager: null,
  gibManager: null,
  spriteManager: null,

  shockwaves: [],
  damageTexts: [],
  draftCards: [],
};

let _onRunRestart = null;

export function setRunRestartHandler(handler) {
  _onRunRestart = handler;
}

export function requestRunRestart() {
  if (_onRunRestart) _onRunRestart();
}

export function triggerHitStop(duration) {
  state.hitStopTimer = Math.max(state.hitStopTimer, duration);
}

export function spawnShockwave(x, y, options = {}) {
  state.shockwaves.push(new Shockwave(x, y, options));
}

export function addDamageText(x, y, text) {
  state.damageTexts.push({
    x: x + (Math.random() - 0.5) * 14,
    y,
    text: Math.round(text),
    life: 0.55
  });
  if (state.damageTexts.length > 60) {
    state.damageTexts.shift();
  }
}