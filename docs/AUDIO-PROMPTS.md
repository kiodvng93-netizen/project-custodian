# Audio prompts (Gemini and alternatives)

One ready-to-paste prompt per sound id from `js/audioManifest.js`. File names match 1:1: the id is the file name (`blaster_fire` → `assets/audio/sfx/blaster_fire_01.ogg`, `_02` …). See `assets/audio/README.md` for formats, loudness and how to drop files in. Regenerate nothing by hand in code: after adding files run `node tools/audio-index.mjs`.

## 1. What can generate audio for free (checked 18.11.2026)

Facts below come from a web search; Google changes this often, so confirm in AI Studio before relying on it.

| Option | Music | SFX | Free tier |
|---|---|---|---|
| **Gemini app (gemini.google.com), Lyria 3** | Yes, text → track | Not an SFX tool, but short "sound" prompts sometimes work | Free for basic access with a daily cap; free tracks are capped at **about 30 s**; paid plans (AI Plus/Pro/Ultra) raise limits and length (up to about 3 min). 18+ only. |
| **Gemini API, Lyria 3 Clip / Lyria 3.5 preview** | Yes | Community tools use the Clip model for short SFX | Third-party listings show **no free API tier**, about $0.04 (Clip) and $0.08 (Pro) per generation. Not confirmed on an official Google page; the author does not pay, so treat as unavailable. |
| **Gemini TTS models** | No | No (speech only, no SFX generation) | Has a free tier, but is not useful here. |
| Google AI Studio (web) | Possible to try Lyria in the studio UI | | One guide says AI Studio testing is free while API keys need billing; unconfirmed. |

**Conclusion.** Gemini has no dedicated text-to-SFX model. The free route is the Gemini app: ask for very short clips and trim them. Expect a 30 s cap for music, which suits our loop lengths (about 28-50 s) only partly: generate 30 s and loop it, or ask for a shorter loop and check the seam. For SFX, expect trial and error (Lyria is a music model: use words like "isolated sound effect", "no melody", "no drums" and trim in an editor).

**Alternatives if Gemini is poor at SFX** (from memory, not verified in this search; check licenses and limits before use):
- **jsfxr / sfxr** (browser, free, no limits): perfect for the cute robot blips, pickups, UI and zaps (`xp_pickup`, `scrap_pickup`, `ui_*`, `dash`, `blaster_*`, `tesla_zap`, `drone_laser`). Export WAV.
- **Stable Audio Open** (open weights, run locally or on a free Colab/Hugging Face Space): text → SFX/loops up to about 47 s; good for wet/organic hits and ambience.
- **ElevenLabs Sound Effects**: has a small monthly free credit allowance; the free plan requires attribution and has usage limits.
- **CC0 libraries** (freesound.org filtered by CC0, kenney.nl audio packs, OpenGameArt): layer a squelch + a chitin crack for enemy deaths.
- Record yourself: wet squelches (a sponge in water, a wet cloth), crunches (celery, dry pasta) are classic for gore.

## 2. Workflow and tips

1. Paste the prompt, generate, listen, regenerate until it is right. Make the number of variants listed per sound (high-frequency sounds need 2-4 so a crowd does not sound like a machine gun).
2. Trim silence at the start (the hit must be audible in the first few ms) and fade out the last 10 ms in an editor (Audacity is free).
3. Name files `<id>_01`, `<id>_02`, … (single variant: just `<id>`). Convert to `.ogg` if you can; `.mp3` and `.wav` also work.
4. Run `node tools/audio-index.mjs`, reload the game, and check the console: it warns once per id that still has no file.
5. Music loops: Gemini will not guarantee a perfect loop. Generate a track that starts and ends on the same chord, then crossfade the last second into the first in an editor to remove the seam. Keep all tracks in the same key family (A minor / C major) so the game can crossfade between them.

## 3. Shared style block

Every SFX prompt below already contains this block, so you can paste any prompt on its own:

> Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.

## 4. Sound effects (`assets/audio/sfx/`)

### Weapons

#### `blaster_fire`
File: `blaster_fire_01` … `blaster_fire_03` · Length: 0.10-0.15 s · Variants: 3

