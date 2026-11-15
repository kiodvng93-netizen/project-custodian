// js/goreBrush.js — Пензлі для крові: нерівні плями, рвані смуги, мазки. Чиста математика Canvas 2D.
// Уся випадковість — через сід (mulberry32), щоб пляма, що зачіпає кілька чанків, малювалась однаково.

export const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;

export function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const newSeed = () => (Math.random() * 4294967296) >>> 0;

export function blob(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// Нерівна крапля: коло з «горбатим» краєм (8–11 вершин, квадратичні криві між серединами)
export function lumpyBlob(ctx, x, y, r, rng, roughness = 0.35, stretch = 1, angle = 0) {
  const n = 8 + Math.floor(rng() * 4);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng() * 0.3;
    const rr = r * (1 - roughness * 0.5 + rng() * roughness);
    const px = Math.cos(a) * rr * stretch, py = Math.sin(a) * rr;
    pts.push([x + px * Math.cos(angle) - py * Math.sin(angle), y + px * Math.sin(angle) + py * Math.cos(angle)]);
  }
  ctx.beginPath();
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i], m = mid(p, pts[(i + 1) % n]);
    ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  ctx.closePath();
  ctx.fill();
}

// Рвана смуга від удару: суцільна хвиляста стрічка, що звужується, з розривами і краплею на кінці.
// Два проходи (спершу всі темні краї, потім уся свіжа середина) — інакше кожен крок малює темний
// обідок поверх попереднього і смуга виглядає як намисто.
export function brokenStreak(ctx, x, y, angle, len, width, rng, dark, base, alpha = 0.8) {
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const nx = -sa, ny = ca;
  const steps = Math.max(5, Math.round(len / Math.max(1.5, width * 0.4)));
  const pts = [];
  let wobble = 0, vel = (rng() - 0.5) * 0.3, gapLeft = 0;
  const phase0 = rng() * Math.PI;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    vel += (rng() - 0.5) * 0.18;            // плавне блукання вбік, а не тремтіння
    wobble += vel * width * 0.35;
    if (gapLeft > 0) { gapLeft--; continue; }
    if (t > 0.3 && rng() < 0.008 + t * 0.03) { gapLeft = 2 + Math.floor(rng() * 4); continue; }
    const d = t * len;
    // перетяжки: стрічка то товщає (згусток), то тоншає
    const pinch = 0.6 + 0.55 * Math.abs(Math.sin(t * 9 + phase0));
    const w = width * (1 - t * 0.8) * pinch * (0.85 + rng() * 0.3);
    pts.push([x + ca * d + nx * wobble, y + sa * d + ny * wobble, w]);
  }
  // один шлях на прохід: еліпси (дешевше за нерівні краплі; нерівність дають перетяжки й блукання)
  ctx.fillStyle = rgba(dark, alpha * 0.8);
  ctx.beginPath();
  for (const [px, py, w] of pts) { ctx.moveTo(px + ca * w * 0.8, py + sa * w * 0.8); ctx.ellipse(px, py, w * 0.8, w * 0.6, angle, 0, Math.PI * 2); }
  ctx.fill();
  ctx.fillStyle = rgba(base, alpha);
  ctx.beginPath();
  for (const [px, py, w] of pts) { ctx.moveTo(px + ca * w * 0.48, py + sa * w * 0.48); ctx.ellipse(px, py, w * 0.48, w * 0.36, angle, 0, Math.PI * 2); }
  ctx.fill();
  // крапля на кінці + сателіти
  const ex = x + ca * len * (1.06 + rng() * 0.12) + nx * wobble, ey = y + sa * len * (1.06 + rng() * 0.12) + ny * wobble;
  ctx.fillStyle = rgba(dark, alpha * 0.9);
  lumpyBlob(ctx, ex, ey, width * (0.3 + rng() * 0.25), rng, 0.45);
  for (let k = 0, m = Math.floor(rng() * 2); k < m; k++) {
    const a = angle + (rng() - 0.5) * 1.2, d = width * (0.8 + rng() * 1.6);
    ctx.fillStyle = rgba(rng() < 0.5 ? dark : base, alpha * 0.8);
    blob(ctx, ex + Math.cos(a) * d, ey + Math.sin(a) * d, Math.max(0.8, width * (0.1 + rng() * 0.15)));
  }
}

