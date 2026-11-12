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
    if (this.radius >= this.maxRadius || this.alpha <= 0) {
      this.alive = false;
    }
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

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, (this.lineWidth * 0.4) * this.alpha);
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0, this.radius - 2), 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
window.Shockwave = Shockwave;

let shockwaves = [];
window.shockwaves = shockwaves;
window.spawnShockwave = (x, y, options = {}) => {
  shockwaves.push(new Shockwave(x, y, options));
};

const camCfg = (window.CONFIG && window.CONFIG.CAMERA) || { lerpSpeed: 0.1, maxOffsetX: 28, maxOffsetY: 28, maxAngle: 0.048, traumaDecay: 1.5, traumaExponent: 1.35 };

const camera = {
  x: 0,
  y: 0,
  lerpSpeed: camCfg.lerpSpeed,
  trauma: 0,
  maxOffsetX: camCfg.maxOffsetX,
  maxOffsetY: camCfg.maxOffsetY,
  maxAngle: camCfg.maxAngle,
  traumaDecay: camCfg.traumaDecay,
  traumaExponent: camCfg.traumaExponent,
  shakeX: 0,
  shakeY: 0,
  shakeAngle: 0,
  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  },
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
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeAngle = 0;
    }
  }
};
window.camera = camera;

let hitStopTimer = 0;
window.triggerHitStop = (duration) => {
  hitStopTimer = Math.max(hitStopTimer, duration);
};

const player = new window.Player(0, 0);
let spriteManager = new window.SpriteManager();
let decalManager = new window.DecalManager();
let gibManager = new window.GibManager();
let weaponManager = new window.WeaponManager(player);
let pickupManager = new window.PickupManager();
let enemyManager = new window.EnemyManager();
let worldManager = new window.WorldManager();
let damageTexts = [];

window.player = player;
window.spriteManager = spriteManager;
window.decalManager = decalManager;
window.gibManager = gibManager;
window.pickupManager = pickupManager;
window.damageTexts = damageTexts;
window.enemyManager = enemyManager;
window.worldManager = worldManager;

window.triggerFullRunRestart = () => {
  window.CONFIG.WEAPONS.blaster.damage = window.CONFIG.WEAPONS.blaster.baseDamage;
  window.CONFIG.WEAPONS.blaster.fireRate = window.CONFIG.WEAPONS.blaster.baseFireRate;
  window.CONFIG.WEAPONS.saw.bladeCount = 1;
  window.CONFIG.WEAPONS.saw.damage = window.CONFIG.WEAPONS.saw.baseDamage;
  window.CONFIG.WEAPONS.saw.orbitSpeed = 3.2;
  window.CONFIG.WEAPONS.mortar.damage = window.CONFIG.WEAPONS.mortar.baseDamage;
  window.CONFIG.WEAPONS.mortar.fireRate = window.CONFIG.WEAPONS.mortar.baseFireRate;
  window.CONFIG.WEAPONS.mortar.cloudRadius = 65;
  window.CONFIG.WEAPONS.tesla.damage = window.CONFIG.WEAPONS.tesla.baseDamage;
  window.CONFIG.WEAPONS.tesla.cooldown = window.CONFIG.WEAPONS.tesla.baseCooldown;
  window.CONFIG.WEAPONS.tesla.chainCount = 4;
  window.CONFIG.WEAPONS.drone.damage = window.CONFIG.WEAPONS.drone.baseDamage;
  window.CONFIG.WEAPONS.drone.fireRate = window.CONFIG.WEAPONS.drone.baseFireRate;
  window.CONFIG.WEAPONS.drone.droneCount = 2;
  window.CONFIG.WEAPONS.flamer.damage = window.CONFIG.WEAPONS.flamer.baseDamage;
  window.CONFIG.WEAPONS.flamer.range = 155;

  weaponManager.reset();
  if (decalManager) decalManager.clear();
  if (gibManager) gibManager.clear();

  enemyManager = new window.EnemyManager();
  pickupManager = new window.PickupManager();
  worldManager = new window.WorldManager();
  damageTexts = [];

  window.enemyManager = enemyManager;
  window.pickupManager = pickupManager;
  window.worldManager = worldManager;
  window.damageTexts = damageTexts;

  camera.x = 0;
  camera.y = 0;
  camera.trauma = 0;
  hitStopTimer = 0;
  shockwaves = [];
  window.shockwaves = shockwaves;
};

