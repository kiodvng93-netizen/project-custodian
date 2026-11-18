// tools/audio-test-tones.mjs — генерує тестові WAV-заглушки (placeholders) для перевірки конвеєра.
// node tools/audio-test-tones.mjs        створити   (імена з префіксом у README: це заглушки)
// node tools/audio-test-tones.mjs clean  видалити ці файли
// Не є реальним звуком: просто тони, щоб почути, що play/throttle/mute/музика працюють.

import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'audio');
const RATE = 22050;

function wav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  return buf;
}
// Тон із швидким нарощуванням/спадом (без клацань), опційно ковзання частоти
function tone(freq, sec, { slide = 0, gain = 0.5 } = {}) {
  const n = Math.floor(RATE * sec), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n, f = freq + slide * t;
    ph += (2 * Math.PI * f) / RATE;
    const env = Math.min(1, i / 120) * Math.min(1, (n - i) / 400) * (1 - t * 0.5);
    out[i] = Math.sin(ph) * gain * env;
  }
  return out;
}
// Музична заглушка: повільний акорд, цілі періоди → петля без клацання
function pad(freqs, sec) {
  const n = Math.floor(RATE * sec), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (const f of freqs) v += Math.sin((2 * Math.PI * f * i) / RATE);
    out[i] = (v / freqs.length) * 0.3;
  }
  return out;
}

const files = {
  'sfx/blaster_fire_01.wav': tone(900, 0.12, { slide: -500 }),
  'sfx/blaster_fire_02.wav': tone(1100, 0.12, { slide: -600 }),
  'sfx/enemy_death_sprout.wav': tone(220, 0.25, { slide: -150 }),
  'sfx/xp_pickup.wav': tone(1200, 0.08, { slide: 600, gain: 0.4 }),
  'sfx/level_up.wav': tone(600, 0.5, { slide: 600 }),
  'music/music_combat.wav': pad([110, 165, 220], 8),
  'music/music_calm.wav': pad([98, 147, 196], 8),
};

const clean = process.argv[2] === 'clean';
for (const [rel, data] of Object.entries(files)) {
  const p = join(root, rel);
  if (clean) { if (existsSync(p)) unlinkSync(p); continue; }
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, wav(data));
}
console.log(clean ? 'test tones removed' : `wrote ${Object.keys(files).length} test tones (placeholders)`);