```text
Generate an isolated game sound effect: a tiny robot's plasma blaster shot: a bright, chirpy "pew" with a short mechanical servo click at the start, light and fast, fires hundreds of times per run so it must not be fatiguing. Length 0.10-0.15 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 3 different variations with slightly different pitch and texture.
```

#### `blaster_hit`
File: `blaster_hit_01` … `blaster_hit_04` · Length: 0.08-0.12 s · Variants: 4

```text
Generate an isolated game sound effect: a small energy bolt hitting a soft alien body: a crisp electric tick plus a tiny wet squelch, very short and light, played very often. Length 0.08-0.12 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 4 different variations with slightly different pitch and texture.
```

#### `hyperion_salvo`
File: `hyperion_salvo` · Length: 0.5-0.7 s · Variants: 1

```text
Generate an isolated game sound effect: a powerful radial burst of a dozen energy bolts leaving a robot at once: a rising charge-up whoosh then a wide bright "fwoomp" burst, heroic and punchy. Length 0.5-0.7 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `mortar_fire`
File: `mortar_fire_01` … `mortar_fire_02` · Length: 0.25-0.35 s · Variants: 2

```text
Generate an isolated game sound effect: a bio-spore mortar launch: a hollow thump of a tube cannon with a short gooey pop and a rising whistle tail. Length 0.25-0.35 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 2 different variations with slightly different pitch and texture.
```

#### `mortar_explode`
File: `mortar_explode_01` … `mortar_explode_03` · Length: 0.5-0.8 s · Variants: 3

```text
Generate an isolated game sound effect: a bio-spore mortar shell detonating on a crowd: a heavy wet bursting boom with a green slime splash and a few droplets, punchy low end, tail fades quickly. Length 0.5-0.8 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 3 different variations with slightly different pitch and texture.
```

#### `tesla_zap`
File: `tesla_zap_01` … `tesla_zap_03` · Length: 0.15-0.25 s · Variants: 3

```text
Generate an isolated game sound effect: a Tesla coil chain-lightning arc jumping between targets: a crackling electric zap with a bright snap, a little buzz, clean cutoff. Length 0.15-0.25 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 3 different variations with slightly different pitch and texture.
```

#### `saw_hit`
File: `saw_hit_01` … `saw_hit_04` · Length: 0.08-0.12 s · Variants: 4

```text
Generate an isolated game sound effect: a spinning scrap-metal saw blade clipping an insectoid body: a short metallic "tching" scrape plus a chitin crunch. Length 0.08-0.12 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 4 different variations with slightly different pitch and texture.
```

#### `drone_laser`
File: `drone_laser_01` … `drone_laser_03` · Length: 0.10-0.18 s · Variants: 3

```text
Generate an isolated game sound effect: a small orbiting drone firing a thin laser: a high, clean "zip" beam with a tiny electronic warble. Length 0.10-0.18 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 3 different variations with slightly different pitch and texture.
```

#### `flamer_burst`
File: `flamer_burst_01` … `flamer_burst_03` · Length: 0.25-0.35 s · Variants: 3

```text
Generate an isolated game sound effect: a short burst of a plasma flamethrower: a soft roaring "fwsshh" with crackle, no sharp attack, designed to be retriggered every quarter second without becoming a harsh drone. Length 0.25-0.35 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 3 different variations with slightly different pitch and texture.
```

#### `aura_pulse`
File: `aura_pulse_01` … `aura_pulse_02` · Length: 0.4-0.6 s · Variants: 2

```text
Generate an isolated game sound effect: a purple spore-aura pulse expanding around a robot: a soft low "whump" with a shimmering airy ring-out, gentle, slightly alien. Length 0.4-0.6 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 2 different variations with slightly different pitch and texture.
```

### Enemies and world threats

#### `enemy_hit`
File: `enemy_hit_01` … `enemy_hit_04` · Length: 0.06-0.10 s · Variants: 4

```text
Generate an isolated game sound effect: a generic alien bio-creature taking a hit: a very short wet slap/squelch with a slight chitin tick, low-mid frequencies, subtle because it plays constantly. Length 0.06-0.10 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 4 different variations with slightly different pitch and texture.
```

#### `enemy_death_sprout`
File: `enemy_death_sprout_01` … `enemy_death_sprout_04` · Length: 0.2-0.35 s · Variants: 4

```text
Generate an isolated game sound effect: a small grotesque alien sprout creature dying: a quick wet "splurt" burst with a little squeaky gurgle, cartoonishly gross but short, satisfying when played many times in quick succession. Length 0.2-0.35 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 4 different variations with slightly different pitch and texture.
```

#### `enemy_death_dasher`
File: `enemy_death_dasher_01` … `enemy_death_dasher_03` · Length: 0.25-0.4 s · Variants: 3

```text
Generate an isolated game sound effect: a fast lizard-like alien dasher dying: a sharp chitin crack followed by a wet splat and a short rising screech that cuts off. Length 0.25-0.4 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 3 different variations with slightly different pitch and texture.
```

#### `enemy_death_stalker`
File: `enemy_death_stalker_01` … `enemy_death_stalker_02` · Length: 0.4-0.6 s · Variants: 2

```text
Generate an isolated game sound effect: a larger stalker alien predator dying: a heavy wet crunch, a low guttural gurgle and a juicy burst, meatier than a small enemy. Length 0.4-0.6 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 2 different variations with slightly different pitch and texture.
```

#### `enemy_death_elite`
File: `enemy_death_elite_01` … `enemy_death_elite_02` · Length: 0.6-0.9 s · Variants: 2

```text
Generate an isolated game sound effect: a tough golden-outlined elite alien dying: a deep crunchy burst with a resonant low thud, a metallic ring-out hint (it was fat with scrap) and a long satisfying gurgle. Length 0.6-0.9 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 2 different variations with slightly different pitch and texture.
```

#### `enemy_death_warden`
File: `enemy_death_warden` · Length: 1.5-2.0 s · Variants: 1

```text
Generate an isolated game sound effect: the Hive Warden boss dying: a huge multi-stage wet collapse, deep roar dissolving into a gurgling groan, heavy bass impact, then bubbling splashes, epic but grotesque. Length 1.5-2.0 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `stalker_windup`
File: `stalker_windup_01` … `stalker_windup_03` · Length: 0.3-0.5 s · Variants: 3