let isDrafting = false;
let draftCards = [];
let isWorkshopOpen = false;
let isPaused = false;
let timeScale = 1.0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const UPGRADE_POOL = [
  {
    id: 'blaster_tune',
    title: 'OVERCLOCK BLASTER',
    desc: '+6 Damage, +20% Fire Rate',
    apply: () => {
      window.CONFIG.WEAPONS.blaster.damage += 6;
      window.CONFIG.WEAPONS.blaster.fireRate = Math.max(0.16, window.CONFIG.WEAPONS.blaster.fireRate * 0.8);
      weaponManager.slots[0].cfg = window.CONFIG.WEAPONS.blaster;
    }
  },
  {
    id: 'scrap_saw_weapon',
    title: 'SCRAP SAW (WEAPON)',
    desc: 'Mount orbital circular saw blade',
    apply: () => {
      if (!weaponManager.hasWeapon("Scrap Saw")) {
        weaponManager.addWeapon(new window.ScrapSaw(player));
      } else {
        window.CONFIG.WEAPONS.saw.bladeCount = Math.min(4, window.CONFIG.WEAPONS.saw.bladeCount + 1);
        window.CONFIG.WEAPONS.saw.damage += 6;
        window.CONFIG.WEAPONS.saw.orbitSpeed += 0.8;
      }
    }
  },
  {
    id: 'bio_mortar_weapon',
    title: 'BIO-SPORE MORTAR',
    desc: 'Lob spores creating lingering slowing AoE clouds',
    apply: () => {
      if (!weaponManager.hasWeapon("Bio-Spore Mortar")) {
        weaponManager.addWeapon(new window.BioSporeMortar(player));
      } else {
        window.CONFIG.WEAPONS.mortar.damage += 14;
        window.CONFIG.WEAPONS.mortar.cloudRadius = Math.min(120, window.CONFIG.WEAPONS.mortar.cloudRadius + 15);
        window.CONFIG.WEAPONS.mortar.fireRate = Math.max(1.1, window.CONFIG.WEAPONS.mortar.fireRate * 0.85);
      }
    }
  },
  {
    id: 'tesla_arc_weapon',
    title: 'TESLA ARC (WEAPON)',
    desc: 'Unleash chained lightning bouncing between foes',
    apply: () => {
      if (!weaponManager.hasWeapon("Tesla Arc")) {
        weaponManager.addWeapon(new window.TeslaArc(player));
      } else {
        window.CONFIG.WEAPONS.tesla.damage += 8;
        window.CONFIG.WEAPONS.tesla.chainCount += 1;
        window.CONFIG.WEAPONS.tesla.cooldown = Math.max(0.65, window.CONFIG.WEAPONS.tesla.cooldown * 0.85);
      }
    }
  },
  {
    id: 'aegis_drones_weapon',
    title: 'AEGIS DRONES (WEAPON)',
    desc: 'Deploy orbiting combat drones with laser interceptors',
    apply: () => {
      if (!weaponManager.hasWeapon("Aegis Drones")) {
        weaponManager.addWeapon(new window.AegisDrones(player));
      } else {
        window.CONFIG.WEAPONS.drone.droneCount = Math.min(4, window.CONFIG.WEAPONS.drone.droneCount + 1);
        window.CONFIG.WEAPONS.drone.damage += 5;
        window.CONFIG.WEAPONS.drone.fireRate = Math.max(0.65, window.CONFIG.WEAPONS.drone.fireRate * 0.85);
      }
    }
  },
  {
    id: 'plasma_purifier_weapon',
    title: 'PLASMA PURIFIER (WEAPON)',
    desc: 'Unleash continuous conical stream of incinerating plasma',
    apply: () => {
      if (!weaponManager.hasWeapon("Plasma Purifier")) {
        weaponManager.addWeapon(new window.PlasmaPurifier(player));
      } else {
        window.CONFIG.WEAPONS.flamer.damage += 18;
        window.CONFIG.WEAPONS.flamer.range = Math.min(260, window.CONFIG.WEAPONS.flamer.range + 25);
        window.CONFIG.WEAPONS.flamer.burnDamage += 4;
      }
    }
  },
  {
    id: 'nanite_regen',
    title: 'NANITE REPAIR',
    desc: '+1.2 HP/sec Passive Regeneration',
    apply: () => {
      player.healthRegenRate += 1.2;
    }
  },
  {
    id: 'magnet_pulse',
    title: 'MAGNET PULSE',
    desc: '+45% Pickup Range & Instant Vacuum',
    apply: () => {
      window.CONFIG.PLAYER.pickupRadius = Math.round(window.CONFIG.PLAYER.pickupRadius * 1.45);
      for (const p of pickupManager.pickups) {
        p.isMagnetized = true;
      }
    }
  },
  {
    id: 'shield_up',
    title: 'AEGIS BATTERY',
    desc: '+1 Max Shield Charge & Instant Recharge',
    apply: () => {
      player.maxShieldCharges++;
      player.shieldCharges = player.maxShieldCharges;
    }
  },
  {
    id: 'thrusters',
    title: 'OVERDRIVE SERVOS',
    desc: '+15% Move Speed',
    apply: () => {
      player.speed = Math.round(player.speed * 1.15);
    }
  },
  {
    id: 'titan_armor',
    title: 'TITAN CHASSIS',
    desc: '+40 Max HP & Full Repair',
    apply: () => {
      player.maxHealth += 40;
      player.heal(player.maxHealth);
    }
  }
];

