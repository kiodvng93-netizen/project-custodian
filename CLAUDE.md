# Project Custodian

Top-down survivors-like (auto-weapons, level-up drafts, weapon evolutions) in an open circular world.
You are a lone custodian robot. Carry Tech Scrap from chests and nests, bank it before you die,
spend it in the Sanctuary Workshop on permanent perks. Vanilla JS, no build step.

**Core fantasy (from the author):** the game is meant to be hard. You progress slowly, upgrade, get stronger and survive longer, and over many runs you **terraform the world permanently**. Evac ends a run; it isn't the goal. Combat should feel like Diablo / Path of Exile clearing: enemy lines collapse and the ground gets painted with their blood (red, green, blue). See `PROJECT_STATE.md` §3 C and D.

**Current focus:** make the Ring 1 loop fun. The world ends at `CONFIG.WORLD.ring1Radius` (15 000 px).
Do not add Ring 2+, new resources or new systems until the core loop is fun.
Open problems and priorities are listed in `docs/AUDIT-2026-11-14.md` (§2 bugs, §3 balance, §7 order).

## Run
- Static files only. Serve the repo root over HTTP. Opening `index.html` via `file://` breaks ES modules and image processing.
  - VS Code Live Server → `http://127.0.0.1:5500`, or the `custodian` config in `.claude/launch.json` (port 8123, sends `Cache-Control: no-store`). Plain `python -m http.server` lets the browser cache old ES modules, so edits silently don't load.
- Balance checks: a page-console script can import the live modules (`await import('/js/state.js')`), set `state.isPaused = true`, then step `player/world/enemy/weapon` updates in a loop with a bot moving `player.keys`. That fast-forwards minutes of play in seconds, and it is how the XP and speed numbers in `PROJECT_STATE.md` were measured.
  - **Judge difficulty with real damage only.** No god mode, no invulnerability, no `takeDamage` stubs. Use a bot that dodges (steers away from enemies within ~320 px), opens chests and banks scrap, and record time of death plus what dealt the damage. A bot that only circles dies to its own pathing. An invulnerable bot hides the difficulty entirely (the user caught this in play-testing).
- PixiJS v8 comes from jsDelivr via the import map in `index.html`, **pinned to an exact version**. Don't change it to `@8`.
- Dev keys: `` ` `` / `F2` telemetry HUD, `G` god mode, `T` stress swarm, `Esc`/`P` pause.

## Architecture
- `js/main.js`: boot, game loop, input, Workshop perk list, HUD composition.
- `js/gore.js`: blood palettes per enemy type (green / red / blue / purple) and the painting routines (death splatter along the hit vector, hit spurts, gib smears) that draw into `decals.js` chunks. Tune via `CONFIG.GORE`.
- `js/corpses.js`: enemy bodies use the "remains pile" frames from the sprite sheets (`CORPSE_FRAMES` in `sprites.js`). The robot and enemies can push them for `CORPSES.interactiveTime`; after that they are baked permanently into the decal chunks, so piles of bodies accumulate at no per-frame cost. `gore.js` also leaves robot tread marks after driving through fresh blood.
- `js/draft.js`: level-up queue and card drafts. Level-ups queue in `state.pendingLevelUps`, and drafts open at most every `CONFIG.DRAFT.minInterval` seconds of game time.
- `js/config.js`: all balance numbers and the meta save (`localStorage` key `custodian_meta_save`, versioned, with migration in `loadMetaProgression`). **Treat `CONFIG` as read-only.** Per-run values belong on the player, `WeaponManager.runConfigs`, or `state`.
- `js/state.js`: the single run-state object, shockwaves, hit-stop, restart callback. Modules share data through `state`; there are no `window.*` globals.
- Simulation: `player.js`, `pickups.js`, `enemies/` (Enemy, EnemyManager waves, SpatialGrid), `weapons/` (catalog with per-rank `WEAPON_UPGRADES`, draft card pool in `upgrades.js`, 6 archetypes, projectiles, shared `targeting.js`, manager tracking `upgradeRanks`, which evolutions inherit), `world/` (WorldManager, structures, sanctuary hub, outposts, evac beacon, objective chain, minimap).
- Persistent world (v4.14): the world has a **persistent layer** (Hub, Purifier, Warden lair, terraform sites) and a **random layer** regenerated every run (`world/generation.js`: nests, ruins, chests, outposts; it avoids reclaimed ground). `world/terraform.js` owns the sites: stages come from counters in `MetaProgression.world` (`nestsCleansed` → Hub, `purifierRestorations` → Purifier) against `CONFIG.TERRAFORM` thresholds. Wild patches (`world/terraformPatches.js`, v4.17) appear where nests are cleansed (1 per `PATCHES.nestsPerPatch`, capped) and are saved in `MetaProgression.world.patches`; `terraform.areas` = sites + patches. Any reclaimed ground slows enemies, makes them take more damage, regenerates the player and blocks wave spawns; the same wavy edge is used for gameplay and the generated grass texture (`render/reclaimedGround.js`, `render/pixiTerraform.js`). Full-ring terraforming is intentionally out of scope (future/DLC): add sites, don't remove the cap.
- Run flow: Warden → Core → Purifier → `[E]` evac → hold 60 s → victory (`world/evac.js`, `world/objective.js`). `js/run.js` `endRun(outcome)` sets `state.runEnd`, which freezes simulation and shows the summary (`render/runUI.js`). `startNewRun()` resets the player and fires the restart handler in `main.js`. Death and pause-abort go through `player.die()` → `endRun`.
- Rendering: PixiJS (WebGL) draws the world (`render/pixi*.js`). A transparent Canvas 2D layer on top draws HUD, labels and overlays (`render/ui.js`, plus `render(ctx)` methods). If Pixi fails to init, `main.js` falls back to the Canvas `render(ctx)` methods.
- Enemy pressure has two inputs: time (wave number raises HP and damage, with surge/ebb/breather rhythm) and carried scrap (`EnemyManager.cargoAlert` raises spawn rate, pack size, elite chance and cancels breathers; `CONFIG.CARGO_PRESSURE`). Both are shown in the HUD.
- Carried (unbanked) scrap currently lives in `Telemetry.metrics.resourcesCollected.techScrap`. This is a known smell; read and write it through that path until it is moved.

## Rules
- **Done means wired and played.** A feature is done only when every module it touches is changed (often `world/` + `enemies/` + `player.js` + `weapons/`), and it was seen working in the browser. Never mark `[x]` in `PROJECT_STATE.md` otherwise. (v4.6 shipped armor and slime zones as config, rendering and HUD with no gameplay hook; they were removed.)
- One feature per session. Commit when it works.
- Keep files under ~300 lines; split by responsibility when they grow.
- No defensive `a && a.b && a.b.c` chains for things that always exist (`CONFIG`, managers on `state` after boot).
- Code comments are in Ukrainian; identifiers and UI strings in English. Match the surrounding style.
- Changing save fields: bump `version` in `DEFAULT_META_SAVE` and migrate in `loadMetaProgression`.
- `archive/` holds obsolete prototypes. Don't load or edit them.

## Docs
- `PROJECT_STATE.md`: status and roadmap (Ukrainian).
- `docs/AUDIT-*.md`: audits; the latest one is the to-do source.
