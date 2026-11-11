# PROJECT CUSTODIAN — MASTER STATE & HANDOVER (READY FOR STEP 26)

Документ полного контекста и текущего состояния проекта для загрузки в новую сессию разработки (Google AI Studio / Claude / ChatGPT).

================================================================================
ЧАСТЬ 1: СВОДКА ПРАВИЛ И ТЕКУЩИХ МЕХАНИК
================================================================================
1. Жанр: Semi-Roguelike Horde Survival / Extraction Lite (Canvas 2D, нативный JS, 60 FPS).
2. Сеттинг: Робот-хранитель очищает разрушенный мир от порчи и восстанавливает биосферу Земли.
3. Управление и боевой цикл:
   - Передвижение: WASD / стрелки (8 направлений с диагональной нормализацией).
   - Авто-стрельба: 6 слотов вооружения.
   - Пауза и системное меню: клавиши [ESC] или [P].
4. Экономика и ресурсы:
   - Bio-Essence: Только XP текущего забега, шкала уровня, вызов драфта карт в Bullet-Time (timeScale = 0.08). При гибели сгорает.
   - Tech Scrap: Мета-валюта Хаба. Выбивается из гнёзд и боссов. Защищается только при эвакуации или доставке в Хаб. При смерти теряется.
5. Защита и выживание:
   - Силовые щиты Aegis Shield (базово 1 заряд, перезарядка 25 сек с ускорением через апгрейды).
   - При уроне: 0.65с неуязвимости (I-Frames) + кинетический расталкивающий импульс.
   - Верхний правый монитор состояния: полоса HP (100/100), статус щитов, +HP/s регенерация, счетчик убийств (💀).
6. Мир (Кольцо 1 = 4000px):
   - Хаб в (0, 0) с зоной безопасности и Воркшопом [B].
   - 7 био-гнёзд (1000–3200м).
   - Монумент Biosphere Purifier на (2200, -1400).
   - Босс Hive Warden на (-2200, 1900) (1100 HP, таран на скорости 370, элитные Dasher свиты).
   - Доставка Ядра Стража в Монумент активирует зелёный купол (260px), терминал удаленного трансфера [E] (волна 25с, 100% скрапа в банк) и фаст-тревел [F] с налогом за дистанцию.
7. Полный арсенал оружия (6/6) и Эволюции:
   - [1] Tech Blaster (прямой кинетический снаряд).
   - [2] Scrap Saw (ближняя орбитальная резка).
   - [3] Bio-Spore Mortar (баллистический AoE + замедляющий DoT).
   - [4] Tesla Arc (цепная молния до 4 целей).
   - [5] Aegis Drones (орбитальные лазерные перехватчики + кинетический отброс).
   - [6] Plasma Purifier (направленный конус плазмы и ожоги).
   - Эволюция 1: Volt Hurricane (Scrap Saw + Tesla Arc) — электрические пилы с цепными детонациями.
   - Эволюция 2: Biomass Incinerator (Plasma Purifier + Bio-Spore Mortar) — зоны выжженной земли (DoT врагам, +4 HP/s исцеление роботу).
   - Эволюция 3: Hyperion Turret (Tech Blaster + Aegis Drones) — парящая турель со сквозными выстрелами и круговым залпом на 360°.
   - Эволюция 4: Storm Spore (Tesla Arc + Bio-Spore Mortar) — ионизированные облака спор с цепными разрядами и ускорением щита робота.
   - Механика компрессии: эволюции освобождают 1 слот (2 пушки объединяются в 1 слот).
8. Нижний HUD арсенала:
   - 6 интерактивных ячеек внизу экрана с параметрами урона, скорострельности и золотыми плашками для эволюций (★).
9. Инструменты отладки и обновления:
   - [G] — GOD MODE (бессмертие + гипер-урон на все 6 орудий и эволюции).
   - [`] или F2 — Окно телеметрии и мониторинга баланса.
   - `patcher.html` (Smart Patcher v3.1) — локальная утилита обновления через File System Access API.

================================================================================
ЧАСТЬ 2: ОБНОВЛЕННАЯ ДОРОЖНАЯ КАРТА ПРОЕКТА (105 ШАГОВ)
================================================================================
Фаза 1: Движок и фундамент (Шаги 1–5) [ВЫПОЛНЕНО]
  - Шаг 1: Canvas, 60 FPS delta loop, config.js, телеметрия.
  - Шаг 2: Физика робота (WASD), камера, силовые щиты.
  - Шаг 3: Стартовый Tech Blaster, притяжение кристаллов Bio-Essence.
  - Шаг 4: Система опыта (XP), рост робота, драфт апгрейдов в Bullet-Time.
  - Шаг 5: ИИ орды, расталкивание толпы, базовые враги (Sprout, Stalker).

Фаза 2: Орда, Мир, Босс и Мета-прогрессия (Шаги 6–10) [ВЫПОЛНЕНО]
  - Шаг 6: Эскалация спавна, био-гнёзда, перехватчики Dasher.
  - Шаг 7: Второе оружие (Scrap Saw), расширенный драфт, смерть и сброс.
  - Шаг 8: Ликвидация «паровозика» (квота на хвост 85), Монумент №1, Страж Ядра.
  - Шаг 9: Расширение Кольца 1 (4000px), таран Босса, терминал эвакуации.
  - Шаг 10: Разделение валют (Bio vs Scrap), Воркшоп [B], автосохранение localStorage.

Фаза 3: Полный арсенал оружия и слияния (Шаги 11–25) [ВЫПОЛНЕНО]
  - Шаг 11: Bio-Spore Mortar (баллистический DoT и замедление).
  - Шаг 12: Tesla Arc (цепная молния с процедурными зигзагами).
  - Шаги 13–15: Aegis Drones (орбитальные лазерные перехватчики).
  - Шаги 16–18: Plasma Purifier (конус пламени и горение).
  - Шаг 19: Ядро эволюций и Эволюция №1 Volt Hurricane (Tech+Tech).
  - Шаг 20: Эволюция №2 Biomass Incinerator (Tech+Bio: Кибер-экология).
  - Шаги 21–22: Эволюция №3 Hyperion Turret (Tech+Tech).
  - Шаги 23–25: Эволюция №4 Storm Spore (Tech+Bio), пауза [ESC], HUD здоровья и арсенала.

Фаза 3.5: Diablo-Style Juice & Visceral Combat (Шаги 26–30) [СЛЕДУЮЩАЯ ФАЗА]
  - Шаг 26: Offscreen Decal Canvas — запекание перманентных брызг люминесцентной био-слизи, машинного масла и выжженных пятен на земле без просадки 60 FPS.
  - Шаг 27: Кинетический импульс смерти (Directional Ragdoll & Gibs) — тела и кибер-осколки разлетаются по вектору фатального удара с замедлением трением.
  - Шаг 28: Micro Hit-Stop & Trauma Screen Shake — сочные микро-задержки кадров при критических взрывах и кинетическое сотрясение камеры.
  - Шаг 29: Аудио-визуальные вспышки аннигиляции (Shockwaves, Dynamic Lighting Glow).
  - Шаг 30: Стресс-тест сочности: одновременное уничтожение 60+ мобов в 60 FPS.

Фаза 4: Внешние биомы и дальние экспедиции (Шаги 31–45)
  - Шаги 31–35: Кольцо 2 (Ржавые дюны): песчаные черви, коррозия брони, Монумент №2.
  - Шаги 36–40: Первые дальнобойные стреляющие враги и турели заражения.
  - Шаги 41–45: Кольцо 3 (Ледяные пики) и Кольцо 4 (Древний заросший мегаполис).

Фаза 5: Развитие Сада и Терраформирование Хаба (Шаги 46–60)
  - Шаги 46–50: Рост Хаба «внутри и снаружи»: строительство гидропоники, энергогенераторов.
  - Шаги 51–55: Визуальное преображение мира: постоянные зеленые зоны вокруг монументов.
  - Шаги 56–60: Сеть быстрого перемещения между восстановленными монументами.

Фаза 6: Бестиарий, Разблокировки и Море Достижений (Шаги 61–75)
  - Шаги 61–65: Система постепенной разблокировки оружия и карточек за подвиги (Feats & Unlocks).
  - Шаги 66–70: Исследовательский журнал (Bio-Research Bestiary): убийство N врагов дает постоянные +0.5% статов.
  - Шаги 71–75: Система утилизации (Scrap Recycling) и мастерство модулей.

Фаза 7: Поздняя игра и Опциональная Сложность (Шаги 76–90)
  - Шаги 76–80: Система перегрузки Хаба (Heat / Corruption Modifiers).
  - Шаги 81–85: Бродячие Титаны (гигантские колоссы, патрулирующие границы колец).
  - Шаги 86–90: Глобальные события Blight Incursion.

Фаза 8: Звуковой движок Web Audio, Бот Балансировки и Релиз (Шаги 91–105)
  - Шаги 91–95: Синтез звуковых эффектов через Web Audio API.
  - Шаги 96–100: Процедурный генератор адаптивной музыки.
  - Шаги 101–103: Headless Simulation Bot для стресс-теста баланса урона.
  - Шаги 104–105: Финальная полировка, сохранение профилей, релизная сборка.

================================================================================
ЧАСТЬ 3: ИСХОДНЫЙ КОД ВСЕХ 11 ФАЙЛОВ ПРОЕКТА
================================================================================

--------------------------------------------------------------------------------
FILE: index.html
--------------------------------------------------------------------------------
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Custodian</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="gameContainer">
    <canvas id="gameCanvas"></canvas>
    <div id="debugHUD" class="hidden">
      <div class="hud-header">
        <span>TELEMETRY & BALANCE MONITOR</span>
        <span class="hud-key-hint">[Press ` or F2 to Close]</span>
      </div>
      <div id="hudContent"></div>
      <div class="hud-actions">
        <button id="btnCopyJSON">Copy Run Log (JSON)</button>
        <button id="btnResetTelemetry">Reset Metrics</button>
      </div>
    </div>
  </div>
  <script src="js/config.js"></script>
  <script src="js/telemetry.js"></script>
  <script src="js/weapons.js"></script>
  <script src="js/pickups.js"></script>
  <script src="js/enemies.js"></script>
  <script src="js/world.js"></script>
  <script src="js/player.js"></script>
  <script src="js/main.js"></script>
</body>
</html>