const WORKSHOP_PERKS = [
  {
    key: 'chassisArmor',
    title: 'CHASSIS ARMOR',
    costBase: 3,
    costScale: 2,
    desc: '+15 Max Base HP permanently',
    buy: () => { player.applyMetaUpgrades(); }
  },
  {
    key: 'engineSpeed',
    title: 'MOTOR TUNING',
    costBase: 4,
    costScale: 3,
    desc: '+8 Base Movement Speed permanently',
    buy: () => { player.applyMetaUpgrades(); }
  },
  {
    key: 'shieldCapacitor',
    title: 'SHIELD CAPACITOR',
    costBase: 5,
    costScale: 4,
    desc: '-2.0s Shield Recharge Time permanently',
    buy: () => { player.applyMetaUpgrades(); }
  },
  {
    key: 'naniteScavenge',
    title: 'NANITE HARVESTER',
    costBase: 6,
    costScale: 5,
    desc: '+1 Extra Tech Scrap from Nests',
    buy: () => {}
  }
];

function triggerLevelUp() {
  isDrafting = true;
  timeScale = 0.08;

  const availableEvolutions = [];
  if (window.CONFIG.EVOLUTIONS) {
    for (const [key, evo] of Object.entries(window.CONFIG.EVOLUTIONS)) {
      if (!weaponManager.hasWeapon(evo.resultWeapon)) {
        const hasAllIngredients = evo.ingredients.every(name => weaponManager.hasWeapon(name));
        if (hasAllIngredients) {
          availableEvolutions.push({
            id: evo.id,
            title: `★ EVOLUTION: ${evo.name}`,
            desc: evo.desc,
            isEvolutionCard: true,
            apply: () => {
              weaponManager.evolveWeapons(key);
            }
          });
        }
      }
    }
  }

  let candidates = [...UPGRADE_POOL];
  if (weaponManager.slots.length >= weaponManager.maxSlots) {
    candidates = candidates.filter(card => !card.id.endsWith('_weapon') || weaponManager.hasWeapon(card.title.split(' (')[0]));
  }

  const shuffled = [...candidates].sort(() => 0.5 - Math.random());

  if (availableEvolutions.length > 0) {
    draftCards = [availableEvolutions[0], ...shuffled.slice(0, 2)];
  } else {
    draftCards = shuffled.slice(0, 3);
  }

  window.Telemetry.recordEvent('LEVEL', `Robot reached Level ${player.level}!`);
}

function selectCard(index) {
  if (!isDrafting || !draftCards[index]) return;
  draftCards[index].apply();
  player.grow();
  isDrafting = false;
  timeScale = 1.0;
  window.Telemetry.recordEvent('UPGRADE', `Equipped: ${draftCards[index].title}`);
}

