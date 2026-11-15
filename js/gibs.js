// js/gibs.js — Фізичні уламки ворогів: політ по дузі з опором повітря, нерівні відскоки,
// кувиркання, ковзання з тертям і рваний мазок крові, що закінчується «шльопом» (ES Module)

import { CONFIG } from './config.js';
import { state } from './state.js';
import { BLOOD, bloodFor, paintGibSmear, paintGibSplat } from './gore.js';
import { makeRng, newSeed, lumpyBlob, rgba } from './goreBrush.js';

// Колір панцира (шматки тіла) за типом ворога
const SHELL_COLOR = { sprout: '#2b5d34', stalker: '#5c1a1a', dasher: '#b35a14', warden: '#4a1942' };
const TAU = Math.PI * 2;

export class Gib {
  constructor(x, y, vx, vy, options = {}) {
    this.x = x;
    this.y = y;
    this.z = 4 + Math.random() * 10;
    this.vx = vx;
    this.vy = vy;
    this.vz = options.vz !== undefined ? options.vz : 120 + Math.random() * 300;

    this.angle = Math.random() * TAU;                       // поворот у площині землі
    this.spin = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 12);
    this.tumble = Math.random() * TAU;                      // фаза перевороту через ребро (фейкове 3D)
    this.tumbleRate = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 14);
    this.curve = (Math.random() - 0.5) * 1.6;               // рад/с — мазок вигинається, а не йде по лінійці

    this.size = options.size || (4 + Math.random() * 6);
    this.color = options.color || '#48bb78';
    this.outline = options.outline || '#276749';
    this.shape = options.shape || 'chunk';
    this.type = options.type || 'slime';
    this.ink = options.ink !== undefined ? options.ink : 0.7 + Math.random() * 0.3;

    this.alive = true;
    this.sliding = false;
    this.bounces = 0;
    this.age = 0;
    this.smearX = x;
    this.smearY = y;
    this.smearDist = Math.random() * 100; // фаза «дихання» ширини мазка
  }

  // Фаза перевороту → видимий масштаб (1 = плазом, 0.35 = ребром до камери)
  get flip() {
    return 0.35 + 0.65 * Math.abs(Math.cos(this.tumble));
  }

  update(dt, decals) {
    if (!this.alive) return;
    const G = CONFIG.GIBS;
    this.age += dt;
    if (this.age > 8) { this.finish(decals); return; }

    if (!this.sliding) {
      const f = Math.exp(-G.airDrag * dt);
      this.vx *= f; this.vy *= f;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vz += G.gravity * dt;
      this.z += this.vz * dt;
      this.angle += this.spin * dt;
      this.tumble += this.tumbleRate * dt;
      if (this.z <= 0) this.land(decals);
      return;
    }

    // Ковзання: постійне тертя + в'язке; траєкторія злегка вигинається
    const speed = Math.hypot(this.vx, this.vy);
    const newSpeed = Math.max(0, speed - G.groundDecel * dt - speed * (1 - Math.exp(-G.groundDrag * dt)));
    if (newSpeed < 6) { this.finish(decals); return; }
    const turn = this.curve * dt;
    const c = Math.cos(turn), s = Math.sin(turn), k = newSpeed / speed;
    const vx = (this.vx * c - this.vy * s) * k, vy = (this.vx * s + this.vy * c) * k;
    this.vx = vx; this.vy = vy;
    this.x += vx * dt;
    this.y += vy * dt;

    if (this.shape === 'chunk') {
      // круглий шматок котиться: обертання прив'язане до швидкості
      const roll = newSpeed / Math.max(2, this.size);
      this.angle += roll * dt * Math.sign(this.spin);
      this.tumble += roll * dt * 0.6;
    } else {
      // пластина/скалка ковзає плазом і поступово перестає крутитись
      this.spin *= Math.exp(-5 * dt);
      this.angle += this.spin * dt;
      const flat = Math.round(this.tumble / Math.PI) * Math.PI;
      this.tumble += (flat - this.tumble) * Math.min(1, dt * 10);
    }

    const dx = this.x - this.smearX, dy = this.y - this.smearY;
    const d = Math.hypot(dx, dy);
    if (d >= G.smearStep) {
      // підстрибування на нерівностях: що менше крові, то частіше шматок мазка пропущено
      if (this.ink > 0.02 && Math.random() > (1 - this.ink) * 0.45) {
        paintGibSmear(decals, this.smearX, this.smearY, this.x, this.y, this.type, this.size * (0.75 + this.flip * 0.4), this.ink, this.smearDist);
      }
      this.ink = Math.max(0, this.ink - d * G.inkPerPx);
      this.smearDist += d;
      this.smearX = this.x; this.smearY = this.y;
    }
  }

  // Удар об землю: або нерівний відскок зі «шльопом», або перехід у ковзання
  land(decals) {
    const G = CONFIG.GIBS;
    this.z = 0;
    const impact = -this.vz;
    const heading = Math.atan2(this.vy, this.vx);
    const hSpeed = Math.hypot(this.vx, this.vy);
    if (this.bounces < G.maxBounces && impact > 110) {
      const power = Math.min(1.4, impact / 380);
      if (this.ink > 0.05) {
        paintGibSplat(decals, this.x, this.y, this.size * (0.45 + power * 0.4), heading, this.type, power * this.ink);
        this.ink = Math.max(0, this.ink - 0.1);
      }
      this.vz = impact * G.restitution * (0.75 + Math.random() * 0.5);
      // нерівна земля: відхилення курсу й втрата швидкості
      const a = heading + (Math.random() - 0.5) * 0.9;
      const sp = hSpeed * G.bounceKeep * (0.8 + Math.random() * 0.4);
      this.vx = Math.cos(a) * sp; this.vy = Math.sin(a) * sp;
      this.spin = (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 14);
      this.tumbleRate *= -(0.5 + Math.random() * 0.5);
      this.bounces++;
      return;
    }
    this.vz = 0;
    this.sliding = true;
    this.smearX = this.x; this.smearY = this.y;
    if (this.ink > 0.05) paintGibSplat(decals, this.x, this.y, this.size * 0.4, heading, this.type, 0.5 * this.ink);
  }

  // Кінець шляху: маленький «шльоп» там, де мазок обірвався, і сам шматок вростає в декалі
  finish(decals) {
    if (!this.alive) return;
    this.alive = false;
    if (decals && this.ink > 0.04) {
      paintGibSplat(decals, this.x, this.y, this.size * (0.3 + this.ink * 0.35), Math.atan2(this.vy, this.vx), this.type, 0.35 + this.ink * 0.4);
    }
    this.bakePermanentDecal(decals);
  }

  bakePermanentDecal(decals) {
    if (!decals) return;
    const seed = newSeed();
    const pal = BLOOD[this.type] || BLOOD.corrupt;
    decals.paintOnWorld(this.x, this.y, this.size * 1.6, (ctx, lx, ly) => {
      const rng = makeRng(seed);
      const stretch = this.shape === 'chunk' ? 1.1 : 1.5;
      ctx.fillStyle = this.outline;
      lumpyBlob(ctx, lx, ly, this.size * 0.72, rng, 0.45, stretch, this.angle);
      ctx.fillStyle = this.color;
      lumpyBlob(ctx, lx, ly, this.size * 0.48, rng, 0.45, stretch, this.angle);
      ctx.fillStyle = rgba(pal.bright, 0.35);
      lumpyBlob(ctx, lx - this.size * 0.15, ly - this.size * 0.18, this.size * 0.14, rng, 0.3);
    });
  }

  // Canvas-фолбек (коли PixiJS не стартував)
  render(ctx) {
    if (!this.alive) return;
    const shadowScale = Math.max(0.2, 1 - this.z / 90);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * shadowScale})`;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.size * shadowScale, this.size * 0.5 * shadowScale, 0, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.translate(this.x, this.y - this.z);
    ctx.rotate(this.angle);
    ctx.scale(1, this.flip);
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.outline;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (this.shape === 'shard') {
      ctx.moveTo(this.size * 1.4, 0);
      ctx.lineTo(-this.size * 0.8, -this.size * 0.6);
      ctx.lineTo(-this.size * 0.4, 0);
      ctx.lineTo(-this.size * 0.8, this.size * 0.6);
      ctx.closePath();
    } else if (this.shape === 'plate') {
      ctx.rect(-this.size * 0.7, -this.size * 0.5, this.size * 1.4, this.size);
    } else {
      ctx.arc(0, 0, this.size * 0.8, 0, TAU);
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export class GibManager {
  constructor() {
    this.gibs = [];
    this.maxGibs = CONFIG.GIBS.maxActive;
  }

  spawnForEnemy(enemy, sourceX, sourceY) {
    let fatalAngle = Math.random() * TAU;
    if (sourceX !== undefined && sourceY !== undefined) {
      fatalAngle = Math.atan2(enemy.y - sourceY, enemy.x - sourceX);
    }

    // Колір уламків = колір крові ворога (gore.js); темні шматки «тіла» + яскраві згустки
    const type = bloodFor(enemy);
    const pal = BLOOD[type];
    const shell = SHELL_COLOR[enemy.typeKey] || enemy.color;
    let count = 5, baseSpeed = 260, shape = 'chunk';
    if (enemy.typeKey === 'sprout') { count = 6; baseSpeed = 280; }
    else if (enemy.typeKey === 'stalker') { count = 9; baseSpeed = 310; shape = 'plate'; }
    else if (enemy.typeKey === 'dasher') { count = 7; baseSpeed = 380; shape = 'shard'; }
    else if (enemy.typeKey === 'warden') { count = 24; baseSpeed = 460; shape = 'plate'; }
    if (enemy.isElite) count += 4;
    count = Math.round(count * CONFIG.GIBS.countMult);

    for (let i = 0; i < count; i++) {
      if (this.gibs.length >= this.maxGibs) {
        const oldest = this.gibs.shift();
        oldest.bakePermanentDecal(state.decalManager);
      }
      const angle = fatalAngle + (Math.random() - 0.5) * 1.1;
      const speed = baseSpeed * (0.45 + Math.random() * 1.0);
      // Кожен третій — шматок панцира (менше крові на ньому), решта — згустки
      const isShell = i % 3 === 0;
      // частина летить низько й одразу ковзає, частина — високою дугою
      const vz = Math.random() < 0.3 ? 40 + Math.random() * 80 : 160 + Math.random() * 300;
      this.gibs.push(new Gib(enemy.x, enemy.y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
        size: enemy.radius * (isShell ? 0.3 : 0.24) + Math.random() * 3,
        color: isShell ? shell : pal.hex,
        outline: `rgb(${pal.dark.join(', ')})`,
        shape: isShell ? shape : 'chunk',
        ink: isShell ? 0.45 + Math.random() * 0.3 : 0.75 + Math.random() * 0.25,
        vz,
        type,
      }));
    }
  }

  update(dt, decalManager = state.decalManager) {
    for (let i = this.gibs.length - 1; i >= 0; i--) {
      const g = this.gibs[i];
      g.update(dt, decalManager);
      if (!g.alive) this.gibs.splice(i, 1);
    }
  }

  render(ctx) {
    for (let i = 0; i < this.gibs.length; i++) this.gibs[i].render(ctx);
  }

  clear() {
    this.gibs = [];
  }
}
