// js/weapons/upgrades.js — Пул апгрейдів рівня та генерація карток драфту

import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { EVOLUTIONS } from './catalog.js';

export const UPGRADE_POOL = [
  {
    id: 'blaster_tune',
    title: 'OVERCLOCK BLASTER',
    weaponName: 'Tech Blaster',
    desc: '+6 Damage, +20% Fire Rate',
    apply: () => {
      const c = state.weaponManager.getConfig('blaster');
      if (c) {
        c.damage += 6;
        c.fireRate = Math.max(0.16, c.fireRate * 0.8);
      }
    }
  },
  {
    id: 'scrap_saw_weapon',
    title: 'SCRAP SAW (ORBITAL)',
    weaponName: 'Scrap Saw',
    desc: 'Mount orbital circular saw blade',
    apply: () => {
      if (!state.weaponManager.hasWeapon('Scrap Saw')) {
        state.weaponManager.addWeaponByKey('saw');
      } else {
        const c = state.weaponManager.getConfig('saw');
        if (c) {
          c.count = Math.min(4, c.count + 1);
          c.damage += 6;
        }
      }
    }
  },
  {
    id: 'bio_mortar_weapon',
    title: 'BIO-SPORE MORTAR',
    weaponName: 'Bio-Spore Mortar',
    desc: 'Lob spores creating lingering slowing AoE clouds',
    apply: () => {
      if (!state.weaponManager.hasWeapon('Bio-Spore Mortar')) {
        state.weaponManager.addWeaponByKey('mortar');
      } else {
        const c = state.weaponManager.getConfig('mortar');
        if (c) {
          c.damage += 14;
          c.zoneRadius = Math.min(120, c.zoneRadius + 15);
        }
      }
    }
  },
  {
    id: 'tesla_arc_weapon',
    title: 'TESLA ARC (CHAIN)',
    weaponName: 'Tesla Arc',
    desc: 'Unleash chained lightning bouncing between foes',
    apply: () => {
      if (!state.weaponManager.hasWeapon('Tesla Arc')) {
        state.weaponManager.addWeaponByKey('tesla');
      } else {
        const c = state.weaponManager.getConfig('tesla');
        if (c) {
          c.damage += 8;
          c.chainCount += 1;
        }
      }
    }
  },
  {
    id: 'aegis_drones_weapon',
    title: 'AEGIS DRONES (ORBITAL)',
    weaponName: 'Aegis Drones',
    desc: 'Deploy orbiting combat drones with laser interceptors',
    apply: () => {
      if (!state.weaponManager.hasWeapon('Aegis Drones')) {
        state.weaponManager.addWeaponByKey('drone');
      } else {
        const c = state.weaponManager.getConfig('drone');
        if (c) {
          c.count = Math.min(4, c.count + 1);
          c.damage += 5;
        }
      }
    }
  },
  {
    id: 'plasma_purifier_weapon',
    title: 'PLASMA PURIFIER (CONE)',
    weaponName: 'Plasma Purifier',
    desc: 'Unleash continuous conical stream of incinerating plasma',
    apply: () => {
      if (!state.weaponManager.hasWeapon('Plasma Purifier')) {
        state.weaponManager.addWeaponByKey('flamer');
      } else {
        const c = state.weaponManager.getConfig('flamer');
        if (c) {
          c.damage += 18;
          c.range = Math.min(260, c.range + 25);
        }
      }
    }
  },
  {
    id: 'static_aura_weapon',
    title: 'STATIC AURA (AURA)',
    weaponName: 'Static Aura',
    desc: 'Emit pulsing electromagnetic field slowing and shocking nearby foes',
    apply: () => {
      if (!state.weaponManager.hasWeapon('Static Aura')) {
        state.weaponManager.addWeaponByKey('staticAura');
      } else {
        const c = state.weaponManager.getConfig('staticAura');
        if (c) {
          c.damage += 5;
          c.radius = Math.min(180, c.radius + 15);
        }
      }
    }
  },
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
      state.player.maxShieldCharges++;
      state.player.shieldCharges = state.player.maxShieldCharges;
    }
  },
  {
    id: 'thrusters',
    title: 'OVERDRIVE SERVOS',
    desc: '+15% Move Speed',
    apply: () => {
      state.player.speed = Math.round(state.player.speed * 1.15);
    }
  },
  {
    id: 'titan_armor',
    title: 'TITAN CHASSIS',
    desc: '+40 Max HP & Full Repair',
    apply: () => {
      state.player.maxHealth += 40;
      state.player.heal(state.player.maxHealth);
    }
  }
];

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
      availableEvolutions.push({
        id: evo.id,
        title: `★ EVOLUTION: ${evo.name}`,
        desc: evo.desc,
        isEvolutionCard: true,
        apply: () => weaponManager.evolveWeapons(key)
      });
    }
  }

  let candidates = UPGRADE_POOL;
  if (weaponManager.slots.length >= weaponManager.maxSlots) {
    candidates = candidates.filter(card => !card.weaponName || weaponManager.hasWeapon(card.weaponName));
  }

  const shuffled = shuffleCopy(candidates);
  if (availableEvolutions.length > 0) {
    return [availableEvolutions[0], ...shuffled.slice(0, Math.max(0, count - 1))];
  }
  return shuffled.slice(0, count);
}