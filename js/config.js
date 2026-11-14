// js/config.js — Базовий баланс та мета-сейви (Read-only константи)

export const CONFIG = {
  ENGINE: {
    targetFPS: 60,
    maxDeltaTime: 0.1,
    debugKey: '`',
    altDebugKey: 'F2',
  },

  WORLD: {
    ring1Radius: 15000,
    ring2Radius: 28000,
    ring3Radius: 42000,
    ring4Radius: 60000,
    tileGridSize: 64,
    nestCountRing1: 10,
    outpostCount: 3,
    landmarkPos: { x: 3800, y: -3000 },
    wardenPos: { x: -5200, y: 4200 },
    wardenAggroRadius: 900,
    terraformedRadius: 320,
    ruinsClusterCount: 40,
    chestSpawnChance: 0.65,
  },

  OUTPOST: {
    radius: 32,
    captureRadius: 170,
    defenseDuration: 12.0,
    ambushCount: 8,
    minBonusScrap: 2,
    bonusRate: 0.35,
    healReward: 20,
  },

  HUB: {
    radius: 180,
    defenseRange: 255,
    healRate: 14,
    maxHealPool: 220,
    turretFireRate: 0.42,
    turretDamage: 26,
    turretTargetsPerShot: 2,
    campZoneRadius: 250,
    campDecayZone: 340,
    campGraceTime: 150,
    enrageTime: 180,
    campDecayRate: 0.45,
  },

  PLAYER: {
    baseSpeed: 180,
    baseHealth: 100,
    baseShieldCharges: 1,
    shieldRechargeTime: 25.0,
    pickupRadius: 110,
    invulnOnDamage: 0.65,
    invulnOnShieldBreak: 0.70,
    pushbackRadius: 85,
    pushbackForce: 220,

    DASH: {
      speed: 740,
      duration: 0.22,
      cooldown: 2.2,
      iFrames: 0.28,
      shockwaveRadius: 55,
    },

    CRUISE: {
      activationTime: 2.2,
      speedMultiplier: 1.45,
    }
  },

  CAMERA: {
    lerpSpeed: 0.1,
    maxOffsetX: 11,
    maxOffsetY: 11,
    maxAngle: 0.014,
    traumaDecay: 2.1,
    traumaExponent: 1.5,
  },

  JUICE: {
    hitStop: {
      playerHit: 0.05,
      shieldBreak: 0.04,
      mortarExplosion: 0.028,
      incineratorExplosion: 0.038,
      stalkerKill: 0.024,
      wardenKill: 0.12,
      nestAlarm: 0.04,
      nestDestroy: 0.06,
    },
    trauma: {
      playerHit: 0.75,
      shieldBreak: 0.48,
      mortarExplosion: 0.34,
      incineratorExplosion: 0.44,
      hyperionSalvo: 0.32,
      stalkerKill: 0.22,
      wardenKill: 1.0,
      nestAlarm: 0.35,
      nestDestroy: 0.50,
      chestOpen: 0.30,
      dash: 0.20,
    }
  },

  DECALS: { chunkSize: 512, maxChunks: 128 },
  GIBS: { maxActive: 140, friction: 0.88, gravity: -480 },
  SPATIAL_GRID: { cellSize: 140 },

  NEST: {
    maxHealth: 5000,
    radius: 38,
    spawnInterval: 3.6,
    alarmThresholds: [0.75, 0.50, 0.25],
    defenseSwarmCount: 7,
  },

  CHESTS: {
    radius: 16,
    interactionRadius: 65,
    minScrap: 3,
    maxScrap: 5,
    minBio: 5,
    maxBio: 7,
  },

  ENEMIES: {
    maxActive: 400,
    maxRearChasers: 105,
    despawnRadius: 1800,
    hubSafeRadius: 360,
    rampTimeSeconds: 120,
    WAVE: {
      cycleDuration: 40,
      surgeDuration: 22,
      ebbDuration: 8,
      ambushTriggerTime: 10,
      minInterval: 0.14,
      maxInterval: 0.52,
      breatherAlertInterval: 1.1,
      escalation: {
        hpPerWave: 0.14,
        speedPerWave: 0.045,
        damagePerWave: 0.09,
        maxSpeedMult: 1.55,
      },
    },
    types: {
      sprout: {
        name: 'Corrupted Sprout', hp: 44, speed: 158, damage: 16, radius: 15,
        color: '#9b2c2c', outline: '#fc8181', xpValue: 1
      },
      stalker: {
        name: 'Thorn Stalker', hp: 165, speed: 118, damage: 28, radius: 23,
        color: '#551a1a', outline: '#e53e3e', xpValue: 3,
        windupTime: 0.22, attackDuration: 0.15, attackCooldown: 0.65,
        attackRange: 84, lungeSpeed: 420
      },
      dasher: {
        name: 'Spore Dasher', hp: 30, speed: 230, damage: 15, radius: 12,
        color: '#dd6b20', outline: '#fbd38d', xpValue: 1
      },
      warden: {
        name: 'Hive Warden', hp: 1550, speed: 125, chargeSpeed: 430, damage: 38, radius: 32,
        color: '#702459', outline: '#f687b3', xpValue: 15,
        windupTime: 0.42, aimLockTime: 0.22, chargeDuration: 0.85, chargeCooldown: 2.8
      }
    }
  },

  PICKUPS: { magnetSpeed: 300, magnetAcceleration: 850 },
  ECONOMY: {
    distanceTaxRatePer1000px: 0.08,
    maxDistanceTax: 0.65,
    deathLossRates: [0.50, 0.40, 0.25],
  },
  TELEMETRY: { enabled: true, hudUpdateInterval: 0.25 }
};

const DEFAULT_META_SAVE = {
  version: 1,
  bankedTechScrap: 0,
  perks: { chassisArmor: 0, engineSpeed: 0, shieldCapacitor: 0, naniteScavenge: 0, cargoSecurity: 0 }
};

export function loadMetaProgression() {
  try {
    const raw = localStorage.getItem('custodian_meta_save');
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_META_SAVE));
    const parsed = JSON.parse(raw);
    return {
      version: 1,
      bankedTechScrap: Number(parsed.bankedTechScrap) || 0,
      perks: {
        chassisArmor: Number(parsed.perks && parsed.perks.chassisArmor) || 0,
        engineSpeed: Number(parsed.perks && parsed.perks.engineSpeed) || 0,
        shieldCapacitor: Number(parsed.perks && parsed.perks.shieldCapacitor) || 0,
        naniteScavenge: Number(parsed.perks && parsed.perks.naniteScavenge) || 0,
        cargoSecurity: Number(parsed.perks && parsed.perks.cargoSecurity) || 0
      }
    };
  } catch (e) {
    console.warn('[CONFIG] Corrupted save, using defaults', e);
    return JSON.parse(JSON.stringify(DEFAULT_META_SAVE));
  }
}

export const MetaProgression = loadMetaProgression();

export function saveMetaProgression() {
  try {
    localStorage.setItem('custodian_meta_save', JSON.stringify(MetaProgression));
  } catch (e) {
    console.error('[CONFIG] Failed to save meta-progression', e);
  }
}