```text
Generate an isolated game sound effect: an alien stalker telegraphing a lunge: a short rising hiss-and-click chitter, tense, clearly a warning. Length 0.3-0.5 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 3 different variations with slightly different pitch and texture.
```

#### `warden_awaken`
File: `warden_awaken` · Length: 1.5-2.0 s · Variants: 1

```text
Generate an isolated game sound effect: a giant dormant alien boss waking up: a deep rumbling roar with wet organic growl layers and a low sub swell, menacing. Length 1.5-2.0 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `warden_charge`
File: `warden_charge_01` … `warden_charge_02` · Length: 0.5-0.8 s · Variants: 2

```text
Generate an isolated game sound effect: a huge alien boss winding up a charge: a rising guttural snarl with a heavy stomp and a chitin rattle, urgent warning. Length 0.5-0.8 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 2 different variations with slightly different pitch and texture.
```

#### `hive_wrath`
File: `hive_wrath` · Length: 2.0-3.0 s · Variants: 1

```text
Generate an isolated game sound effect: the Sanctuary dome shattering as the Hive unleashes its wrath: a glassy crack and break, a huge low earthquake rumble and a distant monstrous roar, dramatic. Length 2.0-3.0 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `nest_alarm`
File: `nest_alarm_01` … `nest_alarm_02` · Length: 0.6-0.9 s · Variants: 2

```text
Generate an isolated game sound effect: a corrupted alien nest emitting an alarm: a fleshy pulsing shriek with wet throbbing, disturbing and short. Length 0.6-0.9 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 2 different variations with slightly different pitch and texture.
```

#### `nest_destroyed`
File: `nest_destroyed_01` … `nest_destroyed_02` · Length: 1.2-1.8 s · Variants: 2

