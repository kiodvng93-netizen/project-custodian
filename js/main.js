// js/main.js — Легковесный цикл движка, обработка ввода и координатор систем

import { CONFIG, MetaProgression, saveMetaProgression } from './config.js';
import { state, triggerHitStop, spawnShockwave } from './state.js';
import { renderWorldGrid, renderSanctuaryHub } from './render/environment.js';
import { WorldManager } from './world/manager.js';
import { WeaponManager } from './weapons/manager.js';
import { ScrapSaw, BioSporeMortar, TeslaArc, AegisDrones, PlasmaPurifier } from './weapons/arsenal.js';
import {
  renderPlayerVitalsHUD,
  renderArsenalHUD,
  renderXPBar,
  renderDraftOverlay,
  renderWorkshopOverlay,
  renderPauseMenu,
  renderLandmarkTerminalHUD
} from './render/ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let lastTimestamp = 0;
const debugHUD = document.getElementById('debugHUD');

class Shockwave {
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
window.Shockwave = Shockwave;

const camCfg = CONFIG.CAMERA;
const camera = {
  x: 0, y: 0,
  lerpSpeed: camCfg.lerpSpeed,
  trauma: 0,
  maxOffsetX: camCfg.maxOffsetX, maxOffsetY: camCfg.maxOffsetY, maxAngle: camCfg.maxAngle,
  traumaDecay: camCfg.traumaDecay, traumaExponent: camCfg.traumaExponent,
  shakeX: 0, shakeY: 0, shakeAngle: 0,
  addTrauma(amount) { this.trauma = Math.min(1.0, this.trauma + amount); },
  update(dt, targetX, targetY) {
    this.x += (targetX - this.x) * (this.lerpSpeed * (dt * 60));
    this.y += (targetY - this.y) * (this.lerpSpeed * (dt * 60));
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.traumaDecay * dt);
      const shake = Math.pow(this.trauma, this.traumaExponent);
      this.shakeX = (Math.random() * 2 - 1) * this.maxOffsetX * shake;
      this.shakeY = (Math.random() * 2 - 1) * this.maxOffsetY * shake;
      this.shakeAngle = (Math.random() * 2 - 1) * this.maxAngle * shake;
    } else {
      this.shakeX = 0; this.shakeY = 0; this.shakeAngle = 0;
    }
  }
};

state.camera = camera;
window.camera = camera;
state.player = new window.Player(0, 0);
window.player = state.player;
state.spriteManager = new window.SpriteManager();
window.spriteManager = state.spriteManager;
state.decalManager = new window.DecalManager();
window.decalManager = state.decalManager;
state.gibManager = new window.GibManager();
window.gibManager = state.gibManager;
state.weaponManager = new WeaponManager(state.player);
state.pickupManager = new window.PickupManager();
window.pickupManager = state.pickupManager;
state.enemyManager = new window.EnemyManager();
window.enemyManager = state.enemyManager;
state.worldManager = new WorldManager();
window.worldManager = state.worldManager;

