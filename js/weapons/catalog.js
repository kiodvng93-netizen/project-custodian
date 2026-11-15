// js/weapons/catalog.js — Каталог зброї на 6 універсальних архетипах (Read-only шаблон)

export const WEAPON_ARCHETYPES = {
  PROJECTILE: 'projectile',
  MORTAR: 'mortar',
  ORBITAL: 'orbital',
  CHAIN: 'chain',
  CONE: 'cone',
  AURA: 'aura',
};

export const WEAPON_CATALOG = {
  blaster: {
    key: 'blaster',
    name: 'Tech Blaster',
    archetype: WEAPON_ARCHETYPES.PROJECTILE,
    damage: 25,
    fireRate: 0.65,
    range: 360,
    projectileSpeed: 520,
    projectileSize: 5,
    pierce: 1,
    color: '#63b3ed',
  },

  saw: {
    key: 'saw',
    name: 'Scrap Saw',
    archetype: WEAPON_ARCHETYPES.ORBITAL,
    // Було 1 лезо на 56px, оберт ~2с: ворог перетинав смугу за ~0.3с і здебільшого проходив повз,
    // а Сталкер починав випад з 84px — ззовні орбіти. Тепер більше лез, далі, швидше, з відкиданням
    // Але не фортеця: 6 лез з відкиданням тримали натовп назовні (бот-фокус на пилку жив 13 хв проти 5 у бластера)
    damage: 14,
    count: 2,
    maxCount: 4,
    orbitRadius: 95,
    orbitSpeed: 4.4,
    hitRadius: 16,
    hitCooldown: 0.25,
    knockback: 10,        // px від робота за влучання
    interruptStun: 0.18,  // секунд оглушення лише для тих, хто замахується/робить випад
    visual: 'saw',
  },

  mortar: {
    key: 'mortar',
    name: 'Bio-Spore Mortar',
    archetype: WEAPON_ARCHETYPES.MORTAR,
    damage: 40,
    fireRate: 2.0,
    // Ближче й швидше: за 0.85с із 420px ворог встигав пройти ~130px і хмара падала позаду пачки.
    // Тепер снаряд летить 0.55с з упередженням (leadFactor × шлях ворога за політ)
    minRange: 40,
    maxRange: 340,
    flightDuration: 0.55,
    leadFactor: 0.9,
    zoneRadius: 65,
    zoneDuration: 3.2,
    dotTickRate: 0.4,
    dotDamage: 9,
    slowFactor: 0.45,
    theme: 'spore',
  },

  tesla: {
    key: 'tesla',
    name: 'Tesla Arc',
    archetype: WEAPON_ARCHETYPES.CHAIN,
    damage: 28,
    fireRate: 1.35,
    range: 320,
    chainRange: 170,
    chainCount: 4,
    color: '#81e6d9',
  },

  drone: {
    key: 'drone',
    name: 'Aegis Drones',
    archetype: WEAPON_ARCHETYPES.ORBITAL,
    damage: 16,
    pushbackDamage: 24,
    fireRate: 1.1,
    count: 2,
    orbitRadius: 95,
    orbitSpeed: 1.6,
    hitRadius: 16,
    hitCooldown: 0.2,
    pushForce: 90,
    firingRange: 220,
    subAttack: 'laser',
    visual: 'drone',
  },

  flamer: {
    key: 'flamer',
    name: 'Plasma Purifier',
    archetype: WEAPON_ARCHETYPES.CONE,
    damage: 45,
    range: 155,
    spreadAngle: 0.78,
    burnDuration: 1.2,
    burnDamage: 8,
  },

  staticAura: {
    key: 'staticAura',
    name: 'Static Aura',
    archetype: WEAPON_ARCHETYPES.AURA,
    damage: 14,
    fireRate: 0.45,
    radius: 105,
    slowFactor: 0.72,
    pushForce: 55,
    color: '#9f7aea',
  },

  // --- ЕВОЛЮЦІЇ ---
  voltHurricane: {
    key: 'voltHurricane',
    name: 'Volt Hurricane',
    archetype: WEAPON_ARCHETYPES.ORBITAL,
    isEvolution: true,
    damage: 32,
    chainDamage: 24,
    count: 3,
    maxCount: 5,
    orbitRadius: 110,
    orbitSpeed: 5.0,
    hitRadius: 18,
    hitCooldown: 0.22,
    knockback: 14,
    interruptStun: 0.2,
    chainTargets: 3,
    chainRange: 150,
    subAttack: 'chain',
    visual: 'volt_saw',
  },

  biomassIncinerator: {
    key: 'biomassIncinerator',
    name: 'Biomass Incinerator',
    archetype: WEAPON_ARCHETYPES.MORTAR,
    isEvolution: true,
    damage: 65,
    fireRate: 1.8,
    minRange: 40,
    maxRange: 360,
    flightDuration: 0.5,
    leadFactor: 0.9,
    zoneRadius: 90,
    zoneDuration: 4.0,
    zoneDamage: 38,
    healPerSec: 4.0,
    slowFactor: 0.50,
    theme: 'ash',
  },

  hyperionTurret: {
    key: 'hyperionTurret',
    name: 'Hyperion Turret',
    archetype: WEAPON_ARCHETYPES.PROJECTILE,
    isEvolution: true,
    damage: 48,
    fireRate: 0.42,
    range: 420,
    projectileSpeed: 620,
    projectileSize: 7,
    pierce: 2,
    orbitOffsetRadius: 60,
    salvoCooldown: 4.2,
    salvoCount: 12,
    salvoDamage: 35,
    color: '#63b3ed',
  },

  stormSpore: {
    key: 'stormSpore',
    name: 'Storm Spore',
    archetype: WEAPON_ARCHETYPES.MORTAR,
    isEvolution: true,
    damage: 50,
    fireRate: 1.9,
    minRange: 40,
    maxRange: 360,
    flightDuration: 0.5,
    leadFactor: 0.9,
    zoneRadius: 85,
    zoneDuration: 3.5,
    dotDamage: 14,
    dotTickRate: 0.35,
    chainDamage: 22,
    chainInterval: 0.5,
    shieldBoost: 0.35,
    slowFactor: 0.45,
    theme: 'storm',
  },
};

