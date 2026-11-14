// js/weapons/upgrades.js — Пул апгрейдів рівня та генерація карток драфту

import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { EVOLUTIONS } from './catalog.js';

// Картки зброї: якщо зброї немає — встановити, якщо є — +1 ранг (WEAPON_UPGRADES у catalog.js).
// requiresOwned: лише апгрейд (стартовий Blaster і еволюції не встановлюються з драфту).
const WEAPON_CARDS = [
  { key: 'blaster', title: 'TECH BLASTER', requiresOwned: true, upgradeDesc: '+6 Damage, +20% Fire Rate' },
  { key: 'saw', title: 'SCRAP SAW (ORBITAL)', mountDesc: 'Mount orbital circular saw blade', upgradeDesc: '+1 Blade (max 4), +6 Damage' },
  { key: 'mortar', title: 'BIO-SPORE MORTAR', mountDesc: 'Lob spores creating lingering slowing AoE clouds', upgradeDesc: '+14 Damage, +15 Cloud Radius (max 120)' },
  { key: 'tesla', title: 'TESLA ARC (CHAIN)', mountDesc: 'Unleash chained lightning bouncing between foes', upgradeDesc: '+8 Damage, +1 Chain Jump' },
  { key: 'drone', title: 'AEGIS DRONES (ORBITAL)', mountDesc: 'Deploy orbiting combat drones with laser interceptors', upgradeDesc: '+1 Drone (max 4), +5 Damage' },
  { key: 'flamer', title: 'PLASMA PURIFIER (CONE)', mountDesc: 'Auto-aimed cone of incinerating plasma that burns through foes', upgradeDesc: '+18 Damage, +25 Range (max 260)' },
  { key: 'staticAura', title: 'STATIC AURA (AURA)', mountDesc: 'Emit pulsing electromagnetic field slowing and shocking nearby foes', upgradeDesc: '+5 Damage, +15 Radius (max 180)' },

  { key: 'voltHurricane', title: 'VOLT HURRICANE', requiresOwned: true, upgradeDesc: '+8 Damage, +6 Chain Damage, +1 Blade (max 4)' },
  { key: 'biomassIncinerator', title: 'BIOMASS INCINERATOR', requiresOwned: true, upgradeDesc: '+15 Impact, +8 Burn Zone Damage, +10 Radius (max 140)' },
  { key: 'hyperionTurret', title: 'HYPERION TURRET', requiresOwned: true, upgradeDesc: '+10 Damage, +6 Salvo Damage, +10% Fire Rate' },
  { key: 'stormSpore', title: 'STORM SPORE', requiresOwned: true, upgradeDesc: '+12 Damage, +6 Chain Damage, +10 Radius (max 130)' },
];

const PASSIVE_CARDS = [
  {
    id: 'nanite_regen',
    title: 'NANITE REPAIR',
    desc: '+1.2 HP/sec Passive Regeneration',
    apply: () => {
      state.player.healthRegenRate += 1.2;
    }
  },
  {
    id: 'magnet_pulse',
    title: 'MAGNET PULSE',
    desc: '+45% Pickup Range & Instant Vacuum',
    apply: () => {
      CONFIG.PLAYER.pickupRadius = Math.round(CONFIG.PLAYER.pickupRadius * 1.45);
      for (const p of state.pickupManager.pickups) p.isMagnetized = true;
    }
  },
  {
    id: 'shield_up',
    title: 'AEGIS BATTERY',
    desc: '+1 Max Shield Charge & Instant Recharge',
    apply: () => {
      state.player.runBonusShields++;
      state.player.applyMetaUpgrades(false);
      state.player.shieldCharges = state.player.maxShieldCharges;
    }
  },
  {
    id: 'thrusters',
    title: 'OVERDRIVE SERVOS',
    desc: '+15% Move Speed',
    apply: () => {
      state.player.runSpeedMult *= 1.15;
      state.player.applyMetaUpgrades(false);
    }
  },
  {
    id: 'titan_armor',
    title: 'TITAN CHASSIS',
    desc: '+40 Max HP & Full Repair',
    apply: () => {
      state.player.runBonusHealth += 40;
      state.player.applyMetaUpgrades(false);
      state.player.heal(state.player.maxHealth);
    }
  }
];

// Перетворює опис картки зброї на конкретну картку з урахуванням арсеналу; null — не пропонувати
function buildWeaponCard(def, wm) {
  const owned = wm.hasWeaponKey(def.key);
  if (owned) {
    const nextRank = wm.getRank(def.key) + 1;
    return {
      id: `${def.key}_upgrade`,
      title: `${def.title.replace(/\s*\(.*\)$/, '')} Mk${nextRank + 1}`, // «(ORBITAL)» прибираємо, щоб влізло в картку
      desc: def.upgradeDesc,
      apply: () => wm.upgradeWeapon(def.key)
    };
  }
  if (def.requiresOwned || wm.consumedKeys.has(def.key) || wm.slots.length >= wm.maxSlots) return null;
  return {
    id: `${def.key}_mount`,
    title: def.title,
    desc: def.mountDesc,
    apply: () => wm.addWeaponByKey(def.key)
  };
}

function shuffleCopy(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function generateDraftCards(weaponManager, count = 3) {
  const availableEvolutions = [];
  for (const [key, evo] of Object.entries(EVOLUTIONS)) {
    const resultCfg = weaponManager.getConfig(evo.resultKey);
    if (
      resultCfg &&
      !weaponManager.hasWeapon(resultCfg.name) &&
      evo.ingredients.every(name => weaponManager.hasWeapon(name))
    ) {
      const carried = weaponManager.getCarriedRanks(key);
      availableEvolutions.push({
        id: evo.id,
        title: `★ EVOLUTION: ${evo.name}`,
        desc: carried > 0 ? `${evo.desc} Keeps all ${carried} upgrades.` : evo.desc,
        isEvolutionCard: true,
        apply: () => weaponManager.evolveWeapons(key)
      });
    }
  }

  const candidates = [...PASSIVE_CARDS];
  for (const def of WEAPON_CARDS) {
    const card = buildWeaponCard(def, weaponManager);
    if (card) candidates.push(card);
  }

  const picked = [];
  if (availableEvolutions.length > 0) {
    picked.push(availableEvolutions[Math.floor(Math.random() * availableEvolutions.length)]);
  }

  // На старті гарантуємо нову зброю: з одним бластером без неї не вижити
  const guaranteed = CONFIG.DRAFT.newWeaponCardsBySlots[weaponManager.slots.length] || 0;
  const mounts = shuffleCopy(candidates.filter(c => c.id.endsWith('_mount')));
  for (let i = 0; i < guaranteed && i < mounts.length && picked.length < count; i++) picked.push(mounts[i]);

  for (const card of shuffleCopy(candidates)) {
    if (picked.length >= count) break;
    if (!picked.includes(card)) picked.push(card);
  }
  // Еволюція лишається першою; решта у випадковому порядку
  const head = picked[0] && picked[0].isEvolutionCard ? [picked.shift()] : [];
  return [...head, ...shuffleCopy(picked)];
}