```text
Generate an isolated game sound effect: a corrupted alien nest being destroyed and purified: a big wet organic burst and collapse, then a clean bright cleansing shimmer rising at the end (hope returning). Length 1.2-1.8 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 2 different variations with slightly different pitch and texture.
```

### Robot

#### `player_hit`
File: `player_hit_01` … `player_hit_03` · Length: 0.2-0.3 s · Variants: 3

```text
Generate an isolated game sound effect: a small cute robot taking damage: a metallic clang with a sparky zap and a tiny sad descending servo chirp, not violent, readable and not annoying. Length 0.2-0.3 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 3 different variations with slightly different pitch and texture.
```

#### `low_hp_warning`
File: `low_hp_warning` · Length: 0.5-0.7 s · Variants: 1

```text
Generate an isolated game sound effect: a robot low-health warning: a soft double electronic heartbeat-like beep (two low pulses), calm but urgent, must be pleasant to hear every 1.2 s. Length 0.5-0.7 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `shield_break`
File: `shield_break_01` … `shield_break_02` · Length: 0.4-0.6 s · Variants: 2

```text
Generate an isolated game sound effect: a robot energy shield shattering: a bright glassy crack with a descending electronic whoosh and a short shockwave thump. Length 0.4-0.6 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 2 different variations with slightly different pitch and texture.
```

#### `dash`
File: `dash_01` … `dash_03` · Length: 0.2-0.3 s · Variants: 3

```text
Generate an isolated game sound effect: a small robot dashing: a quick servo whirr and a light air whoosh, snappy with a tiny thruster puff. Length 0.2-0.3 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 3 different variations with slightly different pitch and texture.
```

#### `player_death`
File: `player_death` · Length: 1.5-2.0 s · Variants: 1

```text
Generate an isolated game sound effect: a small cute robot being destroyed: a descending power-down whine, a few sparks and clanks, a sad little final beep, not horrifying. Length 1.5-2.0 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

### Loot and progression

#### `xp_pickup`
File: `xp_pickup_01` … `xp_pickup_04` · Length: 0.05-0.08 s · Variants: 4

```text
Generate an isolated game sound effect: collecting a green bio-essence crystal: a tiny bright glassy "blip" in a pleasant high register, extremely short, must not tire the ear when heard 20 times per second. Length 0.05-0.08 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 4 different variations with slightly different pitch and texture.
```

#### `scrap_pickup`
File: `scrap_pickup_01` … `scrap_pickup_03` · Length: 0.10-0.15 s · Variants: 3

```text
Generate an isolated game sound effect: collecting a piece of tech scrap: a short metallic coin-like "clink" with a small electronic sparkle. Length 0.10-0.15 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 3 different variations with slightly different pitch and texture.
```

#### `level_up`
File: `level_up` · Length: 0.8-1.2 s · Variants: 1

```text
Generate an isolated game sound effect: a robot leveling up: a cheerful rising arpeggio of bright synth bells with a soft servo whirr, triumphant but small and cute. Length 0.8-1.2 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `draft_open`
File: `draft_open` · Length: 0.3-0.5 s · Variants: 1

```text
Generate an isolated game sound effect: an upgrade card menu opening: a soft digital "whoosh-ding" with three quiet ascending ticks. Length 0.3-0.5 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `card_pick`
File: `card_pick` · Length: 0.3-0.5 s · Variants: 1

```text
Generate an isolated game sound effect: choosing an upgrade card: a satisfying mechanical latch click and a positive short chime. Length 0.3-0.5 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `evolution`
File: `evolution` · Length: 1.5-2.5 s · Variants: 1

```text
Generate an isolated game sound effect: a weapon evolving into a stronger form: a build-up of mechanical clanks and servo spin, then a bright powerful transformation chord with sparkling shimmer, epic and rewarding. Length 1.5-2.5 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `fruit_eaten`
File: `fruit_eaten_01` … `fruit_eaten_02` · Length: 0.3-0.5 s · Variants: 2

