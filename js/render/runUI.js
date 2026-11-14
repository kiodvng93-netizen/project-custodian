// js/render/runUI.js — HUD цілі забігу: стрілка до цілі, панель евакуації, екран підсумку

import { CONFIG, MetaProgression } from '../config.js';

// Стрілка біля краю екрана, коли ціль поза кадром
export function renderObjectiveArrow(ctx, canvas, camera, objective) {
  if (!objective || !objective.target) return;
  const sx = objective.target.x - camera.x + canvas.width / 2;
  const sy = objective.target.y - camera.y + canvas.height / 2;
  // Рамка для стрілки: над панеллю зброї внизу та під XP-баром угорі
  const left = 56, right = canvas.width - 56, top = 70, bottom = canvas.height - 120;
  if (sx > left && sx < right && sy > top && sy < bottom) return;

  const cx = canvas.width / 2, cy = canvas.height / 2;
  const angle = Math.atan2(sy - cy, sx - cx);
  const dx = Math.cos(angle), dy = Math.sin(angle);
  const kx = dx > 0 ? (right - cx) / dx : dx < 0 ? (left - cx) / dx : Infinity;
  const ky = dy > 0 ? (bottom - cy) / dy : dy < 0 ? (top - cy) / dy : Infinity;
  const k = Math.min(kx, ky);
  const ax = cx + dx * k;
  const ay = cy + dy * k;
  const dist = Math.hypot(objective.target.x - camera.x, objective.target.y - camera.y);

  ctx.save();
  ctx.translate(ax, ay);
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = objective.color;
  ctx.strokeStyle = 'rgba(13, 16, 23, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(16, 0); ctx.lineTo(-8, -11); ctx.lineTo(-3, 0); ctx.lineTo(-8, 11);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = objective.color;
  const label = dist >= 1000 ? `${(dist / 1000).toFixed(1)}k` : `${Math.round(dist)}`;
  ctx.fillText(label, -Math.cos(angle) * 26, -Math.sin(angle) * 26 + 4);
  ctx.restore();
}

const PHASE_STYLE = {
  surge: { label: 'SURGE', color: '#fc8181' },
  ebb: { label: 'EBB', color: '#f6ad55' },
  breather: { label: 'BREATHER', color: '#9ae6b4' },
};

// Тривога Вулика (незданий скрап) + номер і фаза хвилі — ескалація більше не прихована
export function renderHiveAlertHUD(ctx, canvas, state) {
  const em = state.enemyManager;
  const alert = em.cargoAlert;
  const x = 16, y = 66, barX = 106, barW = 100, barH = 8;
  const trickle = alert >= CONFIG.CARGO_PRESSURE.breatherTrickleAlert;
  const pulse = trickle && Math.floor(performance.now() / 250) % 2 === 0;

  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = trickle ? '#fc8181' : '#a0aec0';
  ctx.fillText('HIVE ALERT', x, y);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX, y - barH, barW, barH);
  ctx.fillStyle = alert < 0.4 ? '#48bb78' : alert < 0.75 ? '#ecc94b' : (pulse ? '#ff6b6b' : '#e53e3e');
  ctx.fillRect(barX, y - barH, barW * alert, barH);
  ctx.strokeStyle = '#4a5568';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, y - barH, barW, barH);

  const phase = PHASE_STYLE[em.wavePhase] || PHASE_STYLE.surge;
  let phaseText = `WAVE ${em.waveNumber} · ${phase.label}`;
  if (em.wavePhase === 'breather') phaseText += trickle ? ' (DENIED)' : ` ${Math.ceil(em.breatherTimeLeft)}s`;
  ctx.fillStyle = em.wavePhase === 'breather' && trickle ? '#fc8181' : phase.color;
  ctx.fillText(phaseText, barX + barW + 10, y);
  ctx.restore();
}

