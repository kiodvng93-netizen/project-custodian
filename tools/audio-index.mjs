// tools/audio-index.mjs — будує assets/audio/index.json зі списком файлів у sfx/ і music/.
// Запуск з кореня репо: node tools/audio-index.mjs
// Гра читає цей індекс, щоб не стукатись у неіснуючі файли (без 404 у консолі).
// Також перевіряє імена по реєстру js/audioManifest.js і друкує нерозпізнані файли.

import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'assets', 'audio');
const { SOUNDS, MUSIC } = await import(pathToFileURL(join(root, 'js', 'audioManifest.js')).href);

const AUDIO_RE = /\.(ogg|mp3|wav)$/i;
const out = { sfx: [], music: [] };
for (const kind of ['sfx', 'music']) {
  const p = join(dir, kind);
  if (existsSync(p)) out[kind] = readdirSync(p).filter(f => AUDIO_RE.test(f)).sort();
}
writeFileSync(join(dir, 'index.json'), JSON.stringify(out, null, 2) + '\n');

const known = { sfx: Object.keys(SOUNDS), music: Object.keys(MUSIC) };
let unknown = 0;
for (const kind of ['sfx', 'music']) {
  for (const f of out[kind]) {
    const stem = f.replace(AUDIO_RE, '').replace(/_\d+$/, '');
    if (!known[kind].includes(stem)) { console.warn(`? ${kind}/${f}: no such id "${stem}" in audioManifest.js`); unknown++; }
  }
}
const have = (kind, id) => out[kind].some(f => f.replace(AUDIO_RE, '').replace(/_\d+$/, '') === id);
const missingSfx = known.sfx.filter(id => !have('sfx', id)).length;
const missingMusic = known.music.filter(id => !have('music', id)).length;
console.log(`index.json: ${out.sfx.length} sfx files, ${out.music.length} music files. Missing ids: ${missingSfx}/${known.sfx.length} sfx, ${missingMusic}/${known.music.length} music.${unknown ? ` ${unknown} unrecognised.` : ''}`);