function buyWorkshopPerk(perk) {
  const currentRank = window.MetaProgression.perks[perk.key] || 0;
  const cost = perk.costBase + (currentRank * perk.costScale);

  if (window.MetaProgression.bankedTechScrap >= cost) {
    window.MetaProgression.bankedTechScrap -= cost;
    window.MetaProgression.perks[perk.key] = currentRank + 1;
    perk.buy();
    window.saveMetaProgression();
    window.Telemetry.recordEvent('META', `Purchased ${perk.title} Rank ${currentRank + 1}!`);
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === window.CONFIG.ENGINE.debugKey || e.key === window.CONFIG.ENGINE.altDebugKey) {
    debugHUD.classList.toggle('hidden');
  }

  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (!isDrafting && !isWorkshopOpen) {
      isPaused = !isPaused;
    } else if (isWorkshopOpen) {
      isWorkshopOpen = false;
      timeScale = 1.0;
    }
  }

  if (e.code === 'KeyG') {
    player.godMode = !player.godMode;
    if (player.godMode) {
      window.CONFIG.WEAPONS.blaster.damage = 375;
      window.CONFIG.WEAPONS.saw.damage = 250;
      window.CONFIG.WEAPONS.mortar.damage = 400;
      window.CONFIG.WEAPONS.tesla.damage = 350;
      window.CONFIG.WEAPONS.drone.damage = 220;
      window.CONFIG.WEAPONS.flamer.damage = 380;
      if (window.CONFIG.WEAPONS.hyperionTurret) window.CONFIG.WEAPONS.hyperionTurret.damage = 320;
      if (window.CONFIG.WEAPONS.stormSpore) window.CONFIG.WEAPONS.stormSpore.impactDamage = 350;
    } else {
      window.CONFIG.WEAPONS.blaster.damage = window.CONFIG.WEAPONS.blaster.baseDamage;
      window.CONFIG.WEAPONS.saw.damage = window.CONFIG.WEAPONS.saw.baseDamage;
      window.CONFIG.WEAPONS.mortar.damage = window.CONFIG.WEAPONS.mortar.baseDamage;
      window.CONFIG.WEAPONS.tesla.damage = window.CONFIG.WEAPONS.tesla.baseDamage;
      window.CONFIG.WEAPONS.drone.damage = window.CONFIG.WEAPONS.drone.baseDamage;
      window.CONFIG.WEAPONS.flamer.damage = window.CONFIG.WEAPONS.flamer.baseDamage;
    }
  }

  if (e.code === 'KeyB') {
    if (isPaused) return;
    const distToHub = Math.hypot(player.x, player.y);
    if (distToHub < 180) {
      isWorkshopOpen = !isWorkshopOpen;
      timeScale = isWorkshopOpen ? 0.0 : 1.0;
    }
  }

  if (e.code === 'KeyK') player.takeDamage(25);
  if (e.code === 'KeyH') player.heal(20);

  if (e.code === 'KeyT') {
    if (enemyManager) {
      enemyManager.triggerStressTestSwarm(player);
      if (window.Telemetry) {
        window.Telemetry.recordEvent('STRESS', 'Spawned 65-mob stress swarm! Blast them!');
      }
    }
  }

  if (worldManager && worldManager.landmark && worldManager.landmark.repaired) {
    const distToLm = Math.hypot(player.x - worldManager.landmark.x, player.y - worldManager.landmark.y);
    if (distToLm < window.CONFIG.WORLD.terraformedRadius) {
      if (e.code === 'KeyE') {
        worldManager.startRemoteTransfer();
      }
      if (e.code === 'KeyF') {
        worldManager.fastTravelToHubWithTax(player);
      }
    }
  }

  if (e.code === 'KeyE' && worldManager && worldManager.chests) {
    for (const chest of worldManager.chests) {
      if (!chest.opened && Math.hypot(player.x - chest.x, player.y - chest.y) < 65) {
        chest.open(player);
        break;
      }
    }
  }

  if (isDrafting) {
    if (e.key === '1') selectCard(0);
    if (e.key === '2') selectCard(1);
    if (e.key === '3') selectCard(2);
  }
});

window.addEventListener('click', (e) => {
  if (isPaused) {
    const mw = 260, mh = 44;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (e.clientX >= cx - mw / 2 && e.clientX <= cx + mw / 2 && e.clientY >= cy - 30 && e.clientY <= cy - 30 + mh) {
      isPaused = false;
      return;
    }
    if (e.clientX >= cx - mw / 2 && e.clientX <= cx + mw / 2 && e.clientY >= cy + 26 && e.clientY <= cy + 26 + mh) {
      isPaused = false;
      player.die();
      return;
    }
    return;
  }

  if (isDrafting) {
    const cw = 220, ch = 140, gap = 20;
    const totalW = (cw * 3) + (gap * 2);
    const startX = (canvas.width - totalW) / 2;
    const cardY = canvas.height / 2 - ch / 2;

    for (let i = 0; i < 3; i++) {
      const cardX = startX + i * (cw + gap);
      if (e.clientX >= cardX && e.clientX <= cardX + cw && e.clientY >= cardY && e.clientY <= cardY + ch) {
        selectCard(i);
        break;
      }
    }
    return;
  }

  if (isWorkshopOpen) {
    const pw = 420, ph = 70, gap = 14;
    const startX = canvas.width / 2 - pw / 2;
    const startY = canvas.height / 2 - 130;

    for (let i = 0; i < WORKSHOP_PERKS.length; i++) {
      const py = startY + i * (ph + gap);
      if (e.clientX >= startX && e.clientX <= startX + pw && e.clientY >= py && e.clientY <= py + ph) {
        buyWorkshopPerk(WORKSHOP_PERKS[i]);
        break;
      }
    }
  }
});

document.getElementById('btnCopyJSON').addEventListener('click', () => {
  navigator.clipboard.writeText(window.Telemetry.exportJSON()).then(() => alert('Copied JSON report!'));
});
document.getElementById('btnResetTelemetry').addEventListener('click', () => window.Telemetry.resetRun());

function renderFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2 + camera.shakeX, canvas.height / 2 + camera.shakeY);
  if (camera.shakeAngle) {
    ctx.rotate(camera.shakeAngle);
  }
  ctx.translate(-camera.x, -camera.y);

  renderWorldGrid();
  if (decalManager) {
    decalManager.render(ctx, camera.x, camera.y, canvas.width, canvas.height);
  }
  renderSanctuaryHub();
  worldManager.render(ctx);
  pickupManager.render(ctx);
  if (gibManager) {
    gibManager.render(ctx);
  }
  for (const sw of shockwaves) {
    sw.render(ctx);
  }
  enemyManager.render(ctx);
  player.render(ctx);
  weaponManager.render(ctx);

  for (const dtText of damageTexts) {
    ctx.fillStyle = '#feb2b2';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(dtText.text, dtText.x, dtText.y);
  }
  ctx.restore();

  worldManager.renderCompass(ctx, player, canvas.width, canvas.height);
  renderXPBar();

  if (isDrafting) {
    renderDraftOverlay();
  }

  if (isWorkshopOpen) {
    renderWorkshopOverlay();
  }

  renderLandmarkTerminalHUD();
  renderArsenalHUD();
  renderPlayerVitalsHUD();

  if (isPaused) {
    renderPauseMenu();
  }

  const distToHub = Math.hypot(player.x, player.y);
  if (distToHub < 180 && !isWorkshopOpen && !isPaused) {
    ctx.fillStyle = '#48bb78';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[B] OPEN SANCTUARY WORKSHOP', canvas.width / 2, canvas.height / 2 + 50);
  }

  const m = window.Telemetry.metrics;
  const meta = window.MetaProgression;
  ctx.fillStyle = '#48bb78';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`EXPEDITION SCRAP: ${m.resourcesCollected.techScrap}`, 16, 28);
  ctx.fillStyle = '#ecc94b';
  ctx.fillText(`SANCTUARY VAULT: ${meta.bankedTechScrap} SCRAP`, 16, 46);

  if (player.godMode) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('[GOD MODE ON: INVULNERABLE + 15x DMG] (Press G)', 16, 66);
  }

  ctx.fillStyle = 'rgba(160, 174, 192, 0.85)';
  ctx.font = '12px monospace';
  ctx.fillText(`Horde: ${enemyManager.enemies.length}/400 | Weapons: ${weaponManager.slots.length}/6 | [SPACE] Dash | [T] Stress | [ESC] Pause`, 16, canvas.height - 18);
}