--------------------------------------------------------------------------------
FILE: style.css
--------------------------------------------------------------------------------
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
}
body, html {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #0d0f12;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
  color: #e0e6ed;
}
#gameContainer {
  position: relative;
  width: 100vw;
  height: 100vh;
}
#gameCanvas {
  display: block;
  width: 100%;
  height: 100%;
  background: #090a0f;
}
#debugHUD {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 360px;
  max-height: 85vh;
  background: rgba(13, 16, 23, 0.92);
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  font-size: 12px;
  line-height: 1.4;
  z-index: 999;
  overflow-y: auto;
  backdrop-filter: blur(4px);
}
#debugHUD.hidden {
  display: none;
}
.hud-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: #48bb78;
  border-bottom: 1px solid #2d3748;
  padding-bottom: 8px;
  margin-bottom: 10px;
}
.hud-key-hint {
  font-size: 10px;
  color: #718096;
}
#hudContent pre {
  font-family: monospace;
  white-space: pre-wrap;
  color: #cbd5e0;
}
.hud-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  border-top: 1px solid #2d3748;
  padding-top: 8px;
}
.hud-actions button {
  flex: 1;
  background: #1a202c;
  color: #a0aec0;
  border: 1px solid #4a5568;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}
.hud-actions button:hover {
  background: #2d3748;
  color: #fff;
}

--------------------------------------------------------------------------------
FILE: patcher.html
--------------------------------------------------------------------------------
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Project Custodian — Smart Patcher v3.1</title>
  <style>
    body {
      background-color: #0d1117;
      color: #c9d1d9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", monospace;
      padding: 24px;
      margin: 0;
    }
    .container { max-width: 920px; margin: 0 auto; }
    h1 { color: #58a6ff; font-size: 20px; margin-bottom: 6px; }
    p { font-size: 13px; color: #8b949e; margin-bottom: 14px; }
    .folder-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #161b22;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #30363d;
      margin-bottom: 14px;
    }
    .toolbar { display: flex; gap: 8px; margin-bottom: 8px; }
    button {
      background: #238636;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.15s, transform 0.05s;
    }
    button:hover { background: #2ea043; }
    button:active { transform: scale(0.98); }
    button:disabled { background: #21262d; color: #8b949e; cursor: not-allowed; }
    .btn-secondary { background: #21262d; color: #c9d1d9; border: 1px solid #30363d; }
    .btn-secondary:hover { background: #30363d; color: #fff; }
    .btn-danger { background: #21262d; color: #f85149; border: 1px solid #30363d; }
    .btn-danger:hover { background: #b62324; color: #fff; }
    textarea {
      width: 100%;
      height: 320px;
      background: #0d1117;
      color: #7ee787;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      box-sizing: border-box;
      resize: vertical;
    }
    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
    }
    #log {
      margin-top: 16px;
      background: #161b22;
      border: 1px solid #30363d;
      padding: 12px;
      border-radius: 6px;
      font-size: 12px;
      max-height: 240px;
      overflow-y: auto;
      white-space: pre-wrap;
    }
    .log-success { color: #3fb950; }
    .log-err { color: #f85149; font-weight: bold; }
    .log-info { color: #58a6ff; }
    .log-finish {
      color: #f0883e;
      font-weight: bold;
      border-top: 1px dashed #30363d;
      padding-top: 6px;
      margin-top: 6px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>CUSTODIAN SMART PATCHER v3.1</h1>
    <p>Точечный и полнофайловый патчер с нормализацией отступов и отчетом о завершении.</p>

    <div class="folder-bar">
      <button id="btnSelectDir">1. Выбрать папку проекта</button>
      <span id="folderStatus" style="font-size: 12px; color: #8b949e;">Папка не выбрана</span>
    </div>

    <div class="toolbar">
      <button id="btnPasteClipboard" class="btn-secondary">📋 Вставить из буфера</button>
      <button id="btnClearInput" class="btn-danger">✕ Очистить поле</button>
      <button id="btnClearLog" class="btn-secondary">Очистить лог</button>
    </div>

    <textarea id="patchInput" placeholder="Вставьте блок патча (=== PATCH_FILE или === REPLACE_FILE)..."></textarea>

    <div class="actions-bar">
      <button id="btnApply" disabled style="padding: 10px 22px; font-size: 13px;">3. Применить патч</button>
      <span id="patchSummary" style="font-size: 12px; color: #8b949e;"></span>
    </div>

    <div id="log">Ожидание выбора папки проекта...</div>
  </div>

  <script>
    let rootHandle = null;
    const logEl = document.getElementById('log');
    const folderStatus = document.getElementById('folderStatus');
    const btnApply = document.getElementById('btnApply');
    const patchInput = document.getElementById('patchInput');
    const patchSummary = document.getElementById('patchSummary');

    function log(msg, type = 'info') {
      const cls = type === 'err' ? 'log-err' : (type === 'success' ? 'log-success' : (type === 'finish' ? 'log-finish' : 'log-info'));
      logEl.innerHTML += `<div class="${cls}">[${new Date().toLocaleTimeString()}] ${msg}</div>`;
      logEl.scrollTop = logEl.scrollHeight;
    }

    document.getElementById('btnSelectDir').addEventListener('click', async () => {
      try {
        rootHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        folderStatus.textContent = `Папка: ${rootHandle.name}`;
        folderStatus.style.color = '#3fb950';
        btnApply.disabled = false;
        log(`Папка "${rootHandle.name}" подключена успешно!`, 'success');
      } catch (e) {
        log(`Ошибка выбора папки: ${e.message}`, 'err');
      }
    });

    document.getElementById('btnClearInput').addEventListener('click', () => {
      patchInput.value = '';
      patchSummary.textContent = '';
      log('Поле ввода очищено.', 'info');
    });

    document.getElementById('btnClearLog').addEventListener('click', () => {
      logEl.innerHTML = '';
      log('Лог очищен.', 'info');
    });

    document.getElementById('btnPasteClipboard').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        patchInput.value = text;
        updateSummary();
        log('Текст вставлен из буфера обмена.', 'success');
      } catch (e) {
        log('Вставьте текст вручную (Ctrl+V).', 'err');
      }
    });

    patchInput.addEventListener('input', updateSummary);

    function updateSummary() {
      const val = patchInput.value;
      const patchOps = (val.match(/=== PATCH_FILE:/g) || []).length;
      const replaceOps = (val.match(/=== REPLACE_FILE:/g) || []).length;
      if (patchOps || replaceOps) {
        patchSummary.textContent = `Файлов к изменению: ${patchOps + replaceOps}`;
      } else {
        patchSummary.textContent = '';
      }
    }

    async function getFileHandleRecursive(path) {
      const parts = path.replace(/\\/g, '/').split('/').filter(p => p.length > 0);
      let currentDir = rootHandle;
      for (let i = 0; i < parts.length - 1; i++) {
        currentDir = await currentDir.getDirectoryHandle(parts[i], { create: false });
      }
      return await currentDir.getFileHandle(parts[parts.length - 1], { create: false });
    }

    function fuzzyReplace(source, search, replace) {
      const normSource = source.replace(/\r\n/g, '\n');
      const normSearch = search.replace(/\r\n/g, '\n').trim();
      const normReplace = replace.replace(/\r\n/g, '\n');

      if (normSource.includes(normSearch)) {
        return normSource.replace(normSearch, normReplace);
      }

      const searchLines = normSearch.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const sourceLines = normSource.split('\n');

      for (let i = 0; i <= sourceLines.length - searchLines.length; i++) {
        let match = true;
        for (let j = 0; j < searchLines.length; j++) {
          if (sourceLines[i + j].trim() !== searchLines[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          sourceLines.splice(i, searchLines.length, normReplace);
          return sourceLines.join('\n');
        }
      }
      return null;
    }

    btnApply.addEventListener('click', async () => {
      if (!rootHandle) return;
      const rawText = patchInput.value.trim();
      if (!rawText) return;

      const startTime = performance.now();
      const rawBlocks = rawText.split(/(?==== (?:PATCH_FILE|REPLACE_FILE):)/g).filter(b => b.trim());

      let totalSuccess = 0;
      let totalErrors = 0;

      for (const block of rawBlocks) {
        const isFullReplace = block.startsWith('=== REPLACE_FILE:');
        const firstLineEnd = block.indexOf('\n');
        const header = block.substring(0, firstLineEnd).trim();
        const filePath = header.split(':')[1].trim();
        const body = block.substring(firstLineEnd + 1);

        log(`Обработка: ${filePath}...`, 'info');

        try {
          const fileHandle = await getFileHandleRecursive(filePath);

          if (isFullReplace) {
            const cleanContent = body.replace(/^\n+|\n+$/g, '');
            const writable = await fileHandle.createWritable();
            await writable.write(cleanContent);
            await writable.close();
            totalSuccess++;
            log(`✔ [ПОЛНАЯ ЗАМЕНА] ${filePath} успешно перезаписан!`, 'success');
            continue;
          }

          const file = await fileHandle.getFile();
          let currentContent = await file.text();
          const operations = body.split('<<< SEARCH').slice(1);
          let allOpsOk = true;

          for (const op of operations) {
            const splitPoint = op.indexOf('=== REPLACE');
            const endPoint = op.indexOf('>>>');
            if (splitPoint === -1 || endPoint === -1) continue;

            const searchPart = op.substring(0, splitPoint).replace(/^\n+|\n+$/g, '');
            const replacePart = op.substring(splitPoint + 11, endPoint).replace(/^\n+|\n+$/g, '');

            const result = fuzzyReplace(currentContent, searchPart, replacePart);
            if (result !== null) {
              currentContent = result;
              totalSuccess++;
              log(`  ✔ Блок успешно заменен в ${filePath}`, 'success');
            } else {
              allOpsOk = false;
              totalErrors++;
              log(`  ✖ ОШИБКА: Блок не найден в ${filePath}! Искали:\n${searchPart.slice(0, 100)}...`, 'err');
            }
          }

          if (allOpsOk) {
            const writable = await fileHandle.createWritable();
            await writable.write(currentContent);
            await writable.close();
            log(`✔ Все изменения сохранены в ${filePath}`, 'success');
          } else {
            log(`✖ Файл ${filePath} НЕ изменен из-за ошибок поиска!`, 'err');
          }

        } catch (err) {
          totalErrors++;
          log(`Ошибка доступа к ${filePath}: ${err.message}`, 'err');
        }
      }

      const elapsed = Math.round(performance.now() - startTime);

      if (totalErrors === 0) {
        log(`🎉 [ГОТОВО] Все файлы успешно обновлены за ${elapsed}ms! Успешных операций: ${totalSuccess}, Ошибок: 0.`, 'finish');
        const oldText = btnApply.textContent;
        btnApply.textContent = '✔ Успешно завершено!';
        btnApply.style.background = '#2ea043';
        setTimeout(() => {
          btnApply.textContent = oldText;
          btnApply.style.background = '';
        }, 2200);
      } else {
        log(`⚠ [ВНИМАНИЕ] Процесс завершен с ошибками за ${elapsed}ms. Успешно: ${totalSuccess}, Ошибок: ${totalErrors}.`, 'err');
      }
    });
  </script>
</body>
</html>

--------------------------------------------------------------------------------
FILE: js/config.js
--------------------------------------------------------------------------------
window.CONFIG = {
  ENGINE: {
    targetFPS: 60,
    maxDeltaTime: 0.1,
    debugKey: '`',
    altDebugKey: 'F2',
  },
  WORLD: {
    ring1Radius: 4000,
    ring2Radius: 7500,
    ring3Radius: 11000,
    ring4Radius: 16000,
    tileGridSize: 64,
    nestCountRing1: 7,
    landmarkPos: { x: 2200, y: -1400 },
    wardenPos: { x: -2200, y: 1900 },
    wardenAggroRadius: 800,
    terraformedRadius: 260,
  },
  PLAYER: {
    baseSpeed: 180,
    baseHealth: 100,
    baseShieldCharges: 1,
    shieldRechargeTime: 25.0,
    pickupRadius: 110,
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

--------------------------------------------------------------------------------
FILE: js/telemetry.js
--------------------------------------------------------------------------------
class TelemetryEngine {
  constructor() {
    this.sessionStartTime = performance.now();
    this.runStartTime = performance.now();
    this.isRunning = true;

    this.fps = 60;
    this.frameCount = 0;
    this.fpsTimer = 0;

    this.metrics = {
      runDurationSeconds: 0,
      damageDealt: 0,
      damageTaken: 0,
      kills: 0,
      shieldHitsAbsorbed: 0,
      resourcesCollected: { techScrap: 0, bioEssence: 0 },
      resourcesBanked: { techScrap: 0, bioEssence: 0 },
      resourcesLostOnDeath: { techScrap: 0, bioEssence: 0 },
      distanceTraveled: 0,
      transferSurgesAttempted: 0,
      transferSurgesFailed: 0,
      deaths: 0,
    };

    this.eventLog = [];
    this.hudTimer = 0;

    this.recordEvent('SYSTEM', 'Telemetry initialized');
  }

  recordEvent(type, message, payload = null) {
    const entry = {
      time: ((performance.now() - this.runStartTime) / 1000).toFixed(1),
      type,
      message,
      payload
    };
    this.eventLog.unshift(entry);
    if (this.eventLog.length > 100) this.eventLog.pop();
  }

  update(dt) {
    if (!this.isRunning) return;

    this.metrics.runDurationSeconds += dt;

    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round((this.frameCount / this.fpsTimer));
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.hudTimer += dt;
    if (this.hudTimer >= window.CONFIG.TELEMETRY.hudUpdateInterval) {
      this.updateHUD();
      this.hudTimer = 0;
    }
  }

  updateHUD() {
    const hudContainer = document.getElementById('hudContent');
    if (!hudContainer || document.getElementById('debugHUD').classList.contains('hidden')) return;

    const m = this.metrics;
    const minutes = Math.floor(m.runDurationSeconds / 60);
    const seconds = Math.floor(m.runDurationSeconds % 60).toString().padStart(2, '0');

    hudContainer.innerHTML = `
      <pre>
<strong>[ENGINE]</strong>
FPS: ${this.fps} | Run Time: ${minutes}:${seconds}

<strong>[COMBAT METRICS]</strong>
Kills: ${m.kills}
DPS Output: ${(m.damageDealt / Math.max(1, m.runDurationSeconds)).toFixed(1)}
Damage Taken: ${m.damageTaken} (Shields Absorbed: ${m.shieldHitsAbsorbed})

<strong>[ECONOMY]</strong>
Expedition Scrap: ${m.resourcesCollected.techScrap}
Sanctuary Vault: ${window.MetaProgression ? window.MetaProgression.bankedTechScrap : 0} Scrap
Lost on Death: Scrap ${m.resourcesLostOnDeath.techScrap}

<strong>[RECENT LOG]</strong>
${this.eventLog.slice(0, 5).map(e => `[${e.time}s] ${e.type}: ${e.message}`).join('\n')}
      </pre>
    `;
  }

  exportJSON() {
    const report = {
      exportedAt: new Date().toISOString(),
      configSnapshot: window.CONFIG,
      summary: this.metrics,
      metaProgression: window.MetaProgression,
      recentEvents: this.eventLog
    };
    return JSON.stringify(report, null, 2);
  }

  resetRun() {
    this.runStartTime = performance.now();
    this.metrics.runDurationSeconds = 0;
    this.metrics.damageDealt = 0;
    this.metrics.damageTaken = 0;
    this.metrics.kills = 0;
    this.recordEvent('RUN', 'New run started');
  }
}

window.Telemetry = new TelemetryEngine();

--------------------------------------------------------------------------------
FILE: js/weapons.js
--------------------------------------------------------------------------------
class Projectile {
  constructor(x, y, vx, vy, damage, range) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.maxRange = range;
    this.size = window.CONFIG.WEAPONS.blaster.projectileSize || 5;
    this.alive = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (Math.hypot(this.x - this.startX, this.y - this.startY) >= this.maxRange) {
      this.alive = false;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.strokeStyle = '#63b3ed';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.02, this.y - this.vy * 0.02);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class MortarShell {
  constructor(startX, startY, targetX, targetY, impactDamage, cloudRadius, cfg) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.x = startX;
    this.y = startY;
    this.impactDamage = impactDamage;
    this.cloudRadius = cloudRadius;
    this.cfg = cfg;

    this.flightTime = cfg.flightDuration;
    this.progress = 0;
    this.alive = true;
    this.peakHeight = 75;
  }

  update(dt, onDetonate) {
    this.progress += dt / this.flightTime;
    if (this.progress >= 1.0) {
      this.progress = 1.0;
      this.alive = false;
      onDetonate(this.targetX, this.targetY, this.impactDamage, this.cloudRadius, this.cfg);
      return;
    }

    this.x = this.startX + (this.targetX - this.startX) * this.progress;
    this.y = this.startY + (this.targetY - this.startY) * this.progress;
  }

  render(ctx) {
    const currentGroundY = this.y;
    const arcOffset = Math.sin(this.progress * Math.PI) * this.peakHeight;
    const drawY = currentGroundY - arcOffset;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(this.x, currentGroundY, 6 * (1 - this.progress * 0.3), 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38a169';
    ctx.strokeStyle = '#68d391';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, drawY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(104, 211, 145, 0.45)';
    ctx.beginPath();
    ctx.arc(this.x - (this.targetX - this.startX) * 0.02, drawY + 3, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class SporeCloud {
  constructor(x, y, radius, duration, dotDamage, tickRate, slowFactor) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.duration = duration;
    this.maxDuration = duration;
    this.dotDamage = dotDamage;
    this.tickRate = tickRate;
    this.tickTimer = 0;
    this.slowFactor = slowFactor;
    this.alive = true;
  }

  update(dt, enemies) {
    this.duration -= dt;
    if (this.duration <= 0) {
      this.alive = false;
      return;
    }

    this.tickTimer += dt;
    const doTick = this.tickTimer >= this.tickRate;
    if (doTick) {
      this.tickTimer = 0;
    }

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist <= this.radius + enemy.radius) {
        enemy.sporeSlowTimer = 0.25;
        enemy.sporeSlowMult = this.slowFactor;

        if (doTick) {
          enemy.takeDamage(this.dotDamage);
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const fadeAlpha = Math.min(1.0, this.duration / 0.5) * 0.32;
    const pulse = Math.sin(performance.now() / 200) * 3;

    ctx.fillStyle = `rgba(56, 161, 105, ${fadeAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(154, 230, 180, ${fadeAlpha * 1.5})`;
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 + (performance.now() / 1000);
      const pr = (this.radius * 0.55) + Math.sin(angle * 2) * 6;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * pr, Math.sin(angle) * pr, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = `rgba(104, 211, 145, ${fadeAlpha * 1.8})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }
}

class TechBlaster {
  constructor(owner) {
    this.owner = owner;
    this.cooldown = 0;
    this.cfg = window.CONFIG.WEAPONS.blaster;
    this.name = "Tech Blaster";
  }

  update(dt, enemies, projectiles) {
    if (this.cooldown > 0) this.cooldown -= dt;

    if (this.cooldown <= 0) {
      const target = this.findNearestEnemy(enemies);
      if (target) {
        this.fire(target, projectiles);
        this.cooldown = this.cfg.fireRate;
      }
    }
  }

  findNearestEnemy(enemies) {
    let closestEnemy = null;
    let closestDist = this.cfg.range;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestEnemy = enemy;
      }
    }
    return closestEnemy;
  }

  fire(target, projectiles) {
    const angle = Math.atan2(target.y - this.owner.y, target.x - this.owner.x);
    const vx = Math.cos(angle) * this.cfg.projectileSpeed;
    const vy = Math.sin(angle) * this.cfg.projectileSpeed;

    projectiles.push(new Projectile(
      this.owner.x,
      this.owner.y,
      vx,
      vy,
      this.cfg.damage,
      this.cfg.range
    ));
  }

  render() {}
}

class ScrapSaw {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.saw;
    this.currentAngle = 0;
    this.hitCooldowns = new Map();
    this.name = "Scrap Saw";
  }

  update(dt, enemies, projectiles, spawnParticles) {
    this.currentAngle += this.cfg.orbitSpeed * dt;

    for (const [enemy, timer] of this.hitCooldowns.entries()) {
      if (timer <= dt) this.hitCooldowns.delete(enemy);
      else this.hitCooldowns.set(enemy, timer - dt);
    }

    for (let b = 0; b < this.cfg.bladeCount; b++) {
      const bladeAngle = this.currentAngle + (b * (Math.PI * 2) / this.cfg.bladeCount);
      const bx = this.owner.x + Math.cos(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const by = this.owner.y + Math.sin(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(bx - enemy.x, by - enemy.y);
        if (dist < this.cfg.bladeRadius + enemy.radius) {
          if (!this.hitCooldowns.has(enemy)) {
            enemy.takeDamage(this.cfg.damage);
            this.hitCooldowns.set(enemy, 0.28);
            spawnParticles(bx, by);
          }
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    for (let b = 0; b < this.cfg.bladeCount; b++) {
      const bladeAngle = this.currentAngle + (b * (Math.PI * 2) / this.cfg.bladeCount);
      const bx = this.owner.x + Math.cos(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const by = this.owner.y + Math.sin(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      ctx.translate(bx, by);
      ctx.rotate(this.currentAngle * 4);

      ctx.fillStyle = '#cbd5e0';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      const teeth = 8;
      for (let i = 0; i < teeth * 2; i++) {
        const a = (i * Math.PI) / teeth;
        const r = i % 2 === 0 ? this.cfg.bladeRadius : this.cfg.bladeRadius * 0.65;
        const tx = Math.cos(a) * r;
        const ty = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4a5568';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(-this.currentAngle * 4);
      ctx.translate(-bx, -by);
    }
    ctx.restore();
  }
}

class BioSporeMortar {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.mortar;
    this.cooldown = 0;
    this.name = "Bio-Spore Mortar";
  }

  update(dt, enemies, shells) {
    if (this.cooldown > 0) this.cooldown -= dt;

    if (this.cooldown <= 0) {
      const clusterTarget = this.findBestClusterTarget(enemies);
      if (clusterTarget) {
        this.fire(clusterTarget, shells);
        this.cooldown = this.cfg.fireRate;
      }
    }
  }

  findBestClusterTarget(enemies) {
    let bestTarget = null;
    let maxClusterWeight = 0;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (d < this.cfg.minRange || d > this.cfg.maxRange) continue;

      let localWeight = 1;
      for (const other of enemies) {
        if (!other.alive || other === enemy) continue;
        const crowdDist = Math.hypot(enemy.x - other.x, enemy.y - other.y);
        if (crowdDist <= this.cfg.cloudRadius) {
          localWeight++;
        }
      }

      if (localWeight > maxClusterWeight) {
        maxClusterWeight = localWeight;
        bestTarget = enemy;
      }
    }

    return bestTarget;
  }

  fire(target, shells) {
    shells.push(new MortarShell(
      this.owner.x,
      this.owner.y,
      target.x,
      target.y,
      this.cfg.damage,
      this.cfg.cloudRadius,
      this.cfg
    ));
  }

  render() {}
}

class TeslaArc {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.tesla;
    this.cooldown = 0;
    this.activeBolts = [];
    this.name = "Tesla Arc";
  }

  update(dt, enemies, projectiles, spawnParticles) {
    if (this.cooldown > 0) this.cooldown -= dt;

    for (let i = this.activeBolts.length - 1; i >= 0; i--) {
      this.activeBolts[i].life -= dt;
      if (this.activeBolts[i].life <= 0) {
        this.activeBolts.splice(i, 1);
      }
    }

    if (this.cooldown <= 0) {
      const primaryTarget = this.findInitialTarget(enemies);
      if (primaryTarget) {
        this.triggerChainDischarge(primaryTarget, enemies, spawnParticles);
        this.cooldown = this.cfg.cooldown;
      }
    }
  }

  findInitialTarget(enemies) {
    let closest = null;
    let closestDist = this.cfg.initialRange;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }
    return closest;
  }

  triggerChainDischarge(initialTarget, enemies, spawnParticles) {
    const hitChain = [initialTarget];
    let current = initialTarget;

    initialTarget.takeDamage(this.cfg.damage);
    if (spawnParticles) spawnParticles(initialTarget.x, initialTarget.y);

    let fromX = this.owner.x;
    let fromY = this.owner.y;

    this.activeBolts.push({
      fromX,
      fromY,
      toX: initialTarget.x,
      toY: initialTarget.y,
      life: 0.12,
      maxLife: 0.12
    });

    for (let step = 1; step < this.cfg.chainCount; step++) {
      let nextTarget = null;
      let nextDist = this.cfg.chainRange;

      for (const enemy of enemies) {
        if (!enemy.alive || hitChain.includes(enemy)) continue;
        const d = Math.hypot(enemy.x - current.x, enemy.y - current.y);
        if (d < nextDist) {
          nextDist = d;
          nextTarget = enemy;
        }
      }

      if (nextTarget) {
        hitChain.push(nextTarget);
        nextTarget.takeDamage(this.cfg.damage * 0.9);
        if (spawnParticles) spawnParticles(nextTarget.x, nextTarget.y);

        this.activeBolts.push({
          fromX: current.x,
          fromY: current.y,
          toX: nextTarget.x,
          toY: nextTarget.y,
          life: 0.12,
          maxLife: 0.12
        });
        current = nextTarget;
      } else {
        break;
      }
    }
  }

  render(ctx) {
    for (const bolt of this.activeBolts) {
      this.drawLightning(ctx, bolt.fromX, bolt.fromY, bolt.toX, bolt.toY, bolt.life / bolt.maxLife);
    }
  }

  drawLightning(ctx, x1, y1, x2, y2, alpha) {
    ctx.save();
    ctx.strokeStyle = `rgba(129, 230, 217, ${alpha})`;
    ctx.shadowColor = '#4fd1c5';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;

    const segments = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const lx = x1 + (x2 - x1) * t;
      const ly = y1 + (y2 - y1) * t;
      const offset = (Math.random() - 0.5) * 16;
      ctx.lineTo(lx + offset, ly + offset);
    }

    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}

class AegisDrones {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.drone;
    this.currentAngle = 0;
    this.fireTimer = 0;
    this.laserBeams = [];
    this.name = "Aegis Drones";
  }

  update(dt, enemies, projectiles, spawnParticles) {
    this.currentAngle += this.cfg.orbitSpeed * dt;
    this.fireTimer += dt;

    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      this.laserBeams[i].life -= dt;
      if (this.laserBeams[i].life <= 0) {
        this.laserBeams.splice(i, 1);
      }
    }

    const canFire = this.fireTimer >= this.cfg.fireRate;
    if (canFire) this.fireTimer = 0;

    const count = this.cfg.droneCount;
    for (let i = 0; i < count; i++) {
      const droneAngle = this.currentAngle + (i * (Math.PI * 2) / count);
      const dx = this.owner.x + Math.cos(droneAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const dy = this.owner.y + Math.sin(droneAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const contactDist = Math.hypot(dx - enemy.x, dy - enemy.y);
        if (contactDist < 20 + enemy.radius) {
          enemy.takeDamage(this.cfg.pushbackDamage * dt * 2.5);
          const pushAngle = Math.atan2(enemy.y - dy, enemy.x - dx);
          enemy.x += Math.cos(pushAngle) * 90 * dt;
          enemy.y += Math.sin(pushAngle) * 90 * dt;
        }
      }

      if (canFire) {
        let nearestEnemy = null;
        let nearestDist = this.cfg.firingRange;

        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const dist = Math.hypot(dx - enemy.x, dy - enemy.y);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestEnemy = enemy;
          }
        }

        if (nearestEnemy) {
          nearestEnemy.takeDamage(this.cfg.damage);
          if (spawnParticles) spawnParticles(nearestEnemy.x, nearestEnemy.y);

          this.laserBeams.push({
            fromX: dx,
            fromY: dy,
            toX: nearestEnemy.x,
            toY: nearestEnemy.y,
            life: 0.08,
            maxLife: 0.08
          });
        }
      }
    }
  }

  render(ctx) {
    const count = this.cfg.droneCount;

    for (const beam of this.laserBeams) {
      const alpha = beam.life / beam.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(246, 173, 85, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(beam.fromX, beam.fromY);
      ctx.lineTo(beam.toX, beam.toY);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < count; i++) {
      const droneAngle = this.currentAngle + (i * (Math.PI * 2) / count);
      const dx = this.owner.x + Math.cos(droneAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const dy = this.owner.y + Math.sin(droneAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(droneAngle + Math.PI / 2);

      ctx.fillStyle = '#2d3748';
      ctx.strokeStyle = '#ed8936';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(6, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f6ad55';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}

class PlasmaPurifier {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.flamer;
    this.particles = [];
    this.spawnTimer = 0;
    this.name = "Plasma Purifier";
  }

  update(dt, enemies) {
    this.spawnTimer += dt;
    const baseAngle = this.owner.facingAngle;

    if (this.spawnTimer >= 0.03) {
      this.spawnTimer = 0;
      for (let i = 0; i < 3; i++) {
        const spread = (Math.random() - 0.5) * this.cfg.spreadAngle;
        const speed = 190 + Math.random() * 120;
        this.particles.push({
          x: this.owner.x + Math.cos(baseAngle) * (this.owner.radius * 0.7),
          y: this.owner.y + Math.sin(baseAngle) * (this.owner.radius * 0.7),
          vx: Math.cos(baseAngle + spread) * speed,
          vy: Math.sin(baseAngle + spread) * speed,
          life: 0.38,
          maxLife: 0.38,
          size: 4 + Math.random() * 5
        });
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    const halfSpread = this.cfg.spreadAngle / 2;
    const currentRange = this.cfg.range * this.owner.growthScale;
    const currentRangeSq = currentRange * currentRange;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x - this.owner.x;
      const dy = enemy.y - this.owner.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= currentRangeSq) {
        const angleToEnemy = Math.atan2(dy, dx);
        let diff = Math.abs(angleToEnemy - baseAngle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;

        if (diff <= halfSpread) {
          enemy.takeDamage(this.cfg.damage * dt);
          enemy.plasmaBurnTimer = this.cfg.burnDuration;
          enemy.plasmaBurnDmg = this.cfg.burnDamage;
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    for (const p of this.particles) {
      const ratio = p.life / p.maxLife;
      const radius = p.size * (1 - ratio * 0.3);

      if (ratio > 0.6) {
        ctx.fillStyle = `rgba(255, 255, 255, ${ratio})`;
      } else if (ratio > 0.3) {
        ctx.fillStyle = `rgba(246, 173, 85, ${ratio * 0.9})`;
      } else {
        ctx.fillStyle = `rgba(229, 62, 62, ${ratio * 0.7})`;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class VoltHurricane {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.voltHurricane;
    this.currentAngle = 0;
    this.hitCooldowns = new Map();
    this.activeBolts = [];
    this.name = "Volt Hurricane";
    this.isEvolution = true;
    this.slotCost = 1;
  }

  update(dt, enemies, projectiles, spawnParticles) {
    this.currentAngle += this.cfg.orbitSpeed * dt;

    for (let i = this.activeBolts.length - 1; i >= 0; i--) {
      this.activeBolts[i].life -= dt;
      if (this.activeBolts[i].life <= 0) {
        this.activeBolts.splice(i, 1);
      }
    }

    for (const [enemy, timer] of this.hitCooldowns.entries()) {
      if (timer <= dt) this.hitCooldowns.delete(enemy);
      else this.hitCooldowns.set(enemy, timer - dt);
    }

    const count = this.cfg.bladeCount;
    for (let b = 0; b < count; b++) {
      const bladeAngle = this.currentAngle + (b * (Math.PI * 2) / count);
      const bx = this.owner.x + Math.cos(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const by = this.owner.y + Math.sin(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(bx - enemy.x, by - enemy.y);
        if (dist < 16 + enemy.radius) {
          if (!this.hitCooldowns.has(enemy)) {
            enemy.takeDamage(this.cfg.damage);
            this.hitCooldowns.set(enemy, 0.22);
            if (spawnParticles) spawnParticles(bx, by);

            this.triggerDischarge(bx, by, enemy, enemies, spawnParticles);
          }
        }
      }
    }
  }

  triggerDischarge(fromX, fromY, hitEnemy, enemies, spawnParticles) {
    let current = hitEnemy;
    const hitChain = [hitEnemy];

    for (let i = 0; i < this.cfg.chainTargets; i++) {
      let nextTarget = null;
      let nextDist = this.cfg.chainRange;

      for (const other of enemies) {
        if (!other.alive || hitChain.includes(other)) continue;
        const d = Math.hypot(other.x - current.x, other.y - current.y);
        if (d < nextDist) {
          nextDist = d;
          nextTarget = other;
        }
      }

      if (nextTarget) {
        hitChain.push(nextTarget);
        nextTarget.takeDamage(this.cfg.chainDamage);
        if (spawnParticles) spawnParticles(nextTarget.x, nextTarget.y);

        this.activeBolts.push({
          fromX: current.x,
          fromY: current.y,
          toX: nextTarget.x,
          toY: nextTarget.y,
          life: 0.1,
          maxLife: 0.1
        });
        current = nextTarget;
      } else {
        break;
      }
    }
  }

  render(ctx) {
    for (const bolt of this.activeBolts) {
      const alpha = bolt.life / bolt.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(129, 230, 217, ${alpha})`;
      ctx.shadowColor = '#4fd1c5';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bolt.fromX, bolt.fromY);
      ctx.lineTo(bolt.toX, bolt.toY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    const count = this.cfg.bladeCount;
    for (let b = 0; b < count; b++) {
      const bladeAngle = this.currentAngle + (b * (Math.PI * 2) / count);
      const bx = this.owner.x + Math.cos(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const by = this.owner.y + Math.sin(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      ctx.translate(bx, by);
      ctx.rotate(this.currentAngle * 6);

      ctx.fillStyle = '#81e6d9';
      ctx.strokeStyle = '#e6fffa';
      ctx.lineWidth = 2;

      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8;
        const r = i % 2 === 0 ? 15 : 9;
        const tx = Math.cos(a) * r;
        const ty = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#234e52';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(-this.currentAngle * 6);
      ctx.translate(-bx, -by);
    }
    ctx.restore();
  }
}

class IncineratorShell {
  constructor(startX, startY, targetX, targetY, cfg) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.x = startX;
    this.y = startY;
    this.cfg = cfg;
    this.flightTime = cfg.flightDuration;
    this.progress = 0;
    this.alive = true;
    this.peakHeight = 85;
  }

  update(dt, onDetonate) {
    this.progress += dt / this.flightTime;
    if (this.progress >= 1.0) {
      this.progress = 1.0;
      this.alive = false;
      onDetonate(this.targetX, this.targetY, this.cfg);
      return;
    }
    this.x = this.startX + (this.targetX - this.startX) * this.progress;
    this.y = this.startY + (this.targetY - this.startY) * this.progress;
  }

  render(ctx) {
    const currentGroundY = this.y;
    const arcOffset = Math.sin(this.progress * Math.PI) * this.peakHeight;
    const drawY = currentGroundY - arcOffset;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(this.x, currentGroundY, 8 * (1 - this.progress * 0.3), 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dd6b20';
    ctx.strokeStyle = '#fbd38d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(this.x, drawY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#48bb78';
    ctx.beginPath();
    ctx.arc(this.x, drawY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class CleansingAshZone {
  constructor(x, y, cfg) {
    this.x = x;
    this.y = y;
    this.cfg = cfg;
    this.duration = cfg.zoneDuration;
    this.radius = cfg.zoneRadius;
    this.alive = true;
  }

  update(dt, enemies, player) {
    this.duration -= dt;
    if (this.duration <= 0) {
      this.alive = false;
      return;
    }

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (d <= this.radius + enemy.radius) {
        enemy.takeDamage(this.cfg.zoneDamage * dt);
        enemy.sporeSlowTimer = 0.2;
        enemy.sporeSlowMult = this.cfg.slowFactor;
      }
    }

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    if (distToPlayer <= this.radius + player.radius) {
      player.heal(this.cfg.healPerSec * dt);
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const fadeAlpha = Math.min(1.0, this.duration / 0.6) * 0.38;
    const pulse = Math.sin(performance.now() / 150) * 4;

    ctx.fillStyle = `rgba(221, 107, 32, ${fadeAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(72, 187, 120, ${fadeAlpha * 1.3})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.55 + pulse * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(246, 224, 94, ${fadeAlpha * 1.8})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }
}

class BiomassIncinerator {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.biomassIncinerator;
    this.cooldown = 0;
    this.shells = [];
    this.zones = [];
    this.name = "Biomass Incinerator";
    this.isEvolution = true;
    this.slotCost = 1;
  }

  update(dt, enemies, projectiles, spawnParticles) {
    if (this.cooldown > 0) this.cooldown -= dt;

    if (this.cooldown <= 0) {
      const clusterTarget = this.findBestClusterTarget(enemies);
      if (clusterTarget) {
        this.fire(clusterTarget);
        this.cooldown = this.cfg.fireRate;
      }
    }

    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.update(dt, (tx, ty, cfg) => {
        this.detonateShell(tx, ty, cfg, enemies, spawnParticles);
      });
      if (!s.alive) this.shells.splice(i, 1);
    }

    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.update(dt, enemies, this.owner);
      if (!z.alive) this.zones.splice(i, 1);
    }
  }

  findBestClusterTarget(enemies) {
    let best = null;
    let maxWeight = 0;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (d < this.cfg.minRange || d > this.cfg.maxRange) continue;

      let weight = 1;
      for (const other of enemies) {
        if (!other.alive || other === enemy) continue;
        if (Math.hypot(enemy.x - other.x, enemy.y - other.y) <= this.cfg.zoneRadius) {
          weight++;
        }
      }

      if (weight > maxWeight) {
        maxWeight = weight;
        best = enemy;
      }
    }
    return best;
  }

  fire(target) {
    this.shells.push(new IncineratorShell(this.owner.x, this.owner.y, target.x, target.y, this.cfg));
  }

  detonateShell(x, y, cfg, enemies, spawnParticles) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (Math.hypot(enemy.x - x, enemy.y - y) <= cfg.zoneRadius + enemy.radius) {
        enemy.takeDamage(cfg.impactDamage);
      }
    }

    this.zones.push(new CleansingAshZone(x, y, cfg));

    if (spawnParticles) {
      for (let i = 0; i < 20; i++) {
        spawnParticles(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
      }
    }
  }

  render(ctx) {
    for (const z of this.zones) z.render(ctx);
    for (const s of this.shells) s.render(ctx);
  }
}

class HyperionProjectile {
  constructor(x, y, vx, vy, damage, range, maxPierce) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.maxRange = range;
    this.size = 7;
    this.pierceLeft = maxPierce;
    this.hitEnemies = new Set();
    this.alive = true;
  }

  update(dt, enemies, spawnParticles) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (Math.hypot(this.x - this.startX, this.y - this.startY) >= this.maxRange) {
      this.alive = false;
      return;
    }

    for (const enemy of enemies) {
      if (!enemy.alive || this.hitEnemies.has(enemy)) continue;
      const d = Math.hypot(this.x - enemy.x, this.y - enemy.y);
      if (d <= this.size + enemy.radius) {
        enemy.takeDamage(this.damage);
        this.hitEnemies.add(enemy);
        if (spawnParticles) spawnParticles(this.x, this.y);
        this.pierceLeft--;
        if (this.pierceLeft <= 0) {
          this.alive = false;
          break;
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.strokeStyle = '#63b3ed';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.03, this.y - this.vy * 0.03);
    ctx.stroke();

    ctx.fillStyle = '#ebf8ff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class HyperionTurret {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.hyperionTurret;
    this.cooldown = 0;
    this.salvoTimer = 0;
    this.orbitAngle = 0;
    this.projectiles = [];
    this.name = "Hyperion Turret";
    this.isEvolution = true;
    this.slotCost = 1;
  }

  update(dt, enemies, globalProjectiles, spawnParticles) {
    this.orbitAngle += 1.2 * dt;
    if (this.cooldown > 0) this.cooldown -= dt;
    this.salvoTimer += dt;

    const tx = this.owner.x + Math.cos(this.orbitAngle) * (60 * this.owner.growthScale);
    const ty = this.owner.y + Math.sin(this.orbitAngle) * (60 * this.owner.growthScale);

    if (this.cooldown <= 0) {
      const target = this.findNearestEnemy(tx, ty, enemies);
      if (target) {
        this.fire(tx, ty, target);
        this.cooldown = this.cfg.fireRate;
      }
    }

    if (this.salvoTimer >= this.cfg.salvoCooldown) {
      this.salvoTimer = 0;
      this.triggerSalvo(tx, ty);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, enemies, spawnParticles);
      if (!p.alive) this.projectiles.splice(i, 1);
    }
  }

  findNearestEnemy(fromX, fromY, enemies) {
    let nearest = null;
    let minDist = this.cfg.range;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - fromX, enemy.y - fromY);
      if (d < minDist) {
        minDist = d;
        nearest = enemy;
      }
    }
    return nearest;
  }

  fire(fromX, fromY, target) {
    const angle = Math.atan2(target.y - fromY, target.x - fromX);
    const vx = Math.cos(angle) * this.cfg.projectileSpeed;
    const vy = Math.sin(angle) * this.cfg.projectileSpeed;
    this.projectiles.push(new HyperionProjectile(
      fromX, fromY, vx, vy, this.cfg.damage, this.cfg.range, this.cfg.pierceCount
    ));
  }

  triggerSalvo(fromX, fromY) {
    const count = this.cfg.salvoCount;
    for (let i = 0; i < count; i++) {
      const a = (i * Math.PI * 2) / count;
      const vx = Math.cos(a) * (this.cfg.projectileSpeed * 0.85);
      const vy = Math.sin(a) * (this.cfg.projectileSpeed * 0.85);
      this.projectiles.push(new HyperionProjectile(
        fromX, fromY, vx, vy, this.cfg.salvoDamage, 280, 1
      ));
    }
  }

  render(ctx) {
    for (const p of this.projectiles) p.render(ctx);

    const tx = this.owner.x + Math.cos(this.orbitAngle) * (60 * this.owner.growthScale);
    const ty = this.owner.y + Math.sin(this.orbitAngle) * (60 * this.owner.growthScale);

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(this.orbitAngle + Math.PI / 2);

    ctx.fillStyle = '#1a365d';
    ctx.strokeStyle = '#63b3ed';
    ctx.lineWidth = 2;
    ctx.fillRect(-10, -10, 20, 20);
    ctx.strokeRect(-10, -10, 20, 20);

    ctx.fillStyle = '#90cdf4';
    ctx.fillRect(-6, -16, 4, 10);
    ctx.fillRect(2, -16, 4, 10);

    ctx.fillStyle = '#ecc94b';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class StormSporeCloud {
  constructor(x, y, cfg) {
    this.x = x;
    this.y = y;
    this.cfg = cfg;
    this.duration = cfg.cloudDuration;
    this.radius = cfg.cloudRadius;
    this.dotTimer = 0;
    this.chainTimer = 0;
    this.activeArcs = [];
    this.alive = true;
  }

  update(dt, enemies, player, spawnParticles) {
    this.duration -= dt;
    if (this.duration <= 0) {
      this.alive = false;
      return;
    }

    for (let i = this.activeArcs.length - 1; i >= 0; i--) {
      this.activeArcs[i].life -= dt;
      if (this.activeArcs[i].life <= 0) this.activeArcs.splice(i, 1);
    }

    this.dotTimer += dt;
    const doDot = this.dotTimer >= this.cfg.dotTickRate;
    if (doDot) this.dotTimer = 0;

    const trappedEnemies = [];
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (d <= this.radius + enemy.radius) {
        enemy.sporeSlowTimer = 0.2;
        enemy.sporeSlowMult = this.cfg.slowFactor;
        trappedEnemies.push(enemy);
        if (doDot) enemy.takeDamage(this.cfg.dotDamage);
      }
    }

    if (Math.hypot(player.x - this.x, player.y - this.y) <= this.radius + player.radius) {
      if (player.shieldCharges < player.maxShieldCharges) {
        player.shieldTimer += dt * 0.35;
      }
    }

    this.chainTimer += dt;
    if (this.chainTimer >= this.cfg.chainInterval && trappedEnemies.length > 0) {
      this.chainTimer = 0;
      const source = trappedEnemies[Math.floor(Math.random() * trappedEnemies.length)];

      let target = null;
      let targetDist = 170;
      for (const enemy of enemies) {
        if (!enemy.alive || enemy === source) continue;
        const d = Math.hypot(enemy.x - source.x, enemy.y - source.y);
        if (d < targetDist) {
          targetDist = d;
          target = enemy;
        }
      }

      if (target) {
        target.takeDamage(this.cfg.chainDamage);
        if (spawnParticles) spawnParticles(target.x, target.y);
        this.activeArcs.push({
          fromX: source.x,
          fromY: source.y,
          toX: target.x,
          toY: target.y,
          life: 0.12,
          maxLife: 0.12
        });
      }
    }
  }

  render(ctx) {
    for (const arc of this.activeArcs) {
      const alpha = arc.life / arc.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(129, 230, 217, ${alpha})`;
      ctx.shadowColor = '#4fd1c5';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arc.fromX, arc.fromY);
      ctx.lineTo(arc.toX, arc.toY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    const fadeAlpha = Math.min(1.0, this.duration / 0.6) * 0.35;
    const pulse = Math.sin(performance.now() / 160) * 4;

    ctx.fillStyle = `rgba(72, 187, 120, ${fadeAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(129, 230, 217, ${fadeAlpha * 1.6})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = `rgba(226, 232, 240, ${fadeAlpha * 1.8})`;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + (performance.now() / 400);
      const pr = this.radius * 0.45;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * pr, Math.sin(a) * pr, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class StormSpore {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.stormSpore;
    this.cooldown = 0;
    this.shells = [];
    this.clouds = [];
    this.name = "Storm Spore";
    this.isEvolution = true;
    this.slotCost = 1;
  }

  update(dt, enemies, globalProjectiles, spawnParticles) {
    if (this.cooldown > 0) this.cooldown -= dt;

    if (this.cooldown <= 0) {
      const target = this.findClusterTarget(enemies);
      if (target) {
        this.fire(target);
        this.cooldown = this.cfg.fireRate;
      }
    }

    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.update(dt, (tx, ty, cfg) => {
        this.detonateShell(tx, ty, cfg, enemies, spawnParticles);
      });
      if (!s.alive) this.shells.splice(i, 1);
    }

    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const c = this.clouds[i];
      c.update(dt, enemies, this.owner, spawnParticles);
      if (!c.alive) this.clouds.splice(i, 1);
    }
  }

  findClusterTarget(enemies) {
    let best = null;
    let maxWeight = 0;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (d < this.cfg.minRange || d > this.cfg.maxRange) continue;

      let weight = 1;
      for (const other of enemies) {
        if (!other.alive || other === enemy) continue;
        if (Math.hypot(enemy.x - other.x, enemy.y - other.y) <= this.cfg.cloudRadius) {
          weight++;
        }
      }
      if (weight > maxWeight) {
        maxWeight = weight;
        best = enemy;
      }
    }
    return best;
  }

  fire(target) {
    this.shells.push(new IncineratorShell(this.owner.x, this.owner.y, target.x, target.y, this.cfg));
  }

  detonateShell(x, y, cfg, enemies, spawnParticles) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (Math.hypot(enemy.x - x, enemy.y - y) <= cfg.cloudRadius + enemy.radius) {
        enemy.takeDamage(cfg.impactDamage);
      }
    }

    this.clouds.push(new StormSporeCloud(x, y, cfg));

    if (spawnParticles) {
      for (let i = 0; i < 16; i++) {
        spawnParticles(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
      }
    }
  }

  render(ctx) {
    for (const c of this.clouds) c.render(ctx);
    for (const s of this.shells) s.render(ctx);
  }
}

class WeaponManager {
  constructor(owner) {
    this.owner = owner;
    this.slots = [new TechBlaster(owner)];
    this.maxSlots = 6;
    this.projectiles = [];
    this.mortarShells = [];
    this.sporeClouds = [];
    this.particles = [];
  }

  hasWeapon(name) {
    return this.slots.some(w => w.name === name);
  }

  addWeapon(weaponInstance) {
    if (this.slots.length < this.maxSlots) {
      this.slots.push(weaponInstance);
      return true;
    }
    return false;
  }

  evolveWeapons(evolutionKey) {
    const evo = window.CONFIG.EVOLUTIONS[evolutionKey];
    if (!evo) return false;

    const hasAll = evo.ingredients.every(name => this.hasWeapon(name));
    if (!hasAll) return false;

    this.slots = this.slots.filter(w => !evo.ingredients.includes(w.name));

    if (evo.resultWeapon === 'Volt Hurricane') {
      this.slots.push(new VoltHurricane(this.owner));
    } else if (evo.resultWeapon === 'Biomass Incinerator') {
      this.slots.push(new BiomassIncinerator(this.owner));
    } else if (evo.resultWeapon === 'Hyperion Turret') {
      this.slots.push(new HyperionTurret(this.owner));
    } else if (evo.resultWeapon === 'Storm Spore') {
      this.slots.push(new StormSpore(this.owner));
    }

    if (window.Telemetry) {
      window.Telemetry.recordEvent('EVOLUTION', `WEAPON EVOLVED: ${evo.name}! Slot compressed.`);
    }
    return true;
  }

  reset() {
    this.slots = [new TechBlaster(this.owner)];
    this.projectiles = [];
    this.mortarShells = [];
    this.sporeClouds = [];
    this.particles = [];
  }

  update(dt, enemies) {
    for (const enemy of enemies) {
      if (enemy.sporeSlowTimer && enemy.sporeSlowTimer > 0) {
        enemy.sporeSlowTimer -= dt;
        enemy.currentSlow = enemy.sporeSlowMult || 0.55;
      } else {
        enemy.currentSlow = 1.0;
      }
    }

    for (const weapon of this.slots) {
      if (weapon instanceof ScrapSaw) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else if (weapon instanceof BioSporeMortar) {
        weapon.update(dt, enemies, this.mortarShells);
      } else if (weapon instanceof TeslaArc) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else if (weapon instanceof AegisDrones) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else if (weapon instanceof PlasmaPurifier) {
        weapon.update(dt, enemies);
      } else if (weapon instanceof VoltHurricane) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else if (weapon instanceof BiomassIncinerator) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else if (weapon instanceof HyperionTurret) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else if (weapon instanceof StormSpore) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else {
        weapon.update(dt, enemies, this.projectiles);
      }
    }

    for (let i = this.mortarShells.length - 1; i >= 0; i--) {
      const shell = this.mortarShells[i];
      shell.update(dt, (tx, ty, impactDmg, cloudRadius, cfg) => {
        this.detonateSporeShell(tx, ty, impactDmg, cloudRadius, cfg, enemies);
      });
      if (!shell.alive) {
        this.mortarShells.splice(i, 1);
      }
    }

    for (let i = this.sporeClouds.length - 1; i >= 0; i--) {
      const cloud = this.sporeClouds[i];
      cloud.update(dt, enemies);
      if (!cloud.alive) {
        this.sporeClouds.splice(i, 1);
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (dist < p.size + enemy.radius) {
          enemy.takeDamage(p.damage);
          this.spawnImpactParticles(p.x, p.y);
          p.alive = false;
          break;
        }
      }

      if (!p.alive) {
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  detonateSporeShell(x, y, impactDmg, radius, cfg, enemies) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - x, enemy.y - y);
      if (d <= radius + enemy.radius) {
        enemy.takeDamage(impactDmg);
      }
    }

    this.sporeClouds.push(new SporeCloud(
      x,
      y,
      radius,
      cfg.cloudDuration,
      cfg.dotDamage,
      cfg.dotTickRate,
      cfg.slowFactor
    ));

    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45,
        maxLife: 0.45,
        color: '#68d391'
      });
    }
  }

  spawnImpactParticles(x, y) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.2,
        maxLife: 0.2,
        color: '#63b3ed'
      });
    }
  }

  render(ctx) {
    for (const cloud of this.sporeClouds) cloud.render(ctx);
    for (const shell of this.mortarShells) shell.render(ctx);
    for (const p of this.projectiles) p.render(ctx);
    for (const w of this.slots) w.render(ctx);

    for (const pt of this.particles) {
      const alpha = pt.life / pt.maxLife;
      ctx.fillStyle = pt.color ? pt.color : `rgba(99, 179, 237, ${alpha})`;
      ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
    }
  }
}

window.WeaponManager = WeaponManager;
window.TechBlaster = TechBlaster;
window.ScrapSaw = ScrapSaw;
window.BioSporeMortar = BioSporeMortar;
window.TeslaArc = TeslaArc;
window.AegisDrones = AegisDrones;
window.PlasmaPurifier = PlasmaPurifier;
window.VoltHurricane = VoltHurricane;
window.BiomassIncinerator = BiomassIncinerator;
window.HyperionTurret = HyperionTurret;
window.StormSpore = StormSpore;

--------------------------------------------------------------------------------
FILE: js/pickups.js
--------------------------------------------------------------------------------
class Pickup {
  constructor(x, y, type = 'bio', value = 1) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 50;
    this.vy = (Math.random() - 0.5) * 50;
    this.type = type;
    this.value = value;
    this.radius = 6;
    this.alive = true;
    this.isMagnetized = false;
    this.homingSpeed = 220;
  }

  update(dt, player) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);

    if (dist <= window.CONFIG.PLAYER.pickupRadius) {
      this.isMagnetized = true;
    }

    if (this.isMagnetized) {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);

      this.homingSpeed = Math.min(
        this.homingSpeed + window.CONFIG.PICKUPS.magnetAcceleration * dt * 1.5,
        900
      );

      this.vx = Math.cos(angle) * this.homingSpeed;
      this.vy = Math.sin(angle) * this.homingSpeed;

      const stepDistance = this.homingSpeed * dt;
      if (dist <= stepDistance + this.radius + player.radius) {
        this.collect();
        return;
      }
    } else {
      this.vx *= 0.90;
      this.vy *= 0.90;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  collect() {
    this.alive = false;
    if (this.type === 'bio') {
      window.Telemetry.metrics.resourcesCollected.bioEssence += this.value;
    } else {
      window.Telemetry.metrics.resourcesCollected.techScrap += this.value;
      window.Telemetry.recordEvent('LOOT', `+${this.value} Tech Scrap acquired!`);
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = Math.sin(performance.now() / 200) * 1.5;

    if (this.type === 'bio') {
      ctx.fillStyle = '#48bb78';
      ctx.strokeStyle = '#9ae6b4';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(0, -this.radius - pulse);
      ctx.lineTo(this.radius + pulse, 0);
      ctx.lineTo(0, this.radius + pulse);
      ctx.lineTo(-this.radius - pulse, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ecc94b';
      ctx.strokeStyle = '#f6e05e';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-this.radius / 2, -this.radius / 2, this.radius, this.radius);
      ctx.strokeRect(-this.radius / 2, -this.radius / 2, this.radius, this.radius);
    }

    ctx.restore();
  }
}

class PickupManager {
  constructor() {
    this.pickups = [];
  }

  spawn(x, y, type = 'bio', val = 1) {
    this.pickups.push(new Pickup(x, y, type, val));
  }

  update(dt, player) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      this.pickups[i].update(dt, player);
      if (!this.pickups[i].alive) {
        this.pickups.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.pickups) {
      p.render(ctx);
    }
  }
}

window.PickupManager = PickupManager;

--------------------------------------------------------------------------------
FILE: js/enemies.js
--------------------------------------------------------------------------------
class Enemy {
  constructor(x, y, typeKey = 'sprout') {
    this.x = x;
    this.y = y;
    this.typeKey = typeKey;
    const cfg = window.CONFIG.ENEMIES.types[typeKey];

    this.name = cfg.name;
    this.maxHealth = cfg.hp;
    this.health = this.maxHealth;
    this.speed = cfg.speed;
    this.damage = cfg.damage;
    this.radius = cfg.radius;
    this.color = cfg.color;
    this.outline = cfg.outline;
    this.xpValue = cfg.xpValue;

    this.alive = true;
    this.hitFlashTimer = 0;
    this.currentSlow = 1.0;
    this.sporeSlowTimer = 0;
    this.sporeSlowMult = 1.0;

    this.isAwakened = false;
    this.chargeCooldown = 4.5;
    this.chargeTimer = 2.0;
    this.isTelegraphing = false;
    this.isCharging = false;
    this.chargeDuration = 0;
    this.chargeVx = 0;
    this.chargeVy = 0;
  }

  takeDamage(amount) {
    if (!this.alive) return;

    this.health -= amount;
    this.hitFlashTimer = 0.12;

    if (this.typeKey === 'warden' && !this.isAwakened) {
      this.isAwakened = true;
      if (window.Telemetry) {
        window.Telemetry.recordEvent('BOSS', 'Hive Warden provoked!');
      }
    }

    if (window.Telemetry) {
      window.Telemetry.metrics.damageDealt += amount;
    }

    const displayDamage = Math.round(amount);
    if (window.damageTexts && displayDamage > 0) {
      window.damageTexts.push({
        x: this.x + (Math.random() - 0.5) * 14,
        y: this.y - this.radius - 6,
        text: displayDamage,
        life: 0.55
      });
    }

    if (this.health <= 0) {
      this.alive = false;

      if (window.Telemetry) {
        window.Telemetry.metrics.kills++;
        window.Telemetry.recordEvent('KILL', `${this.name} destroyed!`);
      }

      if (this.typeKey === 'warden' && window.worldManager) {
        window.worldManager.spawnCore(this.x, this.y);
      }

      if (window.pickupManager) {
        window.pickupManager.spawn(this.x, this.y, 'bio', this.xpValue);
      }
    }
  }

  update(dt, player, enemies) {
    if (!this.alive) return;

    if (window.worldManager && window.worldManager.landmark && window.worldManager.landmark.repaired) {
      const lm = window.worldManager.landmark;
      if (Math.hypot(this.x - lm.x, this.y - lm.y) < window.CONFIG.WORLD.terraformedRadius) {
        this.alive = false;
        return;
      }
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distSq = dx * dx + dy * dy;

    if (this.typeKey === 'warden') {
      const dist = Math.sqrt(distSq);
      this.updateWardenAI(dt, player, dist, dx, dy);
      return;
    }

    if (distSq > 1) {
      const effectiveSpeed = this.speed * (this.currentSlow || 1.0);
      const dist = Math.sqrt(distSq);
      let vx = (dx / dist) * effectiveSpeed;
      let vy = (dy / dist) * effectiveSpeed;

      let checks = 0;
      const len = enemies.length;
      for (let i = 0; i < len; i++) {
        const other = enemies[i];
        if (other === this || !other.alive) continue;

        const ox = this.x - other.x;
        const oy = this.y - other.y;
        const oDistSq = ox * ox + oy * oy;
        const minDist = this.radius + other.radius;

        if (oDistSq > 0 && oDistSq < minDist * minDist) {
          const oDist = Math.sqrt(oDistSq);
          const push = ((minDist - oDist) / minDist) * 65;
          vx += (ox / oDist) * push;
          vy += (oy / oDist) * push;
        }

        checks++;
        if (checks > 20) break;
      }

      this.x += vx * dt;
      this.y += vy * dt;
    }

    const touchDist = this.radius + player.radius;
    if (distSq < touchDist * touchDist) {
      player.takeDamage(this.damage);
    }

    if (this.plasmaBurnTimer && this.plasmaBurnTimer > 0) {
      this.plasmaBurnTimer -= dt;
      this.takeDamage((this.plasmaBurnDmg || 8) * dt);
    }

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
  }

  updateWardenAI(dt, player, dist, dx, dy) {
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    if (!this.isAwakened) {
      if (dist < window.CONFIG.WORLD.wardenAggroRadius) {
        this.isAwakened = true;
        if (window.Telemetry) {
          window.Telemetry.recordEvent('BOSS', 'Hive Warden awakened in its lair!');
        }
      } else {
        return;
      }
    }

    if (this.isCharging) {
      this.x += this.chargeVx * dt;
      this.y += this.chargeVy * dt;
      this.chargeDuration -= dt;

      if (dist < this.radius + player.radius) {
        player.takeDamage(this.damage * 1.3);
      }

      if (this.chargeDuration <= 0) {
        this.isCharging = false;
      }
      return;
    }

    if (this.isTelegraphing) {
      this.chargeDuration -= dt;
      if (this.chargeDuration <= 0) {
        this.isTelegraphing = false;
        this.isCharging = true;
        this.chargeDuration = 1.1;
        const cSpeed = window.CONFIG.ENEMIES.types.warden.chargeSpeed;
        const a = Math.atan2(player.y - this.y, player.x - this.x);
        this.chargeVx = Math.cos(a) * cSpeed;
        this.chargeVy = Math.sin(a) * cSpeed;

        if (window.enemyManager && window.enemyManager.enemies.length < window.CONFIG.ENEMIES.maxActive) {
          window.enemyManager.enemies.push(new Enemy(this.x + 30, this.y, 'dasher'));
          window.enemyManager.enemies.push(new Enemy(this.x - 30, this.y, 'dasher'));
        }
      }
      return;
    }

    this.chargeTimer += dt;
    if (this.chargeTimer >= this.chargeCooldown && dist < 700) {
      this.chargeTimer = 0;
      this.isTelegraphing = true;
      this.chargeDuration = 0.7;
      return;
    }

    if (dist > 1) {
      const effectiveSpeed = this.speed * (this.currentSlow || 1.0);
      this.x += (dx / dist) * effectiveSpeed * dt;
      this.y += (dy / dist) * effectiveSpeed * dt;
    }

    if (dist < this.radius + player.radius) {
      player.takeDamage(this.damage);
    }
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : this.color;
    ctx.strokeStyle = this.outline;
    ctx.lineWidth = 2;

    if (this.typeKey === 'dasher') {
      ctx.beginPath();
      ctx.moveTo(this.radius * 1.3, 0);
      ctx.lineTo(-this.radius, -this.radius);
      ctx.lineTo(-this.radius * 0.4, 0);
      ctx.lineTo(-this.radius, this.radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.typeKey === 'warden') {
      if (!this.isAwakened) {
        ctx.fillStyle = '#441837';
      } else if (this.isTelegraphing) {
        ctx.fillStyle = Math.floor(performance.now() / 80) % 2 === 0 ? '#fc8181' : '#e53e3e';
      } else if (this.isCharging) {
        ctx.fillStyle = '#ff0055';
      }

      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = this.radius + (this.isCharging ? 5 : 0);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f687b3';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      const statusText = !this.isAwakened ? 'HIVE WARDEN [DORMANT]' : this.isCharging ? '!! CHARGE !!' : 'HIVE WARDEN (ELITE)';
      ctx.fillText(statusText, 0, -this.radius - 14);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (this.health < this.maxHealth) {
      const barW = this.radius * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-this.radius, -this.radius - 8, barW, 3);
      ctx.fillStyle = '#fc8181';
      ctx.fillRect(-this.radius, -this.radius - 8, barW * (this.health / this.maxHealth), 3);
    }

    ctx.restore();
  }
}

class EnemyManager {
  constructor() {
    this.enemies = [];
    this.spawnTimer = 0;
    this.swarmTimer = 0;
    this.rearCapTimer = 0;
    this.elapsedRunTime = 0;
    this.spawnWarden();
  }

  spawnWarden() {
    const pos = window.CONFIG.WORLD.wardenPos;
    this.enemies.push(new Enemy(pos.x, pos.y, 'warden'));
  }

  update(dt, player, camera, canvasWidth, canvasHeight, activeNestsCount = 7) {
    this.elapsedRunTime += dt;

    const cfg = window.CONFIG.ENEMIES;
    const progress = Math.min(1.0, this.elapsedRunTime / cfg.rampTimeSeconds);
    const nestMult = 0.6 + (activeNestsCount / 7) * 0.4;
    const surgeMultiplier = (player.carryingCore || (window.worldManager && window.worldManager.transferActive)) ? 0.5 : 1.0;
    const currentInterval = ((cfg.initialSpawnInterval - (progress * (cfg.initialSpawnInterval - cfg.minimumSpawnInterval))) / nestMult) * surgeMultiplier;

    this.spawnTimer += dt;
    if (this.spawnTimer >= currentInterval) {
      this.spawnTimer = 0;
      if (this.enemies.length < cfg.maxActive) {
        this.spawnDirectionalWave(player, canvasWidth, canvasHeight, 2 + Math.floor(progress * 4));
      }
    }

    this.swarmTimer += dt;
    if (this.swarmTimer >= cfg.swarmInterval) {
      this.swarmTimer = 0;
      this.triggerAmbushSwarm(player, canvasWidth, canvasHeight);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, player, this.enemies);

      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (e.typeKey !== 'warden' && (dx * dx + dy * dy) > cfg.despawnRadius * cfg.despawnRadius) {
        e.alive = false;
      }

      if (!e.alive) {
        this.enemies.splice(i, 1);
      }
    }

    this.rearCapTimer += dt;
    if (this.rearCapTimer >= 0.25) {
      this.rearCapTimer = 0;
      this.enforceRearChaserCap(player);
    }
  }

  enforceRearChaserCap(player) {
    const isMoving = Math.hypot(player.vx, player.vy) > 10;
    if (!isMoving) return;

    const moveAngle = Math.atan2(player.vy, player.vx);
    const rearEnemies = [];

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.typeKey === 'warden') continue;

      const angleToEnemy = Math.atan2(e.y - player.y, e.x - player.x);
      let diff = Math.abs(angleToEnemy - moveAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;

      if (diff > (115 * Math.PI) / 180) {
        const distSq = (e.x - player.x) * (e.x - player.x) + (e.y - player.y) * (e.y - player.y);
        rearEnemies.push({ index: i, distSq });
      }
    }

    const maxRear = window.CONFIG.ENEMIES.maxRearChasers;
    if (rearEnemies.length > maxRear) {
      rearEnemies.sort((a, b) => b.distSq - a.distSq);
      const toRemoveCount = rearEnemies.length - maxRear;
      const removeIndices = new Set(rearEnemies.slice(0, toRemoveCount).map(r => r.index));
      this.enemies = this.enemies.filter((_, idx) => !removeIndices.has(idx));
    }
  }

  spawnDirectionalWave(player, canvasWidth, canvasHeight, count = 3) {
    const cfg = window.CONFIG.ENEMIES;
    const distFromHubSq = player.x * player.x + player.y * player.y;
    if (distFromHubSq < cfg.hubSafeRadius * cfg.hubSafeRadius && this.enemies.length > 25) return;

    const isMoving = Math.hypot(player.vx, player.vy) > 10;
    const moveAngle = isMoving ? Math.atan2(player.vy, player.vx) : Math.random() * Math.PI * 2;
    const headingAway = (player.x * player.vx + player.y * player.vy) >= 0;

    const halfDiag = Math.hypot(canvasWidth / 2, canvasHeight / 2);
    const spawnDist = halfDiag + 90;

    for (let i = 0; i < count; i++) {
      if (this.enemies.length >= cfg.maxActive) break;

      let spawnAngle;
      if (isMoving && headingAway) {
        spawnAngle = Math.random() < 0.70 ? moveAngle + (Math.random() - 0.5) * 1.8 : Math.random() * Math.PI * 2;
      } else if (isMoving && !headingAway) {
        spawnAngle = Math.random() < 0.75 ? (moveAngle + Math.PI) + (Math.random() - 0.5) * 1.8 : Math.random() * Math.PI * 2;
      } else {
        spawnAngle = Math.random() * Math.PI * 2;
      }

      const x = player.x + Math.cos(spawnAngle) * spawnDist;
      const y = player.y + Math.sin(spawnAngle) * spawnDist;

      if (window.worldManager && window.worldManager.landmark && window.worldManager.landmark.repaired) {
        const lm = window.worldManager.landmark;
        const dlmSq = (x - lm.x) * (x - lm.x) + (y - lm.y) * (y - lm.y);
        if (dlmSq < window.CONFIG.WORLD.terraformedRadius * window.CONFIG.WORLD.terraformedRadius) {
          continue;
        }
      }

      const roll = Math.random();
      let type = 'sprout';
      if (roll < 0.18) type = 'dasher';
      else if (roll < 0.38) type = 'stalker';

      this.enemies.push(new Enemy(x, y, type));
    }
  }

  triggerAmbushSwarm(player, canvasWidth, canvasHeight) {
    if (window.Telemetry) {
      window.Telemetry.recordEvent('SURGE', 'Swarm Ambush surrounding!');
    }
    const count = 16;
    const halfDiag = Math.hypot(canvasWidth / 2, canvasHeight / 2);
    const spawnDist = halfDiag + 80;

    for (let i = 0; i < count; i++) {
      if (this.enemies.length >= window.CONFIG.ENEMIES.maxActive) break;
      const angle = (i * Math.PI * 2) / count;
      const x = player.x + Math.cos(angle) * spawnDist;
      const y = player.y + Math.sin(angle) * spawnDist;
      const type = i % 4 === 0 ? 'dasher' : 'sprout';
      this.enemies.push(new Enemy(x, y, type));
    }
  }

  render(ctx) {
    for (const enemy of this.enemies) {
      enemy.render(ctx);
    }
  }
}

window.Enemy = Enemy;
window.EnemyManager = EnemyManager;

--------------------------------------------------------------------------------
FILE: js/world.js
--------------------------------------------------------------------------------
class CorruptedNest {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 34;
    this.maxHealth = 400;
    this.health = this.maxHealth;
    this.alive = true;
    this.spawnTimer = 0;
    this.spawnInterval = 4.0;
    this.hitFlashTimer = 0;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.health -= amount;
    this.hitFlashTimer = 0.1;

    const displayDamage = Math.round(amount);
    if (window.damageTexts && displayDamage > 0) {
      window.damageTexts.push({
        x: this.x + (Math.random() - 0.5) * 16,
        y: this.y - this.radius - 8,
        text: displayDamage,
        life: 0.55
      });
    }

    if (this.health <= 0) {
      this.alive = false;
      if (window.Telemetry) {
        window.Telemetry.recordEvent('WORLD', 'Corrupted Nest Cleansed!');
      }

      if (window.pickupManager) {
        for (let i = 0; i < 6; i++) {
          window.pickupManager.spawn(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30, 'bio', 2);
        }
        const bonusScrap = (window.MetaProgression && window.MetaProgression.perks.naniteScavenge > 0) ? 1 : 0;
        for (let i = 0; i < 2 + bonusScrap; i++) {
          window.pickupManager.spawn(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30, 'tech', 1);
        }
      }
    }
  }

  update(dt, player, enemyManager) {
    if (!this.alive) return;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    if (distToPlayer < 650) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        if (enemyManager.enemies.length < window.CONFIG.ENEMIES.maxActive) {
          enemyManager.enemies.push(new window.Enemy(this.x + 40, this.y, 'stalker'));
        }
      }
    }
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = Math.sin(performance.now() / 250) * 3;

    ctx.fillStyle = 'rgba(112, 38, 52, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 14 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : '#4a1525';
    ctx.strokeStyle = '#e53e3e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fc8181';
    ctx.beginPath();
    ctx.arc(0, 0, 10 + pulse * 0.5, 0, Math.PI * 2);
    ctx.fill();

    const barW = 46;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-barW / 2, -this.radius - 12, barW, 5);
    ctx.fillStyle = '#e53e3e';
    ctx.fillRect(-barW / 2, -this.radius - 12, barW * (this.health / this.maxHealth), 5);

    ctx.restore();
  }
}

class Landmark {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 48;
    this.repaired = false;
  }

  repair(player) {
    if (this.repaired) return;
    this.repaired = true;
    player.carryingCore = false;

    if (window.Telemetry) {
      window.Telemetry.recordEvent('TERRAFORM', 'Biosphere Purifier restored! Safe haven created.');
      window.Telemetry.metrics.resourcesCollected.techScrap += 5;
    }

    if (window.pickupManager) {
      for (let i = 0; i < 8; i++) {
        window.pickupManager.spawn(this.x + (Math.random() - 0.5) * 60, this.y + (Math.random() - 0.5) * 60, 'bio', 3);
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = Math.sin(performance.now() / 300) * 4;

    if (this.repaired) {
      const auraR = window.CONFIG.WORLD.terraformedRadius;
      ctx.fillStyle = 'rgba(72, 187, 120, 0.12)';
      ctx.beginPath();
      ctx.arc(0, 0, auraR + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#48bb78';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = this.repaired ? '#1c4532' : '#2d3748';
    ctx.strokeStyle = this.repaired ? '#68d391' : '#718096';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.repaired ? '#48bb78' : '#e53e3e';
    ctx.beginPath();
    ctx.arc(0, 0, 16 + (this.repaired ? pulse * 0.5 : 0), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.repaired ? '#9ae6b4' : '#cbd5e0';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.repaired ? 'BIOSPHERE PURIFIER [ONLINE]' : 'PURIFIER [NEEDS CORE]', 0, this.radius + 20);

    ctx.restore();
  }
}

class CorePickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.alive = true;
  }

  update(player) {
    if (!this.alive) return;
    if (Math.hypot(player.x - this.x, player.y - this.y) < player.radius + this.radius) {
      this.alive = false;
      player.carryingCore = true;
      if (window.Telemetry) {
        window.Telemetry.recordEvent('OBJECTIVE', 'Purifier Core retrieved! Deliver to Landmark.');
      }
    }
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = Math.sin(performance.now() / 180) * 3;

    ctx.fillStyle = 'rgba(236, 201, 75, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 8 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d69e2e';
    ctx.strokeStyle = '#faf089';
    ctx.lineWidth = 2;
    ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CORE', 0, 4);

    ctx.restore();
  }
}

class WorldManager {
  constructor() {
    this.nests = [];
    const lm = window.CONFIG.WORLD.landmarkPos;
    this.landmark = new Landmark(lm.x, lm.y);
    this.coreDrop = null;
    this.transferActive = false;
    this.transferTimer = 0;
    this.transferTotalTime = 25.0;

    this.spawnInitialNests();
  }

  spawnInitialNests() {
    const count = window.CONFIG.WORLD.nestCountRing1;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + 0.3;
      const dist = 1100 + Math.random() * 2200;
      this.nests.push(new CorruptedNest(Math.cos(angle) * dist, Math.sin(angle) * dist));
    }
  }

  spawnCore(x, y) {
    this.coreDrop = new CorePickup(x, y);
  }

  startRemoteTransfer() {
    if (this.transferActive || !this.landmark.repaired) return;
    this.transferActive = true;
    this.transferTimer = this.transferTotalTime;
    if (window.Telemetry) {
      window.Telemetry.recordEvent('SURGE', 'Scrap Transfer started! 25s Survival Surge!');
    }
  }

  completeRemoteTransfer() {
    this.transferActive = false;
    const m = window.Telemetry.metrics;

    const scrapSecured = m.resourcesCollected.techScrap;
    window.MetaProgression.bankedTechScrap += scrapSecured;
    m.resourcesBanked.techScrap += scrapSecured;
    m.resourcesCollected.techScrap = 0;

    window.saveMetaProgression();

    if (window.Telemetry) {
      window.Telemetry.recordEvent('BANK', `Secured +${scrapSecured} Tech Scrap in Sanctuary Vault!`);
    }
  }

  fastTravelToHubWithTax(player) {
    if (!this.landmark.repaired) return;

    const dist = Math.hypot(this.landmark.x, this.landmark.y);
    const taxRate = Math.min(window.CONFIG.ECONOMY.maxDistanceTax, (dist / 1000) * window.CONFIG.ECONOMY.distanceTaxRatePer1000px);

    const m = window.Telemetry.metrics;
    const scrapKept = Math.floor(m.resourcesCollected.techScrap * (1 - taxRate));

    window.MetaProgression.bankedTechScrap += scrapKept;
    m.resourcesBanked.techScrap += scrapKept;
    m.resourcesCollected.techScrap = 0;

    window.saveMetaProgression();

    player.x = 0;
    player.y = 0;

    if (window.Telemetry) {
      window.Telemetry.recordEvent('TRAVEL', `Fast traveled home! Banked ${scrapKept} Scrap (Tax: ${Math.round(taxRate * 100)}%).`);
    }
  }

  update(dt, player, enemyManager) {
    for (let i = this.nests.length - 1; i >= 0; i--) {
      this.nests[i].update(dt, player, enemyManager);
      if (!this.nests[i].alive) {
        this.nests.splice(i, 1);
      }
    }

    if (this.coreDrop && this.coreDrop.alive) {
      this.coreDrop.update(player);
    }

    if (player.carryingCore && !this.landmark.repaired) {
      if (Math.hypot(player.x - this.landmark.x, player.y - this.landmark.y) < player.radius + this.landmark.radius) {
        this.landmark.repair(player);
      }
    }

    if (this.transferActive) {
      this.transferTimer -= dt;
      if (this.transferTimer <= 0) {
        this.completeRemoteTransfer();
      }
    }
  }

  render(ctx) {
    this.landmark.render(ctx);
    for (const nest of this.nests) {
      nest.render(ctx);
    }
    if (this.coreDrop && this.coreDrop.alive) {
      this.coreDrop.render(ctx);
    }
  }

  renderCompass(ctx, player, canvasWidth, canvasHeight) {
    let target = null;
    let label = '';
    let color = '#e53e3e';

    if (player.carryingCore && !this.landmark.repaired) {
      target = this.landmark;
      label = 'DELIVER CORE:';
      color = '#48bb78';
    } else if (this.coreDrop && this.coreDrop.alive) {
      target = this.coreDrop;
      label = 'PICKUP CORE:';
      color = '#ecc94b';
    } else if (!this.landmark.repaired) {
      const warden = window.enemyManager ? window.enemyManager.enemies.find(e => e.typeKey === 'warden' && e.alive) : null;
      if (warden) {
        target = warden;
        label = warden.isAwakened ? 'HIVE WARDEN:' : 'WARDEN LAIR:';
        color = '#f687b3';
      } else {
        target = this.landmark;
        label = 'MONUMENT:';
        color = '#cbd5e0';
      }
    } else {
      let closestDist = Infinity;
      for (const nest of this.nests) {
        const d = Math.hypot(nest.x - player.x, nest.y - player.y);
        if (d < closestDist) {
          closestDist = d;
          target = nest;
        }
      }
      label = 'NEST:';
      color = '#e53e3e';
    }

    if (!target) return;

    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const dist = Math.round(Math.hypot(target.x - player.x, target.y - player.y));
    const indicatorDist = 120;
    const indX = canvasWidth / 2 + Math.cos(angle) * indicatorDist;
    const indY = canvasHeight / 2 + Math.sin(angle) * indicatorDist;

    ctx.save();
    ctx.translate(indX, indY);
    ctx.rotate(angle);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = color;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${label} ${dist}m`, canvasWidth / 2, canvasHeight / 2 + 36);
  }
}

window.WorldManager = WorldManager;

--------------------------------------------------------------------------------
FILE: js/player.js
--------------------------------------------------------------------------------
class Player {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 18;
    this.growthScale = 1.0;
    this.facingAngle = 0;

    this.applyMetaUpgrades();

    this.invulnerableTimer = 0;
    this.healthRegenRate = 0.5;
    this.carryingCore = false;
    this.godMode = false;

    this.level = 1;
    this.xp = 0;
    this.xpToNext = 4;

    this.keys = { up: false, down: false, left: false, right: false };
    this.bindInputs();
  }

  applyMetaUpgrades() {
    const perks = (window.MetaProgression && window.MetaProgression.perks) ? window.MetaProgression.perks : { chassisArmor: 0, engineSpeed: 0, shieldCapacitor: 0 };

    this.speed = window.CONFIG.PLAYER.baseSpeed + (perks.engineSpeed * 8);
    this.maxHealth = window.CONFIG.PLAYER.baseHealth + (perks.chassisArmor * 15);
    this.health = this.maxHealth;
    this.maxShieldCharges = window.CONFIG.PLAYER.baseShieldCharges;
    this.shieldCharges = this.maxShieldCharges;
    this.shieldTimer = 0;
    this.shieldRechargeTime = Math.max(12.0, window.CONFIG.PLAYER.shieldRechargeTime - (perks.shieldCapacitor * 2.0));
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => this.handleKey(e.code, true));
    window.addEventListener('keyup', (e) => this.handleKey(e.code, false));
  }

  handleKey(code, pressed) {
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = pressed;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = pressed;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = pressed;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = pressed;
  }

  addXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.25) + 2;
      return true;
    }
    return false;
  }

  grow() {
    this.growthScale = Math.min(1.35, this.growthScale + 0.04);
    this.radius = 18 * this.growthScale;
  }

  takeDamage(amount = 20) {
    if (this.godMode) return;
    if (this.invulnerableTimer > 0) return;

    if (this.shieldCharges > 0) {
      this.shieldCharges--;
      this.invulnerableTimer = 0.7;
      this.shieldTimer = 0;
      window.Telemetry.metrics.shieldHitsAbsorbed++;
      this.pushCrowdBack(80, 160);
      return;
    }

    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = 0.65;
    window.Telemetry.metrics.damageTaken += amount;
    this.pushCrowdBack(85, 220);

    if (this.health <= 0) {
      this.die();
    }
  }

  pushCrowdBack(radius, force) {
    if (!window.enemyManager) return;
    for (const e of window.enemyManager.enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < radius + e.radius) {
        e.x += (dx / d) * force * 0.15;
        e.y += (dy / d) * force * 0.15;
      }
    }
  }

  heal(amount = 15) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  die() {
    window.Telemetry.metrics.deaths++;
    window.Telemetry.metrics.resourcesLostOnDeath.techScrap += window.Telemetry.metrics.resourcesCollected.techScrap;
    window.Telemetry.metrics.resourcesCollected.techScrap = 0;
    window.Telemetry.metrics.resourcesCollected.bioEssence = 0;

    window.Telemetry.recordEvent('DEATH', 'Robot destroyed! Lost unbanked scrap.');

    this.resetRunProgression();

    if (window.triggerFullRunRestart) {
      window.triggerFullRunRestart();
    }
  }

  resetRunProgression() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 4;
    this.growthScale = 1.0;
    this.radius = 18;
    this.applyMetaUpgrades();
    this.healthRegenRate = 0.5;
    this.carryingCore = false;
    this.invulnerableTimer = 1.5;
  }

  update(dt) {
    let mx = 0, my = 0;
    if (this.keys.left) mx -= 1;
    if (this.keys.right) mx += 1;
    if (this.keys.up) my -= 1;
    if (this.keys.down) my += 1;

    if (mx !== 0 && my !== 0) {
      mx *= 0.7071;
      my *= 0.7071;
    }

    this.vx = mx * this.speed;
    this.vy = my * this.speed;

    const prevX = this.x;
    const prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    window.Telemetry.metrics.distanceTraveled += Math.round(Math.hypot(this.x - prevX, this.y - prevY));

    if (mx !== 0 || my !== 0) {
      this.facingAngle = Math.atan2(my, mx);
    }

    if (this.shieldCharges < this.maxShieldCharges) {
      this.shieldTimer += dt;
      if (this.shieldTimer >= this.shieldRechargeTime) {
        this.shieldCharges++;
        this.shieldTimer = 0;
      }
    }

    if (this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + this.healthRegenRate * dt);
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.invulnerableTimer > 0 && Math.floor(performance.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    if (this.godMode) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 15 + Math.sin(performance.now() / 100) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.carryingCore) {
      const corePulse = Math.sin(performance.now() / 150) * 3;
      ctx.strokeStyle = '#ecc94b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 12 + corePulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.shieldCharges > 0) {
      ctx.strokeStyle = '#4299e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 7 + Math.sin(performance.now() / 200) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.rotate(this.facingAngle);
    ctx.fillStyle = this.godMode ? '#d69e2e' : '#2b6cb0';
    ctx.strokeStyle = this.godMode ? '#fff' : '#e2e8f0';
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      if (i === 0) ctx.moveTo(Math.cos(a) * this.radius, Math.sin(a) * this.radius);
      else ctx.lineTo(Math.cos(a) * this.radius, Math.sin(a) * this.radius);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#63b3ed';
    ctx.beginPath();
    ctx.arc(this.radius * 0.65, 0, 4 * this.growthScale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.carryingCore ? '#ecc94b' : '#48bb78';
    ctx.beginPath();
    ctx.arc(0, 0, 5 * this.growthScale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.renderHUD(ctx);
  }

  renderHUD(ctx) {
    const w = 38 * this.growthScale;
    const h = 4;
    const bx = this.x - w / 2;
    const by = this.y - this.radius - 14;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);

    ctx.fillStyle = this.health / this.maxHealth > 0.5 ? '#48bb78' : '#f56565';
    ctx.fillRect(bx, by, w * (this.health / this.maxHealth), h);

    for (let i = 0; i < this.maxShieldCharges; i++) {
      ctx.fillStyle = i < this.shieldCharges ? '#4299e1' : '#4a5568';
      ctx.fillRect(bx + i * 9, by - 7, 6, 6);
    }
  }
}

window.Player = Player;

--------------------------------------------------------------------------------
FILE: js/main.js
--------------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let lastTimestamp = 0;
const debugHUD = document.getElementById('debugHUD');

const player = new window.Player(0, 0);
let weaponManager = new window.WeaponManager(player);
let pickupManager = new window.PickupManager();
let enemyManager = new window.EnemyManager();
let worldManager = new window.WorldManager();
let damageTexts = [];
const camera = { x: 0, y: 0, lerpSpeed: 0.1 };

window.player = player;
window.pickupManager = pickupManager;
window.damageTexts = damageTexts;
window.enemyManager = enemyManager;
window.worldManager = worldManager;

window.triggerFullRunRestart = () => {
  window.CONFIG.WEAPONS.blaster.damage = window.CONFIG.WEAPONS.blaster.baseDamage;
  window.CONFIG.WEAPONS.blaster.fireRate = window.CONFIG.WEAPONS.blaster.baseFireRate;
  window.CONFIG.WEAPONS.saw.bladeCount = 1;
  window.CONFIG.WEAPONS.saw.damage = window.CONFIG.WEAPONS.saw.baseDamage;
  window.CONFIG.WEAPONS.saw.orbitSpeed = 3.2;
  window.CONFIG.WEAPONS.mortar.damage = window.CONFIG.WEAPONS.mortar.baseDamage;
  window.CONFIG.WEAPONS.mortar.fireRate = window.CONFIG.WEAPONS.mortar.baseFireRate;
  window.CONFIG.WEAPONS.mortar.cloudRadius = 65;
  window.CONFIG.WEAPONS.tesla.damage = window.CONFIG.WEAPONS.tesla.baseDamage;
  window.CONFIG.WEAPONS.tesla.cooldown = window.CONFIG.WEAPONS.tesla.baseCooldown;
  window.CONFIG.WEAPONS.tesla.chainCount = 4;
  window.CONFIG.WEAPONS.drone.damage = window.CONFIG.WEAPONS.drone.baseDamage;
  window.CONFIG.WEAPONS.drone.fireRate = window.CONFIG.WEAPONS.drone.baseFireRate;
  window.CONFIG.WEAPONS.drone.droneCount = 2;
  window.CONFIG.WEAPONS.flamer.damage = window.CONFIG.WEAPONS.flamer.baseDamage;
  window.CONFIG.WEAPONS.flamer.range = 155;

  weaponManager.reset();

  enemyManager = new window.EnemyManager();
  pickupManager = new window.PickupManager();
  worldManager = new window.WorldManager();
  damageTexts = [];

  window.enemyManager = enemyManager;
  window.pickupManager = pickupManager;
  window.worldManager = worldManager;
  window.damageTexts = damageTexts;

  camera.x = 0;
  camera.y = 0;
};

let isDrafting = false;
let draftCards = [];
let isWorkshopOpen = false;
let isPaused = false;
let timeScale = 1.0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const UPGRADE_POOL = [
  {
    id: 'blaster_tune',
    title: 'OVERCLOCK BLASTER',
    desc: '+6 Damage, +20% Fire Rate',
    apply: () => {
      window.CONFIG.WEAPONS.blaster.damage += 6;
      window.CONFIG.WEAPONS.blaster.fireRate = Math.max(0.16, window.CONFIG.WEAPONS.blaster.fireRate * 0.8);
      weaponManager.slots[0].cfg = window.CONFIG.WEAPONS.blaster;
    }
  },
  {
    id: 'scrap_saw_weapon',
    title: 'SCRAP SAW (WEAPON)',
    desc: 'Mount orbital circular saw blade',
    apply: () => {
      if (!weaponManager.hasWeapon("Scrap Saw")) {
        weaponManager.addWeapon(new window.ScrapSaw(player));
      } else {
        window.CONFIG.WEAPONS.saw.bladeCount = Math.min(4, window.CONFIG.WEAPONS.saw.bladeCount + 1);
        window.CONFIG.WEAPONS.saw.damage += 6;
        window.CONFIG.WEAPONS.saw.orbitSpeed += 0.8;
      }
    }
  },
  {
    id: 'bio_mortar_weapon',
    title: 'BIO-SPORE MORTAR',
    desc: 'Lob spores creating lingering slowing AoE clouds',
    apply: () => {
      if (!weaponManager.hasWeapon("Bio-Spore Mortar")) {
        weaponManager.addWeapon(new window.BioSporeMortar(player));
      } else {
        window.CONFIG.WEAPONS.mortar.damage += 14;
        window.CONFIG.WEAPONS.mortar.cloudRadius = Math.min(120, window.CONFIG.WEAPONS.mortar.cloudRadius + 15);
        window.CONFIG.WEAPONS.mortar.fireRate = Math.max(1.1, window.CONFIG.WEAPONS.mortar.fireRate * 0.85);
      }
    }
  },
  {
    id: 'tesla_arc_weapon',
    title: 'TESLA ARC (WEAPON)',
    desc: 'Unleash chained lightning bouncing between foes',
    apply: () => {
      if (!weaponManager.hasWeapon("Tesla Arc")) {
        weaponManager.addWeapon(new window.TeslaArc(player));
      } else {
        window.CONFIG.WEAPONS.tesla.damage += 8;
        window.CONFIG.WEAPONS.tesla.chainCount += 1;
        window.CONFIG.WEAPONS.tesla.cooldown = Math.max(0.65, window.CONFIG.WEAPONS.tesla.cooldown * 0.85);
      }
    }
  },
  {
    id: 'aegis_drones_weapon',
    title: 'AEGIS DRONES (WEAPON)',
    desc: 'Deploy orbiting combat drones with laser interceptors',
    apply: () => {
      if (!weaponManager.hasWeapon("Aegis Drones")) {
        weaponManager.addWeapon(new window.AegisDrones(player));
      } else {
        window.CONFIG.WEAPONS.drone.droneCount = Math.min(4, window.CONFIG.WEAPONS.drone.droneCount + 1);
        window.CONFIG.WEAPONS.drone.damage += 5;
        window.CONFIG.WEAPONS.drone.fireRate = Math.max(0.65, window.CONFIG.WEAPONS.drone.fireRate * 0.85);
      }
    }
  },
  {
    id: 'plasma_purifier_weapon',
    title: 'PLASMA PURIFIER (WEAPON)',
    desc: 'Unleash continuous conical stream of incinerating plasma',
    apply: () => {
      if (!weaponManager.hasWeapon("Plasma Purifier")) {
        weaponManager.addWeapon(new window.PlasmaPurifier(player));
      } else {
        window.CONFIG.WEAPONS.flamer.damage += 18;
        window.CONFIG.WEAPONS.flamer.range = Math.min(260, window.CONFIG.WEAPONS.flamer.range + 25);
        window.CONFIG.WEAPONS.flamer.burnDamage += 4;
      }
    }
  },
  {
    id: 'nanite_regen',
    title: 'NANITE REPAIR',
    desc: '+1.2 HP/sec Passive Regeneration',
    apply: () => {
      player.healthRegenRate += 1.2;
    }
  },
  {
    id: 'magnet_pulse',
    title: 'MAGNET PULSE',
    desc: '+45% Pickup Range & Instant Vacuum',
    apply: () => {
      window.CONFIG.PLAYER.pickupRadius = Math.round(window.CONFIG.PLAYER.pickupRadius * 1.45);
      for (const p of pickupManager.pickups) {
        p.isMagnetized = true;
      }
    }
  },
  {
    id: 'shield_up',
    title: 'AEGIS BATTERY',
    desc: '+1 Max Shield Charge & Instant Recharge',
    apply: () => {
      player.maxShieldCharges++;
      player.shieldCharges = player.maxShieldCharges;
    }
  },
  {
    id: 'thrusters',
    title: 'OVERDRIVE SERVOS',
    desc: '+15% Move Speed',
    apply: () => {
      player.speed = Math.round(player.speed * 1.15);
    }
  },
  {
    id: 'titan_armor',
    title: 'TITAN CHASSIS',
    desc: '+40 Max HP & Full Repair',
    apply: () => {
      player.maxHealth += 40;
      player.heal(player.maxHealth);
    }
  }
];

const WORKSHOP_PERKS = [
  {
    key: 'chassisArmor',
    title: 'CHASSIS ARMOR',
    costBase: 3,
    costScale: 2,
    desc: '+15 Max Base HP permanently',
    buy: () => { player.applyMetaUpgrades(); }
  },
  {
    key: 'engineSpeed',
    title: 'MOTOR TUNING',
    costBase: 4,
    costScale: 3,
    desc: '+8 Base Movement Speed permanently',
    buy: () => { player.applyMetaUpgrades(); }
  },
  {
    key: 'shieldCapacitor',
    title: 'SHIELD CAPACITOR',
    costBase: 5,
    costScale: 4,
    desc: '-2.0s Shield Recharge Time permanently',
    buy: () => { player.applyMetaUpgrades(); }
  },
  {
    key: 'naniteScavenge',
    title: 'NANITE HARVESTER',
    costBase: 6,
    costScale: 5,
    desc: '+1 Extra Tech Scrap from Nests',
    buy: () => {}
  }
];

function triggerLevelUp() {
  isDrafting = true;
  timeScale = 0.08;

  const availableEvolutions = [];
  if (window.CONFIG.EVOLUTIONS) {
    for (const [key, evo] of Object.entries(window.CONFIG.EVOLUTIONS)) {
      if (!weaponManager.hasWeapon(evo.resultWeapon)) {
        const hasAllIngredients = evo.ingredients.every(name => weaponManager.hasWeapon(name));
        if (hasAllIngredients) {
          availableEvolutions.push({
            id: evo.id,
            title: `★ EVOLUTION: ${evo.name}`,
            desc: evo.desc,
            isEvolutionCard: true,
            apply: () => {
              weaponManager.evolveWeapons(key);
            }
          });
        }
      }
    }
  }

  let candidates = [...UPGRADE_POOL];
  if (weaponManager.slots.length >= weaponManager.maxSlots) {
    candidates = candidates.filter(card => !card.id.endsWith('_weapon') || weaponManager.hasWeapon(card.title.split(' (')[0]));
  }

  const shuffled = [...candidates].sort(() => 0.5 - Math.random());

  if (availableEvolutions.length > 0) {
    draftCards = [availableEvolutions[0], ...shuffled.slice(0, 2)];
  } else {
    draftCards = shuffled.slice(0, 3);
  }

  window.Telemetry.recordEvent('LEVEL', `Robot reached Level ${player.level}!`);
}

function selectCard(index) {
  if (!isDrafting || !draftCards[index]) return;
  draftCards[index].apply();
  player.grow();
  isDrafting = false;
  timeScale = 1.0;
  window.Telemetry.recordEvent('UPGRADE', `Equipped: ${draftCards[index].title}`);
}

function buyWorkshopPerk(perk) {
  const currentRank = window.MetaProgression.perks[perk.key] || 0;
  const cost = perk.costBase + (currentRank * perk.costScale);

  if (window.MetaProgression.bankedTechScrap >= cost) {
    window.MetaProgression.bankedTechScrap -= cost;
    window.MetaProgression.perks[perk.key] = currentRank + 1;
    perk.buy();
    window.saveMetaProgression();
    window.Telemetry.recordEvent('META', `Purchased ${perk.title} Rank ${currentRank + 1}!`);
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === window.CONFIG.ENGINE.debugKey || e.key === window.CONFIG.ENGINE.altDebugKey) {
    debugHUD.classList.toggle('hidden');
  }

  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (!isDrafting && !isWorkshopOpen) {
      isPaused = !isPaused;
    } else if (isWorkshopOpen) {
      isWorkshopOpen = false;
      timeScale = 1.0;
    }
  }

  if (e.code === 'KeyG') {
    player.godMode = !player.godMode;
    if (player.godMode) {
      window.CONFIG.WEAPONS.blaster.damage = 375;
      window.CONFIG.WEAPONS.saw.damage = 250;
      window.CONFIG.WEAPONS.mortar.damage = 400;
      window.CONFIG.WEAPONS.tesla.damage = 350;
      window.CONFIG.WEAPONS.drone.damage = 220;
      window.CONFIG.WEAPONS.flamer.damage = 380;
      if (window.CONFIG.WEAPONS.hyperionTurret) window.CONFIG.WEAPONS.hyperionTurret.damage = 320;
      if (window.CONFIG.WEAPONS.stormSpore) window.CONFIG.WEAPONS.stormSpore.impactDamage = 350;
    } else {
      window.CONFIG.WEAPONS.blaster.damage = window.CONFIG.WEAPONS.blaster.baseDamage;
      window.CONFIG.WEAPONS.saw.damage = window.CONFIG.WEAPONS.saw.baseDamage;
      window.CONFIG.WEAPONS.mortar.damage = window.CONFIG.WEAPONS.mortar.baseDamage;
      window.CONFIG.WEAPONS.tesla.damage = window.CONFIG.WEAPONS.tesla.baseDamage;
      window.CONFIG.WEAPONS.drone.damage = window.CONFIG.WEAPONS.drone.baseDamage;
      window.CONFIG.WEAPONS.flamer.damage = window.CONFIG.WEAPONS.flamer.baseDamage;
    }
  }

  if (e.code === 'KeyB') {
    if (isPaused) return;
    const distToHub = Math.hypot(player.x, player.y);
    if (distToHub < 180) {
      isWorkshopOpen = !isWorkshopOpen;
      timeScale = isWorkshopOpen ? 0.0 : 1.0;
    }
  }

  if (e.code === 'KeyK') player.takeDamage(25);
  if (e.code === 'KeyH') player.heal(20);

  if (worldManager && worldManager.landmark && worldManager.landmark.repaired) {
    const distToLm = Math.hypot(player.x - worldManager.landmark.x, player.y - worldManager.landmark.y);
    if (distToLm < window.CONFIG.WORLD.terraformedRadius) {
      if (e.code === 'KeyE') {
        worldManager.startRemoteTransfer();
      }
      if (e.code === 'KeyF') {
        worldManager.fastTravelToHubWithTax(player);
      }
    }
  }

  if (isDrafting) {
    if (e.key === '1') selectCard(0);
    if (e.key === '2') selectCard(1);
    if (e.key === '3') selectCard(2);
  }
});

window.addEventListener('click', (e) => {
  if (isPaused) {
    const mw = 260, mh = 44;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (e.clientX >= cx - mw / 2 && e.clientX <= cx + mw / 2 && e.clientY >= cy - 30 && e.clientY <= cy - 30 + mh) {
      isPaused = false;
      return;
    }
    if (e.clientX >= cx - mw / 2 && e.clientX <= cx + mw / 2 && e.clientY >= cy + 26 && e.clientY <= cy + 26 + mh) {
      isPaused = false;
      player.die();
      return;
    }
    return;
  }

  if (isDrafting) {
    const cw = 220, ch = 140, gap = 20;
    const totalW = (cw * 3) + (gap * 2);
    const startX = (canvas.width - totalW) / 2;
    const cardY = canvas.height / 2 - ch / 2;

    for (let i = 0; i < 3; i++) {
      const cardX = startX + i * (cw + gap);
      if (e.clientX >= cardX && e.clientX <= cardX + cw && e.clientY >= cardY && e.clientY <= cardY + ch) {
        selectCard(i);
        break;
      }
    }
    return;
  }

  if (isWorkshopOpen) {
    const pw = 420, ph = 70, gap = 14;
    const startX = canvas.width / 2 - pw / 2;
    const startY = canvas.height / 2 - 130;

    for (let i = 0; i < WORKSHOP_PERKS.length; i++) {
      const py = startY + i * (ph + gap);
      if (e.clientX >= startX && e.clientX <= startX + pw && e.clientY >= py && e.clientY <= py + ph) {
        buyWorkshopPerk(WORKSHOP_PERKS[i]);
        break;
      }
    }
  }
});

document.getElementById('btnCopyJSON').addEventListener('click', () => {
  navigator.clipboard.writeText(window.Telemetry.exportJSON()).then(() => alert('Copied JSON report!'));
});
document.getElementById('btnResetTelemetry').addEventListener('click', () => window.Telemetry.resetRun());

function gameLoop(currentTimestamp) {
  if (!lastTimestamp) lastTimestamp = currentTimestamp;
  let rawDt = Math.min((currentTimestamp - lastTimestamp) / 1000, window.CONFIG.ENGINE.maxDeltaTime);
  lastTimestamp = currentTimestamp;

  let dt = rawDt * timeScale;

  if (!isWorkshopOpen && !isPaused) {
    player.update(dt);
    worldManager.update(dt, player, enemyManager);
    enemyManager.update(dt, player, camera, canvas.width, canvas.height, worldManager.nests.length);

    const allTargets = [...enemyManager.enemies, ...worldManager.nests];
    weaponManager.update(dt, allTargets);

    for (let i = pickupManager.pickups.length - 1; i >= 0; i--) {
      const p = pickupManager.pickups[i];
      p.update(dt, player);
      if (!p.alive) {
        if (p.type === 'bio') {
          if (player.addXP(p.value)) {
            triggerLevelUp();
          }
        }
        pickupManager.pickups.splice(i, 1);
      }
    }

    for (let i = damageTexts.length - 1; i >= 0; i--) {
      damageTexts[i].y -= 30 * dt;
      damageTexts[i].life -= dt;
      if (damageTexts[i].life <= 0) damageTexts.splice(i, 1);
    }

    camera.x += (player.x - camera.x) * (camera.lerpSpeed * (rawDt * 60));
    camera.y += (player.y - camera.y) * (camera.lerpSpeed * (rawDt * 60));
    window.Telemetry.update(rawDt);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2 - camera.x, canvas.height / 2 - camera.y);

  renderWorldGrid();
  renderSanctuaryHub();
  worldManager.render(ctx);
  pickupManager.render(ctx);
  enemyManager.render(ctx);
  player.render(ctx);
  weaponManager.render(ctx);

  for (const dtText of damageTexts) {
    ctx.fillStyle = '#feb2b2';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(dtText.text, dtText.x, dtText.y);
  }
  ctx.restore();

  worldManager.renderCompass(ctx, player, canvas.width, canvas.height);
  renderXPBar();

  if (isDrafting) {
    renderDraftOverlay();
  }

  if (isWorkshopOpen) {
    renderWorkshopOverlay();
  }

  renderLandmarkTerminalHUD();
  renderArsenalHUD();
  renderPlayerVitalsHUD();

  if (isPaused) {
    renderPauseMenu();
  }

  const distToHub = Math.hypot(player.x, player.y);
  if (distToHub < 180 && !isWorkshopOpen && !isPaused) {
    ctx.fillStyle = '#48bb78';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[B] OPEN SANCTUARY WORKSHOP', canvas.width / 2, canvas.height / 2 + 50);
  }

  const m = window.Telemetry.metrics;
  const meta = window.MetaProgression;
  ctx.fillStyle = '#48bb78';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`EXPEDITION SCRAP: ${m.resourcesCollected.techScrap}`, 16, 28);
  ctx.fillStyle = '#ecc94b';
  ctx.fillText(`SANCTUARY VAULT: ${meta.bankedTechScrap} SCRAP`, 16, 46);

  if (player.godMode) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('[GOD MODE ON: INVULNERABLE + 15x DMG] (Press G)', 16, 66);
  }

  ctx.fillStyle = 'rgba(160, 174, 192, 0.85)';
  ctx.font = '12px monospace';
  ctx.fillText(`Horde: ${enemyManager.enemies.length}/400 | Weapons: ${weaponManager.slots.length}/6 | [ESC] Pause`, 16, canvas.height - 18);

  requestAnimationFrame(gameLoop);
}

function renderPlayerVitalsHUD() {
  const panelW = 210;
  const panelH = 76;
  const panelX = canvas.width - panelW - 16;
  const panelY = 16;

  ctx.save();
  ctx.fillStyle = 'rgba(13, 16, 23, 0.88)';
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 1.5;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = '#a0aec0';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('HULL INTEGRITY', panelX + 10, panelY + 16);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#fc8181';
  ctx.fillText(`💀 ${window.Telemetry.metrics.kills}`, panelX + panelW - 10, panelY + 16);

  const barX = panelX + 10;
  const barY = panelY + 23;
  const barW = panelW - 20;
  const barH = 14;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX, barY, barW, barH);

  const hpRatio = Math.max(0, Math.min(1, player.health / player.maxHealth));
  ctx.fillStyle = hpRatio > 0.4 ? '#48bb78' : '#e53e3e';
  ctx.fillRect(barX, barY, barW * hpRatio, barH);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(player.health)} / ${Math.round(player.maxHealth)}`, barX + barW / 2, barY + 11);

  const shieldY = panelY + 44;
  ctx.fillStyle = '#a0aec0';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('AEGIS SHIELD:', barX, shieldY + 14);

  const shieldStartX = barX + 85;
  for (let i = 0; i < player.maxShieldCharges; i++) {
    const isCharged = i < player.shieldCharges;
    ctx.fillStyle = isCharged ? '#4299e1' : '#2d3748';
    ctx.strokeStyle = isCharged ? '#bee3f8' : '#4a5568';
    ctx.lineWidth = 1;
    ctx.fillRect(shieldStartX + i * 14, shieldY + 3, 11, 13);
    ctx.strokeRect(shieldStartX + i * 14, shieldY + 3, 11, 13);
  }

  if (player.shieldCharges < player.maxShieldCharges) {
    const rechargeRatio = player.shieldTimer / player.shieldRechargeTime;
    ctx.fillStyle = '#63b3ed';
    ctx.fillRect(shieldStartX + player.shieldCharges * 14, shieldY + 14, 11 * rechargeRatio, 2);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#68d391';
  ctx.font = '10px monospace';
  ctx.fillText(`+${player.healthRegenRate.toFixed(1)}/s`, panelX + panelW - 10, shieldY + 14);

  ctx.restore();
}

function renderPauseMenu() {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 7, 12, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#63b3ed';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SYSTEM PAUSED', canvas.width / 2, canvas.height / 2 - 90);

  ctx.fillStyle = '#a0aec0';
  ctx.font = '12px monospace';
  ctx.fillText('Press [ESC] or [P] to Return', canvas.width / 2, canvas.height / 2 - 60);

  const mw = 260, mh = 44;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = '#1a202c';
  ctx.strokeStyle = '#48bb78';
  ctx.lineWidth = 2;
  ctx.fillRect(cx - mw / 2, cy - 30, mw, mh);
  ctx.strokeRect(cx - mw / 2, cy - 30, mw, mh);

  ctx.fillStyle = '#48bb78';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('RESUME MISSION', cx, cy - 3);

  ctx.fillStyle = '#1a202c';
  ctx.strokeStyle = '#e53e3e';
  ctx.lineWidth = 2;
  ctx.fillRect(cx - mw / 2, cy + 26, mw, mh);
  ctx.strokeRect(cx - mw / 2, cy + 26, mw, mh);

  ctx.fillStyle = '#fc8181';
  ctx.fillText('ABORT RUN (RESTART)', cx, cy + 53);

  ctx.restore();
}

function renderArsenalHUD() {
  const slots = weaponManager.slots;
  const maxSlots = weaponManager.maxSlots;
  const slotW = 105;
  const slotH = 46;
  const gap = 8;
  const totalW = maxSlots * slotW + (maxSlots - 1) * gap;
  const startX = (canvas.width - totalW) / 2;
  const startY = canvas.height - slotH - 12;

  ctx.save();
  for (let i = 0; i < maxSlots; i++) {
    const x = startX + i * (slotW + gap);
    const y = startY;
    const wpn = slots[i];

    if (wpn) {
      const isEvo = !!wpn.isEvolution;
      ctx.fillStyle = isEvo ? 'rgba(28, 40, 38, 0.92)' : 'rgba(18, 22, 31, 0.88)';
      ctx.strokeStyle = isEvo ? '#ecc94b' : '#4a5568';
      ctx.lineWidth = isEvo ? 2 : 1;
      ctx.fillRect(x, y, slotW, slotH);
      ctx.strokeRect(x, y, slotW, slotH);

      ctx.fillStyle = isEvo ? '#f6e05e' : '#63b3ed';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      const title = (isEvo ? '★ ' : '') + wpn.name;
      ctx.fillText(title.length > 13 ? title.slice(0, 12) + '…' : title, x + 6, y + 14);

      ctx.fillStyle = '#cbd5e0';
      ctx.font = '9px monospace';
      let statLine1 = '';
      let statLine2 = '';

      if (wpn.cfg) {
        const dmg = wpn.cfg.damage || wpn.cfg.impactDamage || wpn.cfg.zoneDamage || 0;
        statLine1 = `DMG: ${Math.round(dmg)}`;
        if (wpn.cfg.fireRate) {
          statLine2 = `RATE: ${wpn.cfg.fireRate.toFixed(2)}s`;
        } else if (wpn.cfg.cooldown) {
          statLine2 = `CD: ${wpn.cfg.cooldown.toFixed(2)}s`;
        } else if (wpn.cfg.bladeCount) {
          statLine2 = `BLADES: ${wpn.cfg.bladeCount}`;
        } else if (wpn.cfg.droneCount) {
          statLine2 = `DRONES: ${wpn.cfg.droneCount}`;
        }
      }

      ctx.fillText(statLine1, x + 6, y + 27);
      if (statLine2) ctx.fillText(statLine2, x + 6, y + 38);

    } else {
      ctx.fillStyle = 'rgba(13, 16, 23, 0.55)';
      ctx.strokeStyle = 'rgba(74, 85, 104, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.fillRect(x, y, slotW, slotH);
      ctx.strokeRect(x, y, slotW, slotH);
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(113, 128, 150, 0.6)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`SLOT ${i + 1}`, x + slotW / 2, y + 20);
      ctx.fillText('[EMPTY]', x + slotW / 2, y + 33);
    }
  }
  ctx.restore();
}

function renderXPBar() {
  const barWidth = canvas.width * 0.5;
  const barHeight = 8;
  const barX = (canvas.width - barWidth) / 2;
  const barY = 16;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

  const xpRatio = Math.min(1, player.xp / player.xpToNext);
  ctx.fillStyle = '#48bb78';
  ctx.fillRect(barX, barY, barWidth * xpRatio, barHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`LVL ${player.level} [${player.xp} / ${player.xpToNext} ESSENCE]`, canvas.width / 2, barY + 24);
}

function renderWorkshopOverlay() {
  ctx.fillStyle = 'rgba(5, 7, 12, 0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ecc94b';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SANCTUARY WORKSHOP (PERMANENT UPGRADES)', canvas.width / 2, canvas.height / 2 - 180);

  ctx.fillStyle = '#a0aec0';
  ctx.font = '13px monospace';
  ctx.fillText(`AVAILABLE VAULT SCRAP: ${window.MetaProgression.bankedTechScrap} | Press [B] to Close`, canvas.width / 2, canvas.height / 2 - 150);

  const pw = 420, ph = 70, gap = 14;
  const startX = canvas.width / 2 - pw / 2;
  const startY = canvas.height / 2 - 130;

  for (let i = 0; i < WORKSHOP_PERKS.length; i++) {
    const perk = WORKSHOP_PERKS[i];
    const py = startY + i * (ph + gap);
    const rank = window.MetaProgression.perks[perk.key] || 0;
    const cost = perk.costBase + (rank * perk.costScale);
    const canAfford = window.MetaProgression.bankedTechScrap >= cost;

    ctx.fillStyle = canAfford ? '#1a202c' : '#12161f';
    ctx.strokeStyle = canAfford ? '#ecc94b' : '#4a5568';
    ctx.lineWidth = 1.5;
    ctx.fillRect(startX, py, pw, ph);
    ctx.strokeRect(startX, py, pw, ph);

    ctx.textAlign = 'left';
    ctx.fillStyle = canAfford ? '#f6e05e' : '#a0aec0';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${perk.title} [RANK ${rank}]`, startX + 16, py + 26);

    ctx.fillStyle = '#cbd5e0';
    ctx.font = '11px monospace';
    ctx.fillText(perk.desc, startX + 16, py + 50);

    ctx.textAlign = 'right';
    ctx.fillStyle = canAfford ? '#48bb78' : '#e53e3e';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`COST: ${cost} SCRAP`, startX + pw - 16, py + 38);
  }
}

function renderLandmarkTerminalHUD() {
  if (!worldManager || !worldManager.landmark || !worldManager.landmark.repaired) return;

  const distToLm = Math.hypot(player.x - worldManager.landmark.x, player.y - worldManager.landmark.y);
  if (distToLm < window.CONFIG.WORLD.terraformedRadius) {
    ctx.fillStyle = 'rgba(13, 16, 23, 0.85)';
    ctx.fillRect(canvas.width / 2 - 230, canvas.height - 120, 460, 60);
    ctx.strokeStyle = '#48bb78';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(canvas.width / 2 - 230, canvas.height - 120, 460, 60);

    ctx.textAlign = 'center';
    if (worldManager.transferActive) {
      ctx.fillStyle = '#fc8181';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`TRANSFER ACTIVE: ${Math.ceil(worldManager.transferTimer)}s REMAINING!`, canvas.width / 2, canvas.height - 85);
    } else {
      ctx.fillStyle = '#ecc94b';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('[E] START 25s SCRAP TRANSFER (100% SECURED)', canvas.width / 2, canvas.height - 95);
      ctx.fillStyle = '#63b3ed';
      ctx.fillText('[F] FAST TRAVEL TO HUB (DISTANCE TAX)', canvas.width / 2, canvas.height - 75);
    }
  }
}

function renderWorldGrid() {
  const gridSize = window.CONFIG.WORLD.tileGridSize;
  const viewLeft = camera.x - canvas.width / 2;
  const viewRight = camera.x + canvas.width / 2;
  const viewTop = camera.y - canvas.height / 2;
  const viewBottom = camera.y + canvas.height / 2;

  ctx.strokeStyle = 'rgba(45, 55, 72, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.floor(viewLeft / gridSize) * gridSize; x <= viewRight; x += gridSize) {
    ctx.moveTo(x, viewTop); ctx.lineTo(x, viewBottom);
  }
  for (let y = Math.floor(viewTop / gridSize) * gridSize; y <= viewBottom; y += gridSize) {
    ctx.moveTo(viewLeft, y); ctx.lineTo(viewRight, y);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(237, 137, 54, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.arc(0, 0, window.CONFIG.WORLD.ring1Radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function renderSanctuaryHub() {
  ctx.fillStyle = 'rgba(72, 187, 120, 0.08)';
  ctx.strokeStyle = '#48bb78';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#48bb78';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#a0aec0';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SANCTUARY GATE (0, 0)', 0, 36);
}

function renderDraftOverlay() {
  ctx.fillStyle = 'rgba(5, 7, 12, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#48bb78';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CHASSIS UPGRADE AVAILABLE (BULLET TIME)', canvas.width / 2, canvas.height / 2 - 110);
  ctx.font = '13px monospace';
  ctx.fillStyle = '#a0aec0';
  ctx.fillText('Select with Click or Press [1], [2], or [3]', canvas.width / 2, canvas.height / 2 - 85);

  const cw = 220, ch = 140, gap = 20;
  const totalW = (cw * 3) + (gap * 2);
  const startX = (canvas.width - totalW) / 2;
  const cardY = canvas.height / 2 - ch / 2;

  for (let i = 0; i < draftCards.length; i++) {
    const card = draftCards[i];
    const cardX = startX + i * (cw + gap);

    const isEvo = card.isEvolutionCard;
    ctx.fillStyle = isEvo ? '#1c2826' : '#1a202c';
    ctx.strokeStyle = isEvo ? '#ecc94b' : '#4299e1';
    ctx.lineWidth = isEvo ? 3 : 2;
    ctx.fillRect(cardX, cardY, cw, ch);
    ctx.strokeRect(cardX, cardY, cw, ch);

    ctx.fillStyle = isEvo ? '#f6e05e' : '#63b3ed';
    ctx.font = isEvo ? 'bold 13px monospace' : 'bold 14px monospace';
    ctx.fillText(`[${i + 1}] ${card.title}`, cardX + cw / 2, cardY + 32);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px monospace';
    ctx.fillText(card.desc, cardX + cw / 2, cardY + 75);
  }
}

requestAnimationFrame(gameLoop);
--- END OF FILE PROJECT_STATE.md ---
```

---