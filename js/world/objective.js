// js/world/objective.js — Поточна ціль забігу (радар, стрілка-вказівник, HUD)
// Ланцюжок: Hive Warden → Ядро → Пурифаєр → виклик евакуації → утримання маяка

export function getRunObjective(worldManager, enemyManager, player) {
  const lm = worldManager.landmark;
  const evac = worldManager.evac;

  if (evac.state === 'complete') return null;
  if (evac.isActive) {
    return evac.playerInZone
      ? { text: `HOLD THE BEACON: ${Math.ceil(evac.timer)}s`, color: '#63b3ed', target: lm }
      : { text: 'RETURN TO EVAC BEACON!', color: '#fc8181', target: lm };
  }
  if (lm.repaired) return { text: 'CALL EVAC AT PURIFIER [E]', color: '#90cdf4', target: lm };
  if (player.carryingCore) return { text: 'DELIVER CORE TO PURIFIER', color: '#68d391', target: lm };

  const core = worldManager.coreDrop;
  if (core && core.alive) return { text: 'PICK UP PURIFIER CORE', color: '#ecc94b', target: core };

  const warden = enemyManager.enemies.find(e => e.typeKey === 'warden' && !e.isTitan && e.alive);
  if (warden) {
    return { text: warden.isAwakened ? 'KILL THE HIVE WARDEN' : 'HUNT THE HIVE WARDEN', color: '#f687b3', target: warden };
  }
  return { text: 'CLEAR NESTS', color: '#fc8181', target: null };
}