window.triggerFullRunRestart = () => {
  CONFIG.WEAPONS.blaster.damage = CONFIG.WEAPONS.blaster.baseDamage;
  CONFIG.WEAPONS.blaster.fireRate = CONFIG.WEAPONS.blaster.baseFireRate;
  CONFIG.WEAPONS.saw.bladeCount = 1;
  CONFIG.WEAPONS.saw.damage = CONFIG.WEAPONS.saw.baseDamage;
  CONFIG.WEAPONS.mortar.damage = CONFIG.WEAPONS.mortar.baseDamage;
  CONFIG.WEAPONS.mortar.cloudRadius = 65;
  CONFIG.WEAPONS.tesla.damage = CONFIG.WEAPONS.tesla.baseDamage;
  CONFIG.WEAPONS.drone.damage = CONFIG.WEAPONS.drone.baseDamage;
  CONFIG.WEAPONS.drone.droneCount = 2;
  CONFIG.WEAPONS.flamer.damage = CONFIG.WEAPONS.flamer.baseDamage;
  CONFIG.PLAYER.pickupRadius = 110;

  state.weaponManager.reset();
  if (state.decalManager) state.decalManager.clear();
  if (state.gibManager) state.gibManager.clear();

  state.enemyManager = new window.EnemyManager();
  state.pickupManager = new window.PickupManager();
  state.worldManager = new WorldManager();
  state.damageTexts = [];
  state.shockwaves = [];

  window.enemyManager = state.enemyManager;
  window.pickupManager = state.pickupManager;
  window.worldManager = state.worldManager;

  camera.x = 0; camera.y = 0; camera.trauma = 0;
  state.hitStopTimer = 0;
  state.pendingLevelUps = 0;
};

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const UPGRADE_POOL = [
  {
    id: 'blaster_tune', title: 'OVERCLOCK BLASTER', weaponName: 'Tech Blaster', desc: '+6 Damage, +20% Fire Rate',
    apply: () => {
      CONFIG.WEAPONS.blaster.damage += 6;
      CONFIG.WEAPONS.blaster.fireRate = Math.max(0.16, CONFIG.WEAPONS.blaster.fireRate * 0.8);
      const blaster = state.weaponManager.slots.find(w => w.name === 'Tech Blaster');
      if (blaster) blaster.cfg = CONFIG.WEAPONS.blaster;
    }
  },
  {
    id: 'scrap_saw_weapon', title: 'SCRAP SAW (WEAPON)', weaponName: 'Scrap Saw', desc: 'Mount orbital circular saw blade',
    apply: () => {
      if (!state.weaponManager.hasWeapon("Scrap Saw")) state.weaponManager.addWeapon(new ScrapSaw(state.player));
      else { CONFIG.WEAPONS.saw.bladeCount = Math.min(4, CONFIG.WEAPONS.saw.bladeCount + 1); CONFIG.WEAPONS.saw.damage += 6; }
    }
  },
  {
    id: 'bio_mortar_weapon', title: 'BIO-SPORE MORTAR', weaponName: 'Bio-Spore Mortar', desc: 'Lob spores creating lingering slowing AoE clouds',
    apply: () => {
      if (!state.weaponManager.hasWeapon("Bio-Spore Mortar")) state.weaponManager.addWeapon(new BioSporeMortar(state.player));
      else { CONFIG.WEAPONS.mortar.damage += 14; CONFIG.WEAPONS.mortar.cloudRadius = Math.min(120, CONFIG.WEAPONS.mortar.cloudRadius + 15); }
    }
  },
  {
    id: 'tesla_arc_weapon', title: 'TESLA ARC (WEAPON)', weaponName: 'Tesla Arc', desc: 'Unleash chained lightning bouncing between foes',
    apply: () => {
      if (!state.weaponManager.hasWeapon("Tesla Arc")) state.weaponManager.addWeapon(new TeslaArc(state.player));
      else { CONFIG.WEAPONS.tesla.damage += 8; CONFIG.WEAPONS.tesla.chainCount += 1; }
    }
  },
  {
    id: 'aegis_drones_weapon', title: 'AEGIS DRONES (WEAPON)', weaponName: 'Aegis Drones', desc: 'Deploy orbiting combat drones with laser interceptors',
    apply: () => {
      if (!state.weaponManager.hasWeapon("Aegis Drones")) state.weaponManager.addWeapon(new AegisDrones(state.player));
      else { CONFIG.WEAPONS.drone.droneCount = Math.min(4, CONFIG.WEAPONS.drone.droneCount + 1); CONFIG.WEAPONS.drone.damage += 5; }
    }
  },
  {
    id: 'plasma_purifier_weapon', title: 'PLASMA PURIFIER (WEAPON)', weaponName: 'Plasma Purifier', desc: 'Unleash continuous conical stream of incinerating plasma',
    apply: () => {
      if (!state.weaponManager.hasWeapon("Plasma Purifier")) state.weaponManager.addWeapon(new PlasmaPurifier(state.player));
      else { CONFIG.WEAPONS.flamer.damage += 18; CONFIG.WEAPONS.flamer.range = Math.min(260, CONFIG.WEAPONS.flamer.range + 25); }
    }
  },
  { id: 'nanite_regen', title: 'NANITE REPAIR', desc: '+1.2 HP/sec Passive Regeneration', apply: () => { state.player.healthRegenRate += 1.2; } },
  { id: 'magnet_pulse', title: 'MAGNET PULSE', desc: '+45% Pickup Range & Instant Vacuum', apply: () => { CONFIG.PLAYER.pickupRadius = Math.round(CONFIG.PLAYER.pickupRadius * 1.45); for (const p of state.pickupManager.pickups) p.isMagnetized = true; } },
  { id: 'shield_up', title: 'AEGIS BATTERY', desc: '+1 Max Shield Charge & Instant Recharge', apply: () => { state.player.maxShieldCharges++; state.player.shieldCharges = state.player.maxShieldCharges; } },
  { id: 'thrusters', title: 'OVERDRIVE SERVOS', desc: '+15% Move Speed', apply: () => { state.player.speed = Math.round(state.player.speed * 1.15); } },
  { id: 'titan_armor', title: 'TITAN CHASSIS', desc: '+40 Max HP & Full Repair', apply: () => { state.player.maxHealth += 40; state.player.heal(state.player.maxHealth); } }
];

