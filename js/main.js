// js/main.js — Легковесний цикл движка, обробка вводу і координатор систем

import { CONFIG, MetaProgression, saveMetaProgression } from './config.js';
import { state, setRunRestartHandler, updateFlashes } from './state.js';
import { Telemetry } from './telemetry.js';
import { DecalManager } from './decals.js';
import { GibManager } from './gibs.js';
import { CorpseManager } from './corpses.js';
import { GroundCover } from './groundCover.js';
import { Fertility } from './fertility.js';
import { HubLink } from './hubLink.js';
import { PixiRootsRenderer } from './render/pixiRoots.js';
import { renderBiomassHUD } from './render/biomassUI.js';
import { PlantManager } from './plants.js';
import { updateRobotTracks, resetGore } from './goreTracks.js';
import { SpriteManager } from './sprites.js';
import { PickupManager } from './pickups.js';
import { renderWorldGrid, renderSanctuaryHub } from './render/environment.js';
import { renderReclaimedGround } from './render/reclaimedGround.js';
import { PixiCore } from './render/pixiCore.js';
import { PixiWorldRenderer } from './render/pixiWorld.js';
import { PixiTerraformRenderer } from './render/pixiTerraform.js';
import { PixiEntitiesRenderer } from './render/pixiEntities.js';
import { PixiPlantsRenderer } from './render/pixiPlants.js';
import { PixiWeaponsRenderer } from './render/pixiWeapons.js';
import { WorldManager } from './world/manager.js';
import { renderOutpostHUD } from './world/outpost.js';
import { WeaponManager } from './weapons/manager.js';
import { queueLevelUps, updateDraftQueue, selectCard, resetDraftQueue } from './draft.js';
import { Player } from './player.js';
import { EnemyManager } from './enemies/manager.js';
import {
  renderPlayerVitalsHUD,
  renderArsenalHUD,
  renderXPBar,
  renderDraftOverlay,
  renderWorkshopOverlay,
  renderPauseMenu,
  renderSanctuaryHUD
} from './render/ui.js';
import {
  renderObjectiveArrow, renderEvacHUD, renderRunEndOverlay, renderHiveAlertHUD,
  renderTerraformToast, renderReclamationStatus, renderReclaimedGroundHUD
} from './render/runUI.js';
import { getRunObjective } from './world/objective.js';
import { canLeaveRunEnd, startNewRun } from './run.js';
import { audio } from './audio.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let lastTimestamp = 0;
const debugHUD = document.getElementById('debugHUD');
const _allTargets = [];

const pixi = new PixiCore();
let pixiWorld = null;
let pixiTerraform = null;
let pixiEntities = null;
let pixiPlants = null;
let pixiRoots = null;
let pixiWeapons = null;