function renderWorldGrid() {
  const viewLeft = camera.x - canvas.width / 2 - 100;
  const viewRight = camera.x + canvas.width / 2 + 100;
  const viewTop = camera.y - canvas.height / 2 - 100;
  const viewBottom = camera.y + canvas.height / 2 + 100;
  const w = viewRight - viewLeft;
  const h = viewBottom - viewTop;

  let drawn = false;
  if (window.spriteManager) {
    try {
      const pattern = window.spriteManager.getPattern(ctx, 'tile_wasteland');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(viewLeft, viewTop, w, h);
        drawn = true;
      }
    } catch (e) {}
  }

  if (!drawn) {
    // Надежный красивый процедурный пол вместо глухой пустоты
    ctx.fillStyle = '#12151c';
    ctx.fillRect(viewLeft, viewTop, w, h);

    const gridSize = 64;
    ctx.strokeStyle = 'rgba(45, 55, 72, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(viewLeft / gridSize) * gridSize; x <= viewRight; x += gridSize) {
      ctx.moveTo(x, viewTop); ctx.lineTo(x, viewBottom);
    }
    for (let y = Math.floor(viewTop / gridSize) * gridSize; y <= viewBottom; y += gridSize) {
      ctx.moveTo(viewLeft, y); ctx.lineTo(viewRight, y);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(237, 137, 54, 0.55)';
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 16]);
  ctx.beginPath();
  ctx.arc(0, 0, window.CONFIG.WORLD.ring1Radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function renderSanctuaryHub() {
  ctx.save();
  let drawn = false;
  if (window.spriteManager) {
    try {
      const hubPattern = window.spriteManager.getPattern(ctx, 'tile_hub');
      if (hubPattern) {
        ctx.fillStyle = hubPattern;
        ctx.beginPath();
        ctx.arc(0, 0, 180, 0, Math.PI * 2);
        ctx.fill();
        drawn = true;
      }
    } catch (e) {}
  }

  if (!drawn) {
    ctx.fillStyle = 'rgba(72, 187, 120, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, 180, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#48bb78';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#48bb78';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#a0aec0';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SANCTUARY GATE (0, 0)', 0, 36);
  ctx.restore();
}

function renderDraftOverlay() {
  ctx.fillStyle = 'rgba(5, 7, 12, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#48bb78';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CHASSIS UPGRADE AVAILABLE (BULLET TIME)', canvas.width / 2, canvas.height / 2 - 110);
  ctx.font = '13px monospace';
  ctx.fillStyle = '#a0aec0';
  ctx.fillText('Select with Click or Press [1], [2], or [3]', canvas.width / 2, canvas.height / 2 - 85);

  const cw = 220, ch = 140, gap = 20;
  const totalW = (cw * 3) + (gap * 2);
  const startX = (canvas.width - totalW) / 2;
  const cardY = canvas.height / 2 - ch / 2;

  for (let i = 0; i < draftCards.length; i++) {
    const card = draftCards[i];
    const cardX = startX + i * (cw + gap);

    const isEvo = card.isEvolutionCard;
    ctx.fillStyle = isEvo ? '#1c2826' : '#1a202c';
    ctx.strokeStyle = isEvo ? '#ecc94b' : '#4299e1';
    ctx.lineWidth = isEvo ? 3 : 2;
    ctx.fillRect(cardX, cardY, cw, ch);
    ctx.strokeRect(cardX, cardY, cw, ch);

    ctx.fillStyle = isEvo ? '#f6e05e' : '#63b3ed';
    ctx.font = isEvo ? 'bold 13px monospace' : 'bold 14px monospace';
    ctx.fillText(`[${i + 1}] ${card.title}`, cardX + cw / 2, cardY + 32);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px monospace';
    ctx.fillText(card.desc, cardX + cw / 2, cardY + 75);
  }
}

function gameLoop(currentTimestamp) {
  if (!lastTimestamp) lastTimestamp = currentTimestamp;
  let rawDt = Math.min((currentTimestamp - lastTimestamp) / 1000, window.CONFIG.ENGINE.maxDeltaTime);
  lastTimestamp = currentTimestamp;

  if (hitStopTimer > 0) {
    hitStopTimer -= rawDt;
    camera.update(rawDt, player.x, player.y);
    window.Telemetry.update(rawDt);
    renderFrame();
    requestAnimationFrame(gameLoop);
    return;
  }

  let dt = rawDt * timeScale;

  if (!isWorkshopOpen && !isPaused) {
    player.update(dt);
    worldManager.update(dt, player, enemyManager);
    enemyManager.update(dt, player, camera, canvas.width, canvas.height, worldManager.nests.length);

    const allTargets = [...enemyManager.enemies, ...worldManager.nests];
    weaponManager.update(dt, allTargets);

    if (gibManager) {
      gibManager.update(dt, decalManager);
    }

    for (let i = shockwaves.length - 1; i >= 0; i--) {
      shockwaves[i].update(dt);
      if (!shockwaves[i].alive) {
        shockwaves.splice(i, 1);
      }
    }

    for (let i = pickupManager.pickups.length - 1; i >= 0; i--) {
      const p = pickupManager.pickups[i];
      p.update(dt, player);
      if (!p.alive) {
        if (p.type === 'bio') {
          if (player.addXP(p.value)) {
            triggerLevelUp();
          }
        }
        pickupManager.pickups.splice(i, 1);
      }
    }

    if (damageTexts.length > 60) {
      damageTexts.splice(0, damageTexts.length - 60);
    }
    for (let i = damageTexts.length - 1; i >= 0; i--) {
      damageTexts[i].y -= 30 * dt;
      damageTexts[i].life -= dt;
      if (damageTexts[i].life <= 0) damageTexts.splice(i, 1);
    }

    camera.update(rawDt, player.x, player.y);
    window.Telemetry.update(rawDt);
  }

  renderFrame();
  requestAnimationFrame(gameLoop);
}

function renderPlayerVitalsHUD() {
  const panelW = 210;
  const panelH = 76;
  const panelX = canvas.width - panelW - 16;
  const panelY = 16;

  ctx.save();
  ctx.fillStyle = 'rgba(13, 16, 23, 0.88)';
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 1.5;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = '#a0aec0';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('HULL INTEGRITY', panelX + 10, panelY + 16);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#fc8181';
  ctx.fillText(`💀 ${window.Telemetry.metrics.kills}`, panelX + panelW - 10, panelY + 16);

  const barX = panelX + 10;
  const barY = panelY + 23;
  const barW = panelW - 20;
  const barH = 14;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX, barY, barW, barH);

  const hpRatio = Math.max(0, Math.min(1, player.health / player.maxHealth));
  ctx.fillStyle = hpRatio > 0.4 ? '#48bb78' : '#e53e3e';
  ctx.fillRect(barX, barY, barW * hpRatio, barH);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(player.health)} / ${Math.round(player.maxHealth)}`, barX + barW / 2, barY + 11);

  const shieldY = panelY + 44;
  ctx.fillStyle = '#a0aec0';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('AEGIS SHIELD:', barX, shieldY + 14);

  const shieldStartX = barX + 85;
  for (let i = 0; i < player.maxShieldCharges; i++) {
    const isCharged = i < player.shieldCharges;
    ctx.fillStyle = isCharged ? '#4299e1' : '#2d3748';
    ctx.strokeStyle = isCharged ? '#bee3f8' : '#4a5568';
    ctx.lineWidth = 1;
    ctx.fillRect(shieldStartX + i * 14, shieldY + 3, 11, 13);
    ctx.strokeRect(shieldStartX + i * 14, shieldY + 3, 11, 13);
  }

  if (player.shieldCharges < player.maxShieldCharges) {
    const rechargeRatio = player.shieldTimer / player.shieldRechargeTime;
    ctx.fillStyle = '#63b3ed';
    ctx.fillRect(shieldStartX + player.shieldCharges * 14, shieldY + 14, 11 * rechargeRatio, 2);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#68d391';
  ctx.font = '10px monospace';
  ctx.fillText(`+${player.healthRegenRate.toFixed(1)}/s`, panelX + panelW - 10, shieldY + 14);

  ctx.restore();
}

function renderPauseMenu() {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 7, 12, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#63b3ed';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SYSTEM PAUSED', canvas.width / 2, canvas.height / 2 - 90);

  ctx.fillStyle = '#a0aec0';
  ctx.font = '12px monospace';
  ctx.fillText('Press [ESC] or [P] to Return', canvas.width / 2, canvas.height / 2 - 60);

  const mw = 260, mh = 44;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = '#1a202c';
  ctx.strokeStyle = '#48bb78';
  ctx.lineWidth = 2;
  ctx.fillRect(cx - mw / 2, cy - 30, mw, mh);
  ctx.strokeRect(cx - mw / 2, cy - 30, mw, mh);

  ctx.fillStyle = '#48bb78';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('RESUME MISSION', cx, cy - 3);

  ctx.fillStyle = '#1a202c';
  ctx.strokeStyle = '#e53e3e';
  ctx.lineWidth = 2;
  ctx.fillRect(cx - mw / 2, cy + 26, mw, mh);
  ctx.strokeRect(cx - mw / 2, cy + 26, mw, mh);

  ctx.fillStyle = '#fc8181';
  ctx.fillText('ABORT RUN (RESTART)', cx, cy + 53);

  ctx.restore();
}

function renderArsenalHUD() {
  const slots = weaponManager.slots;
  const maxSlots = weaponManager.maxSlots;
  const slotW = 105;
  const slotH = 46;
  const gap = 8;
  const totalW = maxSlots * slotW + (maxSlots - 1) * gap;
  const startX = (canvas.width - totalW) / 2;
  const startY = canvas.height - slotH - 12;

  ctx.save();
  for (let i = 0; i < maxSlots; i++) {
    const x = startX + i * (slotW + gap);
    const y = startY;
    const wpn = slots[i];

    if (wpn) {
      const isEvo = !!wpn.isEvolution;
      ctx.fillStyle = isEvo ? 'rgba(28, 40, 38, 0.92)' : 'rgba(18, 22, 31, 0.88)';
      ctx.strokeStyle = isEvo ? '#ecc94b' : '#4a5568';
      ctx.lineWidth = isEvo ? 2 : 1;
      ctx.fillRect(x, y, slotW, slotH);
      ctx.strokeRect(x, y, slotW, slotH);

      ctx.fillStyle = isEvo ? '#f6e05e' : '#63b3ed';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      const title = (isEvo ? '★ ' : '') + wpn.name;
      ctx.fillText(title.length > 13 ? title.slice(0, 12) + '…' : title, x + 6, y + 14);

      ctx.fillStyle = '#cbd5e0';
      ctx.font = '9px monospace';
      let statLine1 = '';
      let statLine2 = '';

      if (wpn.cfg) {
        const dmg = wpn.cfg.damage || wpn.cfg.impactDamage || wpn.cfg.zoneDamage || 0;
        statLine1 = `DMG: ${Math.round(dmg)}`;
        if (wpn.cfg.fireRate) {
          statLine2 = `RATE: ${wpn.cfg.fireRate.toFixed(2)}s`;
        } else if (wpn.cfg.cooldown) {
          statLine2 = `CD: ${wpn.cfg.cooldown.toFixed(2)}s`;
        } else if (wpn.cfg.bladeCount) {
          statLine2 = `BLADES: ${wpn.cfg.bladeCount}`;
        } else if (wpn.cfg.droneCount) {
          statLine2 = `DRONES: ${wpn.cfg.droneCount}`;
        }
      }

      ctx.fillText(statLine1, x + 6, y + 27);
      if (statLine2) ctx.fillText(statLine2, x + 6, y + 38);

    } else {
      ctx.fillStyle = 'rgba(13, 16, 23, 0.55)';
      ctx.strokeStyle = 'rgba(74, 85, 104, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.fillRect(x, y, slotW, slotH);
      ctx.strokeRect(x, y, slotW, slotH);
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(113, 128, 150, 0.6)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`SLOT ${i + 1}`, x + slotW / 2, y + 20);
      ctx.fillText('[EMPTY]', x + slotW / 2, y + 33);
    }
  }
  ctx.restore();
}

function renderXPBar() {
  const barWidth = canvas.width * 0.5;
  const barHeight = 8;
  const barX = (canvas.width - barWidth) / 2;
  const barY = 16;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

  const xpRatio = Math.min(1, player.xp / player.xpToNext);
  ctx.fillStyle = '#48bb78';
  ctx.fillRect(barX, barY, barWidth * xpRatio, barHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`LVL ${player.level} [${player.xp} / ${player.xpToNext} ESSENCE]`, canvas.width / 2, barY + 24);
}

function renderWorkshopOverlay() {
  ctx.fillStyle = 'rgba(5, 7, 12, 0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ecc94b';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SANCTUARY WORKSHOP (PERMANENT UPGRADES)', canvas.width / 2, canvas.height / 2 - 180);

  ctx.fillStyle = '#a0aec0';
  ctx.font = '13px monospace';
  ctx.fillText(`AVAILABLE VAULT SCRAP: ${window.MetaProgression.bankedTechScrap} | Press [B] to Close`, canvas.width / 2, canvas.height / 2 - 150);

  const pw = 420, ph = 70, gap = 14;
  const startX = canvas.width / 2 - pw / 2;
  const startY = canvas.height / 2 - 130;

  for (let i = 0; i < WORKSHOP_PERKS.length; i++) {
    const perk = WORKSHOP_PERKS[i];
    const py = startY + i * (ph + gap);
    const rank = window.MetaProgression.perks[perk.key] || 0;
    const cost = perk.costBase + (rank * perk.costScale);
    const canAfford = window.MetaProgression.bankedTechScrap >= cost;

    ctx.fillStyle = canAfford ? '#1a202c' : '#12161f';
    ctx.strokeStyle = canAfford ? '#ecc94b' : '#4a5568';
    ctx.lineWidth = 1.5;
    ctx.fillRect(startX, py, pw, ph);
    ctx.strokeRect(startX, py, pw, ph);

    ctx.textAlign = 'left';
    ctx.fillStyle = canAfford ? '#f6e05e' : '#a0aec0';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${perk.title} [RANK ${rank}]`, startX + 16, py + 26);

    ctx.fillStyle = '#cbd5e0';
    ctx.font = '11px monospace';
    ctx.fillText(perk.desc, startX + 16, py + 50);

    ctx.textAlign = 'right';
    ctx.fillStyle = canAfford ? '#48bb78' : '#e53e3e';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`COST: ${cost} SCRAP`, startX + pw - 16, py + 38);
  }
}

