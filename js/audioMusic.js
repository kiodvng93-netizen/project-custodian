// js/audioMusic.js — Режисер музики: обирає трек за станом гри й робить кросфейд.
// Треки: assets/audio/music/<id>.(ogg|mp3|wav). Без файлів тиша (попередження один раз).

import { CONFIG } from './config.js';
import { state } from './state.js';
import { MUSIC, AUDIO_CFG } from './audioManifest.js';

export class MusicDirector {
  constructor(engine) {
    this.engine = engine;
    this.current = null;     // id активного треку (навіть якщо файлу немає)
    this.layer = null;       // { id, src, gain }
    this.pending = null;     // id, чекає на декодування буфера
    this.holdUntil = 0;
    this.clock = 0;
    this.duck = 1;           // плавний множник (пауза / меню)
    this.bossCheck = 0;
    this.bossAlive = false;
  }

  applyGain(instant) {
    const e = this.engine;
    if (!e.buses) return;
    const v = e.cfg.music * this.duck;
    if (instant) e.buses.music.gain.value = v;
    else e.buses.music.gain.setTargetAtTime(v, e.ctx.currentTime, 0.08);
  }

  // Цільовий трек за станом гри; priority=true — міняємо негайно
  desired() {
    const em = state.enemyManager, wm = state.worldManager, p = state.player;
    if (state.runEnd) {
      const o = state.runEnd.outcome;
      return { id: o === 'victory' ? 'music_victory' : o === 'death' ? 'music_death' : null, priority: true };
    }
    if (!em || !wm) return { id: 'music_calm', priority: false };
    if (wm.evac.isActive) return { id: 'music_evac', priority: true };
    if (this.bossAlive) return { id: 'music_boss', priority: true };
    const inHub = !wm.sanctuary.domeBroken && Math.hypot(p.x, p.y) < CONFIG.HUB.radius;
    if (inHub || em.wavePhase === 'breather') return { id: 'music_calm', priority: false };
    if (em.wavePhase === 'surge' && em.enemies.length >= 60) return { id: 'music_surge', priority: false };
    return { id: 'music_combat', priority: false };
  }

  scanBoss(dt) {
    this.bossCheck -= dt;
    if (this.bossCheck > 0) return;
    this.bossCheck = 0.5;
    const em = state.enemyManager, p = state.player;
    this.bossAlive = false;
    if (!em || state.runEnd) return;
    for (let i = 0; i < em.enemies.length; i++) {
      const e = em.enemies[i];
      if (e.typeKey === 'warden' && e.alive && e.isAwakened && Math.hypot(e.x - p.x, e.y - p.y) < 1500) { this.bossAlive = true; return; }
    }
  }

  update(dt) {
    this.clock += dt;
    this.scanBoss(dt);

    // Дакінг: пауза глушить музику сильно, драфт/Воркшоп трохи
    const target = state.isPaused ? AUDIO_CFG.pauseMusicDuck
      : (state.isDrafting || state.isWorkshopOpen) ? AUDIO_CFG.menuMusicDuck : 1;
    if (Math.abs(target - this.duck) > 0.001) { this.duck = target; this.applyGain(false); }

    const want = this.desired();
    if (want.id !== this.current && (want.priority || this.clock >= this.holdUntil)) {
      this.switchTo(want.id);
      this.holdUntil = this.clock + AUDIO_CFG.musicHoldSeconds;
    }
    if (this.pending) this.tryStartPending();
  }

  switchTo(id) {
    this.current = id;
    this.pending = id;
    if (id === null) this.fadeOutLayer(1.0);
    else this.tryStartPending();
  }

  tryStartPending() {
    const id = this.pending, e = this.engine;
    if (id === null) { this.pending = null; return; }
    const bank = e.musicBank(id);
    if (!bank || (bank.length === 0 && bank.loading > 0)) return; // індекс/файл ще вантажиться
    if (bank.length === 0) {                 // файлу немає: тиша
      e.warnOnce('missing:' + id, `no audio file for "${id}" (silent)`);
      this.pending = null;
      this.fadeOutLayer(MUSIC[id].fade);
      return;
    }
    if (this.current !== id) { this.pending = null; return; }
    this.pending = null;
    this.startLayer(id, bank[0]);
  }

  startLayer(id, buffer) {
    const e = this.engine, c = e.ctx, def = MUSIC[id], t = c.currentTime;
    this.fadeOutLayer(def.fade);
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.loop = def.loop;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(def.vol, t + def.fade);
    src.connect(gain);
    gain.connect(e.buses.music);
    src.start(t);
    this.layer = { id, src, gain };
  }

  fadeOutLayer(sec) {
    const l = this.layer;
    if (!l) return;
    this.layer = null;
    const c = this.engine.ctx, t = c.currentTime;
    l.gain.gain.cancelScheduledValues(t);
    l.gain.gain.setValueAtTime(l.gain.gain.value, t);
    l.gain.gain.linearRampToValueAtTime(0, t + sec);
    l.src.stop(t + sec + 0.05);
    l.src.onended = () => { l.src.disconnect(); l.gain.disconnect(); };
  }
}