const camCfg = CONFIG.CAMERA;
const camera = {
  x: 0, y: 0, lerpSpeed: camCfg.lerpSpeed, trauma: 0,
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
state.player = new Player(0, 0);
state.spriteManager = new SpriteManager();
state.decalManager = new DecalManager();
state.gibManager = new GibManager();
state.corpseManager = new CorpseManager();
state.weaponManager = new WeaponManager(state.player);
state.pickupManager = new PickupManager();
state.enemyManager = new EnemyManager();
state.worldManager = new WorldManager();
state.groundCover = new GroundCover();
state.fertility = new Fertility(state.groundCover);
state.hubLink = new HubLink(state.fertility);
state.plants = new PlantManager();

setRunRestartHandler(() => {
  CONFIG.PLAYER.pickupRadius = 110;
  state.weaponManager.reset();
  state.decalManager.clear();
  state.gibManager.clear();
  state.corpseManager.clear();
  state.groundCover.clear();
  state.fertility = new Fertility(state.groundCover);
  state.hubLink = new HubLink(state.fertility);
  state.plants = new PlantManager();
  resetGore();

  // Смерть під час драфту/Воркшопу не має переносити меню й уповільнення в новий забіг
  resetDraftQueue();
  state.isWorkshopOpen = false;
  state.isPaused = false;
  state.timeScale = 1.0;
  state.runEnd = null;
  Telemetry.resetRun();

  state.enemyManager = new EnemyManager();
  state.pickupManager = new PickupManager();
  state.worldManager = new WorldManager();
  state.damageTexts.length = 0;
  state.shockwaves.length = 0;
  state.flashes.length = 0;
  camera.x = 0; camera.y = 0; camera.trauma = 0;
  state.hitStopTimer = 0;
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const WORKSHOP_PERKS = [
  { key: 'chassisArmor', title: 'CHASSIS ARMOR', costBase: 3, costScale: 2, desc: '+15 Max Base HP permanently', buy: () => state.player.applyMetaUpgrades(false) },
  { key: 'engineSpeed', title: 'MOTOR TUNING', costBase: 4, costScale: 3, desc: '+8 Base Movement Speed permanently', buy: () => state.player.applyMetaUpgrades(false) },
  { key: 'shieldCapacitor', title: 'SHIELD CAPACITOR', costBase: 5, costScale: 4, desc: '-2.0s Shield Recharge Time permanently', buy: () => state.player.applyMetaUpgrades(false) },
  { key: 'naniteScavenge', title: 'NANITE HARVESTER', costBase: 6, costScale: 5, desc: '+1 Extra Tech Scrap from Nests', buy: () => {} },
  { key: 'cargoSecurity', title: 'HOLD SECURITY', maxRank: 2, costBase: 5, costScale: 5, desc: 'Reduce scrap lost on death (50% → 40% → 25%)', buy: () => {} }
];

function buyWorkshopPerk(perk) {
  const rank = MetaProgression.perks[perk.key] || 0;
  if (perk.maxRank !== undefined && rank >= perk.maxRank) return;
  const cost = perk.costBase + (rank * perk.costScale);
  if (MetaProgression.bankedTechScrap >= cost) {
    MetaProgression.bankedTechScrap -= cost;
    MetaProgression.perks[perk.key] = rank + 1;
    perk.buy();
    audio.play('ui_click');
    saveMetaProgression();
    Telemetry.recordEvent('META', `Purchased ${perk.title} Rank ${rank + 1}!`);
  }
}

window.addEventListener('keydown', (e) => {
  if (!e.repeat && e.code === 'KeyM') audio.toggleMute();
  if (e.code === 'Minus' || e.code === 'NumpadSubtract') audio.adjustMaster(-0.1);
  if (e.code === 'Equal' || e.code === 'NumpadAdd') audio.adjustMaster(0.1);
  if (e.key === CONFIG.ENGINE.debugKey || e.key === CONFIG.ENGINE.altDebugKey) debugHUD.classList.toggle('hidden');
  if (state.runEnd) {
    if (!e.repeat && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE')) startNewRun();
    return;
  }
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (!state.isDrafting && !state.isWorkshopOpen) {
      state.isPaused = !state.isPaused;
      audio.play(state.isPaused ? 'ui_pause' : 'ui_resume');
    } else if (state.isWorkshopOpen) { state.isWorkshopOpen = false; state.timeScale = 1.0; }
  }
  if (e.code === 'KeyG') state.player.godMode = !state.player.godMode;
  const domeBroken = state.worldManager && state.worldManager.sanctuary && state.worldManager.sanctuary.domeBroken;
  if (e.code === 'KeyB' && !state.isPaused && !state.isDrafting && !domeBroken && Math.hypot(state.player.x, state.player.y) < CONFIG.HUB.radius) {
    state.isWorkshopOpen = !state.isWorkshopOpen;
    state.timeScale = state.isWorkshopOpen ? 0.0 : 1.0;
  }
  if (e.code === 'KeyT' && state.enemyManager) state.enemyManager.triggerStressTestSwarm(state.player);
  if (e.code === 'KeyF' && state.worldManager.landmark.repaired && !state.worldManager.evac.isActive) {
    if (Math.hypot(state.player.x - state.worldManager.landmark.x, state.player.y - state.worldManager.landmark.y) < CONFIG.WORLD.terraformedRadius) {
      state.worldManager.fastTravelToHubWithTax(state.player);
    }
  }
  if (e.code === 'KeyE' && !state.isPaused && !state.isDrafting && !state.isWorkshopOpen) {
    let handled = false;
    if (state.worldManager && state.worldManager.chests) {
      for (const chest of state.worldManager.chests) {
        if (!chest.opened && Math.hypot(state.player.x - chest.x, state.player.y - chest.y) < 65) {
          chest.open(state.player);
          handled = true;
          break;
        }
      }
    }
    if (!handled && state.worldManager && state.worldManager.outposts) {
      for (const outpost of state.worldManager.outposts) {
        if (outpost.state === 'idle' && Math.hypot(state.player.x - outpost.x, state.player.y - outpost.y) <= outpost.captureRadius) {
          handled = outpost.activate(state.player, state.enemyManager);
          if (handled) break;
        }
      }
    }
    if (!handled && state.worldManager && state.worldManager.sanctuary) {
      handled = state.worldManager.sanctuary.depositScrap(state.player);
    }
    if (!handled) state.worldManager.evac.call(state.player, state.enemyManager);
  }
  if (state.isDrafting) { if (e.key === '1') selectCard(0); if (e.key === '2') selectCard(1); if (e.key === '3') selectCard(2); }
});

window.addEventListener('click', (e) => {
  if (state.runEnd) { startNewRun(); return; }
  if (state.isPaused) {
    const mw = 260, mh = 44, cx = canvas.width / 2, cy = canvas.height / 2;
    if (e.clientX >= cx - mw / 2 && e.clientX <= cx + mw / 2 && e.clientY >= cy - 30 && e.clientY <= cy - 30 + mh) { state.isPaused = false; audio.play('ui_click'); return; }
    if (e.clientX >= cx - mw / 2 && e.clientX <= cx + mw / 2 && e.clientY >= cy + 26 && e.clientY <= cy + 26 + mh) { audio.play('ui_click'); state.isPaused = false; state.player.die('abort'); return; }
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
    const pw = 450, ph = 52, gap = 10, startX = canvas.width / 2 - pw / 2, startY = canvas.height / 2 - 150;
    for (let i = 0; i < WORKSHOP_PERKS.length; i++) {
      const py = startY + i * (ph + gap);
      if (e.clientX >= startX && e.clientX <= startX + pw && e.clientY >= py && e.clientY <= py + ph) { buyWorkshopPerk(WORKSHOP_PERKS[i]); break; }
    }
  }
});

document.getElementById('btnCopyJSON').addEventListener('click', () => navigator.clipboard.writeText(Telemetry.exportJSON()).then(() => alert('Copied report!')));
document.getElementById('btnResetTelemetry').addEventListener('click', () => Telemetry.resetRun());

function renderWorldLabelsOverlay() {
  if (!pixi.ready) {
    // Межа світу (у Pixi її малює pixiWorld.ringGraphic)
    ctx.save();
    ctx.strokeStyle = 'rgba(237, 137, 54, 0.55)';
    ctx.lineWidth = 4;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, CONFIG.WORLD.ring1Radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const sanc = state.worldManager && state.worldManager.sanctuary;
  if (pixi.ready && sanc) sanc.renderOverlay(ctx);
  if (pixi.ready && state.worldManager && state.worldManager.outposts) {
    for (const outpost of state.worldManager.outposts) outpost.render(ctx);
  }
  if (pixi.ready) state.worldManager.evac.render(ctx);

  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = sanc && sanc.domeBroken ? '#fc8181' : '#a0aec0';
  ctx.fillText(sanc && sanc.domeBroken ? 'SANCTUARY GATE [BREACHED]' : 'SANCTUARY GATE (0, 0)', 0, 36);

  const lm = state.worldManager.landmark;
  if (lm) {
    const evacActive = state.worldManager.evac.isActive;
    ctx.fillStyle = evacActive ? '#90cdf4' : lm.repaired ? '#9ae6b4' : '#cbd5e0';
    ctx.fillText(evacActive ? 'EVAC BEACON [FIELD DOWN]' : lm.repaired ? 'BIOSPHERE PURIFIER [ONLINE]' : 'PURIFIER [NEEDS CORE]', lm.x, lm.y + lm.radius + 20);
  }
  for (const c of state.worldManager.chests) {
    if (!c.opened && Math.abs(c.x - camera.x) < canvas.width && Math.abs(c.y - camera.y) < canvas.height) {
      ctx.fillStyle = '#f6e05e'; ctx.font = 'bold 9px monospace';
      ctx.fillText('[E] CACHE', c.x, c.y - 14);
    }
  }
  for (const e of state.enemyManager.enemies) {
    if (e.alive && e.typeKey === 'warden') {
      ctx.fillStyle = e.isTitan ? '#ff0055' : '#f687b3';
      ctx.font = 'bold 11px monospace';
      const label = e.isTitan
        ? 'ABYSSAL TITAN [INVULNERABLE]'
        : !e.isAwakened ? 'HIVE WARDEN [DORMANT]' : e.isCharging ? '!! CHARGE !!' : 'HIVE WARDEN (ELITE)';
      ctx.fillText(label, e.x, e.y - e.radius - 14);
    }
  }
  ctx.font = 'bold 13px monospace';
  for (const dtText of state.damageTexts) {
    ctx.fillStyle = dtText.color || '#feb2b2';
    ctx.fillText(dtText.text, dtText.x, dtText.y);
  }
}

function renderFrame() {
  const nowSec = performance.now() / 1000;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (pixi.ready) {
    pixi.updateCamera(camera, canvas.width, canvas.height);
    pixiWorld.syncBackground(camera, canvas.width, canvas.height, state.spriteManager);
    pixiTerraform.sync(state.worldManager.terraform);
    pixiRoots.sync(state.hubLink, state.worldManager.terraform, nowSec);
    pixiWorld.syncCover(state.groundCover, camera, canvas.width, canvas.height);
    pixiWorld.syncDecals(state.decalManager, camera, canvas.width, canvas.height);
    pixiWorld.syncStructures(state.worldManager, camera, canvas.width, canvas.height, nowSec);
    pixiPlants.sync(state.plants.plants, camera, canvas.width, canvas.height, nowSec);
    pixiEntities.sync(state, camera, canvas.width, canvas.height, nowSec);
    pixiWeapons.sync(state, camera, canvas.width, canvas.height, nowSec);
    pixi.render();

    ctx.save();
    ctx.translate(canvas.width / 2 + camera.shakeX, canvas.height / 2 + camera.shakeY);
    if (camera.shakeAngle) ctx.rotate(camera.shakeAngle);
    ctx.translate(-camera.x, -camera.y);
    renderWorldLabelsOverlay();
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(canvas.width / 2 + camera.shakeX, canvas.height / 2 + camera.shakeY);
    if (camera.shakeAngle) ctx.rotate(camera.shakeAngle);
    ctx.translate(-camera.x, -camera.y);
    renderWorldGrid(ctx, canvas, camera, state.spriteManager);
    renderReclaimedGround(ctx, state.worldManager.terraform);
    if (state.decalManager) state.decalManager.render(ctx, camera.x, camera.y, canvas.width, canvas.height);
    renderSanctuaryHub(ctx, state.spriteManager, state.worldManager.sanctuary);
    state.worldManager.render(ctx);
    state.corpseManager.render(ctx);
    state.pickupManager.render(ctx, state.spriteManager);
    if (state.gibManager) state.gibManager.render(ctx);
    for (const sw of state.shockwaves) sw.render(ctx);
    state.enemyManager.render(ctx);
    state.player.render(ctx);
    state.weaponManager.render(ctx);
    renderWorldLabelsOverlay();
    ctx.restore();
  }

  state.worldManager.renderCompass(ctx, state.player, canvas.width, canvas.height);
  renderXPBar(ctx, canvas, state);
  renderSanctuaryHUD(ctx, canvas, state);
  if (state.isDrafting) renderDraftOverlay(ctx, canvas, state);
  if (state.isWorkshopOpen) {
    renderWorkshopOverlay(ctx, canvas, WORKSHOP_PERKS);
    renderReclamationStatus(ctx, canvas, state.worldManager.terraform);
  }
  renderOutpostHUD(ctx, canvas, state.worldManager, state.player);
  renderEvacHUD(ctx, canvas, state);
  renderTerraformToast(ctx, canvas, state.worldManager.terraform);
  renderReclaimedGroundHUD(ctx, canvas, state.player);
  renderArsenalHUD(ctx, canvas, state);
  renderPlayerVitalsHUD(ctx, canvas, state);
  if (!state.isDrafting && !state.isWorkshopOpen) {
    renderObjectiveArrow(ctx, canvas, camera, getRunObjective(state.worldManager, state.enemyManager, state.player));
  }
  if (state.isPaused) renderPauseMenu(ctx, canvas);

  const domeBroken = state.worldManager.sanctuary && state.worldManager.sanctuary.domeBroken;
  if (!domeBroken && Math.hypot(state.player.x, state.player.y) < CONFIG.HUB.radius && !state.isWorkshopOpen && !state.isPaused) {
    ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = '#48bb78';
    ctx.fillText('[B] OPEN SANCTUARY WORKSHOP', canvas.width / 2, canvas.height / 2 + 50);
    const carriedScrap = Telemetry.metrics.resourcesCollected.techScrap;
    if (carriedScrap > 0) {
      ctx.fillStyle = '#ecc94b';
      ctx.fillText(`[E] DEPOSIT SCRAP (+${carriedScrap} TO VAULT)`, canvas.width / 2, canvas.height / 2 + 70);
    }
  }
  ctx.fillStyle = '#48bb78'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left';
  ctx.fillText(`EXPEDITION SCRAP: ${Telemetry.metrics.resourcesCollected.techScrap}`, 16, 28);
  ctx.fillStyle = '#ecc94b';
  ctx.fillText(`SANCTUARY VAULT: ${MetaProgression.bankedTechScrap} SCRAP`, 16, 46);
  renderBiomassHUD(ctx, state);
  renderHiveAlertHUD(ctx, canvas, state);
  audio.renderNote(ctx, canvas);
  if (state.player.godMode) {
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left';
    ctx.fillText('[GOD MODE ON: 15x DMG + INVULNERABLE] (Press G)', 16, canvas.height - 40);
  }
  ctx.fillStyle = 'rgba(160, 174, 192, 0.85)'; ctx.font = '12px monospace';
  ctx.fillText(`Horde: ${state.enemyManager.enemies.length}/400 | Weapons: ${state.weaponManager.slots.length}/6 | [SPACE] Dash | [T] Stress | [ESC] Pause`, 16, canvas.height - 18);
  if (state.runEnd) renderRunEndOverlay(ctx, canvas, state.runEnd, canLeaveRunEnd());
}

function gameLoop(currentTimestamp) {
  if (!lastTimestamp) lastTimestamp = currentTimestamp;
  let rawDt = Math.min((currentTimestamp - lastTimestamp) / 1000, CONFIG.ENGINE.maxDeltaTime);
  lastTimestamp = currentTimestamp;
  audio.update(rawDt);

  if (state.hitStopTimer > 0) {
    state.hitStopTimer -= rawDt;
    camera.update(rawDt, state.player.x, state.player.y);
    Telemetry.update(rawDt);
    renderFrame();
    requestAnimationFrame(gameLoop);
    return;
  }

  let dt = rawDt * state.timeScale;
  if (!state.isWorkshopOpen && !state.isPaused && !state.runEnd) {
    state.player.update(dt);
    state.worldManager.update(dt, state.player, state.enemyManager);
    state.enemyManager.update(dt, state.player, camera, canvas.width, canvas.height, state.worldManager.nests.length);
    _allTargets.length = 0;
    for (let i = 0; i < state.enemyManager.enemies.length; i++) _allTargets.push(state.enemyManager.enemies[i]);
    for (let i = 0; i < state.worldManager.nests.length; i++) _allTargets.push(state.worldManager.nests[i]);
    state.weaponManager.update(dt, _allTargets);
    if (state.gibManager) state.gibManager.update(dt, state.decalManager);
    state.corpseManager.update(dt, state.player);
    updateRobotTracks(state.decalManager, state.player, dt);
    state.decalManager.update(dt);
    state.fertility.update(dt);
    state.hubLink.update(dt);
    state.plants.update(dt, state.player);
    for (let i = state.shockwaves.length - 1; i >= 0; i--) { state.shockwaves[i].update(dt); if (!state.shockwaves[i].alive) state.shockwaves.splice(i, 1); }
    updateFlashes(dt);
    for (let i = state.pickupManager.pickups.length - 1; i >= 0; i--) {
      const p = state.pickupManager.pickups[i];
      p.update(dt, state.player);
      if (!p.alive) { if (p.type === 'bio') queueLevelUps(state.player.addXP(p.value)); state.pickupManager.pickups.splice(i, 1); }
    }
    updateDraftQueue(dt);
    if (state.damageTexts.length > 60) state.damageTexts.splice(0, state.damageTexts.length - 60);
    for (let i = state.damageTexts.length - 1; i >= 0; i--) { state.damageTexts[i].y -= 30 * dt; state.damageTexts[i].life -= dt; if (state.damageTexts[i].life <= 0) state.damageTexts.splice(i, 1); }
    camera.update(rawDt, state.player.x, state.player.y);
    Telemetry.update(rawDt);
  }
  renderFrame();
  requestAnimationFrame(gameLoop);
}

(async function boot() {
  audio.init();
  try {
    await pixi.init(document.getElementById('gameContainer'));
    pixiWorld = new PixiWorldRenderer(pixi);
    pixiTerraform = new PixiTerraformRenderer(pixi);
    pixiRoots = new PixiRootsRenderer(pixi);
    state.rootsStats = pixiRoots.stats; // для виміру вартості перебудови коренів (dev)
    pixiEntities = new PixiEntitiesRenderer(pixi);
    pixiPlants = new PixiPlantsRenderer(pixi);
    pixiWeapons = new PixiWeaponsRenderer(pixi);
  } catch (err) {
    console.warn('[PixiCore] Init failed, running Canvas 2D fallback:', err);
  }
  requestAnimationFrame(gameLoop);
})();