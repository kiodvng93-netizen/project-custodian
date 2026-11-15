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
    enemyDamageTakenMult: 1.15, // вороги на відновленій землі отримують більше урону
    playerRegen: 4,        // HP/с гравцю на будь-якій відновленій землі (тихі гавані, але не безпечні)
    // Дикі латки: постійні клаптики трави по Кільцю. Нова латка — кожні nestsPerPatch очищених гнізд,
    // там, де гніздо було очищене. Позиції в сейві (MetaProgression.world.patches). Ліміт — не все Кільце.
    PATCHES: {
      nestsPerPatch: 3,
      maxPatches: 12,
      radiusMin: 170,
      radiusMax: 240,
      minDistHub: 1500,      // від центру Хаба
      minDistPurifier: 1000,
      minDistWarden: 900,
      minDistPatch: 1300,    // між латками
    },
    growSeconds: 2.5,      // анімація розростання при новій стадії
    toastSeconds: 4.5,     // банер «ЗЕМЛЮ ВІДНОВЛЕНО»
    sites: [
      // Хаб: росте лише трохи — від усіх очищених гнізд за всі забіги (основний ріст — дикі латки)
      { id: 'hub', label: 'SANCTUARY', anchor: 'hub', counter: 'nestsCleansed', seed: 1171,
        thresholds: [0, 4, 10, 18, 30], radii: [260, 300, 340, 380, 420],
        biomassPerUnit: 600 }, // 600 біомаси = 1 очищене гніздо для стадії Хаба (змінюється без міграції)
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
    clearMargin: 40,       // запас навколо Хаба/його ділянки, де не лишається кров, тіла й сліди
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
    baseHealth: 120,           // було 100: оточення вбивало за ~4 с
    baseShieldCharges: 1,
    shieldRechargeTime: 25.0,
    pickupRadius: 110,
    invulnOnDamage: 0.9,       // було 0.65
    invulnOnShieldBreak: 0.70,
    pushbackRadius: 120,       // відкидання натовпу при ударі по гравцю (було 85)
    pushbackForce: 450,        // зсув = force × 0.15 ≈ 68px (було 33px — вороги одразу верталися)
    pushbackStun: 0.45,        // відкинуті вороги оглушені: вікно вирватись з оточення

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
    poolMult: 1.25,          // калюжі смерті більші: великі низькочастотні плями замість дрібного шуму
    dropMult: 0.45,          // множник кількості дрібних крапель (менше конфеті на землі)
    dropSizeMult: 1.5,       // а самі краплі крупніші
    // Старіння: свіжа кров яскрава й насичена, потім темніє й сіріє — «вростає» в колір землі
    ageInterval: 1.5,        // секунд між кроками старіння одного чанка
    ageSteps: 30,            // кроків після останнього малювання (≈45 с)
    ageStrength: 0.06,       // частка кольору землі, що домішується за крок
    ageTint: '#1a1b20',      // колір, до якого сходить стара кров
    ageChunksPerTick: 2,     // чанків за кадр (бюджет перезаливки текстур)
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
    // На відновленій землі (terraform.areas) вростає лише ~1 з keepOneIn тіл, і то блідим;
    // решта розчиняється за dissolveTime замість запікання (рішення — у момент запікання)
    keepOneIn: 10,
    dissolveTime: 1.2,     // с — розчинення тіла, яке не вростає
    reclaimedAlpha: 0.45,  // прозорість вросшого тіла на відновленій землі
    reclaimedTint: '#2a4222', // колір відновленої землі, до якого підмішується тіло
    reclaimedTintMix: 0.45,
  },

  // Родючість забігу (js/fertility.js, js/groundCover.js): де гинуло багато ворогів, земля вкривається
  // мохом → травою → квітами. Лише в межах забігу, у сейв не йде. Значення ростуть від ваг смертей.
  FERTILITY: {
    cellSize: 160,           // px клітинки сітки (масив Float32 на Ring 1)
    maxPerCell: 120,          // стеля родючості клітинки
    deathWeight: { sprout: 2.5, stalker: 3.5, dasher: 3, warden: 35 },
    eliteMult: 3,            // множник ваги еліти
    titanWeight: 80,
    tickInterval: 0.25,      // с гри між кроками росту
    cellsPerTick: 40,        // скільки активних клітинок обходимо за крок (бюджет малювання)
    marksPerVisit: 8,        // макс. мазків одного шару на клітинку за обхід
    rateRef: 25,             // родючість, за якої швидкість росту = 1× (мін. 0.25×, макс. 2×)
    // Стадії: поріг родючості, початок і тривалість у «секундах росту», макс. мазків на клітинку
    moss:   { fert: 3,  at: 0,   span: 80,  max: 40 },
    grass:  { fert: 5,  at: 60,  span: 160, max: 34 },
    flower: { fert: 10, at: 180, span: 160, max: 8 },
    // Рослини (js/plants.js): поріг родючості клітинки і «час росту» g, з якого з'являються кущі й дерева
    bush: { fert: 14, at: 140 },
    tree: { fert: 30, at: 230 },
    edgeNoise: 0.3,         // розмах шуму порогу: м'який нерівний край плями
    noiseScale: 70,          // px періоду низькочастотного шуму
    reclaimedBloodAlpha: 0.35, // кров на відновленій землі блідша
  },

  // Зв'язок родючості з Хабом (js/hubLink.js): клітинки родючості, з'єднані з Хабом/відновленою землею,
  // дають біомасу на повну; решта — зі зниженою ставкою (м'яке правило). Біомаса йде в сейв після забігу.
  HUBLINK: {
    fertThreshold: 4,        // мін. родючість клітинки, щоб вона була «живою» для зв'язку
    gap: 1,                  // скільки порожніх клітинок можна перестрибнути (8-сусідство + розрив)
    interval: 2,             // с гри між перерахунками зв'язності
    disconnectedRate: 0.25,  // ставка біомаси для незв'язаної родючості
    maxVeinCells: 1600,      // ліміт сегментів коренів
  },

  // Рослини, що лікують (js/plants.js, js/render/pixiPlants.js): кущі (прохідні) і дрібні дерева (тверді),
  // обидва плодоносять. Лише в межах забігу.
  PLANTS: {
    maxBushes: 36, maxTrees: 12,        // ліміт на забіг
    perCell: { bush: 2, tree: 1 },      // на клітинку сітки родючості
    areaSize: 640, perArea: { bush: 6, tree: 3 }, // ліміт на «район» (квадрат areaSize px)
    spacing: { bush: 78, tree: 130 },   // мін. відстань між рослинами, px
    minPlayerDist: 260,                 // не ростуть впритул до робота
    scanInterval: 0.5, cellsPerScan: 1500, spawnPerScan: 2, spawnChance: 0.4,
    growSeconds: { bush: 50, tree: 100 },
    treeRadius: 9,                      // радіус стовбура (твердий коліджн), px
    bushRadius: 15,                     // лише для відстані підбору
    // Плоди: частка maxHP за плід, ліміти й відновлення
    healFrac: 0.07,
    maxFruit: { bush: 2, tree: 3 },
    regrowSeconds: { bush: 80, tree: 65 },
    totalFruitCap: 10,                  // скільки плодів одночасно може бути дозрілими на всій карті
    magnetRadius: 70,                   // від краю рослини до робота
    minMissingFrac: 0.6,                // їсти, лише якщо бракує ≥ цієї частки лікування плоду
    pickCooldown: 0.9,                  // с між двома плодами з однієї рослини
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
      // Хвиля = surge + ebb + breather. Рано пауз майже немає (з одним бластером ворогів і так мало,
      // довгий перепочинок = нудьга); з хвилями пауза росте до повної. Індекс = номер хвилі - 1, далі — останнє.
      surgeDuration: 22,
      ebbByWave: [3, 4, 5, 6, 8],
      breatherByWave: [2, 3, 4, 6, 8, 10],
      ambushTriggerTime: 10,
      ambushGapDegrees: 70, // пролом у кільці засідки для втечі
      minInterval: 0.14,
      maxInterval: 0.52,
      breatherAlertInterval: 1.1,
      escalation: {
        hpPerWave: 0.14,
        speedPerWave: 0.045,
        damagePerWave: 0.06,   // було 0.09: на 15-й хвилі ×1.84 замість ×2.26
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
        windupTime: 0.32, attackDuration: 0.15, attackCooldown: 0.65,
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
  version: 5,
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
    purifierRestorations: 0,
    patches: [], // дикі латки: { x, y, r, seed }
    biomass: 0   // накопичена біомаса з усіх забігів (годує ріст Хаба)
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

function sanitizePatches(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map(p => ({ x: Number(p.x), y: Number(p.y), r: Number(p.r), seed: Number(p.seed) || 1 }))
    .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.r > 0);
}

export function loadMetaProgression() {
  try {
    const raw = localStorage.getItem('custodian_meta_save');
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_META_SAVE));
    const parsed = JSON.parse(raw);
    // v2 → v3: додано world (лічильники тераформування), старі сейви починають з нуля
    // v4 → v5: додано world.biomass (старі сейви починають з 0, Хаб не втрачає стадію)
    // v3 → v4: додано world.patches; бракуючі латки за вже очищені гнізда добудовує terraform.js
    const world = parsed.world || {};
    return {
      version: 5,
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
        purifierRestorations: Number(world.purifierRestorations) || 0,
        patches: sanitizePatches(world.patches),
        biomass: Math.max(0, Number(world.biomass) || 0)
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