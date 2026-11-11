window.CONFIG = {
  ENGINE: {
    targetFPS: 60,
    maxDeltaTime: 0.1,
    debugKey: '`',
    altDebugKey: 'F2',
  },

  WORLD: {
    ring1Radius: 40000,
    ring2Radius: 75000,
    ring3Radius: 110000,
    ring4Radius: 160000,
    tileGridSize: 64,
    nestCountRing1: 28,
    landmarkPos: { x: 4200, y: -3200 },
    wardenPos: { x: -5500, y: 4800 },
    wardenAggroRadius: 900,
    terraformedRadius: 320,
    ruinsClusterCount: 180,
    chestSpawnChance: 0.65,
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

    // Механика рывка (Overdrive Dash)
    DASH: {
      speed: 740,
      duration: 0.22,
      cooldown: 2.2,
      iFrames: 0.28,
      shockwaveRadius: 55,
    },

    // Круиз-контроль для дальних переходов
    CRUISE: {
      activationTime: 2.2,
      speedMultiplier: 1.45,
    }
  },

  CAMERA: {
    lerpSpeed: 0.1,
    maxOffsetX: 28,
    maxOffsetY: 28,
    maxAngle: 0.048,
    traumaDecay: 1.5,
    traumaExponent: 1.35,
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

  DECALS: {
    chunkSize: 512,
    maxChunks: 128,
  },

  GIBS: {
    maxActive: 140,
    friction: 0.88,
    gravity: -480,
  },

  SPATIAL_GRID: {
    cellSize: 140,
  },

  NEST: {
    maxHealth: 850,
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

  WEAPONS: {
    blaster: {
      name: "Tech Blaster",
      baseDamage: 25,
      baseFireRate: 0.65,
      damage: 25,
      fireRate: 0.65,
      range: 360,
      projectileSpeed: 520,
      projectileSize: 5,
    },
    saw: {
      name: "Scrap Saw",
      baseDamage: 18,
      damage: 18,
      orbitRadius: 56,
      orbitSpeed: 3.2,
      bladeRadius: 11,
      bladeCount: 1,
    },
    mortar: {
      name: "Bio-Spore Mortar",
      baseDamage: 40,
      damage: 40,
      baseFireRate: 2.2,
      fireRate: 2.2,
      minRange: 100,
      maxRange: 420,
      flightDuration: 0.85,
      cloudRadius: 65,
      cloudDuration: 3.2,
      dotTickRate: 0.4,
      dotDamage: 9,
      slowFactor: 0.45
    },
    tesla: {
      name: "Tesla Arc",
      baseDamage: 28,
      damage: 28,
      baseCooldown: 1.35,
      cooldown: 1.35,
      initialRange: 320,
      chainRange: 170,
      chainCount: 4
    },
    drone: {
      name: "Aegis Drones",
      baseDamage: 16,
      damage: 16,
      baseFireRate: 1.1,
      fireRate: 1.1,
      droneCount: 2,
      orbitRadius: 95,
      orbitSpeed: 1.6,
      firingRange: 220,
      pushbackDamage: 24
    },
    flamer: {
      name: "Plasma Purifier",
      baseDamage: 45,
      damage: 45,
      range: 155,
      spreadAngle: 0.78,
      burnDuration: 1.2,
      burnTickRate: 0.3,
      burnDamage: 8
    },
    voltHurricane: {
      name: "Volt Hurricane",
      damage: 32,
      chainDamage: 24,
      orbitRadius: 72,
      orbitSpeed: 4.8,
      bladeCount: 2,
      chainTargets: 3,
      chainRange: 150
    },
    biomassIncinerator: {
      name: "Biomass Incinerator",
      impactDamage: 65,
      fireRate: 1.8,
      minRange: 80,
      maxRange: 400,
      flightDuration: 0.75,
      zoneRadius: 90,
      zoneDuration: 4.0,
      zoneDamage: 38,
      healPerSec: 4.0,
      slowFactor: 0.50
    },
    hyperionTurret: {
      name: "Hyperion Turret",
      damage: 48,
      fireRate: 0.42,
      range: 420,
      projectileSpeed: 620,
      pierceCount: 2,
      salvoCooldown: 4.2,
      salvoCount: 12,
      salvoDamage: 35
    },
    stormSpore: {
      name: "Storm Spore",
      impactDamage: 50,
      fireRate: 1.9,
      minRange: 90,
      maxRange: 420,
      flightDuration: 0.8,
      cloudRadius: 85,
      cloudDuration: 3.5,
      dotDamage: 14,
      dotTickRate: 0.35,
      chainDamage: 22,
      chainInterval: 0.5,
      slowFactor: 0.45
    }
  },

  EVOLUTIONS: {
    voltHurricane: {
      id: 'volt_hurricane',
      name: 'VOLT HURRICANE',
      desc: 'EVOLUTION: Electrified hyper-saws unleash chain lightning bursts on impact. Frees 1 weapon slot!',
      ingredients: ['Scrap Saw', 'Tesla Arc'],
      resultWeapon: 'Volt Hurricane',
      slotCost: 1,
      category: 'TECH_TECH'
    },
    biomassIncinerator: {
      id: 'biomass_incinerator',
      name: 'BIOMASS INCINERATOR',
      desc: 'EVOLUTION (TECH+BIO): Lobs plasma-spore bombs leaving cleansing zones that roast foes and repair robot chassis (+4 HP/s)!',
      ingredients: ['Plasma Purifier', 'Bio-Spore Mortar'],
      resultWeapon: 'Biomass Incinerator',
      slotCost: 1,
      category: 'TECH_BIO'
    },
    hyperionTurret: {
      id: 'hyperion_turret',
      name: 'HYPERION TURRET',
      desc: 'EVOLUTION (TECH+TECH): Heavy orbiting platform with piercing twin-lasers and periodic 360° defensive salvos!',
      ingredients: ['Tech Blaster', 'Aegis Drones'],
      resultWeapon: 'Hyperion Turret',
      slotCost: 1,
      category: 'TECH_TECH'
    },
    stormSpore: {
      id: 'storm_spore',
      name: 'STORM SPORE',
      desc: 'EVOLUTION (TECH+BIO): Electrified spore clusters that shock surrounded enemies and accelerate robot shield recharge!',
      ingredients: ['Tesla Arc', 'Bio-Spore Mortar'],
      resultWeapon: 'Storm Spore',
      slotCost: 1,
      category: 'TECH_BIO'
    }
  },

  ENEMIES: {
    maxActive: 400,
    maxRearChasers: 85,
    despawnRadius: 1800,
    hubSafeRadius: 360,
    initialSpawnInterval: 0.75,
    minimumSpawnInterval: 0.25,
    rampTimeSeconds: 120,
    swarmInterval: 30,
    types: {
      sprout: {
        name: 'Corrupted Sprout',
        hp: 30,
        speed: 130,
        damage: 14,
        radius: 13,
        color: '#9b2c2c',
        outline: '#fc8181',
        xpValue: 1
      },
      stalker: {
        name: 'Thorn Stalker',
        hp: 110,
        speed: 85,
        damage: 28,
        radius: 20,
        color: '#551a1a',
        outline: '#e53e3e',
        xpValue: 3
      },
      dasher: {
        name: 'Spore Dasher',
        hp: 20,
        speed: 190,
        damage: 12,
        radius: 10,
        color: '#dd6b20',
        outline: '#fbd38d',
        xpValue: 1
      },
      warden: {
        name: 'Hive Warden',
        hp: 1100,
        speed: 105,
        chargeSpeed: 370,
        damage: 35,
        radius: 28,
        color: '#702459',
        outline: '#f687b3',
        xpValue: 15
      }
    }
  },

  PICKUPS: {
    magnetSpeed: 300,
    magnetAcceleration: 850,
  },

  ECONOMY: {
    distanceTaxRatePer1000px: 0.08,
    maxDistanceTax: 0.65,
  },

  TELEMETRY: {
    enabled: true,
    hudUpdateInterval: 0.25,
  }
};

const defaultSave = {
  bankedTechScrap: 0,
  perks: {
    chassisArmor: 0,
    engineSpeed: 0,
    shieldCapacitor: 0,
    naniteScavenge: 0
  }
};

try {
  const loaded = localStorage.getItem('custodian_meta_save');
  window.MetaProgression = loaded ? JSON.parse(loaded) : defaultSave;
} catch (e) {
  window.MetaProgression = defaultSave;
}

window.saveMetaProgression = () => {
  try {
    localStorage.setItem('custodian_meta_save', JSON.stringify(window.MetaProgression));
  } catch (e) {}
};