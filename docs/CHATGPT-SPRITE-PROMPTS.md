# Промпти ChatGPT для нових спрайтів (вороги + уламки)

Мета: перегенерувати листи 4 ворогів так, щоб кожна анімація була окремою картинкою з рівною сіткою,
і додати лист уламків (гібсів). Промпти англійською (так ChatGPT точніше), пояснення — українською.

## 0. Як це працює і чому саме так

**Фон — суцільний маджента `#FF00FF`, а не прозорість.** Дослідження (листопад 2026):
- У застосунку ChatGPT (особливо безкоштовному) справжня прозорість ненадійна: той самий промпт дає то прозорий PNG, то білий фон, то **намальовану** «шахівницю». Параметр `background: transparent` є лише в API.
- Білий фон, як у поточних листах, з'їдає світлі пікселі персонажа (кістяні кігті, крила Dasher) і лишає ореол.
- Маджента не трапляється в жодному ворогові, тож її можна чисто вирізати кодом. Ключування маджента в `js/sprites.js` додам окремо, коли будуть нові листи.

**Одна анімація = одна картинка.** Цілий лист 6×8 за раз ChatGPT малює з плаванням пропорцій і злиплими кадрами. Коротка серія з 6 кадрів в одній картинці тримає персонажа стабільним (рекомендація з усіх джерел: вся серія — в одному запиті, а не кадр за кадром).

**Формат кожної картинки: 1536×1024, сітка 3 колонки × 2 ряди, клітинка 512×512.** Це рідний розмір ChatGPT (альбомна орієнтація), тож нічого не обрізається. Кадри читаються зліва направо, зверху вниз (1-2-3 / 4-5-6). Код нарізає за вмістом (`js/spriteSlicer.js`), тож точні до пікселя межі не обов'язкові, але **персонаж не має виходити за свою клітинку**.

**Напрямки: малюємо лише 5 (S, SE, E, NE, N).** W, SW, NW код отримує дзеркалом. Напрямок у промпті описано через екран («обличчям до нижнього правого кута»), бо слова «схід/південь» модель плутає.

## 1. Порядок роботи (важливо для однаковості)

1. **Один чат на одного ворога.** Нові чати для кожного ворога; усі його анімації — в тому самому чаті, по черзі.
2. **Перше повідомлення — налаштування** (блок «Setup» нижче) **з прикріпленим поточним листом** (`assets/sprites/enemy_sprout.png` тощо). Модель відповідає «Ready» без картинки.
3. Далі — промпти по одному. Після кожної картинки перевір (п. 4). Якщо добре — наступний промпт.
4. **Перевірка кожної картинки:**
   - Завантажуй кнопкою Download (не скріншот). Розмір має бути 1536×1024.
   - Фон суцільний маджента, без градієнта, без тіні під персонажем, без підлоги.
   - Рівно 6 кадрів (або скільки просили), без цифр, підписів, ліній сітки.
   - Персонаж той самий, що на референсі: кольори, кількість ніг/очей, пропорції.
   - Напрямок правильний (порівняй із попередньою картинкою).
5. **Якщо щось не так** — у тому ж чаті одна з фраз «Ремонт» (п. 7). Не пиши новий довгий промпт.
6. **Якщо персонаж «поплив»** після кількох картинок — прикріпи найкращу попередню картинку цього ворога і напиши: `Use the attached image as the exact character reference from now on.`
7. Зберігай у `assets/sprites/new/` з іменами з таблиць нижче (`sprout_walk_se.png` тощо).

## 2. Спільний блок правил (вже вбудований у кожен Setup)

Нижче він у кожному Setup. Окремо його вставляти не треба — він тут для довідки, якщо захочеш щось змінити.

```
RULES FOR EVERY IMAGE IN THIS CHAT:
- Canvas exactly 1536x1024 pixels, landscape.
- Background: one flat solid color, pure magenta #FF00FF, edge to edge. No gradient, no texture, no vignette, no checkerboard, no floor, no ground shadow, no drop shadow.
- Never use magenta or pink anywhere on the character.
- Layout: invisible grid of 3 columns x 2 rows, each cell 512x512. One frame per cell, read left to right, top to bottom. The character is centered in its cell and never crosses into another cell. Leave magenta margin around it.
- Same character size, same scale, same feet position in every frame (feet near the bottom of the cell, about 40 px above the cell's bottom edge).
- Camera: top-down three-quarter view (about 45 degrees from above), same as the reference sheet.
- Style: detailed 16-bit pixel art, crisp hard pixel edges, dark outline, same palette and shading as the reference. No anti-aliased blur into the background, no glow halo spilling onto the background.
- No text, no numbers, no labels, no grid lines, no borders, no UI.
```

