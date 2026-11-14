# PROJECT CUSTODIAN — MASTER STATE & HANDOVER (v4.6)
**Дата оновлення:** Листопад 2026  
**Статус:** Повністю модульний ES6+ проєкт, 0 змінних у `window.*`, 6 архетипів зброї, гібридний рендер **PixiJS v8 (WebGL світ + Y-sorting + тіні)** + **Canvas 2D UI**, відкритий світ Кільця 1 (`15 000px`), синусоїдальні хвилі + прихована ескалація, Хаб з турелями/лімітом/«Гнівом Улля», польові Аутпости, страховка скрапу, а також механіки **Кільця 2+ (зони слизу/павутиння та фронтальна броня ворогів)**.

================================================================================
1. СТАНДАРТ ТА СТАТУС АРХІТЕКТУРИ
================================================================================
- Стек: PixiJS v8 (ESM через `importmap`), Canvas 2D (прозорий HUD-шар + радар), Vanilla JS (ES6+ Modules), 60 FPS.
- Запуск: VS Code Live Server (`http://127.0.0.1:5500`).
- Потік даних:
  1. `config.js` & `weapons/catalog.js` — незмінний баланс, версіоновані сейви (Read-only шаблони).
  2. `state.js` — централізований ізольований стан забігу (Single Source of Truth) + `Shockwave` + рестарт-хендлер.
  3. Логіка систем (`player.js`, `enemies/`, `weapons/`, `world/`) — чиста симуляція.
  4. Шар рендера (`render/pixi*` + `render/ui.js` + `sprites.js`) — тільки читання даних зі `state`, нуль впливу на геймплей.
- Точка входу: `<script type="module" src="js/main.js"></script>`.

================================================================================
2. ВИКОНАНО В СЕСІЇ v4.3 → v4.6
================================================================================
[x] Винесено `UPGRADE_POOL` та `generateDraftCards(...)` з `main.js` у `js/weapons/upgrades.js`.
[x] Світ Кільця 1 стиснуто до `15 000px` (`ring2/3/4: 28k / 42k / 60k`), скориговано щільність руїн (`40`) та гнізд (`10`).
[x] Синусоїдальний ритм хвиль (`40с` цикл: `22с Surge → 8с Ebb → 10с Breather`), кільцева засідка на піку Surge.
[x] Прихована ескалація складності за хвилями (`waveNumber`: `+14% HP`, `+4.5% speed` до `1.55x`, `+9% dmg` за хвилю) — прихована гонка з часом у відкритому світі (Brotato-раунди).
[x] Прискорено бойовку мобів + додано `facingAngle`, `animState` (`idle|chase|windup|attack`) і чесні телеграфи для `Stalker` (швидкий замах `0.22с` → випад) і `Warden` (раннє блокування кута ривка).
[x] Повний фікс колізій зі стінами для ворогів і куль: статична сітка `_obstacleGrid` (`O(1)`), swept-AABB для снарядів (`projectiles.js`), обтікання кутів для мобів, чистий спавн скринь поза стінами.
[x] Гнізда (`5000 HP`) отримали рандомізацію пулу спавну та потужний **Loot Vacuum** (`900px`, зелена хвиля `620px`, ривок луту `520 → 1050 px/s`).
[x] Тактична кругла радар-мінікарта зліва (`js/world/minimap.js`): Хаб, гнізда, аутпости, Очищувач, бос, Ядро, локальні скрині.
[x] Механіки Хаба (`js/world/sanctuary.js`): ліміт лікування (`220 HP` на забіг), турелі без дропу луту (`suppressLoot = true`), здавання скрапу однією кнопкою **`[E]`**, «Гнів Улля» (тривога на `150с`, злам купола + 14 невразливих Титанів на `180с`).
[x] Польові аутпости страхування здобичі (`js/world/outpost.js`, `12с` оборона, `+35%` бонус) + часткове збереження скрапу при смерті (`50% → 40% → 25%`) через перк `HOLD SECURITY` (`cargoSecurity`, 2 ранги).
[x] **(v4.6) Зовнішні зони слизу/павутиння Кільця 2+ (`js/world/hazards.js`):** детермінована zero-GC сітка (`520px`, `> 15 000px`), сповільнення на `50%` і блокування Cruise; 6-й перк Воркшопа `ALL-TERRAIN TRACKS` (`terrainTracks`, 2 ранги по `-35%` штрафу) + картка драфта `ALL-TERRAIN CLEATS` (`+50%` опору).
[x] **(v4.6) Фронтальна броня мобів Кільця 2+ (`> 15 000px`):** `hasFrontalArmor` з кутом захисту `±65°` відносно `facingAngle`; звичайні кулі, лазери дронів і пили спереду ріжуться до `20%` урону (`armorFlashTimer` + спалах-рикошет), але броня пробивається вогнем (`Plasma Purifier`, burn DoT), ланцюгами (`Tesla Arc`, `Volt Hurricane`), аурою (`Static Aura`), мортирами/зонами (`Bio-Spore Mortar`, `Biomass Incinerator`, `Storm Spore`) або обходом у фланг/спину.