```text
Generate an isolated game sound effect: a robot absorbing a healing fruit: a soft organic "gulp-pop" with a gentle warm rising chime of restoration. Length 0.3-0.5 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 2 different variations with slightly different pitch and texture.
```

### World and objectives

#### `chest_open`
File: `chest_open_01` … `chest_open_02` · Length: 0.6-0.9 s · Variants: 2

```text
Generate an isolated game sound effect: opening a supply cache: a heavy latch clunk, a hydraulic hiss and a bright treasure sparkle. Length 0.6-0.9 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 2 different variations with slightly different pitch and texture.
```

#### `scrap_banked`
File: `scrap_banked` · Length: 0.8-1.2 s · Variants: 1

```text
Generate an isolated game sound effect: depositing scrap into a vault: a mechanical hopper rattle of coins and metal pieces, a vault thunk and a satisfying register-style "ka-ching" chime. Length 0.8-1.2 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `outpost_start`
File: `outpost_start` · Length: 0.8-1.2 s · Variants: 1

```text
Generate an isolated game sound effect: activating a field outpost beacon: a power-up hum rising, three electronic pings and a low alert tone. Length 0.8-1.2 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `outpost_captured`
File: `outpost_captured` · Length: 1.0-1.5 s · Variants: 1

```text
Generate an isolated game sound effect: an outpost secured: a bright confirming chord with a mechanical lock-in clunk and a rewarding scrap-tally rattle. Length 1.0-1.5 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `core_picked`
File: `core_picked` · Length: 0.8-1.2 s · Variants: 1

```text
Generate an isolated game sound effect: picking up the glowing Purifier Core: a deep humming energy pulse that swells, with crystalline harmonics, important and precious. Length 0.8-1.2 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `purifier_restored`
File: `purifier_restored` · Length: 2.0-3.0 s · Variants: 1

```text
Generate an isolated game sound effect: a biosphere purifier switching on and the land beginning to heal: a deep machine start-up, a big warm rising chord and gentle wind-and-leaf shimmer, hopeful and powerful. Length 2.0-3.0 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `evac_start`
File: `evac_start` · Length: 1.5-2.5 s · Variants: 1

```text
Generate an isolated game sound effect: an evacuation beacon activating: a rising siren-like alarm sweep, radio static and a deep beacon pulse, urgent. Length 1.5-2.5 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `evac_complete`
File: `evac_complete` · Length: 2.0-3.0 s · Variants: 1

```text
Generate an isolated game sound effect: a successful evacuation: a triumphant ascending sweep of engines lifting off with a warm uplifting chord and a final soft chime. Length 2.0-3.0 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `ground_reclaimed`
File: `ground_reclaimed` · Length: 1.5-2.5 s · Variants: 1

```text
Generate an isolated game sound effect: dead ground turning green again: a soft rolling wave of rustling plants growing, gentle wind chimes and a warm low swell, peaceful and magical. Length 1.5-2.5 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `hive_alert`
File: `hive_alert` · Length: 0.8-1.2 s · Variants: 1

```text
Generate an isolated game sound effect: the Hive growing aware of the carried scrap: a low ominous pulsing drone with wet organic undertones that swells and stops, tense but not loud. Length 0.8-1.2 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `wave_surge`
File: `wave_surge` · Length: 1.5-2.0 s · Variants: 1

```text
Generate an isolated game sound effect: a new wave of alien swarm approaching: a rising tide of distant chittering and a deep war-horn-like organic bass swell. Length 1.5-2.0 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `breather_start`
File: `breather_start` · Length: 1.0-1.5 s · Variants: 1

```text
Generate an isolated game sound effect: the swarm retreating for a breather: a long relieved descending exhale of low wind with a soft calming chime. Length 1.0-1.5 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

### Interface

#### `ui_click`
File: `ui_click_01` … `ui_click_03` · Length: 0.04-0.08 s · Variants: 3

```text
Generate an isolated game sound effect: a clean tiny robotic UI click: a crisp mechanical tick with a soft blip. Length 0.04-0.08 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz. Make 3 different variations with slightly different pitch and texture.
```

#### `ui_pause`
File: `ui_pause` · Length: 0.2-0.3 s · Variants: 1

```text
Generate an isolated game sound effect: a pause menu opening: a short descending two-note electronic blip with a soft servo settle. Length 0.2-0.3 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