## 3. Sprout (`enemy_sprout.png`) — кров зелена

### Setup (перше повідомлення, прикріпи `assets/sprites/enemy_sprout.png`)
```
I am making sprites for a top-down game. The attached image is the current sprite sheet of an enemy called "Corrupted Sprout". In this chat you will draw new animation strips of this exact same creature, one strip per message. Do not generate an image now, just reply "Ready".

CHARACTER (copy the attached design exactly): small spider-like beetle. Big glowing lime-green segmented abdomen on its back, dark purple-black armored thorax and head, a cluster of four glowing red eyes, eight curved bone-tan clawed legs, green slime drooling from the mouth. Its blood is bright slime green.

RULES FOR EVERY IMAGE IN THIS CHAT:
- Canvas exactly 1536x1024 pixels, landscape.
- Background: one flat solid color, pure magenta #FF00FF, edge to edge. No gradient, no texture, no vignette, no checkerboard, no floor, no ground shadow, no drop shadow.
- Never use magenta or pink anywhere on the character.
- Layout: invisible grid of 3 columns x 2 rows, each cell 512x512. One frame per cell, read left to right, top to bottom. The character is centered in its cell and never crosses into another cell. Leave magenta margin around it.
- Same character size, same scale, same feet position in every frame (feet near the bottom of the cell, about 40 px above the cell's bottom edge).
- Camera: top-down three-quarter view (about 45 degrees from above), same as the reference sheet.
- Style: detailed 16-bit pixel art, crisp hard pixel edges, dark outline, same palette and shading as the reference. No anti-aliased blur into the background, no glow halo spilling onto the background.
- No text, no numbers, no labels, no grid lines, no borders, no UI.
```

### Промпти
| # | Файл | Промпт |
|---|---|---|
| 1 | `sprout_idle.png` | `Strip 1: IDLE loop, 6 frames. The Sprout faces the viewer (toward the bottom of the image). It stands in place: the abdomen pulses with light, legs shift slightly, slime drips. Frame 6 must loop back smoothly to frame 1. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 2 | `sprout_walk_s.png` | `Strip 2: WALK cycle, 6 frames, facing the viewer (walking toward the bottom of the image). Alternate leg pairs like a real spider gait, small body bob. Seamless loop. Same size and scale as strip 1. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 3 | `sprout_walk_se.png` | `Strip 3: WALK cycle, 6 frames, facing diagonally toward the bottom-right corner of the image (toward the viewer and to the viewer's right). We see its face and its left side. Seamless loop, same size as before. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 4 | `sprout_walk_e.png` | `Strip 4: WALK cycle, 6 frames, side view facing right (walking toward the right edge of the image). We see its left side in profile, head on the right. Seamless loop, same size as before. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 5 | `sprout_walk_ne.png` | `Strip 5: WALK cycle, 6 frames, facing diagonally toward the top-right corner of the image (away from the viewer and to the right). We see its back, the glowing abdomen, and part of its left side; the face is hidden. Seamless loop, same size as before. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 6 | `sprout_walk_n.png` | `Strip 6: WALK cycle, 6 frames, facing away from the viewer (walking toward the top of the image). We see only its back and the glowing abdomen, no face. Seamless loop, same size as before. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 7 | `sprout_attack.png` | `Strip 7: ATTACK, 6 frames, facing the viewer. 1-2: rears back and opens its jaws. 3-4: spits a short burst of green acid straight down (keep the spit inside the cell). 5-6: recovers to the idle pose. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 8 | `sprout_hit_death.png` | `Strip 8: HIT and DEATH, 6 frames, facing the viewer. 1: flinch recoil (squashed, leaning back). 2: back to normal. 3-4: it bursts apart with green slime. 5 and 6: two different flat piles of remains lying on the ground (broken legs, shell pieces, green slime puddle), seen from above. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |

## 4. Stalker (`enemy_stalker.png`) — кров червона

### Setup (прикріпи `assets/sprites/enemy_stalker.png`)
```
I am making sprites for a top-down game. The attached image is the current sprite sheet of an enemy called "Thorn Stalker". In this chat you will draw new animation strips of this exact same creature, one strip per message. Do not generate an image now, just reply "Ready".

CHARACTER (copy the attached design exactly): heavy crab-like armored predator. Dark red and black plated carapace with spikes along the back, a pale bone-white skull-like face mask, glowing orange eyes, two huge curved bone-tan scythe claws in front, several shorter clawed legs. Its blood is dark red.

RULES FOR EVERY IMAGE IN THIS CHAT:
- Canvas exactly 1536x1024 pixels, landscape.
- Background: one flat solid color, pure magenta #FF00FF, edge to edge. No gradient, no texture, no vignette, no checkerboard, no floor, no ground shadow, no drop shadow.
- Never use magenta or pink anywhere on the character.
- Layout: invisible grid of 3 columns x 2 rows, each cell 512x512. One frame per cell, read left to right, top to bottom. The character is centered in its cell and never crosses into another cell. Leave magenta margin around it.
- Same character size, same scale, same feet position in every frame (feet near the bottom of the cell, about 40 px above the cell's bottom edge).
- Camera: top-down three-quarter view (about 45 degrees from above), same as the reference sheet.
- Style: detailed 16-bit pixel art, crisp hard pixel edges, dark outline, same palette and shading as the reference. No anti-aliased blur into the background, no glow halo spilling onto the background.
- No text, no numbers, no labels, no grid lines, no borders, no UI.
```

### Промпти
| # | Файл | Промпт |
|---|---|---|
| 1 | `stalker_idle.png` | `Strip 1: IDLE loop, 6 frames. The Stalker faces the viewer (toward the bottom of the image), crouched and breathing, claws twitching. Frame 6 loops back to frame 1. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 2 | `stalker_walk_s.png` | `Strip 2: WALK cycle, 6 frames, facing the viewer (walking toward the bottom of the image). Heavy stalking gait, claws held forward, small body bob. Seamless loop, same size as strip 1. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 3 | `stalker_walk_se.png` | `Strip 3: WALK cycle, 6 frames, facing diagonally toward the bottom-right corner of the image (toward the viewer and to the viewer's right). We see the mask and its left side. Seamless loop, same size. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 4 | `stalker_walk_e.png` | `Strip 4: WALK cycle, 6 frames, side view facing right (walking toward the right edge of the image), head and claws on the right. Seamless loop, same size. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 5 | `stalker_walk_ne.png` | `Strip 5: WALK cycle, 6 frames, facing diagonally toward the top-right corner of the image (away from the viewer and to the right). We see its spiked back and part of its left side, mask hidden. Seamless loop, same size. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 6 | `stalker_walk_n.png` | `Strip 6: WALK cycle, 6 frames, facing away from the viewer (walking toward the top of the image). Only the spiked armored back is visible. Seamless loop, same size. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 7 | `stalker_attack.png` | `Strip 7: LUNGE ATTACK, 6 frames, facing the viewer. 1-2: crouches low and raises both scythe claws (wind-up). 3-4: lunges forward and slashes down with both claws, a short motion arc that stays inside the cell. 5-6: recovers to stance. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 8 | `stalker_hit_death.png` | `Strip 8: HIT and DEATH, 6 frames, facing the viewer. 1: flinch recoil. 2: back to normal. 3-4: armor cracks and it collapses spraying dark red blood. 5 and 6: two different flat piles of remains on the ground (cracked plates, claws, the bone mask, dark red blood pool), seen from above. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |

## 5. Dasher (`enemy_dasher.png`) — кров синя

> Крила напівпрозорі. На маджента вони змішаються з фоном і стануть рожевими — тому в промптах просимо **непрозорі** сіро-димчасті крила з темними жилками.
> У поточному листі смерть Dasher зелена, а кров у грі синя — у нових кадрах просимо синю.

