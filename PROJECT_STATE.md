# PROJECT CUSTODIAN — MASTER STATE & HANDOVER (v4.7)
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
  `obstacles[]`, `chests[]`, `nests[]`, `outposts[] ({x, y, radius, captureRadius, state})`, `sanctuary ({healPool, maxHealPool, domeBroken, wrathWarning, campTimer})`, `landmark`, `coreDrop`
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

### B. Цикл гри (вирішити після багів)
- [ ] Ціль і фінал забігу (евакуація після очищення Пурифаєра?).
- [ ] Тиск ворогів залежить від скрапу в трюмі, а не лише від часу; ескалація видима на екрані.
- [ ] Зменшити кількість систем збереження скрапу (зараз 5).
- [ ] Вороги не швидші за гравця; плавніша крива XP; еволюції зберігають апгрейди; Flamer наводиться на ворогів.

### C. Відчуття гри
- [ ] Web Audio SFX.
- [ ] Агрегація цифр урону.
- [ ] Титульний екран, екран смерті з підсумком забігу.

### D. Пізніше
- [ ] Пайплайн асетів (прозорі спрайт-листи правильного розміру), спрайти Аутпостів/турелей.
- [ ] Нові кільця — лише коли Кільце 1 цікаве.