#### `ui_resume`
File: `ui_resume` · Length: 0.2-0.3 s · Variants: 1

```text
Generate an isolated game sound effect: a pause menu closing: a short ascending two-note electronic blip, the mirror of the pause sound. Length 0.2-0.3 s. Style: cute small custodian robot (clean, chirpy mechanical servo and tech sounds) versus grotesque alien bio-swarm (wet, squelchy, chitin, gurgles) in a dark corrupted wasteland. Dry sound effect, no music, no voice, no reverb tail, no background noise, clean start and clean end, normalized, mono or stereo, 44.1 kHz.
```

## 5. Music (`assets/audio/music/`)

Shared palette for all tracks: warm analog synth pads, a cute music-box / bell motif (the robot), a dark organic low growl texture (the swarm), crisp electronic drums when there is a beat. Common key family: A minor / C major. No vocals. Aim for -18 LUFS integrated.

The game picks the track by state: calm = Hub or breather; combat = normal waves; surge = surge phase with 60+ enemies; boss = awakened Hive Warden nearby; evac = holding the beacon; victory / death = run-end stingers (play once).

#### `music_calm`
File: `music_calm` · Hub and breather between waves. 78 BPM, 4/4, 16 bars (about 50 s), seamless loop.

```text
Compose a video game soundtrack piece. Hub and breather between waves. 78 BPM, 4/4, 16 bars (about 50 s), seamless loop. Calm, hopeful, slightly lonely sci-fi ambience, the wasteland slowly turning green. Soft warm analog synth pads, a gentle music-box / celesta lead playing a simple 4-note motif, light pizzicato bass, faint wind texture and a distant soft servo tick as percussion. A minor key with a major lift in bars 9-12. No drums beyond a very soft pulse. Low energy, never boring. Shared palette: warm analog synth pads, a cute music-box / bell motif, a dark organic low growl texture, crisp electronic drums where a beat is called for. Key family A minor / C major. Instrumental only, no vocals, no spoken words. It must loop seamlessly: start and end on the same chord with no fade-out and no long silence. Clean mix with space in the mid frequencies so sound effects stay audible.
```

#### `music_combat`
File: `music_combat` · Normal combat. 118 BPM, 4/4, 16 bars (about 33 s), seamless loop.

```text
Compose a video game soundtrack piece. Normal combat. 118 BPM, 4/4, 16 bars (about 33 s), seamless loop. Driving but not overwhelming sci-fi action loop, steady and groovy for long play sessions. Punchy synth bass with a rhythmic pulse, tight electronic drums (kick, snare, crisp hats), metallic percussion hits, an arpeggiated synth, and a cute chirpy bell motif from the calm theme over a darker minor harmony. Slight organic low growl textures for the swarm. Medium energy, leave room for sound effects in the mid frequencies. Shared palette: warm analog synth pads, a cute music-box / bell motif, a dark organic low growl texture, crisp electronic drums where a beat is called for. Key family A minor / C major. Instrumental only, no vocals, no spoken words. It must loop seamlessly: start and end on the same chord with no fade-out and no long silence. Clean mix with space in the mid frequencies so sound effects stay audible.
```

#### `music_surge`
File: `music_surge` · Peak wave surge. 138 BPM, 4/4, 16 bars (about 28 s), seamless loop.

```text
Compose a video game soundtrack piece. Peak wave surge. 138 BPM, 4/4, 16 bars (about 28 s), seamless loop. Intense, relentless horde-clearing power, Diablo and Path of Exile style crowd-clearing excitement. Heavy distorted synth bass, fast double-time drums with big kicks and snare rolls, aggressive saw-wave arpeggios, tense rising risers in bars 7-8 and 15-16, brass-like synth stabs, the cute bell motif twisted into a minor, urgent form. High energy, same palette and key as the combat track. Shared palette: warm analog synth pads, a cute music-box / bell motif, a dark organic low growl texture, crisp electronic drums where a beat is called for. Key family A minor / C major. Instrumental only, no vocals, no spoken words. It must loop seamlessly: start and end on the same chord with no fade-out and no long silence. Clean mix with space in the mid frequencies so sound effects stay audible.
```