### Setup (прикріпи `assets/sprites/enemy_dasher.png`)
```
I am making sprites for a top-down game. The attached image is the current sprite sheet of an enemy called "Spore Dasher". In this chat you will draw new animation strips of this exact same creature, one strip per message. Do not generate an image now, just reply "Ready".

CHARACTER (copy the attached design exactly, with two changes): fast flying wasp-like insect. Black spiky body, big glowing red compound eyes, thin clawed legs, a lime-green segmented stinger tail curving under the body. CHANGE 1: wings are opaque smoky grey with dark veins, NOT see-through. CHANGE 2: its blood is bright blue, not green.

RULES FOR EVERY IMAGE IN THIS CHAT:
- Canvas exactly 1536x1024 pixels, landscape.
- Background: one flat solid color, pure magenta #FF00FF, edge to edge. No gradient, no texture, no vignette, no checkerboard, no floor, no ground shadow, no drop shadow.
- Never use magenta or pink anywhere on the character. Wings must be opaque, never transparent.
- Layout: invisible grid of 3 columns x 2 rows, each cell 512x512. One frame per cell, read left to right, top to bottom. The character is centered in its cell and never crosses into another cell. Leave magenta margin around it, including wing tips.
- Same character size, same scale, same body position in every frame (it hovers; body center in the middle of the cell).
- Camera: top-down three-quarter view (about 45 degrees from above), same as the reference sheet.
- Style: detailed 16-bit pixel art, crisp hard pixel edges, dark outline, same palette and shading as the reference. No motion blur, no speed lines, no glow halo spilling onto the background.
- No text, no numbers, no labels, no grid lines, no borders, no UI.
```

### Промпти
| # | Файл | Промпт |
|---|---|---|
| 1 | `dasher_fly_s.png` | `Strip 1: HOVER/FLY loop, 6 frames, facing the viewer (flying toward the bottom of the image). Wing-beat cycle: wings up, mid, down, mid, up. Tail sways slightly. Seamless loop. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background, opaque wings.` |
| 2 | `dasher_fly_se.png` | `Strip 2: FLY loop, 6 frames, facing diagonally toward the bottom-right corner of the image (toward the viewer and to the viewer's right). Same wing-beat cycle and size as strip 1. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background, opaque wings.` |
| 3 | `dasher_fly_e.png` | `Strip 3: FLY loop, 6 frames, side view facing right (flying toward the right edge of the image), head on the right, stinger trailing left. Same wing-beat cycle and size. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background, opaque wings.` |
| 4 | `dasher_fly_ne.png` | `Strip 4: FLY loop, 6 frames, facing diagonally toward the top-right corner of the image (away from the viewer and to the right). We see its back and wings from behind, eyes hidden. Same cycle and size. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background, opaque wings.` |
| 5 | `dasher_fly_n.png` | `Strip 5: FLY loop, 6 frames, facing away from the viewer (flying toward the top of the image). Back view: wings, back, stinger. Same cycle and size. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background, opaque wings.` |
| 6 | `dasher_attack.png` | `Strip 6: STING DIVE, 6 frames, facing the viewer. 1-2: pulls back, stinger curls forward. 3-4: dives forward and stabs down with the stinger (keep inside the cell). 5-6: pulls back to hover. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background, opaque wings.` |
| 7 | `dasher_hit_death.png` | `Strip 7: HIT and DEATH, 6 frames, facing the viewer. 1: flinch, wings jolted. 2: back to normal. 3-4: it bursts with bright blue blood, wings tearing. 5 and 6: two different flat piles of remains on the ground (torn wings, black shell bits, green stinger, bright blue blood pool), seen from above. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |

## 6. Warden (`boss_warden.png`) — кров фіолетова

> Бос великий: просимо, щоб він займав більшу частину клітинки, але не торкався її країв.
> Зелене сяйво ядра — тільки всередині силуету, без ореолу на фоні.

### Setup (прикріпи `assets/sprites/boss_warden.png`)
```
I am making sprites for a top-down game. The attached image is the current sprite sheet of a boss called "Hive Warden". In this chat you will draw new animation strips of this exact same creature, one strip per message. Do not generate an image now, just reply "Ready".

CHARACTER (copy the attached design exactly): huge hulking bio-mechanical golem. Dark gunmetal armor plates fused with tan bone claws, purple-black spines on the head and back, shoulder missile pods with lime-green lights, smoke vents, a glowing cyan-green core in the chest, massive clawed arms and legs. Its blood is purple. The boss fills most of its cell but never touches the cell edges.

