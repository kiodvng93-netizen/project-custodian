class SpatialGrid {
  constructor(cellSize = 140) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  insert(entity) {
    const cx = Math.floor(entity.x / this.cellSize);
    const cy = Math.floor(entity.y / this.cellSize);
    const key = `${cx},${cy}`;
    let cell = this.cells.get(key);
    if (!cell) {
      cell = [];
      this.cells.set(key, cell);
    }
    cell.push(entity);
  }

  getNearby(x, y, radius) {
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    const result = [];
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.cells.get(`${cx},${cy}`);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            result.push(cell[i]);
          }
        }
      }
    }
    return result;
  }
}
window.SpatialGrid = SpatialGrid;

class Enemy {
  constructor(x, y, typeKey = 'sprout') {
    this.x = x;
    this.y = y;
    this.typeKey = typeKey;
    const cfg = window.CONFIG.ENEMIES.types[typeKey];

    this.name = cfg.name;
    this.maxHealth = cfg.hp;
    this.health = this.maxHealth;
    this.speed = cfg.speed;
    this.damage = cfg.damage;
    this.radius = cfg.radius;
    this.color = cfg.color;
    this.outline = cfg.outline;
    this.xpValue = cfg.xpValue;

    this.alive = true;
    this.hitFlashTimer = 0;
    this.currentSlow = 1.0;
    this.sporeSlowTimer = 0;
    this.sporeSlowMult = 1.0;

    this.isAwakened = false;
    this.chargeCooldown = 4.5;
    this.chargeTimer = 2.0;
    this.isTelegraphing = false;
    this.isCharging = false;
    this.chargeDuration = 0;
    this.chargeVx = 0;
    this.chargeVy = 0;
    this.lastHitSourceX = undefined;
    this.lastHitSourceY = undefined;
  }

  takeDamage(amount, sourceX, sourceY) {
    if (!this.alive) return;

    this.health -= amount;
    this.hitFlashTimer = 0.12;
    if (sourceX !== undefined && sourceY !== undefined) {
      this.lastHitSourceX = sourceX;
      this.lastHitSourceY = sourceY;
    }

    if (this.typeKey === 'warden' && !this.isAwakened) {
      this.isAwakened = true;
      if (window.Telemetry) {
        window.Telemetry.recordEvent('BOSS', 'Hive Warden provoked!');
      }
    }

    if (window.Telemetry) {
      window.Telemetry.metrics.damageDealt += amount;
    }

    const displayDamage = Math.round(amount);
    if (window.damageTexts && displayDamage > 0) {
      window.damageTexts.push({
        x: this.x + (Math.random() - 0.5) * 14,
        y: this.y - this.radius - 6,
        text: displayDamage,
        life: 0.55
      });
    }

    if (this.health <= 0) {
      this.alive = false;

      if (window.gibManager) {
        window.gibManager.spawnForEnemy(this, this.lastHitSourceX, this.lastHitSourceY);
      }

      if (window.decalManager) {
        if (this.typeKey === 'sprout') {
          window.decalManager.addSplatter(this.x, this.y, { type: 'slime', radius: 15, count: 6 });
        } else if (this.typeKey === 'stalker') {
          window.decalManager.addSplatter(this.x, this.y, { type: 'corrupt', radius: 24, count: 10 });
        } else if (this.typeKey === 'dasher') {
          const moveAngle = Math.atan2(this.chargeVy || (this.y - (window.player ? window.player.y : 0)), this.chargeVx || (this.x - (window.player ? window.player.x : 0)));
          window.decalManager.addSplatter(this.x, this.y, {
            type: 'amber',
            radius: 17,
            dirX: Math.cos(moveAngle),
            dirY: Math.sin(moveAngle),
            count: 8
          });
        } else if (this.typeKey === 'warden') {
          window.decalManager.addSplatter(this.x, this.y, { type: 'oil', radius: 46, count: 20 });
          window.decalManager.addSplatter(this.x, this.y, { type: 'corrupt', radius: 36, count: 16 });
          window.decalManager.addScorch(this.x, this.y, 48);
        }
      }

      if (window.Telemetry) {
        window.Telemetry.metrics.kills++;
        window.Telemetry.recordEvent('KILL', `${this.name} destroyed!`);
      }

            if (this.typeKey === 'warden') {
        if (window.spawnShockwave) {
          window.spawnShockwave(this.x, this.y, { radius: 25, maxRadius: 280, color: '#f687b3', speed: 420, lineWidth: 9 });
        }
        if (window.camera) window.camera.addTrauma(1.0);
        if (window.triggerHitStop) window.triggerHitStop(0.12);
        if (window.worldManager) window.worldManager.spawnCore(this.x, this.y);
      } else if (this.typeKey === 'stalker') {
        if (window.spawnShockwave) {
          window.spawnShockwave(this.x, this.y, { radius: 10, maxRadius: 75, color: '#fc8181', speed: 280, lineWidth: 3.5 });
        }
        if (window.camera) window.camera.addTrauma(0.22);
        if (window.triggerHitStop) window.triggerHitStop(0.024);
      }

      if (window.pickupManager) {
        window.pickupManager.spawn(this.x, this.y, 'bio', this.xpValue);
      }
    }
  }