#### `music_boss`
File: `music_boss` · Hive Warden boss fight. 100 BPM, 4/4 (half-time feel), 16 bars (about 38 s), seamless loop.

```text
Compose a video game soundtrack piece. Hive Warden boss fight. 100 BPM, 4/4 (half-time feel), 16 bars (about 38 s), seamless loop. Menacing, heavy and massive. Deep sub-bass drone, slow pounding taiko-like and industrial drums, low organic growl and wet gurgle textures, dissonant string-like synth stabs, a distorted detuned version of the cute bell motif, ominous choir pad swells. Big and slow with a sense of a giant creature, still clean enough to keep gameplay readable. Shared palette: warm analog synth pads, a cute music-box / bell motif, a dark organic low growl texture, crisp electronic drums where a beat is called for. Key family A minor / C major. Instrumental only, no vocals, no spoken words. It must loop seamlessly: start and end on the same chord with no fade-out and no long silence. Clean mix with space in the mid frequencies so sound effects stay audible.
```

#### `music_evac`
File: `music_evac` · Evacuation hold, 60 seconds of survival. 128 BPM, 4/4, 16 bars (about 30 s), seamless loop.

```text
Compose a video game soundtrack piece. Evacuation hold, 60 seconds of survival. 128 BPM, 4/4, 16 bars (about 30 s), seamless loop. Tense, urgent countdown energy with a spark of hope. Pulsing sequenced synth bass, driving four-on-the-floor kick, ticking hi-hats like a clock, a rising arpeggio, rhythmic siren-like synth swells, sparse radio-beep accents. The melody uses the bell motif in a heroic major-leaning key lift in the second half. Same palette as the other tracks. Shared palette: warm analog synth pads, a cute music-box / bell motif, a dark organic low growl texture, crisp electronic drums where a beat is called for. Key family A minor / C major. Instrumental only, no vocals, no spoken words. It must loop seamlessly: start and end on the same chord with no fade-out and no long silence. Clean mix with space in the mid frequencies so sound effects stay audible.
```

#### `music_victory`
File: `music_victory` · Run end, evacuation succeeded. One-shot (not a loop), 78 BPM, about 12 s with a natural ending.

```text
Compose a video game soundtrack piece. Run end, evacuation succeeded. One-shot (not a loop), 78 BPM, about 12 s with a natural ending. Warm, triumphant and emotional sci-fi fanfare in the calm theme. Rising synth pads, bright bell and music-box melody resolving to a major chord, soft strings-like synth, gentle servo-chirp sparkles, a gradual fade to a clean, long final chord. Hopeful: the world is a little greener. Shared palette: warm analog synth pads, a cute music-box / bell motif, a dark organic low growl texture, crisp electronic drums where a beat is called for. Key family A minor / C major. Instrumental only, no vocals, no spoken words. It must loop seamlessly: start and end on the same chord with no fade-out and no long silence. Clean mix with space in the mid frequencies so sound effects stay audible.
```

#### `music_death`
File: `music_death` · Run end, the robot was destroyed. One-shot (not a loop), 70 BPM, about 10 s with a natural ending.

```text
Compose a video game soundtrack piece. Run end, the robot was destroyed. One-shot (not a loop), 70 BPM, about 10 s with a natural ending. Sad but gentle, never harsh: a descending music-box and soft-pad version of the bell motif in a minor key, a distant power-down whine, a few quiet sparks, ending on an unresolved soft chord that fades out. The robot is cute, so it should feel bittersweet, not horrifying, and leave a feeling of "one more run". Shared palette: warm analog synth pads, a cute music-box / bell motif, a dark organic low growl texture, crisp electronic drums where a beat is called for. Key family A minor / C major. Instrumental only, no vocals, no spoken words. It must loop seamlessly: start and end on the same chord with no fade-out and no long silence. Clean mix with space in the mid frequencies so sound effects stay audible.
```
