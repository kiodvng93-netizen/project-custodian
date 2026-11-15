// js/render/biomassUI.js — Малий HUD біомаси забігу: зв'язана/уся родючість і ставка м'якого правила

import { CONFIG } from '../config.js';

export function renderBiomassHUD(ctx, state) {
  const link = state.hubLink;
  if (state.runEnd || (link.totalF <= 0 && link.biomass < 1)) return;
  const pct = link.totalF > 0 ? Math.round((link.linkedF / link.totalF) * 100) : 100;
  const rate = Math.round(CONFIG.HUBLINK.disconnectedRate * 100);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '11px monospace';
  ctx.fillStyle = 'rgba(154, 230, 180, 0.8)';
  ctx.fillText(`BIOMASS +${Math.floor(link.biomass)} · LINKED ${Math.round(link.linkedF)}/${Math.round(link.totalF)} (${pct}%) · UNLINKED ×${rate}%`, ctx.canvas.width / 2, 62);
  ctx.restore();
}
