# PROJECT CUSTODIAN — MASTER STATE & HANDOVER (v4.3)
**Дата оновлення:** Листопад 2026  
**Статус:** Повністю модульний ES6+ проєкт, 0 змінних у `window.*`, 6 архетипів зброї (Brotato-style), гібридний рендер **PixiJS v8 (WebGL світ + Y-sorting + тіні)** + **Canvas 2D UI**.

================================================================================
1. СТАНДАРТ ТА СТАТУС АРХІТЕКТУРИ
================================================================================
- Стек: PixiJS v8 (ESM через `importmap`), Canvas 2D (прозорий HUD-шар), Vanilla JS (ES6+ Modules), 60 FPS.
- Запуск: VS Code Live Server (`http://127.0.0.1:5500`).
- Потік даних:
  1. `config.js` & `weapons/catalog.js` — незмінний баланс, версіоновані сейви (Read-only шаблони).
  2. `state.js` — централізований ізольований стан забігу (Single Source of Truth) + `Shockwave` + рестарт-хендлер.
  3. Логіка систем (`player.js`, `enemies/`, `weapons/`, `world/`) — чиста симуляція.
  4. Шар рендера (`render/pixi*` + `render/ui.js` + `sprites.js`) — тільки читання даних зі `state`, нуль впливу на геймплей.
- Точка входу: `<script type="module" src="js/main.js"></script>`.

================================================================================
2. ВИКОНАНО В СЕСІЇ v4.1 → v4.3
================================================================================
[x] Переведено всі утиліти (`telemetry`, `decals`, `gibs`, `sprites`, `pickups`) в чисті ES-модулі.
[x] Повністю усунуто глобальні змінні `window.*` у всіх модулях.
[x] Усю зброю (6 базових + 4 еволюції + `Static Aura`) переведено на 6 універсальних архетипів:
    `projectile`, `mortar`, `orbital`, `chain`, `cone`, `aura` (100% автострільба, Brotato-стандарт).
[x] Оптимізовано пошук цілей зброї та мортирних скупчень через `SpatialGrid.getNearby(...)`.
[x] Прибрано щокадрове створення масивів у `main.js` (перевикористовуваний буфер `_allTargets`).
[x] Піднято гібридний рендер на **PixiJS v8**: `SpritePool` без GC-сміття, Y-sorting (`entityLayer.sortableChildren = true`), м'які тіні (`shadowLayer`), WebGL-декалі.
[x] Зареєстровано 11 спрайт-листів (`assets/sprites/*.png`) з анти-хейло вирізанням білого фону та fallback-геометрією.
[x] Приглушено трясіння камери (`CONFIG.CAMERA`: `11px`, `0.014 rad`).