function renderLandmarkTerminalHUD() {
  if (!worldManager || !worldManager.landmark || !worldManager.landmark.repaired) return;

  const distToLm = Math.hypot(player.x - worldManager.landmark.x, player.y - worldManager.landmark.y);
  if (distToLm < window.CONFIG.WORLD.terraformedRadius) {
    ctx.fillStyle = 'rgba(13, 16, 23, 0.85)';
    ctx.fillRect(canvas.width / 2 - 230, canvas.height - 120, 460, 60);
    ctx.strokeStyle = '#48bb78';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(canvas.width / 2 - 230, canvas.height - 120, 460, 60);

    ctx.textAlign = 'center';
    if (worldManager.transferActive) {
      ctx.fillStyle = '#fc8181';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`TRANSFER ACTIVE: ${Math.ceil(worldManager.transferTimer)}s REMAINING!`, canvas.width / 2, canvas.height - 85);
    } else {
      ctx.fillStyle = '#ecc94b';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('[E] START 25s SCRAP TRANSFER (100% SECURED)', canvas.width / 2, canvas.height - 95);
      ctx.fillStyle = '#63b3ed';
      ctx.fillText('[F] FAST TRAVEL TO HUB (DISTANCE TAX)', canvas.width / 2, canvas.height - 75);
    }
  }
}

requestAnimationFrame(gameLoop);