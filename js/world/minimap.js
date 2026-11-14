// js/world/minimap.js — Тактичний радар-мінікарта Кільця 1 (зліва)

import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { getRunObjective } from './objective.js';

export function renderRadarMinimap(ctx, worldManager, player) {
  const r = 72;
  const cx = r + 18;
  const cy = r + 82;
  const playerDist = Math.hypot(player.x, player.y);
  const ring1 = CONFIG.WORLD.ring1Radius;
  const worldRadius = Math.max(ring1, playerDist * 1.12);
  const scale = (r - 6) / worldRadius;

  ctx.save();

  // Фон радара
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10, 16, 28, 0.80)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.50)';
  ctx.stroke();
  ctx.clip();

  // Сітка та межа Кільця 1
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
  ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(56, 178, 172, 0.35)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, ring1 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Відновлена земля (постійне тераформування)
  const tf = worldManager.terraform;
  ctx.fillStyle = 'rgba(104, 211, 145, 0.45)';
  for (let i = 0; i < tf.sites.length; i++) {
    const s = tf.sites[i];
    if (s.radius <= 0) continue;
    ctx.beginPath();
    ctx.arc(cx + s.x * scale, cy + s.y * scale, Math.max(3.5, tf.displayRadius(s) * scale), 0, Math.PI * 2);
    ctx.fill();
  }

  // Локальний радіус сканера навколо гравця (для скринь)
  const px = cx + player.x * scale;
  const py = cy + player.y * scale;
  const scanWorldR = 4500;
  ctx.strokeStyle = 'rgba(236, 201, 75, 0.16)';
  ctx.beginPath();
  ctx.arc(px, py, scanWorldR * scale, 0, Math.PI * 2);
  ctx.stroke();

  // Хаб (0, 0)
  const hubBroken = worldManager.sanctuary && worldManager.sanctuary.domeBroken;
  ctx.fillStyle = hubBroken ? 'rgba(229, 62, 62, 0.30)' : 'rgba(72, 187, 120, 0.25)';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hubBroken ? '#e53e3e' : '#48bb78';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Закриті скрині поблизу
  const scanSq = scanWorldR * scanWorldR;
  for (let i = 0; i < worldManager.chests.length; i++) {
    const c = worldManager.chests[i];
    if (c.opened) continue;
    const dx = c.x - player.x, dy = c.y - player.y;
    if (dx * dx + dy * dy <= scanSq) {
      ctx.fillStyle = '#f6e05e';
      ctx.fillRect(cx + c.x * scale - 1.5, cy + c.y * scale - 1.5, 3, 3);
    }
  }

  // Польові Аутпости страхування
  if (worldManager.outposts) {
    for (let i = 0; i < worldManager.outposts.length; i++) {
      const o = worldManager.outposts[i];
      const ox = cx + o.x * scale;
      const oy = cy + o.y * scale;
      ctx.fillStyle = o.state === 'secured' ? '#48bb78' : o.state === 'active' ? '#ecc94b' : '#63b3ed';
      ctx.fillRect(ox - 2.5, oy - 2.5, 5, 5);
      if (o.state === 'idle') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(ox - 2.5, oy - 2.5, 5, 5);
      }
    }
  }

  // Заражені Гнізда
  ctx.fillStyle = '#fc8181';
  for (let i = 0; i < worldManager.nests.length; i++) {
    const n = worldManager.nests[i];
    if (!n.alive) continue;
    ctx.beginPath();
    ctx.arc(cx + n.x * scale, cy + n.y * scale, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Монумент / Очищувач
  const lm = worldManager.landmark;
  if (lm) {
    const lx = cx + lm.x * scale;
    const ly = cy + lm.y * scale;
    if (lm.repaired) {
      ctx.fillStyle = 'rgba(72, 187, 120, 0.25)';
      ctx.beginPath();
      ctx.arc(lx, ly, Math.max(4, CONFIG.WORLD.terraformedRadius * scale), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = lm.repaired ? '#68d391' : '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(lx, ly - 4.5); ctx.lineTo(lx + 4.5, ly);
    ctx.lineTo(lx, ly + 4.5); ctx.lineTo(lx - 4.5, ly);
    ctx.closePath();
    ctx.fill();
  }

  // Бос Hive Warden
  const warden = state.enemyManager ? state.enemyManager.enemies.find(e => e.typeKey === 'warden' && !e.isTitan && e.alive) : null;
  if (warden) {
    const wx = cx + warden.x * scale;
    const wy = cy + warden.y * scale;
    ctx.fillStyle = '#f687b3';
    ctx.beginPath();
    ctx.moveTo(wx, wy - 5); ctx.lineTo(wx + 5, wy);
    ctx.lineTo(wx, wy + 5); ctx.lineTo(wx - 5, wy);
    ctx.closePath();
    ctx.fill();
  }

  // Випавше Ядро
  if (worldManager.coreDrop && worldManager.coreDrop.alive) {
    const kx = cx + worldManager.coreDrop.x * scale;
    const ky = cy + worldManager.coreDrop.y * scale;
    ctx.fillStyle = '#ecc94b';
    ctx.fillRect(kx - 3.5, ky - 3.5, 7, 7);
  }

  // Гравець (стрілка за напрямом руху)
  if (player.carryingCore) {
    ctx.strokeStyle = '#ecc94b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 6.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(player.facingAngle);
  ctx.fillStyle = '#63b3ed';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(6, 0); ctx.lineTo(-4, -3.8); ctx.lineTo(-2, 0); ctx.lineTo(-4, 3.8);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();

  ctx.restore();

  // Підпис під радаром
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#cbd5e0';
  ctx.fillText(`R1:${Math.round(ring1 / 1000)}km | NESTS:${worldManager.nests.length}`, cx, cy + r + 14);

  const objective = getRunObjective(worldManager, state.enemyManager, player);
  if (objective) {
    ctx.fillStyle = objective.color;
    ctx.fillText(objective.text, cx, cy + r + 27);
  }
  ctx.restore();
}