================================================================================
3. АКТУАЛЬНА КАРТА ФАЙЛІВ (ПРАВИЛО: <= 300 РЯДКІВ НА ФАЙЛ)
================================================================================
- `index.html`                 ~ 38 рядків  [importmap для pixi.js v8 + єдиний module entrypoint]
- `style.css`                  ~ 95 рядків  [шари: .pixi-layer (z:1) + прозорий #gameCanvas (z:2)]
- `js/config.js`               ~ 160 рядків [Баланс світу/ворогів/камери, версіонований сейв]
- `js/state.js`                ~ 80 рядків  [state, Shockwave, HitStop, рестарт-колбек]
- `js/telemetry.js`            ~ 120 рядків [Метрики бою та економіки, debug HUD]
- `js/sprites.js`              ~ 215 рядків [SPRITE_MANIFEST (11+ асетів), anti-fringe chromaKey]
- `js/decals.js`               ~ 190 рядків [Чанки декалів 512x512 з прапором needsTextureUpdate]
- `js/gibs.js`                 ~ 215 рядків [Фізичні уламки з запіканням у декалі]
- `js/pickups.js`              ~ 125 рядків [Bio-Essence, Tech Scrap, магніт]
- `js/player.js`               ~ 260 рядків [Робот, Dash, Cruise, щити, HP]
- `js/main.js`                 ~ 275 рядків [Цикл движка, boot PixiJS + fallback, ввід, драфт]

- `js/render/` (Візуальний шар):
  - `pixiCore.js`              ~ 195 рядків [Application, шари, SpritePool, запечені базові текстури]
  - `pixiSpriteAtlas.js`       ~ 125 рядків [Нарізання та кешування Texture зі спрайт-листів]
  - `pixiWorld.js`             ~ 250 рядків [Фон TilingSprite, Хаб, декалі, стіни, скрині, монумент, гнізда, ядро]
  - `pixiEntities.js`          ~ 215 рядків [Робот, вороги, лут, уламки з тінями та Y-sorting]
  - `pixiWeapons.js`           ~ 240 рядків [Рендер 6 архетипів зброї, зон, мін, пил, ударних хвиль]
  - `ui.js`                    ~ 265 рядків [HUD, арсенал, XP-бар, драфт, воркшоп, пауза]
  - `environment.js`           ~ 65 рядків  [Legacy Canvas 2D фон/Хаб (fallback якщо WebGL недоступний)]

- `js/world/` (Відкритий кільцевий світ):
  - `structures.js`            ~ 275 рядків [ObstacleWall, LootChest, Landmark, CorePickup, CorruptedNest]
  - `manager.js`               ~ 175 рядків [WorldManager, спавн руїн/гнізд, компас, трансфер/телепорт]

- `js/weapons/` (Бойове ядро на 6 архетипах):
  - `catalog.js`               ~ 200 рядків [WEAPON_ARCHETYPES, WEAPON_CATALOG, EVOLUTIONS, clone]
  - `projectiles.js`           ~ 235 рядків [Projectile, MortarShell, GroundZone]
  - `rangedArchetypes.js`      ~ 195 рядків [ProjectileWeapon, MortarWeapon, ChainWeapon]
  - `meleeArchetypes.js`       ~ 225 рядків [OrbitalWeapon, ConeWeapon, AuraWeapon]
  - `manager.js`               ~ 185 рядків [WeaponManager, ізольовані runConfigs, еволюції, вибухи]

- `js/enemies/` (Вороги та AI):
  - `grid.js`                  ~ 50 рядків  [SpatialGrid]
  - `enemy.js`                 ~ 230 рядків [Enemy: Sprout, Stalker, Dasher, бос Hive Warden]
  - `manager.js`               ~ 165 рядків [EnemyManager: хвилі, засідки, rear cap]

================================================================================
4. DATA CONTRACTS (ДЛЯ ІЗОЛЬОВАНИХ ЧАТІВ ПО 1 ПАПЦІ)
================================================================================
*Будь-яка логіка може змінюватися всередині своєї папки, якщо зберігає ці публічні поля:*

- **Player (`state.player`):**
  `x, y, vx, vy, radius, growthScale, facingAngle, health, maxHealth, shieldCharges, maxShieldCharges, invulnerableTimer, isCruising, carryingCore, godMode, afterimages[]`
- **Enemy (`state.enemyManager.enemies[]`):**
  `x, y, radius, typeKey ('sprout'|'stalker'|'dasher'|'warden'), color, health, maxHealth, hitFlashTimer, alive, isAwakened, isTelegraphing, isCharging`
- **World (`state.worldManager`):**
  `obstacles[] ({x, y, w, h})`, `chests[] ({x, y, opened})`, `nests[] ({x, y, radius, health, maxHealth, hitFlashTimer, alive})`, `landmark ({x, y, radius, repaired})`, `coreDrop ({x, y, radius, alive})`
- **Weapons (`state.weaponManager`):**
  `slots[] ({name, isEvolution, cfg: {archetype, damage, ...}})`, `projectiles[]`, `mortarShells[]`, `zones[]`, `particles[]`
- **Effects / Loot (`state`):**
  `pickupManager.pickups[] ({x, y, type, radius, alive})`, `gibManager.gibs[] ({x, y, z, angle, size, color, shape, alive})`, `shockwaves[] ({x, y, radius, color, alpha, alive})`

**Контекст під ізольований чат:**
- **Графіка/Спрайти:** `PROJECT_STATE.md` + `js/sprites.js` + `js/render/pixiSpriteAtlas.js` + потрібний `js/render/pixi*.js`.
- **Зброя/Баланс:** `PROJECT_STATE.md` + `js/weapons/*` (+ `UPGRADE_POOL` у `main.js`, поки не винесено в `weapons/`).
- **Вороги/Бойовка:** `PROJECT_STATE.md` + `js/config.js` + `js/enemies/*`.
- **Світ/Кільця/Хаб:** `PROJECT_STATE.md` + `js/config.js` + `js/world/*`.

================================================================================
5. GAME FEEL & DESIGN ROADMAP (v4.3 → v5.0)
================================================================================
### А. Графіка та технічна ізоляція (найближчий крок)
- [ ] **Фікс спрайтів (`js/render/` + `js/sprites.js`):** вирівнювання сіток PNG, правильний `anchor` (в ногах), напрямки спрайтів ворогів.
- [ ] **Анімації атак і телеграфи (`js/enemies/`):** додати `facingAngle` та `animState` (`chase` / `windup` / `attack`) для `Stalker` і `Warden` (чесний замах перед ударом).
- [ ] **Прибирання технічного хвоста:** винести `UPGRADE_POOL` з `main.js` у `js/weapons/upgrades.js`; видалити старі методи `render(ctx)` з логічних файлів після фінального налаштування PixiJS.

### B. Ритм бою та Динаміка (Core Game Feel)
- [x] Тактильний знос орди (Z-балістика ошмьотків, бризки декалів, мікро-хітстоп, 100% автострільба).
- [ ] **Хвильовий ритм — синусоїда (`js/enemies/manager.js`):** замінити лінійне наростання на дихаючий цикл: *Сплеск напруги → Тріумфальний розпил → ~15с перепочинок (збір луту, зміна позиції) → Нова хвиля*.
- [ ] **Loot Vacuum на гніздах (`js/world/structures.js`):** при знищенні гнізда запускати зелену гравітаційну хвилю, що миттєво притягує весь лут у великому радіусі (без їзди колами по порожній галявині).
- [ ] **Рандомізація пулу гнізд (`js/world/manager.js`):** щозабігу активувати випадковий набір стартових точок гнізд (захист від «Дня бабака»).

### C. Хаб — Прихисток та Anti-Camping (`js/world/` + `js/enemies/`)
- [ ] **Стартова допомога Хаба:** зелений купол Хаба лікує та допомагає відбивати перших мобів (турелі/коріння), але має **обмежений запас лікування на забіг**.
- [ ] **Нуль луту з турелей Хаба:** вороги, вбиті захистом бази, не дропають скрап і біо-есенцію (хочеш луту — виїжджай у поле).
- [ ] **«Гнів Улля» (Soft Enrage):** при відсиджуванні в безпечній зоні довше 2.5–3 хвилин — тряска землі, тривога та стіна невразливих титанів, яка зносить купол і робота.

### D. Відкритий світ, Кільця 2+ та Стрибки складності (`js/world/` + `js/enemies/` + `js/weapons/`)
- [ ] **Якісний гейтинг без кімнат і ваншотів:** відкриті концентричні кільця з рідкісними POI-руїнами. Перехід у Кільце 2 створює *тактичний тупик* замість миттєвої смерті:
  - Зовнішні зони павутини/слизу (сповільнюють гусениці на 50% без апгрейду траків).
  - Вороги з важкою фронтальною бронею (відбивають базові кулі; потребують кислотної/корозійної зброї).

### E. Економіка, Смерть та Аутпости (`js/player.js` + `js/world/` + `js/config.js`)
- [ ] **Часткова втрата скрапу при смерті:** замість 100% втрати — згорає 50%, а в Хабі качається *Безпека трюму* (`50% → 40% → 25%`).
- [ ] **Аутпости страхування здобичі:** швидка оборона точки в полі (10–15с) фіксує скинутий скрап + дає бонус за ризик, без повернення в Хаб.
- [ ] **Саморегуляція фарму:** у глибших кільцях значно дорожчий скрап + нові ресурси (хітин, ядра).

### F. Звук та Парковка ідей (Backlog / DLC)
- [ ] **Web Audio SFX:** хруст панцирів, постріли, хіти, детонації, левелап.
- [ ] **Brotato Combine:** злиття дублікатів зброї одного тиру для звільнення слотів.
- [ ] **Шатли евакуації:** повноцінний кінематографічний вихід із забігу на посадковій капсулі.
- [ ] **Візуальна еволюція шасі робота:** фізичний і візуальний ріст модулів робота.

================================================================================
6. ПРАВИЛА ДЛЯ LLM-АСИСТЕНТІВ У ЦЬОМУ ПРОЄКТІ
================================================================================
- ЖОДНИХ файлів більше 300 рядків.
- ЖОДНИХ змінних у `window.*`.
- `CONFIG` і `WEAPON_CATALOG` — тільки для читання. Динамічні модифікатори забігу живуть у `state` або `weaponManager.runConfigs`.
- Не порушувати DATA CONTRACTS без узгодження з користувачем.
- Жодного створення сміттєвих масивів/текстур у щокадровому циклі (`SpritePool` без алокацій).