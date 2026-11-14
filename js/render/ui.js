// js/render/ui.js — Отрисовка всех экранов интерфейса, HUD и меню

import { CONFIG, MetaProgression } from '../config.js';
import { Telemetry } from '../telemetry.js';

function drawWrappedText(ctx, text, cx, startY, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let y = startY;
  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, cx, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, cx, y);
}

export function renderPlayerVitalsHUD(ctx, canvas, state) {
  const panelW = 210, panelH = 76;
  const panelX = canvas.width - panelW - 16, panelY = 16;

  ctx.save();
  ctx.fillStyle = 'rgba(13, 16, 23, 0.88)';
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 1.5;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = '#a0aec0';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('HULL INTEGRITY', panelX + 10, panelY + 16);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#fc8181';
  ctx.fillText(`💀 ${Telemetry.metrics.kills}`, panelX + panelW - 10, panelY + 16);

  const barX = panelX + 10, barY = panelY + 23, barW = panelW - 20, barH = 14;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX, barY, barW, barH);

  const hpRatio = Math.max(0, Math.min(1, state.player.health / state.player.maxHealth));
  ctx.fillStyle = hpRatio > 0.4 ? '#48bb78' : '#e53e3e';
  ctx.fillRect(barX, barY, barW * hpRatio, barH);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(state.player.health)} / ${Math.round(state.player.maxHealth)}`, barX + barW / 2, barY + 11);

  const shieldY = panelY + 44;
  ctx.fillStyle = '#a0aec0';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('AEGIS SHIELD:', barX, shieldY + 14);

  const shieldStartX = barX + 85;
  for (let i = 0; i < state.player.maxShieldCharges; i++) {
    const isCharged = i < state.player.shieldCharges;
    ctx.fillStyle = isCharged ? '#4299e1' : '#2d3748';
    ctx.strokeStyle = isCharged ? '#bee3f8' : '#4a5568';
    ctx.lineWidth = 1;
    ctx.fillRect(shieldStartX + i * 14, shieldY + 3, 11, 13);
    ctx.strokeRect(shieldStartX + i * 14, shieldY + 3, 11, 13);
  }

  if (state.player.shieldCharges < state.player.maxShieldCharges) {
    const rechargeRatio = state.player.shieldTimer / state.player.shieldRechargeTime;
    ctx.fillStyle = '#63b3ed';
    ctx.fillRect(shieldStartX + state.player.shieldCharges * 14, shieldY + 14, 11 * rechargeRatio, 2);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#68d391';
  ctx.font = '10px monospace';
  ctx.fillText(`+${state.player.healthRegenRate.toFixed(1)}/s`, panelX + panelW - 10, shieldY + 14);
  ctx.restore();
}

export function renderArsenalHUD(ctx, canvas, state) {
  const slots = state.weaponManager.slots;
  const maxSlots = state.weaponManager.maxSlots;
  const slotW = 108, slotH = 50, gap = 8;
  const totalW = maxSlots * slotW + (maxSlots - 1) * gap;
  const startX = (canvas.width - totalW) / 2;
  const startY = canvas.height - slotH - 12;

  ctx.save();
  for (let i = 0; i < maxSlots; i++) {
    const x = startX + i * (slotW + gap), y = startY, wpn = slots[i];
    if (wpn) {
      const isEvo = !!wpn.isEvolution;
      ctx.fillStyle = isEvo ? 'rgba(28, 40, 38, 0.92)' : 'rgba(18, 22, 31, 0.88)';
      ctx.strokeStyle = isEvo ? '#ecc94b' : '#4a5568';
      ctx.lineWidth = isEvo ? 2 : 1;
      ctx.fillRect(x, y, slotW, slotH);
      ctx.strokeRect(x, y, slotW, slotH);

      ctx.fillStyle = isEvo ? '#f6e05e' : '#63b3ed';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      const title = (isEvo ? '★ ' : '') + wpn.name;
      ctx.fillText(title.length > 13 ? `${title.slice(0, 12)}…` : title, x + 6, y + 14);

      if (wpn.cfg) {
        const dmg = wpn.cfg.damage || wpn.cfg.zoneDamage || 0;
        const typeTag = (wpn.cfg.archetype || '').toUpperCase();
        ctx.fillStyle = '#cbd5e0';
        ctx.font = '9px monospace';
        ctx.fillText(`DMG: ${Math.round(dmg)} [${typeTag.slice(0, 5)}]`, x + 6, y + 28);
        let statLine2 = '';
        if (wpn.cfg.count) statLine2 = `ORBITALS: ${wpn.cfg.count}`;
        else if (wpn.cfg.fireRate) statLine2 = `RATE: ${wpn.cfg.fireRate.toFixed(2)}s`;
        else if (wpn.cfg.range) statLine2 = `RANGE: ${Math.round(wpn.cfg.range)}`;
        if (statLine2) ctx.fillText(statLine2, x + 6, y + 41);
      }
    } else {
      ctx.fillStyle = 'rgba(13, 16, 23, 0.55)';
      ctx.strokeStyle = 'rgba(74, 85, 104, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.fillRect(x, y, slotW, slotH);
      ctx.strokeRect(x, y, slotW, slotH);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(113, 128, 150, 0.6)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`SLOT ${i + 1}`, x + slotW / 2, y + 21);
      ctx.fillText('[EMPTY]', x + slotW / 2, y + 35);
    }
  }
  ctx.restore();
}

export function renderXPBar(ctx, canvas, state) {
  const barWidth = canvas.width * 0.5, barHeight = 8;
  const barX = (canvas.width - barWidth) / 2, barY = 16;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
  const xpRatio = Math.min(1, state.player.xp / state.player.xpToNext);
  ctx.fillStyle = '#48bb78';
  ctx.fillRect(barX, barY, barWidth * xpRatio, barHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  const lvlText = `LVL ${state.player.level} [${state.player.xp} / ${state.player.xpToNext} ESSENCE]`;
  // Накопичені рівні чекають на своє вікно драфту (js/draft.js) — дописуємо в той самий рядок
  const pending = state.isDrafting ? 0 : state.pendingLevelUps;
  if (pending > 0) {
    const tag = `  ▲ +${pending} UPGRADE${pending > 1 ? 'S' : ''}`;
    const wMain = ctx.measureText(lvlText).width, wTag = ctx.measureText(tag).width;
    const left = canvas.width / 2 - (wMain + wTag) / 2;
    ctx.textAlign = 'left';
    ctx.fillText(lvlText, left, barY + 24);
    ctx.fillStyle = Math.floor(performance.now() / 300) % 2 === 0 ? '#f6e05e' : '#ecc94b';
    ctx.fillText(tag, left + wMain, barY + 24);
    ctx.textAlign = 'center';
  } else {
    ctx.fillText(lvlText, canvas.width / 2, barY + 24);
  }
}

export function renderDraftOverlay(ctx, canvas, state) {
  ctx.fillStyle = 'rgba(5, 7, 12, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#48bb78';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CHASSIS UPGRADE AVAILABLE (BULLET TIME)', canvas.width / 2, canvas.height / 2 - 110);
  ctx.font = '13px monospace';
  ctx.fillStyle = '#a0aec0';
  ctx.fillText('Select with Click or Press [1], [2], or [3]', canvas.width / 2, canvas.height / 2 - 85);

  const cw = 220, ch = 140, gap = 20;
  const startX = (canvas.width - ((cw * 3) + (gap * 2))) / 2;
  const cardY = canvas.height / 2 - ch / 2;

  for (let i = 0; i < state.draftCards.length; i++) {
    const card = state.draftCards[i], cardX = startX + i * (cw + gap), isEvo = card.isEvolutionCard;
    ctx.fillStyle = isEvo ? '#1c2826' : '#1a202c';
    ctx.strokeStyle = isEvo ? '#ecc94b' : '#4299e1';
    ctx.lineWidth = isEvo ? 3 : 2;
    ctx.fillRect(cardX, cardY, cw, ch);
    ctx.strokeRect(cardX, cardY, cw, ch);

    ctx.fillStyle = isEvo ? '#f6e05e' : '#63b3ed';
    ctx.font = isEvo ? 'bold 12px monospace' : 'bold 13px monospace';
    ctx.fillText(`[${i + 1}] ${card.title}`, cardX + cw / 2, cardY + 28);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px monospace';
    drawWrappedText(ctx, card.desc, cardX + cw / 2, cardY + 58, cw - 20, 15);
  }
}

export function renderWorkshopOverlay(ctx, canvas, perks) {
  ctx.fillStyle = 'rgba(5, 7, 12, 0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ecc94b';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SANCTUARY WORKSHOP (PERMANENT UPGRADES)', canvas.width / 2, canvas.height / 2 - 200);
  ctx.fillStyle = '#a0aec0';
  ctx.font = '13px monospace';
  ctx.fillText(`AVAILABLE VAULT SCRAP: ${MetaProgression.bankedTechScrap} | Press [B] to Close`, canvas.width / 2, canvas.height / 2 - 172);

  const pw = 450, ph = 52, gap = 10;
  const startX = canvas.width / 2 - pw / 2;
  const startY = canvas.height / 2 - 150;

  for (let i = 0; i < perks.length; i++) {
    const perk = perks[i], py = startY + i * (ph + gap);
    const rank = MetaProgression.perks[perk.key] || 0;
    const isMaxed = perk.maxRank !== undefined && rank >= perk.maxRank;
    const cost = perk.costBase + (rank * perk.costScale);
    const canAfford = !isMaxed && MetaProgression.bankedTechScrap >= cost;

    ctx.fillStyle = canAfford ? '#1a202c' : '#12161f';
    ctx.strokeStyle = isMaxed ? '#68d391' : canAfford ? '#ecc94b' : '#4a5568';
    ctx.lineWidth = 1.5;
    ctx.fillRect(startX, py, pw, ph);
    ctx.strokeRect(startX, py, pw, ph);

    ctx.textAlign = 'left';
    ctx.fillStyle = isMaxed ? '#9ae6b4' : canAfford ? '#f6e05e' : '#a0aec0';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`${perk.title} [RANK ${rank}${perk.maxRank ? `/${perk.maxRank}` : ''}]`, startX + 16, py + 20);
    ctx.fillStyle = '#cbd5e0';
    ctx.font = '11px monospace';
    ctx.fillText(perk.desc, startX + 16, py + 39);

    ctx.textAlign = 'right';
    ctx.fillStyle = isMaxed ? '#68d391' : canAfford ? '#48bb78' : '#e53e3e';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(isMaxed ? '[MAXED]' : `COST: ${cost} SCRAP`, startX + pw - 16, py + 30);
  }
}

export function renderPauseMenu(ctx, canvas) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 7, 12, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#63b3ed';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SYSTEM PAUSED', canvas.width / 2, canvas.height / 2 - 90);
  ctx.fillStyle = '#a0aec0';
  ctx.font = '12px monospace';
  ctx.fillText('Press [ESC] or [P] to Return', canvas.width / 2, canvas.height / 2 - 60);

  const mw = 260, mh = 44, cx = canvas.width / 2, cy = canvas.height / 2;
  ctx.fillStyle = '#1a202c'; ctx.strokeStyle = '#48bb78'; ctx.lineWidth = 2;
  ctx.fillRect(cx - mw / 2, cy - 30, mw, mh); ctx.strokeRect(cx - mw / 2, cy - 30, mw, mh);
  ctx.fillStyle = '#48bb78'; ctx.font = 'bold 14px monospace';
  ctx.fillText('RESUME MISSION', cx, cy - 3);

  ctx.fillStyle = '#1a202c'; ctx.strokeStyle = '#e53e3e';
  ctx.fillRect(cx - mw / 2, cy + 26, mw, mh); ctx.strokeRect(cx - mw / 2, cy + 26, mw, mh);
  ctx.fillStyle = '#fc8181';
  ctx.fillText('ABORT RUN (RESTART)', cx, cy + 53);
  ctx.restore();
}

export function renderSanctuaryHUD(ctx, canvas, state) {
  const sanc = state.worldManager && state.worldManager.sanctuary;
  if (!sanc) return;
  const distToHub = Math.hypot(state.player.x, state.player.y);
  if (!(sanc.domeBroken || sanc.wrathWarning || distToHub <= CONFIG.HUB.defenseRange + 30)) return;

  const w = 340, h = 36, x = canvas.width / 2 - w / 2, y = 52;
  ctx.save();
  ctx.fillStyle = 'rgba(13, 16, 23, 0.88)';
  ctx.strokeStyle = (sanc.domeBroken || sanc.wrathWarning) ? '#e53e3e' : '#48bb78';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  ctx.textAlign = 'center'; ctx.font = 'bold 11px monospace';

  if (sanc.domeBroken) {
    ctx.fillStyle = '#fc8181';
    ctx.fillText('✖ SANCTUARY SHATTERED — HIVE WRATH ACTIVE', canvas.width / 2, y + 22);
  } else if (sanc.wrathWarning) {
    const left = Math.max(0, Math.ceil(CONFIG.HUB.enrageTime - sanc.campTimer));
    ctx.fillStyle = Math.floor(performance.now() / 220) % 2 === 0 ? '#fc8181' : '#f6ad55';
    ctx.fillText(`⚠ HIVE WRATH IN ${left}s — LEAVE SANCTUARY!`, canvas.width / 2, y + 22);
  } else {
    const ratio = sanc.healPool / sanc.maxHealPool;
    ctx.fillStyle = ratio > 0 ? '#9ae6b4' : '#a0aec0';
    ctx.fillText(`SANCTUARY HEAL RESERVE: ${Math.round(sanc.healPool)} / ${sanc.maxHealPool} HP`, canvas.width / 2, y + 15);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x + 20, y + 22, w - 40, 6);
    ctx.fillStyle = ratio > 0 ? '#48bb78' : '#718096';
    ctx.fillRect(x + 20, y + 22, (w - 40) * ratio, 6);
  }
  ctx.restore();
}