================================================================================
3. АКТУАЛЬНА КАРТА ФАЙЛІВ (ПРАВИЛО: <= 300 РЯДКІВ НА ФАЙЛ)
================================================================================
- `index.html`                 ~ 38 рядків  [importmap для pixi.js v8 + єдиний module entrypoint]
- `style.css`                  ~ 95 рядків  [шари: .pixi-layer (z:1) + прозорий #gameCanvas (z:2)]
- `js/config.js`               ~ 244 рядки [Баланс світу/Хаба/аутпостів/Кільця 2+/хвиль/ворогів, версіонований сейв]
- `js/state.js`                ~ 82 рядків  [state, Shockwave, HitStop, рестарт-колбек]
- `js/telemetry.js`            ~ 120 рядків [Метрики бою та економіки, debug HUD]
- `js/sprites.js`              ~ 215 рядків [SPRITE_MANIFEST (11+ асетів), anti-fringe chromaKey]
- `js/decals.js`               ~ 190 рядків [Чанки декалів 512x512 з прапором needsTextureUpdate]
- `js/gibs.js`                 ~ 215 рядків [Фізичні уламки з запіканням у декалі]
- `js/pickups.js`              ~ 145 рядків [Bio-Essence, Tech Scrap, магніт, vacuumInRadius]
- `js/player.js`               ~ 295 рядків [Робот, Dash, Cruise, щити, опір слизу, HP, часткова втрата скрапу]
- `js/main.js`                 ~ 282 рядки [Цикл движка, boot PixiJS + fallback, ввід, 6-перковий Воркшоп, драфт]

- `js/render/` (Візуальний шар):
  - `pixiCore.js`              ~ 195 рядків [Application, шари, SpritePool, запечені базові текстури]
  - `pixiSpriteAtlas.js`       ~ 125 рядків [Нарізання та кешування Texture зі спрайт-листів]
  - `pixiWorld.js`             ~ 250 рядків [Фон TilingSprite, Хаб, декалі, стіни, скрині, монумент, гнізда, ядро]
  - `pixiEntities.js`          ~ 215 рядків [Робот, вороги, лут, уламки з тінями та Y-sorting]
  - `pixiWeapons.js`           ~ 240 рядків [Рендер 6 архетипів зброї, зон, мін, пил, ударних хвиль]
  - `ui.js`                    ~ 298 рядків [HUD, арсенал, XP-бар, статус Хаба, драфт, 6-перковий воркшоп, пауза]
  - `environment.js`           ~ 95 рядків  [Legacy Canvas 2D фон/Хаб із підтримкою стану пролому купола]

- `js/world/` (Відкритий кільцевий світ):
  - `structures.js`            ~ 278 рядків [ObstacleWall + swept-AABB, LootChest, Landmark, CorePickup, CorruptedNest]
  - `sanctuary.js`             ~ 175 рядків [SanctuaryHub: ліміт лікування, турелі, депозит [E], «Гнів Улля»]
  - `outpost.js`               ~ 145 рядків [InsuranceOutpost + renderOutpostHUD]
  - `hazards.js`               ~ 159 рядків [RingHazardManager: зони слизу/павутиння Кільця 2+, оверлей броні та HUD]
  - `minimap.js`               ~ 155 рядків [Лівостороння кругла радар-мінікарта Кільця 1]
  - `manager.js`               ~ 272 рядки [WorldManager: спавн гнізд/руїн/скринь/аутпостів, hazards, _obstacleGrid, телепорт]

- `js/weapons/` (Бойове ядро на 6 архетипах):
  - `catalog.js`               ~ 200 рядків [WEAPON_ARCHETYPES, WEAPON_CATALOG, EVOLUTIONS, clone]
  - `upgrades.js`              ~ 212 рядків [UPGRADE_POOL (вкл. ALL-TERRAIN CLEATS) та generateDraftCards]
  - `projectiles.js`           ~ 227 рядків [Projectile (armorPiercing flag), MortarShell, GroundZone]
  - `rangedArchetypes.js`      ~ 204 рядки [ProjectileWeapon, MortarWeapon, ChainWeapon]
  - `meleeArchetypes.js`       ~ 234 рядки [OrbitalWeapon, ConeWeapon, AuraWeapon]
  - `manager.js`               ~ 189 рядків [WeaponManager, ізольовані runConfigs, еволюції, вибухи]

- `js/enemies/` (Вороги та AI):
  - `grid.js`                  ~ 50 рядків  [SpatialGrid]
  - `enemy.js`                 ~ 277 рядків [Enemy: Sprout, Stalker, Dasher, Warden, Titan-мод, фронтальна броня, телеграфи]
  - `manager.js`               ~ 196 рядків [EnemyManager: синусоїдальні хвилі, засідки, rear cap]

================================================================================
4. DATA CONTRACTS (ДЛЯ ІЗОЛЬОВАНИХ ЧАТІВ ПО 1 ПАПЦІ)
================================================================================
- **Player (`state.player`):**
  `x, y, vx, vy, radius, growthScale, facingAngle, health, maxHealth, shieldCharges, maxShieldCharges, invulnerableTimer, isCruising, carryingCore, godMode, afterimages[], slimeSlowResist, inSlimeZone, currentHazardType, currentTerrainMult`
- **Enemy (`state.enemyManager.enemies[]`):**
  `x, y, radius, typeKey ('sprout'|'stalker'|'dasher'|'warden'), color, health, maxHealth, hitFlashTimer, alive, isAwakened, isTelegraphing, isCharging, facingAngle, animState ('idle'|'chase'|'windup'|'attack'), isTitan, invulnerable, hasFrontalArmor, armorFlashTimer`
- **World (`state.worldManager`):**
  `obstacles[]`, `chests[]`, `nests[]`, `outposts[] ({x, y, radius, captureRadius, state})`, `sanctuary ({healPool, maxHealPool, domeBroken, wrathWarning, campTimer})`, `hazards (RingHazardManager)`, `landmark`, `coreDrop`
- **Weapons (`state.weaponManager`):**
  `slots[] ({name, isEvolution, cfg: {archetype, damage, ...}})`, `projectiles[]`, `mortarShells[]`, `zones[]`, `particles[]`
- **Effects / Loot (`state`):**
  `pickupManager.pickups[]`, `gibManager.gibs[]`, `shockwaves[]`

================================================================================
5. GAME FEEL & DESIGN ROADMAP (v4.6 → v5.0)
================================================================================
### А. Графіка та технічна ізоляція (НАСТУПНИЙ КРОК)
- [ ] **Фікс спрайтів (`js/render/` + `js/sprites.js`):** вирівнювання сіток PNG, правильний `anchor` (в ногах), напрямки спрайтів за `facingAngle` та анімації за `animState`.
- [ ] **Спрайт/візуал Аутпостів, турелей Хаба та «Гніву Улля» у PixiJS (`js/render/pixiWorld.js`).**
- [ ] **Візуал Кільця 2+ у PixiJS:** перенести рендер зон слизу/павутиння (`hazards.js`) та щитів фронтальної броні ворогів (`hasFrontalArmor`, `armorFlashTimer`) у WebGL-шари `pixiWorld.js` / `pixiEntities.js` (щоб не перекривати сутності на 2D-оверлеї).
- [ ] **Технічний хвіст:** видалити старі методи `render(ctx)` з логічних файлів після фінального перенесення всього в PixiJS.

### B. Ритм бою та Динаміка — [ВИКОНАНО]
- [x] Синусоїдальний хвильовий ритм (`22s Surge / 8s Ebb / 10s Breather`) + прихована ескалація за хвилями (`waveNumber`).
- [x] Швидкі чесні телеграфи `Stalker` і `Warden`.
- [x] `Loot Vacuum` на гніздах (`5000 HP`, `900px` вакуум) + рандомізація пулу гнізд.

### C. Хаб, Прихисток та Економіка — [ВИКОНАНО]
- [x] Ліміт лікування Хаба (`220 HP`), турелі без луту, «Гнів Улля» (150с/180с).
- [x] Депозит скрапу в Хабе однією кнопкою `[E]`.
- [x] Часткова втрата скрапу при смерті (`50% → 40% → 25%`) + Аутпости страхування в полі (`12с`).

### D. Відкритий світ, Кільця 2+ та Стрибки складності — [В ПРОЦЕСІ]
- [x] **Зовнішні зони в'язкої павутини/слизу** за `15 000px` (`-50%` швидкості без апгрейду траків у Воркшопі/драфті).
- [x] **Вороги з важкою фронтальною бронею** у Кільці 2+ (`±65°` по `facingAngle`, ріжуть звичайні кулі спереду; пробиваються вогнем/ланцюгами/аурою/мортирою або обходом із флангу).
- [ ] **Саморегуляція фарму:** у глибших кільцях значно дорожчий скрап + нові ресурси (хітин, ядра).

### E. Баланс, Звук та Backlog (v5.0+)
- [ ] **Фінальний баланс-пас:** тюнінг кривої складності хвиль, урону зброї, вартості перків.
- [ ] **Web Audio SFX:** хруст панцирів, постріли, хіти, детонації, левелап, сирена Хаба.
- [ ] **Brotato Combine:** злиття дублікатів зброї одного тиру для звільнення слотів.
- [ ] **Шатли евакуації & Візуальна еволюція шасі робота.**