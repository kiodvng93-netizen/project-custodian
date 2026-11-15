// js/config.js — Базовий баланс та мета-сейви (Read-only константи)

export const CONFIG = {
  ENGINE: {
    targetFPS: 60,
    maxDeltaTime: 0.1,
    debugKey: '`',
    altDebugKey: 'F2',
  },

  WORLD: {
    ring1Radius: 15000, // межа світу: гравець не може вийти за неї
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

  // Постійне тераформування Кільця 1. Світ = постійні ділянки (тут) + випадкове наповнення
  // (гнізда, руїни, скрині, аутпости — щозабігу нові). Стадія ділянки = скільки порогів лічильника
  // з сейву (MetaProgression.world) пройдено; радіус = radii[стадія]. Відновлена земля:
  // вороги повільніші, хвилі не спавняться, гнізда й руїни на ній не генеруються.
  // Повне озеленення Кільця — не зараз (майбутнє/DLC): нові ділянки = нові записи в sites.
  TERRAFORM: {
    enemySpeedMult: 0.8,   // множник швидкості ворогів на відновленій землі
    growSeconds: 2.5,      // анімація розростання при новій стадії
    toastSeconds: 4.5,     // банер «ЗЕМЛЮ ВІДНОВЛЕНО»
    sites: [
      // Хаб: росте трохи — від усіх очищених гнізд за всі забіги
      { id: 'hub', label: 'SANCTUARY', anchor: 'hub', counter: 'nestsCleansed', seed: 1171,
        thresholds: [0, 4, 10, 18, 30], radii: [260, 320, 380, 440, 500] },
      // Пурифаєр: з'являється після першого відновлення, росте з кожним наступним
      { id: 'purifier', label: 'PURIFIER', anchor: 'landmark', counter: 'purifierRestorations', seed: 2393,
        thresholds: [1, 2, 4, 7], radii: [420, 520, 620, 720] },
    ],
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

  DRAFT: {
    minInterval: 3.0,      // мін. секунд гри між вікнами драфту, коли рівні накопичились
    newWeaponCardsBySlots: [0, 2, 2, 1], // скільки з 3 карток гарантовано НОВА зброя при N зброї в слотах
    bulletTimeScale: 0.08, // уповільнення часу під час вибору картки
  },

  // Фінал забігу: евакуація з відновленого Пурифаєра (зона утримання = terraformedRadius)
  EVAC: {
    duration: 60,          // секунд утримання в зоні маяка
    ambushCount: 14,       // ворогів у кільці засідки
    ambushInterval: 20,    // нове кільце засідки кожні N секунд
    ambushRadius: 560,
    victoryBonusScrap: 10, // бонус до Vault за успішну евакуацію
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
    maxTitans: 14,
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

  DECALS: { chunkSize: 512, maxChunks: 128, textureUploadInterval: 0.05 },
  // Уламки (js/gibs.js): летять по дузі, гальмують у повітрі, відскакують і кувиркаються,
  // а ковзаючи лишають рваний мазок, що закінчується «шльопом»
  GIBS: {
    maxActive: 240, countMult: 1.6,
    gravity: -900,          // px/с² (z вгору)
    airDrag: 0.7,           // 1/с — опір повітря (експоненційне гальмування)
    groundDecel: 240,       // px/с² — тертя ковзання (постійне гальмування)
    groundDrag: 1.8,        // 1/с — додаткове в'язке тертя по крові
    restitution: 0.38,      // частка вертикальної швидкості після відскоку
    bounceKeep: 0.7,        // частка горизонтальної швидкості після відскоку
    maxBounces: 3,
    smearStep: 7,           // px ковзання між шматками мазка
    inkPerPx: 0.012,        // скільки «крові» втрачає уламок за піксель мазка
  },

  // Кров і «поп» смерті (js/gore.js)
  GORE: {
    splatterScale: 1.0,      // загальний розмір плям
    deathRadiusMult: 1.3,    // радіус калюжі смерті = радіус ворога × це
    eliteSplatterBonus: 0.35, // + до сили плями еліти
    overkillBonus: 0.35,     // + до сили плями за надлишковий урон (до 100% maxHP)
    hitSpurtDamage: 14,      // накопичений урон, після якого з ворога бризкає кров
    hitSpurtCooldown: 0.12,  // секунд між бризками одного ворога
    deathFlash: true,        // спалах + кільце кольору крові при смерті
    hitFlashMinDamage: 3,    // менший урон за раз (DoT, контакт щокадру) не блимає білим
  },

  // Тіла ворогів (js/corpses.js): коротко відлітають від смертельного удару й більше не рухаються
  // (ні робот, ні вороги їх не штовхають). Перші interactiveTime секунд робот може розчавити тіло
  // наїздом (другий стан) — тоді воно одразу вростає в декалі розчавленим. Не розчавлене за цей час
  // вростає як є. Після вростання лежить назавжди й нічого не коштує щокадру.
  CORPSES: {
    maxActive: 150,        // тіл, які ще можна розчавити; понад це найстаріше одразу вростає
    interactiveTime: 15,   // секунд, поки тіло можна розчавити
    knockback: 110,        // швидкість короткого відльоту від смертельного удару
    friction: 0.82,        // гальмування відльоту (за 1/60 с)
    smearStep: 20,         // пікселів відльоту між мазками крові
    sizeMult: 1.3,         // розмір купи решток відносно розміру живого спрайта
    crushRadiusMult: 0.75, // наїзд, якщо центр робота ближче за радіус тіла × це + 0.6 радіуса робота
    crushMinSpeed: 20,     // px/с — стоячи на місці тіло не розчавиш
    crushTime: 0.22,       // с — анімація сплющення
    crushWiden: 1.25,      // розчавлене ширше в стільки разів
    crushFlatten: 0.5,     // і пласкіше (частка висоти)
    crushSplat: 1.4,       // розмір бризок крові при наїзді (× радіус тіла)
    crushTrauma: 0.04,     // легкий трус камери
  },

  // Сліди робота у свіжій крові (js/gore.js)
  TRACKS: {
    freshBloodSeconds: 25, // скільки калюжа «свіжа», щоб забруднити гусениці
    maxFreshPools: 160,    // скільки останніх калюж пам'ятаємо
    trailLength: 520,      // пікселів слідів після проїзду крізь калюжу
    stepPx: 6,             // крок між сегментами смуг гусениць
    barSpacing: 5,         // px між ґрунтозачепами (шевронами)
    gapMult: 0.6,          // відстань від центру до осі гусениці = радіус робота × це
    widthMult: 0.5,        // ширина гусениці = радіус робота × це
  },
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

  // «Вулик чує твій трюм»: тиск ворогів росте з НЕЗДАНИМ скрапом (alert 0..1)
  CARGO_PRESSURE: {
    fullAlertScrap: 40,         // скрапу в трюмі для 100% тривоги
    maxSpawnRateBonus: 0.8,     // +80% частоти спавну на 100%
    maxExtraPack: 3,            // +ворогів у пачці на 100%
    maxEliteChance: 0.15,       // шанс еліти для спавну хвиль/засідок на 100%
    breatherTrickleAlert: 0.75, // з цієї тривоги вулик не дає перепочинку (Breather)
    ELITE: { hpMult: 2.5, damageMult: 1.3, radiusMult: 1.25, xpMult: 3 },
  },

  ENEMIES: {
    maxActive: 400,
    // Розгін на старті забігу: з одним бластером орда в 400 ворогів за першу хвилину — нечесно
    OPENING: {
      duration: 300,        // секунд до повної сили спавну
      startSpawnRate: 0.12, // частка частоти спавну на 0с
      startPackScale: 0.35, // частка розміру пачки на 0с
      startActiveCap: 20,   // ліміт живих ворогів хвиль на 0с (далі росте до maxActive)
      ambushStartScale: 0.35, // розмір кільця засідки на 0с відносно повного
    },
    maxRearChasers: 105,
    despawnRadius: 1800,
    hubSafeRadius: 360,
    rampTimeSeconds: 120,
    WAVE: {
      cycleDuration: 40,
      surgeDuration: 22,
      ebbDuration: 8,
      ambushTriggerTime: 10,
      ambushGapDegrees: 70, // пролом у кільці засідки для втечі
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
    // maxSpeedRatio: стеля швидкості після ескалації, частка від PLAYER.baseSpeed.
    // Звичайні вороги лишаються повільнішими за гравця; швидка загроза — лише Dasher (< Cruise 1.45).
    types: {
      sprout: {
        name: 'Corrupted Sprout', hp: 44, speed: 158, damage: 16, radius: 15, maxSpeedRatio: 0.95,
        color: '#9b2c2c', outline: '#fc8181', xpValue: 1
      },
      stalker: {
        name: 'Thorn Stalker', hp: 165, speed: 118, damage: 20, radius: 23, maxSpeedRatio: 0.85, // було 28: випад ×1.25 знімав пів HP
        color: '#551a1a', outline: '#e53e3e', xpValue: 3,
        windupTime: 0.22, attackDuration: 0.15, attackCooldown: 0.65,
        attackRange: 84, lungeSpeed: 420
      },
      dasher: {
        name: 'Spore Dasher', hp: 30, speed: 230, damage: 15, radius: 12, maxSpeedRatio: 1.4,
        color: '#dd6b20', outline: '#fbd38d', xpValue: 1
      },
      warden: {
        name: 'Hive Warden', hp: 1550, speed: 125, chargeSpeed: 430, damage: 38, radius: 32, maxSpeedRatio: 0.8,
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
  version: 3,
  bankedTechScrap: 0,
  perks: {
    chassisArmor: 0,
    engineSpeed: 0,
    shieldCapacitor: 0,
    naniteScavenge: 0,
    cargoSecurity: 0
  },
  // Лічильники постійного світу (стадії тераформування рахуються з них, див. TERRAFORM)
  world: {
    nestsCleansed: 0,
    purifierRestorations: 0
  }
};

// v1 → v2: перк ALL-TERRAIN TRACKS видалено (він ніколи не працював).
// Повертаємо витрачений на нього скрап (ранг 1 = 4, ранг 2 = 9).
function refundRemovedTracksPerk(parsed) {
  const rank = Math.min(2, Number(parsed.perks && parsed.perks.terrainTracks) || 0);
  let refund = 0;
  for (let r = 0; r < rank; r++) refund += 4 + r * 5;
  return refund;
}

export function loadMetaProgression() {
  try {
    const raw = localStorage.getItem('custodian_meta_save');
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_META_SAVE));
    const parsed = JSON.parse(raw);
    // v2 → v3: додано world (лічильники тераформування), старі сейви починають з нуля
    const world = parsed.world || {};
    return {
      version: 3,
      bankedTechScrap: (Number(parsed.bankedTechScrap) || 0) + refundRemovedTracksPerk(parsed),
      perks: {
        chassisArmor: Number(parsed.perks && parsed.perks.chassisArmor) || 0,
        engineSpeed: Number(parsed.perks && parsed.perks.engineSpeed) || 0,
        shieldCapacitor: Number(parsed.perks && parsed.perks.shieldCapacitor) || 0,
        naniteScavenge: Number(parsed.perks && parsed.perks.naniteScavenge) || 0,
        cargoSecurity: Number(parsed.perks && parsed.perks.cargoSecurity) || 0
      },
      world: {
        nestsCleansed: Number(world.nestsCleansed) || 0,
        purifierRestorations: Number(world.purifierRestorations) || 0
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