const WORKSHOP_PERKS = [
  { key: 'chassisArmor', title: 'CHASSIS ARMOR', costBase: 3, costScale: 2, desc: '+15 Max Base HP permanently', buy: () => state.player.applyMetaUpgrades(false) },
  { key: 'engineSpeed', title: 'MOTOR TUNING', costBase: 4, costScale: 3, desc: '+8 Base Movement Speed permanently', buy: () => state.player.applyMetaUpgrades(false) },
  { key: 'shieldCapacitor', title: 'SHIELD CAPACITOR', costBase: 5, costScale: 4, desc: '-2.0s Shield Recharge Time permanently', buy: () => state.player.applyMetaUpgrades(false) },
  { key: 'naniteScavenge', title: 'NANITE HARVESTER', costBase: 6, costScale: 5, desc: '+1 Extra Tech Scrap from Nests', buy: () => {} }
];

function triggerLevelUp() {
  if (state.isDrafting) { state.pendingLevelUps++; return; }
  state.isDrafting = true;
  state.timeScale = 0.08;

  const availableEvolutions = [];
  if (CONFIG.EVOLUTIONS) {
    for (const [key, evo] of Object.entries(CONFIG.EVOLUTIONS)) {
      if (!state.weaponManager.hasWeapon(evo.resultWeapon) && evo.ingredients.every(name => state.weaponManager.hasWeapon(name))) {
        availableEvolutions.push({
          id: evo.id, title: `★ EVOLUTION: ${evo.name}`, desc: evo.desc, isEvolutionCard: true,
          apply: () => state.weaponManager.evolveWeapons(key)
        });
      }
    }
  }

  let candidates = [...UPGRADE_POOL];
  if (state.weaponManager.slots.length >= state.weaponManager.maxSlots) {
    candidates = candidates.filter(card => !card.weaponName || state.weaponManager.slots.some(w => w.name.toLowerCase().trim() === card.weaponName.toLowerCase().trim()));
  }
  const shuffled = [...candidates].sort(() => 0.5 - Math.random());
  state.draftCards = availableEvolutions.length > 0 ? [availableEvolutions[0], ...shuffled.slice(0, 2)] : shuffled.slice(0, 3);
  window.Telemetry.recordEvent('LEVEL', `Robot reached Level ${state.player.level}!`);
}

function selectCard(index) {
  if (!state.isDrafting || !state.draftCards[index]) return;
  state.draftCards[index].apply();
  state.player.grow();
  state.isDrafting = false;
  state.timeScale = 1.0;
  window.Telemetry.recordEvent('UPGRADE', `Equipped: ${state.draftCards[index].title}`);
  if (state.pendingLevelUps > 0) {
    state.pendingLevelUps--;
    setTimeout(triggerLevelUp, 120);
  }
}