  update(dt, player, enemies) {
    if (!this.alive) return;

    if (window.worldManager && window.worldManager.landmark && window.worldManager.landmark.repaired) {
      const lm = window.worldManager.landmark;
      if (Math.hypot(this.x - lm.x, this.y - lm.y) < window.CONFIG.WORLD.terraformedRadius) {
        this.alive = false;
        return;
      }
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distSq = dx * dx + dy * dy;

    if (this.typeKey === 'warden') {
      const dist = Math.sqrt(distSq);
      this.updateWardenAI(dt, player, dist, dx, dy);
      return;
    }

    if (distSq > 1) {
      const effectiveSpeed = this.speed * (this.currentSlow || 1.0);
      const dist = Math.sqrt(distSq);
      let vx = (dx / dist) * effectiveSpeed;
      let vy = (dy / dist) * effectiveSpeed;

            const neighbors = (window.enemyManager && window.enemyManager.grid)
        ? window.enemyManager.grid.getNearby(this.x, this.y, this.radius * 2.5)
        : enemies;

      const len = neighbors.length;
      for (let i = 0; i < len; i++) {
        const other = neighbors[i];
        if (other === this || !other.alive) continue;

        const ox = this.x - other.x;
        const oy = this.y - other.y;
        const oDistSq = ox * ox + oy * oy;
        const minDist = this.radius + other.radius;

        if (oDistSq > 0 && oDistSq < minDist * minDist) {
          const oDist = Math.sqrt(oDistSq);
          const push = ((minDist - oDist) / minDist) * 75;
          vx += (ox / oDist) * push;
          vy += (oy / oDist) * push;
        }
      }

      this.x += vx * dt;
      this.y += vy * dt;
    }

    const touchDist = this.radius + player.radius;
    if (distSq < touchDist * touchDist) {
      player.takeDamage(this.damage);
    }

    if (this.plasmaBurnTimer && this.plasmaBurnTimer > 0) {
      this.plasmaBurnTimer -= dt;
      this.takeDamage((this.plasmaBurnDmg || 8) * dt);
    }

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
  }

  updateWardenAI(dt, player, dist, dx, dy) {
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    if (!this.isAwakened) {
      if (dist < window.CONFIG.WORLD.wardenAggroRadius) {
        this.isAwakened = true;
        if (window.Telemetry) {
          window.Telemetry.recordEvent('BOSS', 'Hive Warden awakened in its lair!');
        }
      } else {
        return;
      }
    }

    if (this.isCharging) {
      this.x += this.chargeVx * dt;
      this.y += this.chargeVy * dt;
      this.chargeDuration -= dt;

      if (dist < this.radius + player.radius) {
        player.takeDamage(this.damage * 1.3);
      }

      if (this.chargeDuration <= 0) {
        this.isCharging = false;
      }
      return;
    }

    if (this.isTelegraphing) {
      this.chargeDuration -= dt;
      if (this.chargeDuration <= 0) {
        this.isTelegraphing = false;
        this.isCharging = true;
        this.chargeDuration = 1.1;
        const cSpeed = window.CONFIG.ENEMIES.types.warden.chargeSpeed;
        const a = Math.atan2(player.y - this.y, player.x - this.x);
        this.chargeVx = Math.cos(a) * cSpeed;
        this.chargeVy = Math.sin(a) * cSpeed;

        if (window.enemyManager && window.enemyManager.enemies.length < window.CONFIG.ENEMIES.maxActive) {
          window.enemyManager.enemies.push(new Enemy(this.x + 30, this.y, 'dasher'));
          window.enemyManager.enemies.push(new Enemy(this.x - 30, this.y, 'dasher'));
        }
      }
      return;
    }

    this.chargeTimer += dt;
    if (this.chargeTimer >= this.chargeCooldown && dist < 700) {
      this.chargeTimer = 0;
      this.isTelegraphing = true;
      this.chargeDuration = 0.7;
      return;
    }

    if (dist > 1) {
      const effectiveSpeed = this.speed * (this.currentSlow || 1.0);
      this.x += (dx / dist) * effectiveSpeed * dt;
      this.y += (dy / dist) * effectiveSpeed * dt;
    }

    if (dist < this.radius + player.radius) {
      player.takeDamage(this.damage);
    }
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : this.color;
    ctx.strokeStyle = this.outline;
    ctx.lineWidth = 2;

    if (this.typeKey === 'dasher') {
      ctx.beginPath();
      ctx.moveTo(this.radius * 1.3, 0);
      ctx.lineTo(-this.radius, -this.radius);
      ctx.lineTo(-this.radius * 0.4, 0);
      ctx.lineTo(-this.radius, this.radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.typeKey === 'warden') {
      if (!this.isAwakened) {
        ctx.fillStyle = '#441837';
      } else if (this.isTelegraphing) {
        ctx.fillStyle = Math.floor(performance.now() / 80) % 2 === 0 ? '#fc8181' : '#e53e3e';
      } else if (this.isCharging) {
        ctx.fillStyle = '#ff0055';
      }

      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = this.radius + (this.isCharging ? 5 : 0);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f687b3';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      const statusText = !this.isAwakened ? 'HIVE WARDEN [DORMANT]' : this.isCharging ? '!! CHARGE !!' : 'HIVE WARDEN (ELITE)';
      ctx.fillText(statusText, 0, -this.radius - 14);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (this.health < this.maxHealth) {
      const barW = this.radius * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-this.radius, -this.radius - 8, barW, 3);
      ctx.fillStyle = '#fc8181';
      ctx.fillRect(-this.radius, -this.radius - 8, barW * (this.health / this.maxHealth), 3);
    }

    ctx.restore();
  }
}

class EnemyManager {
    constructor() {
    this.enemies = [];
    this.grid = new SpatialGrid(140);
    this.spawnTimer = 0;
    this.swarmTimer = 0;
    this.rearCapTimer = 0;
    this.elapsedRunTime = 0;
    this.spawnWarden();
  }

  triggerStressTestSwarm(player) {
    const count = 65;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const dist = 140 + Math.random() * 85;
      const x = player.x + Math.cos(angle) * dist;
      const y = player.y + Math.sin(angle) * dist;
      this.enemies.push(new Enemy(x, y, 'sprout'));
    }
  }

  spawnWarden() {
    const pos = window.CONFIG.WORLD.wardenPos;
    this.enemies.push(new Enemy(pos.x, pos.y, 'warden'));
  }

    update(dt, player, camera, canvasWidth, canvasHeight, activeNestsCount = 7) {
    this.grid.clear();
    const eLen = this.enemies.length;
    for (let i = 0; i < eLen; i++) {
      if (this.enemies[i].alive) {
        this.grid.insert(this.enemies[i]);
      }
    }

    this.elapsedRunTime += dt;

    const cfg = window.CONFIG.ENEMIES;
    const progress = Math.min(1.0, this.elapsedRunTime / cfg.rampTimeSeconds);
    const nestMult = 0.6 + (activeNestsCount / 7) * 0.4;
    const surgeMultiplier = (player.carryingCore || (window.worldManager && window.worldManager.transferActive)) ? 0.5 : 1.0;
    const currentInterval = ((cfg.initialSpawnInterval - (progress * (cfg.initialSpawnInterval - cfg.minimumSpawnInterval))) / nestMult) * surgeMultiplier;

    this.spawnTimer += dt;
    if (this.spawnTimer >= currentInterval) {
      this.spawnTimer = 0;
      if (this.enemies.length < cfg.maxActive) {
        this.spawnDirectionalWave(player, canvasWidth, canvasHeight, 2 + Math.floor(progress * 4));
      }
    }

    this.swarmTimer += dt;
    if (this.swarmTimer >= cfg.swarmInterval) {
      this.swarmTimer = 0;
      this.triggerAmbushSwarm(player, canvasWidth, canvasHeight);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, player, this.enemies);

      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (e.typeKey !== 'warden' && (dx * dx + dy * dy) > cfg.despawnRadius * cfg.despawnRadius) {
        e.alive = false;
      }

      if (!e.alive) {
        this.enemies.splice(i, 1);
      }
    }

    this.rearCapTimer += dt;
    if (this.rearCapTimer >= 0.25) {
      this.rearCapTimer = 0;
      this.enforceRearChaserCap(player);
    }
  }