export const EVOLUTIONS = {
  voltHurricane: {
    id: 'volt_hurricane',
    name: 'VOLT HURRICANE',
    desc: 'EVOLUTION: Electrified hyper-saws unleash chain lightning bursts on impact. Frees 1 weapon slot!',
    ingredients: ['Scrap Saw', 'Tesla Arc'],
    resultKey: 'voltHurricane',
  },
  biomassIncinerator: {
    id: 'biomass_incinerator',
    name: 'BIOMASS INCINERATOR',
    desc: 'EVOLUTION (TECH+BIO): Lobs plasma-spore bombs leaving cleansing zones that roast foes and repair robot chassis (+4 HP/s)!',
    ingredients: ['Plasma Purifier', 'Bio-Spore Mortar'],
    resultKey: 'biomassIncinerator',
  },
  hyperionTurret: {
    id: 'hyperion_turret',
    name: 'HYPERION TURRET',
    desc: 'EVOLUTION (TECH+TECH): Heavy orbiting platform with piercing twin-lasers and periodic 360° defensive salvos!',
    ingredients: ['Tech Blaster', 'Aegis Drones'],
    resultKey: 'hyperionTurret',
  },
  stormSpore: {
    id: 'storm_spore',
    name: 'STORM SPORE',
    desc: 'EVOLUTION (TECH+BIO): Electrified spore clusters that shock surrounded enemies and accelerate robot shield recharge!',
    ingredients: ['Tesla Arc', 'Bio-Spore Mortar'],
    resultKey: 'stormSpore',
  },
};

// Один ранг апгрейду кожної зброї (мутує runConfig цього забігу).
// Використовується картками драфту і переносом рангів інгредієнтів в еволюцію.
export const WEAPON_UPGRADES = {
  blaster: (c) => { c.damage += 6; c.fireRate = Math.max(0.16, c.fireRate * 0.8); },
  saw: (c) => { c.count = Math.min(c.maxCount, c.count + 1); c.damage += 5; c.orbitRadius = Math.min(130, c.orbitRadius + 6); },
  mortar: (c) => { c.damage += 14; c.zoneRadius = Math.min(120, c.zoneRadius + 15); },
  tesla: (c) => { c.damage += 8; c.chainCount += 1; },
  drone: (c) => { c.count = Math.min(4, c.count + 1); c.damage += 5; },
  flamer: (c) => { c.damage += 18; c.range = Math.min(260, c.range + 25); },
  staticAura: (c) => { c.damage += 5; c.radius = Math.min(180, c.radius + 15); },

  voltHurricane: (c) => { c.damage += 8; c.chainDamage += 6; c.count = Math.min(c.maxCount, c.count + 1); },
  biomassIncinerator: (c) => { c.damage += 15; c.zoneDamage += 8; c.zoneRadius = Math.min(140, c.zoneRadius + 10); },
  hyperionTurret: (c) => { c.damage += 10; c.salvoDamage += 6; c.fireRate = Math.max(0.2, c.fireRate * 0.9); },
  stormSpore: (c) => { c.damage += 12; c.chainDamage += 6; c.zoneRadius = Math.min(130, c.zoneRadius + 10); },
};

export function weaponKeyByName(name) {
  const target = name.toLowerCase().trim();
  for (const cfg of Object.values(WEAPON_CATALOG)) {
    if (cfg.name.toLowerCase() === target) return cfg.key;
  }
  return null;
}

export function createRunWeaponConfigs() {
  const clone = {};
  for (const [key, cfg] of Object.entries(WEAPON_CATALOG)) {
    clone[key] = { ...cfg };
  }
  return clone;
}