// js/audioManifest.js — Реєстр звуків: id → шина, гучність, висота, ліміти голосів і антиспам.
// Файли: assets/audio/sfx/<id>[_NN].(ogg|mp3|wav), музика: assets/audio/music/<id>.(ogg|mp3|wav).
// Варіанти (_01, _02 …) знаходяться автоматично через assets/audio/index.json (tools/audio-index.js).
// Полів немає в файлі — звук просто мовчить (див. js/audio.js).
//
// Поля SFX:
//   bus    — 'sfx' | 'ui'
//   vol    — базова гучність 0..1 (відносно шини)
//   pitch  — [мін, макс] випадковий множник швидкості відтворення
//   voices — максимум одночасних голосів цього id
//   gap    — мін. інтервал повтору, секунди (антиспам: сотні влучань за секунду)
//   pos    — true: затухання й стерео-панорама за відстанню до робота
//   pri    — 1 = важливий (не відкидається глобальним лімітом голосів)

const S = (vol, pitch, voices, gap, extra = {}) => ({ bus: 'sfx', vol, pitch, voices, gap, pos: false, pri: 0, ...extra });
const P = (vol, pitch, voices, gap, extra = {}) => S(vol, pitch, voices, gap, { pos: true, ...extra });
const U = (vol, pitch, voices, gap) => ({ bus: 'ui', vol, pitch, voices, gap, pos: false, pri: 1 });
const N = [1, 1];            // без варіації висоти
const SM = [0.94, 1.06];     // легка
const MD = [0.88, 1.14];     // середня
const WD = [0.8, 1.25];      // широка (для частих звуків)

export const SOUNDS = {
  // --- Зброя: постріл / влучання (за архетипом) ---
  blaster_fire:     P(0.45, MD, 4, 0.05),
  blaster_hit:      P(0.40, WD, 6, 0.04),
  hyperion_salvo:   P(0.70, SM, 2, 0.30, { pri: 1 }),
  mortar_fire:      P(0.55, SM, 3, 0.10),
  mortar_explode:   P(0.80, SM, 4, 0.08, { pri: 1 }),
  tesla_zap:        P(0.50, MD, 4, 0.06),
  saw_hit:          P(0.40, WD, 5, 0.05),
  drone_laser:      P(0.40, MD, 4, 0.07),
  flamer_burst:     P(0.40, MD, 2, 0.20),
  aura_pulse:       P(0.55, SM, 2, 0.20),

  // --- Вороги ---
  enemy_hit:            P(0.30, WD, 6, 0.035),
  enemy_death_sprout:   P(0.55, WD, 6, 0.030),
  enemy_death_dasher:   P(0.55, WD, 5, 0.040),
  enemy_death_stalker:  P(0.70, MD, 4, 0.060),
  enemy_death_elite:    P(0.85, SM, 3, 0.150, { pri: 1 }),
  enemy_death_warden:   P(1.00, N, 1, 1.0, { pri: 1 }),
  stalker_windup:       P(0.55, MD, 3, 0.20),
  warden_awaken:        P(1.00, N, 1, 2.0, { pri: 1 }),
  warden_charge:        P(0.90, SM, 1, 0.50, { pri: 1 }),
  hive_wrath:           S(1.00, N, 1, 3.0, { pri: 1 }),
  nest_alarm:           P(0.80, SM, 2, 0.50, { pri: 1 }),
  nest_destroyed:       P(1.00, N, 2, 0.50, { pri: 1 }),

  // --- Робот ---
  player_hit:       S(0.90, SM, 2, 0.12, { pri: 1 }),
  low_hp_warning:   S(0.60, N, 1, 1.20, { pri: 1 }),
  shield_break:     S(0.90, SM, 1, 0.20, { pri: 1 }),
  dash:             S(0.65, MD, 2, 0.15),
  player_death:     S(1.00, N, 1, 1.0, { pri: 1 }),

  // --- Лут, прогресія ---
  xp_pickup:        P(0.30, [0.9, 1.35], 4, 0.035),
  scrap_pickup:     P(0.45, MD, 4, 0.060),
  level_up:         S(0.90, N, 1, 0.50, { pri: 1 }),
  draft_open:       S(0.60, N, 1, 0.30, { pri: 1 }),
  card_pick:        S(0.70, N, 1, 0.20, { pri: 1 }),
  evolution:        S(1.00, N, 1, 1.0, { pri: 1 }),
  fruit_eaten:      S(0.65, SM, 2, 0.20),

  // --- Світ, цілі ---
  chest_open:       P(0.85, SM, 2, 0.20, { pri: 1 }),
  scrap_banked:     S(0.80, N, 1, 0.30, { pri: 1 }),
  outpost_start:    P(0.80, N, 1, 0.50, { pri: 1 }),
  outpost_captured: P(0.90, N, 1, 0.50, { pri: 1 }),
  core_picked:      S(0.90, N, 1, 0.50, { pri: 1 }),
  purifier_restored: S(1.00, N, 1, 1.0, { pri: 1 }),
  evac_start:       S(0.90, N, 1, 1.0, { pri: 1 }),
  evac_complete:    S(1.00, N, 1, 1.0, { pri: 1 }),
  ground_reclaimed: S(0.85, N, 1, 1.0, { pri: 1 }),
  hive_alert:       S(0.70, N, 1, 1.5, { pri: 1 }),
  wave_surge:       S(0.75, N, 1, 2.0, { pri: 1 }),
  breather_start:   S(0.55, N, 1, 2.0, { pri: 1 }),

  // --- Інтерфейс ---
  ui_click:         U(0.60, SM, 3, 0.04),
  ui_pause:         U(0.60, N, 1, 0.10),
  ui_resume:        U(0.60, N, 1, 0.10),
};

// Музика: loop=false для стінгерів кінця забігу. fade — секунди кросфейду.
export const MUSIC = {
  music_calm:    { vol: 0.9, loop: true,  fade: 3.0 },   // Хаб, перепочинок між хвилями
  music_combat:  { vol: 0.9, loop: true,  fade: 2.5 },   // звичайний бій
  music_surge:   { vol: 1.0, loop: true,  fade: 1.5 },   // піковий наплив хвилі
  music_boss:    { vol: 1.0, loop: true,  fade: 1.2 },   // Хранитель Вулика (Warden)
  music_evac:    { vol: 1.0, loop: true,  fade: 1.5 },   // утримання маяка евакуації
  music_victory: { vol: 1.0, loop: false, fade: 0.4 },   // підсумок: евакуація вдалась
  music_death:   { vol: 1.0, loop: false, fade: 0.4 },   // підсумок: знищено
};

// Ліміти шин і глобальні налаштування
export const AUDIO_CFG = {
  maxVoices: 32,         // усього одночасних SFX-голосів
  maxHearDistance: 1200, // px: далі цього позиційний звук не грає
  panDistance: 700,      // px: відстань, на якій панорама сягає максимуму
  maxPan: 0.7,
  musicHoldSeconds: 6,   // мін. час між звичайними змінами музики (антидрижання)
  pauseMusicDuck: 0.25,  // множник музики на паузі
  menuMusicDuck: 0.6,    // драфт / Воркшоп
};
