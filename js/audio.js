// js/audio.js — Аудіо-шар на Web Audio API: контекст, шини, завантаження, play() з антиспамом.
// Файлів може не бути: тоді кожен виклик — тиха no-op (одне попередження в консоль на id).
// Виклик у грі: audio.play('enemy_death_sprout', { x, y })

import { MetaProgression, saveMetaProgression } from './config.js';
import { state } from './state.js';
import { SOUNDS, MUSIC, AUDIO_CFG } from './audioManifest.js';
import { MusicDirector } from './audioMusic.js';

const BASE = 'assets/audio/';
const EXT_ORDER = ['ogg', 'mp3', 'wav'];

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.buses = null;
    this.banks = new Map();      // id → AudioBuffer[] (порожній масив = файлів немає)
    this.files = { sfx: [], music: [] };
    this.voiceState = new Map(); // id → { last, active: Set<{src, gain}> }
    this.totalVoices = 0;
    this.warned = new Set();
    this.note = null;            // коротка підказка на екрані { text, t }
    this.music = new MusicDirector(this);
    this._paused = false;
    this._inited = false;
  }

  get cfg() { return MetaProgression.audio; }
  get muted() { return this.cfg.muted; }

  warnOnce(key, msg) {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    console.warn('[Audio] ' + msg);
  }

  // Слухаємо перший ключ/клік: браузер дозволяє AudioContext лише після жесту користувача
  init() {
    if (this._inited) return;
    this._inited = true;
    const unlock = () => {
      if (!this.ctx) this.createContext();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    };
    window.addEventListener('keydown', unlock);
    window.addEventListener('pointerdown', unlock);
  }

  createContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.warnOnce('noctx', 'Web Audio API is not available'); return; }
    this.ctx = new AC();
    const c = this.ctx;
    const master = c.createGain();
    master.connect(c.destination);
    this.buses = { master };
    for (const name of ['sfx', 'music', 'ui']) {
      const g = c.createGain();
      g.connect(master);
      this.buses[name] = g;
    }
    this.applyVolumes(true);
    this.ready = true;
    this.loadIndex();
  }

  applyVolumes(instant = false) {
    if (!this.buses) return;
    const t = this.ctx.currentTime, k = instant ? 0 : 0.03;
    const set = (g, v) => (instant ? (g.gain.value = v) : g.gain.setTargetAtTime(v, t, k));
    set(this.buses.master, this.cfg.muted ? 0 : this.cfg.master);
    set(this.buses.sfx, this.cfg.sfx);
    set(this.buses.ui, this.cfg.ui);
    this.music.applyGain(instant);
  }

  setVolume(bus, value) {
    this.cfg[bus] = Math.min(1, Math.max(0, Math.round(value * 100) / 100));
    saveMetaProgression();
    this.applyVolumes();
    if (bus === 'master') this.showNote(`VOLUME ${Math.round(this.cfg.master * 100)}%`);
  }

  adjustMaster(delta) { this.setVolume('master', this.cfg.master + delta); }

  toggleMute() {
    this.cfg.muted = !this.cfg.muted;
    saveMetaProgression();
    this.applyVolumes();
    this.showNote(this.cfg.muted ? 'SOUND MUTED [M]' : 'SOUND ON [M]');
  }

  showNote(text) { this.note = { text, t: 1.6 }; }

  // Індекс існуючих файлів (assets/audio/index.json, генерує tools/audio-index.mjs).
  // Без індексу не стукаємось у неіснуючі URL, тож у консолі немає 404.
  async loadIndex() {
    try {
      const res = await fetch(BASE + 'index.json', { cache: 'no-store' });
      if (res.ok) {
        const j = await res.json();
        this.files.sfx = Array.isArray(j.sfx) ? j.sfx : [];
        this.files.music = Array.isArray(j.music) ? j.music : [];
      } else this.warnOnce('index', 'assets/audio/index.json not found; run `node tools/audio-index.mjs`');
    } catch (e) {
      this.warnOnce('index', 'cannot read assets/audio/index.json: ' + e.message);
    }
    for (const id of Object.keys(SOUNDS)) this.loadBank(id, 'sfx');
    this.indexLoaded = true;
  }

  // Знаходить файли id (id.ext, id_01.ext …), для кожного варіанта обирає найкращий формат
  filesFor(id, dir) {
    const re = new RegExp('^(' + id + '(?:_\\d+)?)\\.(ogg|mp3|wav)$');
    const byStem = new Map();
    for (const f of this.files[dir]) {
      const m = re.exec(f);
      if (!m) continue;
      const cur = byStem.get(m[1]);
      if (!cur || EXT_ORDER.indexOf(m[2]) < EXT_ORDER.indexOf(cur.ext)) byStem.set(m[1], { ext: m[2], file: f });
    }
    return [...byStem.values()].map(v => BASE + dir + '/' + v.file);
  }

  loadBank(id, dir) {
    if (this.banks.has(id)) return;
    const urls = this.filesFor(id, dir);
    const bank = [];
    bank.loading = urls.length;   // скільки файлів ще декодується
    this.banks.set(id, bank);
    for (const url of urls) {
      fetch(url)
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
        .then(buf => this.ctx.decodeAudioData(buf))
        .then(ab => { bank.push(ab); })
        .catch(e => this.warnOnce('load:' + url, `cannot load ${url}: ${e.message}`))
        .finally(() => { bank.loading--; });
    }
  }

  // Буфери музики вантажимо за потреби (великі файли)
  musicBank(id) {
    if (!this.indexLoaded) return null;
    this.loadBank(id, 'music');
    return this.banks.get(id);
  }

  stopAllSfx() {
    const t = this.ctx.currentTime;
    for (const st of this.voiceState.values()) {
      for (const v of st.active) {
        v.gain.gain.cancelScheduledValues(t);
        v.gain.gain.setTargetAtTime(0, t, 0.015);
        v.src.stop(t + 0.08);
      }
    }
  }

  // opts: { x, y, volume, pitch }
  play(id, opts) {
    if (!this.ready || this.cfg.muted) return null;
    const def = SOUNDS[id];
    if (!def) { this.warnOnce('unknown:' + id, `unknown sound id "${id}"`); return null; }
    if (state.isPaused && def.bus !== 'ui') return null;
    const bank = this.banks.get(id);
    if (!bank || bank.length === 0) {
      if (this.indexLoaded && bank && bank.loading === 0) this.warnOnce('missing:' + id, `no audio file for "${id}" (silent)`);
      return null;
    }
    const now = this.ctx.currentTime;
    let st = this.voiceState.get(id);
    if (!st) { st = { last: -1e9, active: new Set() }; this.voiceState.set(id, st); }
    if (now - st.last < def.gap) return null;
    if (st.active.size >= def.voices) return null;
    if (this.totalVoices >= AUDIO_CFG.maxVoices && !def.pri) return null;

    let vol = def.vol * ((opts && opts.volume) || 1), pan = 0;
    if (def.pos && opts && opts.x !== undefined && state.player) {
      const dx = opts.x - state.player.x, dy = opts.y - state.player.y;
      const d = Math.hypot(dx, dy);
      if (d >= AUDIO_CFG.maxHearDistance) return null;
      const f = 1 - d / AUDIO_CFG.maxHearDistance;
      vol *= f * f;
      pan = Math.max(-1, Math.min(1, dx / AUDIO_CFG.panDistance)) * AUDIO_CFG.maxPan;
    }
    if (vol < 0.015) return null;

    st.last = now;
    const src = this.ctx.createBufferSource();
    src.buffer = bank[(Math.random() * bank.length) | 0];
    const [lo, hi] = def.pitch;
    src.playbackRate.value = ((opts && opts.pitch) || 1) * (lo + Math.random() * (hi - lo));
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(gain);
    let tail = gain;
    if (pan !== 0 && this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = pan;
      gain.connect(p);
      tail = p;
    }
    tail.connect(this.buses[def.bus]);
    const voice = { src, gain };
    st.active.add(voice);
    this.totalVoices++;
    src.onended = () => { st.active.delete(voice); this.totalVoices--; src.disconnect(); tail.disconnect(); };
    src.start(now);
    return voice;
  }

  // Щокадру з реальним dt (також під час паузи й hit-stop)
  update(dt) {
    if (this.note) { this.note.t -= dt; if (this.note.t <= 0) this.note = null; }
    if (!this.ready) return;
    if (state.isPaused !== this._paused) {
      this._paused = state.isPaused;
      if (this._paused) this.stopAllSfx();
    }
    this.music.update(dt);
  }

  renderNote(ctx, canvas) {
    if (!this.note) return;
    ctx.save();
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.min(1, this.note.t * 2.5);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const w = ctx.measureText(this.note.text).width + 24;
    ctx.fillRect(canvas.width / 2 - w / 2, 62, w, 24);
    ctx.fillStyle = this.cfg.muted ? '#fc8181' : '#90cdf4';
    ctx.fillText(this.note.text, canvas.width / 2, 79);
    ctx.restore();
  }
}

export const audio = new AudioEngine();
export { MUSIC };
