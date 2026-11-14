// js/world/terraform.js — Постійне тераформування: ділянки Хаба й Пурифаєра, їх стадії з сейву,
// вплив відновленої землі на геймплей (повільніші вороги, без спавну, без гнізд/руїн)

import { CONFIG, MetaProgression, saveMetaProgression } from '../config.js';
import { state, spawnShockwave } from '../state.js';
import { Telemetry } from '../telemetry.js';

// Стадія = індекс останнього пройденого порогу; -1 = ділянка ще не відновлена
function stageFor(siteCfg) {
  const value = MetaProgression.world[siteCfg.counter];
  let stage = -1;
  for (let i = 0; i < siteCfg.thresholds.length; i++) {
    if (value >= siteCfg.thresholds[i]) stage = i;
  }
  return stage;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Нерівний край ділянки: множник радіуса за кутом (сума синусоїд із фазами від seed).
// Без стадії — форма стабільна між стадіями й однакова щозабігу. Той самий край і малюється, і діє.
const EDGE_WAVES = [[3, 0.05], [5, 0.035], [9, 0.02], [15, 0.012]];
export const EDGE_MAX = 1 + EDGE_WAVES.reduce((sum, w) => sum + w[1], 0);
function makeEdge(seed) {
  const rnd = mulberry32(seed);
  const waves = EDGE_WAVES.map(([k, amp]) => ({ k, amp, ph: rnd() * Math.PI * 2 }));
  return (theta) => {
    let m = 1;
    for (let i = 0; i < waves.length; i++) m += waves[i].amp * Math.sin(waves[i].k * theta + waves[i].ph);
    return m;
  };
}

function anchorPos(anchor) {
  if (anchor === 'landmark') return CONFIG.WORLD.landmarkPos;
  return { x: 0, y: 0 };
}

export class TerraformSites {
  constructor() {
    this.sites = CONFIG.TERRAFORM.sites.map((cfg) => {
      const pos = anchorPos(cfg.anchor);
      const stage = stageFor(cfg);
      const radius = stage >= 0 ? cfg.radii[stage] : 0;
      return {
        id: cfg.id, label: cfg.label, seed: cfg.seed, cfg,
        edge: makeEdge(cfg.seed),
        x: pos.x, y: pos.y,
        stage, maxStage: cfg.thresholds.length - 1,
        radius,                 // поточний радіус для геймплею (одразу цільовий)
        displayFrom: radius,    // з якого радіуса анімуємо ріст
        growT: 1,               // 0..1 прогрес анімації
        stageAtRunStart: stage,
      };
    });
    this.toast = null; // { text, sub, life }
  }

  // Видимий радіус (під час розростання плавно збільшується)
  displayRadius(site) {
    const t = site.growT;
    const ease = 1 - (1 - t) * (1 - t);
    return site.displayFrom + (site.radius - site.displayFrom) * ease;
  }

  // Чи точка на відновленій землі (pad — додатковий відступ від краю)
  isReclaimed(x, y, pad = 0) {
    for (let i = 0; i < this.sites.length; i++) {
      const s = this.sites[i];
      if (s.radius <= 0) continue;
      const dx = x - s.x, dy = y - s.y;
      const dSq = dx * dx + dy * dy;
      const outer = s.radius * EDGE_MAX + pad;
      if (dSq >= outer * outer) continue; // дешеве відсікання до atan2/sin
      const r = s.radius * s.edge(Math.atan2(dy, dx)) + pad;
      if (dSq < r * r) return true;
    }
    return false;
  }

  enemySpeedMultAt(x, y) {
    return this.isReclaimed(x, y) ? CONFIG.TERRAFORM.enemySpeedMult : 1;
  }

  // Подія збільшила лічильник: зберігаємо сейв і, якщо пройдено поріг, розростаємо ділянку
  bumpCounter(counter) {
    MetaProgression.world[counter] = (MetaProgression.world[counter] || 0) + 1;
    saveMetaProgression();
    for (let i = 0; i < this.sites.length; i++) {
      const site = this.sites[i];
      if (site.cfg.counter !== counter) continue;
      const next = stageFor(site.cfg);
      if (next > site.stage) this.growSite(site, next);
    }
  }

  recordNestCleansed() { this.bumpCounter('nestsCleansed'); }
  recordPurifierRestored() { this.bumpCounter('purifierRestorations'); }

  growSite(site, stage) {
    site.displayFrom = site.radius > 0 ? this.displayRadius(site) : site.cfg.radii[0] * 0.25;
    site.stage = stage;
    site.radius = site.cfg.radii[stage];
    site.growT = 0;
    spawnShockwave(site.x, site.y, { radius: 40, maxRadius: site.radius + 160, color: '#68d391', speed: 520, lineWidth: 7 });
    if (state.camera) state.camera.addTrauma(0.3);
    this.toast = {
      text: `${site.label} GROUND RECLAIMED`,
      sub: `STAGE ${stage + 1}/${site.maxStage + 1} · RADIUS ${site.radius}`,
      life: CONFIG.TERRAFORM.toastSeconds,
    };
    Telemetry.recordEvent('TERRAFORM', `${site.label} reclaimed to stage ${stage + 1}`);
  }

  // Наступний поріг для підказок (Workshop, підсумок забігу)
  progressOf(site) {
    const t = site.cfg.thresholds;
    const value = MetaProgression.world[site.cfg.counter];
    const next = site.stage + 1 < t.length ? t[site.stage + 1] : null;
    return { value, next };
  }

  // Короткий підсумок для екрану кінця забігу
  summary() {
    return this.sites.map((s) => ({
      label: s.label, stage: s.stage + 1, maxStage: s.maxStage + 1,
      grew: s.stage - s.stageAtRunStart,
    }));
  }

  update(dt) {
    const grow = CONFIG.TERRAFORM.growSeconds;
    for (let i = 0; i < this.sites.length; i++) {
      const s = this.sites[i];
      if (s.growT < 1) s.growT = Math.min(1, s.growT + dt / grow);
    }
    if (this.toast) {
      this.toast.life -= dt;
      if (this.toast.life <= 0) this.toast = null;
    }
  }
}
