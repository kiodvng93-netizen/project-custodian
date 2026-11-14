# PROJECT CUSTODIAN — MASTER STATE & HANDOVER (v4.8)
**Дата оновлення:** 14 листопада 2026
**Статус:** Модульний ES6+ проєкт, гібридний рендер **PixiJS v8 (WebGL світ + Y-sorting + тіні)** + **Canvas 2D UI**. Світ — лише **Кільце 1** (`15 000px`, межа світу). Фокус: зробити основний цикл Кільця 1 цікавим.

Карта файлів, правила роботи та запуск — у `CLAUDE.md`. Поточні баги й пріоритети — у `docs/AUDIT-2026-11-14.md`.

================================================================================
1. ВИКОНАНО
================================================================================
[x] Модульна архітектура (ES modules, `state.js`, `config.js` + версіонований сейв).
[x] PixiJS-рендер світу з Y-sorting і тінями; Canvas 2D для HUD.
[x] Синусоїдальний ритм хвиль (`22с Surge → 8с Ebb → 10с Breather`) + ескалація за `waveNumber`.
[x] Телеграфи `Stalker` і `Warden`; колізії зі стінами (сітка `_obstacleGrid`, swept-AABB для куль).
[x] Гнізда (`5000 HP`) + Loot Vacuum; радар-мінікарта.
[x] Хаб: ліміт лікування (`220 HP`), турелі без луту, депозит `[E]`, «Гнів Улля».
[x] Аутпости страхування (`12с`, `+35%`) + перк `HOLD SECURITY`.

### v4.7 — чистка (14.11.2026)
[-] **Видалено Кільце 2+.** Конфіг `ring2/3/4`, зони слизу/павутиння (`world/hazards.js`), HUD «RING 2». Ці механіки ніколи не були підключені до геймплею. Світ тепер обмежений `ring1Radius` (гравця не випускає за межу).
[-] **Видалено фронтальну броню ворогів.** `ENEMIES.ARMOR`, `armorPiercing` у снарядах, оверлей броні. `Enemy.takeDamage` ніколи її не враховував.
[-] **Видалено перк `ALL-TERRAIN TRACKS`** (не робив нічого) і картку драфта `ALL-TERRAIN CLEATS`. Сейв v1 → v2: витрачений на TRACKS скрап повертається у Vault.
[-] Видалено мертві файли `*.js2`. PixiJS зафіксовано на `8.22.0`.

================================================================================
2. DATA CONTRACTS
================================================================================
- **Player (`state.player`):**
  `x, y, vx, vy, radius, growthScale, facingAngle, health, maxHealth, shieldCharges, maxShieldCharges, invulnerableTimer, isCruising, carryingCore, godMode, afterimages[]`
- **Enemy (`state.enemyManager.enemies[]`):**
  `x, y, radius, typeKey ('sprout'|'stalker'|'dasher'|'warden'), color, health, maxHealth, hitFlashTimer, alive, isAwakened, isTelegraphing, isCharging, facingAngle, animState ('idle'|'chase'|'windup'|'attack'), isTitan, invulnerable`
  `takeDamage(amount, sourceX, sourceY, suppressLoot = false)`
- **World (`state.worldManager`):**
  `obstacles[]`, `chests[]`, `nests[]`, `initialNestCount`, `outposts[] ({x, y, radius, captureRadius, state})`, `sanctuary ({healPool, maxHealPool, domeBroken, wrathWarning, campTimer})`, `landmark`, `coreDrop`, `evac ({state: 'idle'|'active'|'complete', timer, totalTime, playerInZone, isActive})`, `isPurifierFieldActive()`
- **Run end (`state.runEnd`):** `null` під час гри; інакше `{outcome: 'victory'|'death'|'abort', banked, lost, bonus, timeSec, kills, level, wave, nestsCleansed, nestsTotal}`. Ставиться через `endRun()` у `js/run.js`.
- **Weapons (`state.weaponManager`):**
  `slots[] ({name, isEvolution, cfg: {archetype, damage, ...}})`, `projectiles[]`, `mortarShells[]`, `zones[]`, `particles[]`
- **Effects / Loot (`state`):**
  `pickupManager.pickups[]`, `gibManager.gibs[]`, `shockwaves[]`

================================================================================
3. ROADMAP (порядок з аудиту 2026-11-14)
================================================================================
### A. Баги, що ламають забіг — виправлено 14.11.2026 (перевірено в браузері)
- [x] Вороги зникають одразу після спавну на великих екранах. Радіус деспавну тепер `max(despawnRadius, дистанція спавну + 400)` (`enemies/manager.js`).
- [x] Покупка перку у Воркшопі посеред забігу стирає апгрейди драфта. Бонуси драфта зберігаються окремо (`player.runSpeedMult / runBonusHealth / runBonusShields`), скидаються лише при смерті.
- [x] Декалі «застигають» після витіснення чанку. `DecalManager.onEvict` → `PixiCore.releaseCanvasTexture` знищує текстуру чанку.
- [x] «Гнів Улля» спавнить Титанів без ліміту. Стеля живих Титанів `HUB.maxTitans` (14).
- [x] Смерть під час драфту переносить драфт і уповільнення в новий забіг. Рестарт скидає драфт, Воркшоп, паузу і `timeScale`; `[B]` не відкриває Воркшоп під час драфту.
- [x] Клавіші «залипають» після alt-tab (скидання на `blur`); Dash не спрацьовує на паузі, у драфті й у Воркшопі.

### B. Цикл гри
- [x] **Ціль і фінал забігу (v4.8, перевірено в браузері).** Ланцюжок: вбити Hive Warden → підібрати Ядро → віднести до Пурифаєра → `[E]` викликати евакуацію → утримати зону Пурифаєра `60с` (таймер стоїть поза зоною; поле Пурифаєра вимкнене; кільце засідки кожні `20с`) → перемога: весь трюм + `10` бонусного скрапу у Vault. Поточна ціль показана під радаром і стрілкою з відстанню біля краю екрана. Евакуація замінила 25-секундний Remote Transfer (`world/evac.js`, `world/objective.js`, `run.js`, `render/runUI.js`, конфіг `EVAC`).
- [ ] Тиск ворогів залежить від скрапу в трюмі, а не лише від часу; ескалація видима на екрані.
- [ ] Зменшити кількість систем збереження скрапу (зараз 4: Хаб, Аутпости, Евакуація, Fast Travel з податком; плюс часткове збереження при смерті).
- [ ] Вороги не швидші за гравця; плавніша крива XP; еволюції зберігають апгрейди; Flamer наводиться на ворогів.

### C. Відчуття гри
- [ ] Web Audio SFX.
- [ ] Агрегація цифр урону.
- [x] Екран підсумку забігу (перемога / знищення / відміна): час, хвиля, рівень, кілли, гнізда, скрап. Симуляція стоїть, новий забіг — `[Enter]` або клік.
- [ ] Титульний екран.

### D. Пізніше
- [ ] Пайплайн асетів (прозорі спрайт-листи правильного розміру), спрайти Аутпостів/турелей.
- [ ] Нові кільця — лише коли Кільце 1 цікаве.