function buyWorkshopPerk(perk) {
  const currentRank = MetaProgression.perks[perk.key] || 0;
  const cost = perk.costBase + (currentRank * perk.costScale);
  if (MetaProgression.bankedTechScrap >= cost) {
    MetaProgression.bankedTechScrap -= cost;
    MetaProgression.perks[perk.key] = currentRank + 1;
    perk.buy();
    saveMetaProgression();
    window.Telemetry.recordEvent('META', `Purchased ${perk.title} Rank ${currentRank + 1}!`);
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === CONFIG.ENGINE.debugKey || e.key === CONFIG.ENGINE.altDebugKey) debugHUD.classList.toggle('hidden');
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (!state.isDrafting && !state.isWorkshopOpen) state.isPaused = !state.isPaused;
    else if (state.isWorkshopOpen) { state.isWorkshopOpen = false; state.timeScale = 1.0; }
  }
  if (e.code === 'KeyG') state.player.godMode = !state.player.godMode;
  if (e.code === 'KeyB' && !state.isPaused && Math.hypot(state.player.x, state.player.y) < 180) {
    state.isWorkshopOpen = !state.isWorkshopOpen;
    state.timeScale = state.isWorkshopOpen ? 0.0 : 1.0;
  }
  if (e.code === 'KeyT' && state.enemyManager) state.enemyManager.triggerStressTestSwarm(state.player);
  if (state.worldManager && state.worldManager.landmark && state.worldManager.landmark.repaired) {
    if (Math.hypot(state.player.x - state.worldManager.landmark.x, state.player.y - state.worldManager.landmark.y) < CONFIG.WORLD.terraformedRadius) {
      if (e.code === 'KeyE') state.worldManager.startRemoteTransfer();
      if (e.code === 'KeyF') state.worldManager.fastTravelToHubWithTax(state.player);
    }
  }
  if (e.code === 'KeyE' && state.worldManager && state.worldManager.chests) {
    for (const chest of state.worldManager.chests) {
      if (!chest.opened && Math.hypot(state.player.x - chest.x, state.player.y - chest.y) < 65) {
        chest.open(state.player); break;
      }
    }
  }
  if (state.isDrafting) {
    if (e.key === '1') selectCard(0);
    if (e.key === '2') selectCard(1);
    if (e.key === '3') selectCard(2);
  }
});

window.addEventListener('click', (e) => {
  if (state.isPaused) {
    const mw = 260, mh = 44, cx = canvas.width / 2, cy = canvas.height / 2;
    if (e.clientX >= cx - mw / 2 && e.clientX <= cx + mw / 2 && e.clientY >= cy - 30 && e.clientY <= cy - 30 + mh) { state.isPaused = false; return; }
    if (e.clientX >= cx - mw / 2 && e.clientX <= cx + mw / 2 && e.clientY >= cy + 26 && e.clientY <= cy + 26 + mh) { state.isPaused = false; state.player.die(); return; }
    return;
  }
  if (state.isDrafting) {
    const cw = 220, ch = 140, gap = 20, totalW = (cw * 3) + (gap * 2), startX = (canvas.width - totalW) / 2, cardY = canvas.height / 2 - ch / 2;
    for (let i = 0; i < 3; i++) {
      const cardX = startX + i * (cw + gap);
      if (e.clientX >= cardX && e.clientX <= cardX + cw && e.clientY >= cardY && e.clientY <= cardY + ch) { selectCard(i); break; }
    }
    return;
  }
  if (state.isWorkshopOpen) {
    const pw = 420, ph = 70, gap = 14, startX = canvas.width / 2 - pw / 2, startY = canvas.height / 2 - 130;
    for (let i = 0; i < WORKSHOP_PERKS.length; i++) {
      const py = startY + i * (ph + gap);
      if (e.clientX >= startX && e.clientX <= startX + pw && e.clientY >= py && e.clientY <= py + ph) { buyWorkshopPerk(WORKSHOP_PERKS[i]); break; }
    }
  }
});

document.getElementById('btnCopyJSON').addEventListener('click', () => navigator.clipboard.writeText(window.Telemetry.exportJSON()).then(() => alert('Copied report!')));
document.getElementById('btnResetTelemetry').addEventListener('click', () => window.Telemetry.resetRun());

function renderFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2 + camera.shakeX, canvas.height / 2 + camera.shakeY);
  if (camera.shakeAngle) ctx.rotate(camera.shakeAngle);
  ctx.translate(-camera.x, -camera.y);

  renderWorldGrid(ctx, canvas, camera, state.spriteManager);
  if (state.decalManager) state.decalManager.render(ctx, camera.x, camera.y, canvas.width, canvas.height);
  renderSanctuaryHub(ctx, state.spriteManager);
  state.worldManager.render(ctx);
  state.pickupManager.render(ctx);
  if (state.gibManager) state.gibManager.render(ctx);
  for (const sw of state.shockwaves) sw.render(ctx);
  state.enemyManager.render(ctx);
  state.player.render(ctx);
  state.weaponManager.render(ctx);

  for (const dtText of state.damageTexts) {
    ctx.fillStyle = '#feb2b2';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(dtText.text, dtText.x, dtText.y);
  }
  ctx.restore();

  state.worldManager.renderCompass(ctx, state.player, canvas.width, canvas.height);
  renderXPBar(ctx, canvas, state);

  if (state.isDrafting) renderDraftOverlay(ctx, canvas, state);
  if (state.isWorkshopOpen) renderWorkshopOverlay(ctx, canvas, WORKSHOP_PERKS);

  renderLandmarkTerminalHUD(ctx, canvas, state);
  renderArsenalHUD(ctx, canvas, state);
  renderPlayerVitalsHUD(ctx, canvas, state);
  if (state.isPaused) renderPauseMenu(ctx, canvas);

  const distToHub = Math.hypot(state.player.x, state.player.y);
  if (distToHub < 180 && !state.isWorkshopOpen && !state.isPaused) {
    ctx.fillStyle = '#48bb78';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[B] OPEN SANCTUARY WORKSHOP', canvas.width / 2, canvas.height / 2 + 50);
  }

  const m = window.Telemetry ? window.Telemetry.metrics : { resourcesCollected: { techScrap: 0 } };
  ctx.fillStyle = '#48bb78';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`EXPEDITION SCRAP: ${m.resourcesCollected.techScrap}`, 16, 28);
  ctx.fillStyle = '#ecc94b';
  ctx.fillText(`SANCTUARY VAULT: ${MetaProgression.bankedTechScrap} SCRAP`, 16, 46);

  if (state.player.godMode) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('[GOD MODE ON: 15x DMG + INVULNERABLE] (Press G)', 16, 66);
  }

  ctx.fillStyle = 'rgba(160, 174, 192, 0.85)';
  ctx.font = '12px monospace';
  ctx.fillText(`Horde: ${state.enemyManager.enemies.length}/400 | Weapons: ${state.weaponManager.slots.length}/6 | [SPACE] Dash | [T] Stress | [ESC] Pause`, 16, canvas.height - 18);
}

function gameLoop(currentTimestamp) {
  if (!lastTimestamp) lastTimestamp = currentTimestamp;
  let rawDt = Math.min((currentTimestamp - lastTimestamp) / 1000, CONFIG.ENGINE.maxDeltaTime);
  lastTimestamp = currentTimestamp;

  if (state.hitStopTimer > 0) {
    state.hitStopTimer -= rawDt;
    camera.update(rawDt, state.player.x, state.player.y);
    if (window.Telemetry) window.Telemetry.update(rawDt);
    renderFrame();
    requestAnimationFrame(gameLoop);
    return;
  }

  let dt = rawDt * state.timeScale;

  if (!state.isWorkshopOpen && !state.isPaused) {
    state.player.update(dt);
    state.worldManager.update(dt, state.player, state.enemyManager);
    state.enemyManager.update(dt, state.player, camera, canvas.width, canvas.height, state.worldManager.nests.length);

    const allTargets = [...state.enemyManager.enemies, ...state.worldManager.nests];
    state.weaponManager.update(dt, allTargets);

    if (state.gibManager) state.gibManager.update(dt, state.decalManager);

    for (let i = state.shockwaves.length - 1; i >= 0; i--) {
      state.shockwaves[i].update(dt);
      if (!state.shockwaves[i].alive) state.shockwaves.splice(i, 1);
    }

    for (let i = state.pickupManager.pickups.length - 1; i >= 0; i--) {
      const p = state.pickupManager.pickups[i];
      p.update(dt, state.player);
      if (!p.alive) {
        if (p.type === 'bio' && state.player.addXP(p.value)) triggerLevelUp();
        state.pickupManager.pickups.splice(i, 1);
      }
    }

    if (state.damageTexts.length > 60) state.damageTexts.splice(0, state.damageTexts.length - 60);
    for (let i = state.damageTexts.length - 1; i >= 0; i--) {
      state.damageTexts[i].y -= 30 * dt;
      state.damageTexts[i].life -= dt;
      if (state.damageTexts[i].life <= 0) state.damageTexts.splice(i, 1);
    }

    camera.update(rawDt, state.player.x, state.player.y);
    if (window.Telemetry) window.Telemetry.update(rawDt);
  }

  renderFrame();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);