  enforceRearChaserCap(player) {
    const isMoving = Math.hypot(player.vx, player.vy) > 10;
    if (!isMoving) return;

    const moveAngle = Math.atan2(player.vy, player.vx);
    const rearEnemies = [];

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.typeKey === 'warden') continue;

      const angleToEnemy = Math.atan2(e.y - player.y, e.x - player.x);
      let diff = Math.abs(angleToEnemy - moveAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;

      if (diff > (115 * Math.PI) / 180) {
        const distSq = (e.x - player.x) * (e.x - player.x) + (e.y - player.y) * (e.y - player.y);
        rearEnemies.push({ index: i, distSq });
      }
    }

    const maxRear = window.CONFIG.ENEMIES.maxRearChasers;
    if (rearEnemies.length > maxRear) {
      rearEnemies.sort((a, b) => b.distSq - a.distSq);
      const toRemoveCount = rearEnemies.length - maxRear;
      const removeIndices = new Set(rearEnemies.slice(0, toRemoveCount).map(r => r.index));
      this.enemies = this.enemies.filter((_, idx) => !removeIndices.has(idx));
    }
  }

  spawnDirectionalWave(player, canvasWidth, canvasHeight, count = 3) {
    const cfg = window.CONFIG.ENEMIES;
    const distFromHubSq = player.x * player.x + player.y * player.y;
    if (distFromHubSq < cfg.hubSafeRadius * cfg.hubSafeRadius && this.enemies.length > 25) return;

    const isMoving = Math.hypot(player.vx, player.vy) > 10;
    const moveAngle = isMoving ? Math.atan2(player.vy, player.vx) : Math.random() * Math.PI * 2;
    const headingAway = (player.x * player.vx + player.y * player.vy) >= 0;

    const halfDiag = Math.hypot(canvasWidth / 2, canvasHeight / 2);
    const spawnDist = halfDiag + 90;

    for (let i = 0; i < count; i++) {
      if (this.enemies.length >= cfg.maxActive) break;

      let spawnAngle;
      if (isMoving && headingAway) {
        spawnAngle = Math.random() < 0.70 ? moveAngle + (Math.random() - 0.5) * 1.8 : Math.random() * Math.PI * 2;
      } else if (isMoving && !headingAway) {
        spawnAngle = Math.random() < 0.75 ? (moveAngle + Math.PI) + (Math.random() - 0.5) * 1.8 : Math.random() * Math.PI * 2;
      } else {
        spawnAngle = Math.random() * Math.PI * 2;
      }

      const x = player.x + Math.cos(spawnAngle) * spawnDist;
      const y = player.y + Math.sin(spawnAngle) * spawnDist;

      if (window.worldManager && window.worldManager.landmark && window.worldManager.landmark.repaired) {
        const lm = window.worldManager.landmark;
        const dlmSq = (x - lm.x) * (x - lm.x) + (y - lm.y) * (y - lm.y);
        if (dlmSq < window.CONFIG.WORLD.terraformedRadius * window.CONFIG.WORLD.terraformedRadius) {
          continue;
        }
      }

      const roll = Math.random();
      let type = 'sprout';
      if (roll < 0.18) type = 'dasher';
      else if (roll < 0.38) type = 'stalker';

      this.enemies.push(new Enemy(x, y, type));
    }
  }

  triggerAmbushSwarm(player, canvasWidth, canvasHeight) {
    if (window.Telemetry) {
      window.Telemetry.recordEvent('SURGE', 'Swarm Ambush surrounding!');
    }
    const count = 16;
    const halfDiag = Math.hypot(canvasWidth / 2, canvasHeight / 2);
    const spawnDist = halfDiag + 80;

    for (let i = 0; i < count; i++) {
      if (this.enemies.length >= window.CONFIG.ENEMIES.maxActive) break;
      const angle = (i * Math.PI * 2) / count;
      const x = player.x + Math.cos(angle) * spawnDist;
      const y = player.y + Math.sin(angle) * spawnDist;
      const type = i % 4 === 0 ? 'dasher' : 'sprout';
      this.enemies.push(new Enemy(x, y, type));
    }
  }

  render(ctx) {
    for (const enemy of this.enemies) {
      enemy.render(ctx);
    }
  }
}

window.Enemy = Enemy;
window.EnemyManager = EnemyManager;