// Панель біля Пурифаєра: виклик евакуації / таймер утримання
export function renderEvacHUD(ctx, canvas, state) {
  const wm = state.worldManager;
  const lm = wm.landmark;
  const evac = wm.evac;
  if (!lm.repaired || evac.state === 'complete') return;

  const nearLandmark = Math.hypot(state.player.x - lm.x, state.player.y - lm.y) < CONFIG.WORLD.terraformedRadius;
  if (!evac.isActive && !nearLandmark) return;

  const w = 600, h = 60, x = canvas.width / 2 - w / 2, y = canvas.height - 130;
  ctx.save();
  ctx.fillStyle = 'rgba(13, 16, 23, 0.88)';
  ctx.strokeStyle = evac.isActive ? (evac.playerInZone ? '#63b3ed' : '#fc8181') : '#48bb78';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.textAlign = 'center';

  if (evac.isActive) {
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = evac.playerInZone ? '#90cdf4' : '#fc8181';
    ctx.fillText(evac.playerInZone ? `EVAC INBOUND: ${evac.timer.toFixed(1)}s — HOLD THE BEACON` : '⚠ OUTSIDE THE BEACON — EVAC TIMER PAUSED', canvas.width / 2, y + 24);
    const ratio = 1 - evac.timer / evac.totalTime;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x + 24, y + 36, w - 48, 10);
    ctx.fillStyle = evac.playerInZone ? '#63b3ed' : '#e53e3e';
    ctx.fillRect(x + 24, y + 36, (w - 48) * ratio, 10);
  } else {
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#ecc94b';
    ctx.fillText(`[E] CALL EVAC — HOLD ${evac.totalTime}s TO END THE RUN`, canvas.width / 2, y + 24);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#90cdf4';
    ctx.fillText(`Banks ALL cargo +${CONFIG.EVAC.victoryBonusScrap} bonus. Purifier field goes down!  |  [F] Fast travel home (tax)`, canvas.width / 2, y + 44);
  }
  ctx.restore();
}

const OUTCOME_STYLE = {
  victory: { title: 'EVACUATION COMPLETE', color: '#68d391' },
  death: { title: 'CHASSIS DESTROYED', color: '#fc8181' },
  abort: { title: 'RUN ABORTED', color: '#a0aec0' },
};

export function renderRunEndOverlay(ctx, canvas, runEnd, canLeave) {
  const style = OUTCOME_STYLE[runEnd.outcome] || OUTCOME_STYLE.death;
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const w = 440, h = 330, x = cx - w / 2, y = cy - h / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(5, 7, 12, 0.82)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#12161f';
  ctx.strokeStyle = style.color;
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  ctx.textAlign = 'center';
  ctx.fillStyle = style.color;
  ctx.font = 'bold 24px monospace';
  ctx.fillText(style.title, cx, y + 44);

  const mins = Math.floor(runEnd.timeSec / 60);
  const secs = Math.floor(runEnd.timeSec % 60).toString().padStart(2, '0');
  const rows = [
    ['TIME', `${mins}:${secs}`],
    ['WAVE REACHED', `${runEnd.wave}`],
    ['LEVEL', `${runEnd.level}`],
    ['KILLS', `${runEnd.kills}`],
    ['NESTS CLEANSED', `${runEnd.nestsCleansed} / ${runEnd.nestsTotal}`],
    ['SCRAP BANKED', runEnd.bonus ? `+${runEnd.banked} (incl. +${runEnd.bonus} evac bonus)` : `+${runEnd.banked}`],
  ];
  if (runEnd.outcome !== 'victory') rows.push(['SCRAP LOST', `${runEnd.lost}`]);

  ctx.font = '13px monospace';
  for (let i = 0; i < rows.length; i++) {
    const ry = y + 86 + i * 24;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#a0aec0';
    ctx.fillText(rows[i][0], x + 36, ry);
    ctx.textAlign = 'right';
    ctx.fillStyle = rows[i][0] === 'SCRAP LOST' ? '#fc8181' : '#e2e8f0';
    ctx.fillText(rows[i][1], x + w - 36, ry);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ecc94b';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`SANCTUARY VAULT: ${MetaProgression.bankedTechScrap} SCRAP`, cx, y + h - 46);
  if (canLeave) {
    ctx.fillStyle = Math.floor(performance.now() / 450) % 2 === 0 ? '#ffffff' : '#a0aec0';
    ctx.fillText('[ENTER] / CLICK — NEW RUN', cx, y + h - 20);
  }
  ctx.restore();
}