const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0];

// Шматок мазка від уламка між двома точками. Один прохід змішаним кольором (без темних обідків),
// ширина «дихає» вздовж шляху (phase — відстань від початку), ink 0..1 — скільки крові лишилось:
// коли мало — мазок рветься на плями й подряпини.
export function smearSegment(ctx, x0, y0, x1, y1, width, ink, rng, pal, phase = 0) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const angle = Math.atan2(dy, dx);
  const n = Math.max(2, Math.round(len / Math.max(1.2, width * 0.3)));
  for (let i = 0; i < n; i++) {
    if (rng() > 0.25 + ink * 0.85) continue;
    const t = (i + rng()) / n;
    const along = phase + len * t;
    const breathe = 0.65 + 0.35 * Math.sin(along * 0.11) * Math.sin(along * 0.037 + 1.3);
    const side = (rng() - 0.5) * width * 0.35;
    const px = x0 + dx * t + nx * side, py = y0 + dy * t + ny * side;
    const w = width * (0.35 + ink * 0.65) * breathe * (0.75 + rng() * 0.5);
    ctx.fillStyle = rgba(mix(pal.dark, pal.base, (0.2 + 0.5 * ink) * rng()), (0.3 + 0.4 * ink) * (0.75 + rng() * 0.25));
    lumpyBlob(ctx, px, py, w * 0.5, rng, 0.5, 1.7, angle + (rng() - 0.5) * 0.3);
  }
  // подряпини-риски вздовж руху: краї уламка дряпають кров
  const scratches = rng() < 0.7 ? 1 + Math.floor(rng() * 2) : 0;
  ctx.lineCap = 'round';
  for (let k = 0; k < scratches; k++) {
    ctx.strokeStyle = rgba(pal.dark, 0.25 + 0.35 * ink);
    ctx.lineWidth = Math.max(0.6, width * (0.06 + rng() * 0.08));
    const off = (rng() - 0.5) * width * 0.9;
    const a = rng() * 0.3, b = 0.7 + rng() * 0.3;
    ctx.beginPath();
    ctx.moveTo(x0 + dx * a + nx * off, y0 + dy * a + ny * off);
    ctx.lineTo(x0 + dx * b + nx * (off + (rng() - 0.5) * 1.5), y0 + dy * b + ny * (off + (rng() - 0.5) * 1.5));
    ctx.stroke();
  }
}

// Невеликий «шльоп»: нерівна калюжка + бризки в напрямку руху (удар об землю чи кінець мазка)
export function smallSplat(ctx, x, y, r, angle, rng, pal, power = 1) {
  ctx.fillStyle = rgba(pal.dark, 0.8);
  lumpyBlob(ctx, x, y, r, rng, 0.55, 1.25, angle);
  ctx.fillStyle = rgba(pal.base, 0.82);
  lumpyBlob(ctx, x + Math.cos(angle) * r * 0.15, y + Math.sin(angle) * r * 0.15, r * 0.62, rng, 0.5, 1.2, angle);
  const drops = Math.round(1 + rng() * 2.5 * power);
  for (let i = 0; i < drops; i++) {
    const a = angle + (rng() - 0.5) * 2.2, d = r * (1.1 + rng() * 1.6 * power);
    ctx.fillStyle = rgba(rng() < 0.4 ? pal.dark : pal.base, 0.6 + rng() * 0.3);
    blob(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, Math.max(0.7, r * (0.08 + rng() * 0.16)));
  }
  if (rng() < 0.6) {
    ctx.fillStyle = rgba(pal.bright, 0.45);
    blob(ctx, x - r * 0.2, y - r * 0.25, Math.max(0.6, r * 0.14));
  }
}
