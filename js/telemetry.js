// js/telemetry.js — Telemetry & Auto-Balancing Logging Engine (ES Module)

import { CONFIG } from './config.js';

export class TelemetryEngine {
  constructor() {
    this.sessionStartTime = performance.now();
    this.runStartTime = performance.now();
    this.isRunning = true;

    this.fps = 60;
    this.frameCount = 0;
    this.fpsTimer = 0;

    this.metrics = {
      runDurationSeconds: 0,
      damageDealt: 0,
      damageTaken: 0,
      kills: 0,
      shieldHitsAbsorbed: 0,
      resourcesCollected: { techScrap: 0, bioEssence: 0 },
      resourcesBanked: { techScrap: 0, bioEssence: 0 },
      resourcesLostOnDeath: { techScrap: 0, bioEssence: 0 },
      distanceTraveled: 0,
      evacsCalled: 0,
      evacsCompleted: 0,
      deaths: 0,
    };

    this.eventLog = [];
    this.hudTimer = 0;

    this.recordEvent('SYSTEM', 'Telemetry initialized');
  }

  recordEvent(type, message, payload = null) {
    const entry = {
      time: ((performance.now() - this.runStartTime) / 1000).toFixed(1),
      type,
      message,
      payload
    };
    this.eventLog.unshift(entry);
    if (this.eventLog.length > 100) this.eventLog.pop();
  }

  update(dt) {
    if (!this.isRunning) return;

    this.metrics.runDurationSeconds += dt;

    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.hudTimer += dt;
    if (this.hudTimer >= CONFIG.TELEMETRY.hudUpdateInterval) {
      this.updateHUD();
      this.hudTimer = 0;
    }
  }

  updateHUD() {
    const hudContainer = document.getElementById('hudContent');
    const debugHud = document.getElementById('debugHUD');
    if (!hudContainer || !debugHud || debugHud.classList.contains('hidden')) return;

    const m = this.metrics;
    const minutes = Math.floor(m.runDurationSeconds / 60);
    const seconds = Math.floor(m.runDurationSeconds % 60).toString().padStart(2, '0');

    hudContainer.innerHTML = `
      <pre>
<strong>[ENGINE]</strong>
FPS: ${this.fps} | Run Time: ${minutes}:${seconds}

<strong>[COMBAT METRICS]</strong>
Kills: ${m.kills}
DPS Output: ${(m.damageDealt / Math.max(1, m.runDurationSeconds)).toFixed(1)}
Damage Taken: ${Math.round(m.damageTaken)} (Shields Absorbed: ${m.shieldHitsAbsorbed})

<strong>[ECONOMY & EXTRACTION]</strong>
Tech Scrap: +${m.resourcesCollected.techScrap} | Banked: ${m.resourcesBanked.techScrap}
Bio Essence: +${m.resourcesCollected.bioEssence} | Banked: ${m.resourcesBanked.bioEssence}
Lost on Death: Scrap ${m.resourcesLostOnDeath.techScrap} | Bio ${m.resourcesLostOnDeath.bioEssence}
Evacs: ${m.evacsCompleted} completed / ${m.evacsCalled} called

<strong>[RECENT LOG]</strong>
${this.eventLog.slice(0, 5).map(e => `[${e.time}s] ${e.type}: ${e.message}`).join('\n')}
      </pre>
    `;
  }

  exportJSON() {
    const report = {
      exportedAt: new Date().toISOString(),
      configSnapshot: CONFIG,
      summary: this.metrics,
      recentEvents: this.eventLog
    };
    return JSON.stringify(report, null, 2);
  }

  resetRun() {
    this.runStartTime = performance.now();
    this.metrics.runDurationSeconds = 0;
    this.metrics.damageDealt = 0;
    this.metrics.damageTaken = 0;
    this.metrics.kills = 0;
    this.recordEvent('RUN', 'New run started');
  }
}

export const Telemetry = new TelemetryEngine();