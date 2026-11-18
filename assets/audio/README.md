# assets/audio

Sound and music for Project Custodian. **The game runs silently while this folder has no files**: a missing file is a no-op and the console warns once per id.

```
assets/audio/
  index.json        list of existing files (generated, commit it)
  sfx/              <id>.ogg | <id>_01.ogg, <id>_02.ogg …
  music/            <id>.ogg
```

The ids live in `js/audioManifest.js` (`SOUNDS`, `MUSIC`). Prompts for every id: `docs/AUDIO-PROMPTS.md`.

## Format
- **`.ogg` (Vorbis) is preferred**: small, loops without the gap that MP3 encoders add at the end.
- `.mp3` and `.wav` are also accepted. If one variant exists in several formats, the game picks `ogg > mp3 > wav`.
- Why not only OGG: Gemini and most free tools export MP3/WAV, and all modern browsers decode all three, so converting is optional. Convert music at least to OGG to get clean loops (Audacity or `ffmpeg -i in.wav -c:a libvorbis -q:a 5 out.ogg`).
- SFX: mono is fine (the game pans by position), 44.1 kHz, keep each under about 1 s (except stingers). Music: stereo, 44.1 kHz.

## Loudness
- SFX: peak at about **-3 dBFS**; short hits at about -18 LUFS short-term. Per-sound balance is done in code (`vol` in the manifest), so keep files uniform and do not clip.
- Music: about **-18 LUFS integrated**, peak -2 dBFS, so combat SFX stay readable on top.
- Trim leading silence (the hit must start in the first ms) and fade the last 10 ms.

## Drop in a file
1. Name it by id: `assets/audio/sfx/blaster_fire_01.ogg`. Several variants of one id: `_01`, `_02`, … (picked at random). Single file: no suffix.
2. Run from the repo root: `node tools/audio-index.mjs`. It rewrites `index.json` and lists files whose id is unknown. The game reads the index so it never requests a missing file (no 404s in the console).
3. Reload the page (serve over HTTP, see `CLAUDE.md`), click once or press a key (browsers block audio until then).

## Music states
`music_calm` (Hub, breather), `music_combat`, `music_surge` (surge phase with 60+ enemies), `music_boss` (awakened Warden nearby), `music_evac`, and stingers `music_victory` / `music_death` (not looped). Changes crossfade; ordinary changes are held at least `musicHoldSeconds` apart.

## In game
- `M` mute (a note shows on screen), `-` / `=` master volume. Saved in the meta save (`audio`: master, sfx, music, ui, muted).
- Pause ducks the music and stops SFX; Draft/Workshop duck it lightly.
- Voices are limited per sound (`voices`) and re-triggers throttled (`gap`) in the manifest, plus a global cap, so hundreds of hits per second stay clean. Positional sounds fade with distance from the robot and pan left/right.

## Test tones
`node tools/audio-test-tones.mjs` writes placeholder tones (a few SFX and two music loops) to check the pipeline; `node tools/audio-test-tones.mjs clean` removes them. Run `node tools/audio-index.mjs` after either.
