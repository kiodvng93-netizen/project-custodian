# Project Custodian: Vision (agreed in design talks, 15.11.2026)

Short on purpose. Decisions only. Details and status live in `PROJECT_STATE.md`.

## Pillars
- **Every run, even a short one, feels good, and dying is not frustrating.** This is the one fixed point; the vision has shifted slightly during development.
- **Hard but fair.** You progress slowly and the game never becomes a walk in the park.
- **The flow of destruction.** Crowds collapse, the ground is painted with blood; the player still chooses weapons and upgrades carefully.
- **The robot stays cute, the enemies get grotesque.** Alien Shooter / Alien Swarm gore and swarm pressure, Diablo / PoE clearing feel.
- **Terraform the world over many runs.** Evac ends a run; it is not the goal.

## Order of work
Updated 18.11.2026: the core loop is close to done, and the visual and readability pass has shipped. Next: sound and music (audio generated with Gemini), then graphics, then a slower progression pace (Vampire Survivors-like: long runs, smooth power growth, still hard), then content, progression, Ring 2. Items not built yet are marked (later).

## Visuals
- Dark, calm, low-contrast ground; the robot is the brightest thing on screen. Detail is wasted at 36-100 px: use silhouette, color, glow.
- Enemy sprites can be bigger than hitboxes (sprite size is separate); a hitbox must never exceed the visible body.
- Fresh blood vivid, old blood darkens and sinks into the ground.
- Light and darkness (later): darker screen edge, radial (not cone) glow around the robot, flashes and burning corpses as light sources. Prototype before committing; keep it from hurting readability.
- Enemy sprites (later): pixel art designed for small size, flat magenta background keyed out in code (`docs/CHATGPT-SPRITE-PROMPTS.md`). Start with a Sprout pilot (5 images) before the full batch; consider fewer walk directions (S, E, N plus mirror). Compare ChatGPT, Gemini free tier and PixelLab trial on the same brief. Baked 3D is rejected for now (needs Blender skills, would clash with the pixel robot).

## Fertility and terraforming (gore feeds the ground)
- In a run, kills make ground fertile: moss, grass, flowers, bushes, small solid trees that bear health fruit. Run gardens reset every run and give only fruit and visuals, weaker than permanent patches.
- Fertility connected to the hub feeds it fully; disconnected counts at a reduced rate (soft rule). Roots show the connection. Biomass is saved even on death and grows the hub.
- Patch locations stay persistent. Reclaimed ground regenerates the player; bodies there thin out (about 1 in 10 kept, faded).
- Hive reaction (later): the more land you regrow, the fiercer the Hive; special elites and new types appear only after kill and regrow thresholds. An enemy that withers gardens ("Hive takes land back") is a later option.
- Hub strength upgrades (later): early on you return to the hub for protection; later it gets turrets and defenses. Hold-the-line bottlenecks and more structures come in later rings.
- No new currency. Do not overdo it: balance later with the bot, no god mode.

## Progression and content (later)
- Weapons unlock one by one from a blaster start; every perk is unlockable except the base ones, so there is always something to chase.
- Unlocks widen the pool; they do not make the game harder by themselves. Difficulty is a separate dial.
- Hidden difficulty director (Rimworld-narrator style), merged with the Doom-style low-HP mercy: reads HP, time since last hit and kill rate, adjusts spawn tempo and packs. Hard floor: it never goes soft.
- Draft consistency: one wish-list slot that boosts weight (not a guarantee), a boost for newly unlocked items, limited reroll or banish, visible evolution recipes. Build it when the weapon pool is big.
- Weapon mastery: a favorite weapon grows slowly with a gold mark, with a cap; unused weapons get a catch-up bonus so variety is rewarded, not the favorite punished.
- Berserk: unlocked in the hub, about 10 s of sprite change plus regen and damage, once per run or a long cooldown.
- Nature merge: hidden build combinations change the robot with overlays (vines, moss, glow) and give perks, instead of full redraws.
- More characters, evolving the robot, and an enemy bestiary come last.

## Ending
- A slow terraform through the rings, a boss and an end screen, then 100% completion. All of this in the main version, without needing DLC; new rings are DLC-sized.

## Constraints
- Solo developer, vanilla JS, no paid art. AI sprites may come from a friend's subscription or free tiers; do not depend on them.
- One feature per session, small playable slices, play-test everything.