RULES FOR EVERY IMAGE IN THIS CHAT:
- Canvas exactly 1536x1024 pixels, landscape.
- Background: one flat solid color, pure magenta #FF00FF, edge to edge. No gradient, no texture, no vignette, no checkerboard, no floor, no ground shadow, no drop shadow.
- Never use magenta or pink anywhere on the character.
- Layout: invisible grid of 3 columns x 2 rows, each cell 512x512. One frame per cell, read left to right, top to bottom. The character is centered in its cell and never crosses into another cell. Leave magenta margin around it.
- Same character size, same scale, same feet position in every frame (feet near the bottom of the cell, about 30 px above the cell's bottom edge).
- Camera: top-down three-quarter view (about 45 degrees from above), same as the reference sheet.
- Style: detailed 16-bit pixel art, crisp hard pixel edges, dark outline, same palette and shading as the reference. Glows stay inside the character silhouette: no glow halo, smoke or sparks spilling onto the background.
- No text, no numbers, no labels, no grid lines, no borders, no UI.
```

### Промпти
| # | Файл | Промпт |
|---|---|---|
| 1 | `warden_idle.png` | `Strip 1: DORMANT IDLE loop, 6 frames, facing the viewer. It stands still, slow heavy breathing, the chest core pulses dim to bright, vents puff tiny smoke kept inside the silhouette. Seamless loop. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 2 | `warden_walk_s.png` | `Strip 2: WALK cycle, 6 frames, facing the viewer (walking toward the bottom of the image). Heavy stomping steps, shoulders sway. Seamless loop, same size as strip 1. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 3 | `warden_walk_se.png` | `Strip 3: WALK cycle, 6 frames, facing diagonally toward the bottom-right corner of the image (toward the viewer and to the viewer's right). We see the core and its left side. Seamless loop, same size. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 4 | `warden_walk_e.png` | `Strip 4: WALK cycle, 6 frames, side view facing right (walking toward the right edge of the image). Seamless loop, same size. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 5 | `warden_walk_ne.png` | `Strip 5: WALK cycle, 6 frames, facing diagonally toward the top-right corner of the image (away from the viewer and to the right). We see its spined back, missile pods and part of its left side; the core is hidden. Seamless loop, same size. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 6 | `warden_walk_n.png` | `Strip 6: WALK cycle, 6 frames, facing away from the viewer (walking toward the top of the image). Back view only. Seamless loop, same size. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 7 | `warden_charge.png` | `Strip 7: CHARGE ATTACK, 6 frames, facing the viewer. 1-3: wind-up: it plants its feet, leans forward, the chest core grows brighter each frame. 4-5: it rams forward, body low, claws out (no beam, no effects outside the body). 6: recovers. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |
| 8 | `warden_hit_death.png` | `Strip 8: HIT and DEATH, 6 frames, facing the viewer. 1: flinch recoil. 2: back to normal. 3-4: the core cracks and it collapses, armor breaking, purple blood. 5 and 6: two different flat heaps of wreckage on the ground (armor plates, claws, dead dark core, purple blood pool), seen from above. Follow all chat rules: 1536x1024, 3x2 grid, flat #FF00FF background.` |

## 7. Уламки (гібси) — один новий чат

Формат інший: **1024×1024, сітка 4×4, клітинка 256×256**, вид строго зверху. Один промпт на тип ворога (4 картинки). Прикріпи лист відповідного ворога до кожного промпту, щоб кольори збігались.

### Setup (без вкладення)
```
I am making small gore chunk sprites ("gibs") for a top-down game. In this chat you will draw one sheet per message. Do not generate an image now, just reply "Ready".

RULES FOR EVERY IMAGE IN THIS CHAT:
- Canvas exactly 1024x1024 pixels, square.
- Background: one flat solid color, pure magenta #FF00FF, edge to edge. No gradient, no texture, no checkerboard, no floor, no shadow.
- Never use magenta or pink on the chunks.
- Layout: invisible grid of 4 columns x 4 rows, each cell 256x256. Exactly one chunk per cell, centered, about 120-180 px across, never crossing into another cell.
- View: strictly from directly above (flat, like objects lying on the ground).
- Style: detailed 16-bit pixel art, crisp hard pixel edges, dark outline, wet glossy highlights.
- No text, no numbers, no grid lines, no borders.
```

### Промпти (до кожного прикріпи лист цього ворога)
| # | Файл | Промпт |
|---|---|---|
| 1 | `gibs_sprout.png` | `Sheet 1: gore chunks of the attached creature (Sprout). 16 different pieces: cells 1-6 dark purple-black shell fragments, cells 7-10 broken bone-tan clawed legs, cells 11-14 lumps of glowing lime-green abdomen flesh dripping green slime, cells 15-16 a red eye and a small fang. Blood and slime are bright green. Follow all chat rules: 1024x1024, 4x4 grid, flat #FF00FF background, top-down view.` |
| 2 | `gibs_stalker.png` | `Sheet 2: gore chunks of the attached creature (Stalker). 16 different pieces: cells 1-6 cracked dark red and black armor plates with spikes, cells 7-10 broken bone-tan scythe claws and legs, cells 11-14 raw meat lumps with dark red blood, cells 15-16 a shard of the bone-white mask and an orange eye. Blood is dark red. Follow all chat rules: 1024x1024, 4x4 grid, flat #FF00FF background, top-down view.` |
| 3 | `gibs_dasher.png` | `Sheet 3: gore chunks of the attached creature (Dasher). 16 different pieces: cells 1-5 torn opaque smoky grey wing pieces with dark veins, cells 6-9 black spiky shell bits, cells 10-12 lime-green stinger segments, cells 13-14 thin broken legs, cells 15-16 a red compound eye and a gob of bright blue blood. Blood is bright blue. Follow all chat rules: 1024x1024, 4x4 grid, flat #FF00FF background, top-down view.` |
| 4 | `gibs_warden.png` | `Sheet 4: gore chunks of the attached boss (Warden). 16 different pieces: cells 1-6 bent dark gunmetal armor plates, cells 7-9 bone-tan claws, cells 10-11 purple-black spines, cells 12-13 broken missile pod pieces with dead green lights, cell 14 a cracked dark core shard, cells 15-16 lumps of flesh with purple blood. Blood is purple. Follow all chat rules: 1024x1024, 4x4 grid, flat #FF00FF background, top-down view.` |

## 8. Ремонт: короткі фрази, коли результат не той

Писати в тому ж чаті:

| Проблема | Фраза |
|---|---|
| Білий/сірий/шаховий фон | `Redo the same image, but the background must be flat solid pure magenta #FF00FF everywhere, no checkerboard, no white.` |
| Тінь або підлога під персонажем | `Redo the same image without any shadow or ground under the character. Only flat #FF00FF behind it.` |
| Кадри злиплися / вилазять за клітинку | `Redo the same image. Each frame must stay fully inside its own 512x512 cell with magenta margin; nothing may cross between cells.` |
| Не 6 кадрів / є цифри чи підписи | `Redo with exactly 6 frames in a 3x2 grid, and no text, numbers, labels or grid lines.` |
| Розмір персонажа скаче між кадрами | `Redo the same image. The character must be the same size and scale in all 6 frames, feet at the same height.` |
| Персонаж змінився (кольори, ноги, очі) | Прикріпи найкращу попередню картинку: `This attached image is the exact character. Redo the last strip matching it exactly.` |
| Неправильний напрямок | `Wrong direction. Redo the same strip with the character facing <toward the bottom-right corner / right edge / top-right corner / top> of the image.` |
| Розмір не 1536×1024 | `Redo at exactly 1536x1024 landscape, 3 columns x 2 rows of 512x512 cells.` |

## 9. Що буде в коді, коли листи готові

- Ключування маджента (`#FF00FF` і близькі до нього рожеві пікселі на краях) у `js/sprites.js` замість білого.
- Новий маніфест: окремий файл на анімацію (`sprout_walk_se.png` …), W/SW/NW — дзеркало E/SE/NE.
- `js/render/enemyAnim.js`: ходьба в усіх 8 напрямках анімована (зараз анімована лише «до камери»), окремий кадр удару, нові кадри смерті/купи решток.
- Уламки: `js/render/pixiEntities.js` малює кадри `gibs_*.png` замість кіл/квадратів/трикутників; кувиркання й мазки лишаються.
