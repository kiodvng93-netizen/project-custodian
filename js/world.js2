class CorruptedNest {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const nestCfg = (window.CONFIG && window.CONFIG.NEST) || { maxHealth: 850, radius: 38, spawnInterval: 3.6, alarmThresholds: [0.75, 0.50, 0.25], defenseSwarmCount: 7 };
    this.radius = nestCfg.radius;
    this.maxHealth = nestCfg.maxHealth;
    this.health = this.maxHealth;
    this.alive = true;
    this.spawnTimer = 0;
    this.spawnInterval = nestCfg.spawnInterval;
    this.hitFlashTimer = 0;
    this.defenseSwarmCount = nestCfg.defenseSwarmCount;
    this.alarmThresholds = [...nestCfg.alarmThresholds];
  }

  takeDamage(amount) {
    if (!this.alive) return;
    const prevRatio = this.health / this.maxHealth;
    this.health -= amount;
    this.hitFlashTimer = 0.12;

    const displayDamage = Math.round(amount);
    if (window.damageTexts && displayDamage > 0) {
      window.damageTexts.push({
        x: this.x + (Math.random() - 0.5) * 16,
        y: this.y - this.radius - 8,
        text: displayDamage,
        life: 0.55
      });
    }

    const currentRatio = this.health / this.maxHealth;
    for (let i = 0; i < this.alarmThresholds.length; i++) {
      const th = this.alarmThresholds[i];
      if (prevRatio > th && currentRatio <= th) {
        this.triggerDefenseSwarm();
        this.alarmThresholds.splice(i, 1);
        break;
      }
    }

    if (this.health <= 0) {
      this.alive = false;

      const juiceTrauma = (window.CONFIG && window.CONFIG.JUICE && window.CONFIG.JUICE.trauma && window.CONFIG.JUICE.trauma.nestDestroy) || 0.5;
      const juiceHitStop = (window.CONFIG && window.CONFIG.JUICE && window.CONFIG.JUICE.hitStop && window.CONFIG.JUICE.hitStop.nestDestroy) || 0.06;
      if (window.camera) window.camera.addTrauma(juiceTrauma);
      if (window.triggerHitStop) window.triggerHitStop(juiceHitStop);

      if (window.decalManager) {
        window.decalManager.addScorch(this.x, this.y, 45);
        window.decalManager.addSplatter(this.x, this.y, { type: 'corrupt', radius: 40, count: 18 });
      }

      if (window.Telemetry) {
        window.Telemetry.recordEvent('WORLD', 'Corrupted Nest Cleansed!');
      }

      if (window.pickupManager) {
        for (let i = 0; i < 6; i++) {
          window.pickupManager.spawn(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30, 'bio', 2);
        }
        const bonusScrap = (window.MetaProgression && window.MetaProgression.perks.naniteScavenge > 0) ? 1 : 0;
        for (let i = 0; i < 2 + bonusScrap; i++) {
          window.pickupManager.spawn(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30, 'tech', 1);
        }
      }
    }
  }

  triggerDefenseSwarm() {
    const alarmTrauma = (window.CONFIG && window.CONFIG.JUICE && window.CONFIG.JUICE.trauma && window.CONFIG.JUICE.trauma.nestAlarm) || 0.35;
    const alarmHitStop = (window.CONFIG && window.CONFIG.JUICE && window.CONFIG.JUICE.hitStop && window.CONFIG.JUICE.hitStop.nestAlarm) || 0.04;
    if (window.camera) window.camera.addTrauma(alarmTrauma);
    if (window.triggerHitStop) window.triggerHitStop(alarmHitStop);

    if (window.spawnShockwave) {
      window.spawnShockwave(this.x, this.y, { radius: 15, maxRadius: 110, color: '#e53e3e', speed: 300, lineWidth: 5 });
    }

    if (window.enemyManager && window.enemyManager.enemies.length < window.CONFIG.ENEMIES.maxActive) {
      const count = this.defenseSwarmCount || 7;
      for (let i = 0; i < count; i++) {
        const a = (i * Math.PI * 2) / count;
        const ex = this.x + Math.cos(a) * (this.radius + 20);
        const ey = this.y + Math.sin(a) * (this.radius + 20);
        const type = i % 3 === 0 ? 'dasher' : 'sprout';
        window.enemyManager.enemies.push(new window.Enemy(ex, ey, type));
      }
    }
  }

  update(dt, player, enemyManager) {
    if (!this.alive) return;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    if (distToPlayer < 750) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        if (enemyManager.enemies.length < window.CONFIG.ENEMIES.maxActive) {
          enemyManager.enemies.push(new window.Enemy(this.x + 40, this.y, 'stalker'));
        }
      }
    }
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = Math.sin(performance.now() / 250) * 3;

    ctx.fillStyle = 'rgba(112, 38, 52, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 14 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : '#4a1525';
    ctx.strokeStyle = '#e53e3e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fc8181';
    ctx.beginPath();
    ctx.arc(0, 0, 10 + pulse * 0.5, 0, Math.PI * 2);
    ctx.fill();

    const barW = 46;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-barW / 2, -this.radius - 12, barW, 5);
    ctx.fillStyle = '#e53e3e';
    ctx.fillRect(-barW / 2, -this.radius - 12, barW * (this.health / this.maxHealth), 5);

    ctx.restore();
  }
}

class ObstacleWall {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  resolveCircleCollision(circle) {
    const nearestX = Math.max(this.x, Math.min(circle.x, this.x + this.w));
    const nearestY = Math.max(this.y, Math.min(circle.y, this.y + this.h));
    const dx = circle.x - nearestX;
    const dy = circle.y - nearestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < circle.radius * circle.radius) {
      const dist = Math.sqrt(distSq);
      if (dist > 0.001) {
        const overlap = circle.radius - dist;
        circle.x += (dx / dist) * overlap;
        circle.y += (dy / dist) * overlap;
      } else {
        const leftDist = circle.x - this.x;
        const rightDist = (this.x + this.w) - circle.x;
        const topDist = circle.y - this.y;
        const bottomDist = (this.y + this.h) - circle.y;
        const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);

        if (minDist === leftDist) circle.x = this.x - circle.radius;
        else if (minDist === rightDist) circle.x = this.x + this.w + circle.radius;
        else if (minDist === topDist) circle.y = this.y - circle.radius;
        else circle.y = this.y + this.h + circle.radius;
      }
      return true;
    }
    return false;
  }

  intersectsPoint(px, py) {
    return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
  }

  intersectsProjectile(p, dt = 0.016) {
    if (!p) return false;
    const r = (p.size || 5) + 1;
    const minX = this.x - r;
    const maxX = this.x + this.w + r;
    const minY = this.y - r;
    const maxY = this.y + this.h + r;

    if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) return true;

    const prevX = p.x - (p.vx || 0) * dt;
    const prevY = p.y - (p.vy || 0) * dt;
    if (prevX >= minX && prevX <= maxX && prevY >= minY && prevY <= maxY) return true;

    const midX = (prevX + p.x) * 0.5;
    const midY = (prevY + p.y) * 0.5;
    return midX >= minX && midX <= maxX && midY >= minY && midY <= maxY;
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = '#1e2530';
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2.5;

    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeRect(this.x, this.y, this.w, this.h);

    ctx.fillStyle = '#2d3748';
    ctx.fillRect(this.x + 3, this.y + 3, Math.max(2, this.w - 6), Math.max(2, this.h - 6));

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x + 6, this.y + 4);
    ctx.lineTo(this.x + this.w - 6, this.y + this.h - 4);
    ctx.stroke();

    ctx.restore();
  }
}

class LootChest {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = (window.CONFIG && window.CONFIG.CHESTS && window.CONFIG.CHESTS.radius) || 16;
    this.opened = false;
  }

  open(player) {
    if (this.opened) return;
    this.opened = true;

    const chestCfg = (window.CONFIG && window.CONFIG.CHESTS) || { minScrap: 3, maxScrap: 5, minBio: 5, maxBio: 7 };
    const juiceTrauma = (window.CONFIG && window.CONFIG.JUICE && window.CONFIG.JUICE.trauma && window.CONFIG.JUICE.trauma.chestOpen) || 0.30;
    if (window.camera) window.camera.addTrauma(juiceTrauma);
    if (window.spawnShockwave) {
      window.spawnShockwave(this.x, this.y, { radius: 10, maxRadius: 80, color: '#ecc94b', speed: 280, lineWidth: 4 });
    }

    if (window.pickupManager) {
      const scrapCount = chestCfg.minScrap + Math.floor(Math.random() * (chestCfg.maxScrap - chestCfg.minScrap + 1));
      for (let i = 0; i < scrapCount; i++) {
        window.pickupManager.spawn(this.x + (Math.random() - 0.5) * 24, this.y + (Math.random() - 0.5) * 24, 'tech', 1);
      }
      const bioCount = chestCfg.minBio + Math.floor(Math.random() * (chestCfg.maxBio - chestCfg.minBio + 1));
      for (let i = 0; i < bioCount; i++) {
        window.pickupManager.spawn(this.x + (Math.random() - 0.5) * 24, this.y + (Math.random() - 0.5) * 24, 'bio', 3);
      }
    }

    if (player.shieldCharges < player.maxShieldCharges) {
      player.shieldCharges = player.maxShieldCharges;
    }

    if (window.Telemetry) {
      window.Telemetry.recordEvent('LOOT', 'Supply Cache cracked open! Tech Scrap acquired.');
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.opened) {
      ctx.fillStyle = '#2d3748';
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-12, -8, 24, 16);
      ctx.strokeRect(-12, -8, 24, 16);
    } else {
      const pulse = Math.sin(performance.now() / 200) * 2;
      ctx.fillStyle = '#b7791f';
      ctx.strokeStyle = '#f6e05e';
      ctx.lineWidth = 2;
      ctx.fillRect(-14, -10, 28, 20);
      ctx.strokeRect(-14, -10, 28, 20);

      ctx.fillStyle = '#fefcbf';
      ctx.beginPath();
      ctx.arc(0, 0, 4 + pulse * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f6e05e';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[E] CACHE', 0, -14);
    }

    ctx.restore();
  }
}

class Landmark {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 48;
    this.repaired = false;
  }

  repair(player) {
    if (this.repaired) return;
    this.repaired = true;
    player.carryingCore = false;

    if (window.camera) window.camera.addTrauma(0.65);
    if (window.triggerHitStop) window.triggerHitStop(0.08);

    if (window.Telemetry) {
      window.Telemetry.recordEvent('TERRAFORM', 'Biosphere Purifier restored! Safe haven created.');
      window.Telemetry.metrics.resourcesCollected.techScrap += 5;
    }

    if (window.pickupManager) {
      for (let i = 0; i < 8; i++) {
        window.pickupManager.spawn(this.x + (Math.random() - 0.5) * 60, this.y + (Math.random() - 0.5) * 60, 'bio', 3);
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = Math.sin(performance.now() / 300) * 4;

    if (this.repaired) {
      const auraR = window.CONFIG.WORLD.terraformedRadius;
      ctx.fillStyle = 'rgba(72, 187, 120, 0.12)';
      ctx.beginPath();
      ctx.arc(0, 0, auraR + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#48bb78';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = this.repaired ? '#1c4532' : '#2d3748';
    ctx.strokeStyle = this.repaired ? '#68d391' : '#718096';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.repaired ? '#48bb78' : '#e53e3e';
    ctx.beginPath();
    ctx.arc(0, 0, 16 + (this.repaired ? pulse * 0.5 : 0), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.repaired ? '#9ae6b4' : '#cbd5e0';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.repaired ? 'BIOSPHERE PURIFIER [ONLINE]' : 'PURIFIER [NEEDS CORE]', 0, this.radius + 20);

    ctx.restore();
  }
}

class CorePickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.alive = true;
  }

  update(player) {
    if (!this.alive) return;
    if (Math.hypot(player.x - this.x, player.y - this.y) < player.radius + this.radius) {
      this.alive = false;
      player.carryingCore = true;
      if (window.Telemetry) {
        window.Telemetry.recordEvent('OBJECTIVE', 'Purifier Core retrieved! Deliver to Landmark.');
      }
    }
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = Math.sin(performance.now() / 180) * 3;

    ctx.fillStyle = 'rgba(236, 201, 75, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 8 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d69e2e';
    ctx.strokeStyle = '#faf089';
    ctx.lineWidth = 2;
    ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CORE', 0, 4);

    ctx.restore();
  }
}

class WorldManager {
  constructor() {
    this.nests = [];
    this.obstacles = [];
    this.chests = [];
    const lm = window.CONFIG.WORLD.landmarkPos;
    this.landmark = new Landmark(lm.x, lm.y);
    this.coreDrop = null;
    this.transferActive = false;
    this.transferTimer = 0;
    this.transferTotalTime = 25.0;

    this.spawnInitialNests();
    this.spawnRuinsAndChests();
  }

  spawnInitialNests() {
    const count = window.CONFIG.WORLD.nestCountRing1;
    const maxDist = (window.CONFIG.WORLD && window.CONFIG.WORLD.ring1Radius * 0.9) || 36000;

    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.4;
      const dist = 1500 + Math.random() * (maxDist - 1500);
      const nx = Math.cos(angle) * dist;
      const ny = Math.sin(angle) * dist;
      this.nests.push(new CorruptedNest(nx, ny));

      if (i % 2 === 0) {
        this.obstacles.push(new ObstacleWall(nx - 70, ny - 60, 140, 24));
      }
    }
  }

  spawnRuinsAndChests() {
    const clusterCount = (window.CONFIG && window.CONFIG.WORLD && window.CONFIG.WORLD.ruinsClusterCount) || 180;
    const chestChance = (window.CONFIG && window.CONFIG.WORLD && window.CONFIG.WORLD.chestSpawnChance) || 0.65;
    const maxDist = (window.CONFIG && window.CONFIG.WORLD && window.CONFIG.WORLD.ring1Radius * 0.92) || 37000;

    for (let c = 0; c < clusterCount; c++) {
      const angle = (c * Math.PI * 2) / clusterCount + (Math.random() - 0.5) * 0.4;
      const dist = 1100 + Math.random() * (maxDist - 1100);
      const cx = Math.cos(angle) * dist;
      const cy = Math.sin(angle) * dist;

      const w1 = 90 + Math.random() * 80;
      const h1 = 26 + Math.random() * 10;
      this.obstacles.push(new ObstacleWall(cx - w1 / 2, cy - h1 / 2, w1, h1));

      const w2 = 26 + Math.random() * 10;
      const h2 = 80 + Math.random() * 70;
      this.obstacles.push(new ObstacleWall(cx + (Math.random() > 0.5 ? 50 : -50), cy - h2 / 2, w2, h2));

      if (Math.random() < chestChance) {
        this.chests.push(new LootChest(cx + (Math.random() - 0.5) * 60, cy + (Math.random() - 0.5) * 60));
      }
    }

    const lm = this.landmark;
    this.obstacles.push(new ObstacleWall(lm.x - 140, lm.y - 120, 280, 28));
    this.obstacles.push(new ObstacleWall(lm.x - 140, lm.y + 92, 280, 28));
    this.obstacles.push(new ObstacleWall(lm.x - 140, lm.y - 92, 28, 184));
    this.chests.push(new LootChest(lm.x + 80, lm.y));
  }

  spawnCore(x, y) {
    this.coreDrop = new CorePickup(x, y);
  }

  startRemoteTransfer() {
    if (this.transferActive || !this.landmark.repaired) return;
    this.transferActive = true;
    this.transferTimer = this.transferTotalTime;
    if (window.camera) window.camera.addTrauma(0.5);
    if (window.Telemetry) {
      window.Telemetry.recordEvent('SURGE', 'Scrap Transfer started! 25s Survival Surge!');
    }
  }

  completeRemoteTransfer() {
    this.transferActive = false;
    const m = window.Telemetry.metrics;

    const scrapSecured = m.resourcesCollected.techScrap;
    window.MetaProgression.bankedTechScrap += scrapSecured;
    m.resourcesBanked.techScrap += scrapSecured;
    m.resourcesCollected.techScrap = 0;

    window.saveMetaProgression();

    if (window.camera) window.camera.addTrauma(0.6);
    if (window.Telemetry) {
      window.Telemetry.recordEvent('BANK', `Secured +${scrapSecured} Tech Scrap in Sanctuary Vault!`);
    }
  }

  fastTravelToHubWithTax(player) {
    if (!this.landmark.repaired) return;

    const dist = Math.hypot(this.landmark.x, this.landmark.y);
    const taxRate = Math.min(window.CONFIG.ECONOMY.maxDistanceTax, (dist / 1000) * window.CONFIG.ECONOMY.distanceTaxRatePer1000px);

    const m = window.Telemetry.metrics;
    const scrapKept = Math.floor(m.resourcesCollected.techScrap * (1 - taxRate));

    window.MetaProgression.bankedTechScrap += scrapKept;
    m.resourcesBanked.techScrap += scrapKept;
    m.resourcesCollected.techScrap = 0;

    window.saveMetaProgression();

    player.x = 0;
    player.y = 0;

    if (window.Telemetry) {
      window.Telemetry.recordEvent('TRAVEL', `Fast traveled home! Banked ${scrapKept} Scrap (Tax: ${Math.round(taxRate * 100)}%).`);
    }
  }

  update(dt, player, enemyManager) {
    for (const wall of this.obstacles) {
      wall.resolveCircleCollision(player);
    }

    for (let i = this.nests.length - 1; i >= 0; i--) {
      this.nests[i].update(dt, player, enemyManager);
      if (!this.nests[i].alive) {
        this.nests.splice(i, 1);
      }
    }

    if (this.coreDrop && this.coreDrop.alive) {
      this.coreDrop.update(player);
    }

    if (player.carryingCore && !this.landmark.repaired) {
      if (Math.hypot(player.x - this.landmark.x, player.y - this.landmark.y) < player.radius + this.landmark.radius) {
        this.landmark.repair(player);
      }
    }

    if (this.transferActive) {
      this.transferTimer -= dt;
      if (this.transferTimer <= 0) {
        this.completeRemoteTransfer();
      }
    }
  }

  render(ctx) {
    const viewLeft = window.camera ? window.camera.x - window.innerWidth / 2 - 100 : -2000;
    const viewRight = window.camera ? window.camera.x + window.innerWidth / 2 + 100 : 2000;
    const viewTop = window.camera ? window.camera.y - window.innerHeight / 2 - 100 : -2000;
    const viewBottom = window.camera ? window.camera.y + window.innerHeight / 2 + 100 : 2000;

    for (const wall of this.obstacles) {
      if (wall.x + wall.w >= viewLeft && wall.x <= viewRight && wall.y + wall.h >= viewTop && wall.y <= viewBottom) {
        wall.render(ctx);
      }
    }
    for (const chest of this.chests) {
      if (chest.x >= viewLeft && chest.x <= viewRight && chest.y >= viewTop && chest.y <= viewBottom) {
        chest.render(ctx);
      }
    }
    this.landmark.render(ctx);
    for (const nest of this.nests) {
      nest.render(ctx);
    }
    if (this.coreDrop && this.coreDrop.alive) {
      this.coreDrop.render(ctx);
    }
  }

  renderCompass(ctx, player, canvasWidth, canvasHeight) {
    let target = null;
    let label = '';
    let color = '#e53e3e';

    if (player.carryingCore && !this.landmark.repaired) {
      target = this.landmark;
      label = 'DELIVER CORE:';
      color = '#48bb78';
    } else if (this.coreDrop && this.coreDrop.alive) {
      target = this.coreDrop;
      label = 'PICKUP CORE:';
      color = '#ecc94b';
    } else if (!this.landmark.repaired) {
      const warden = window.enemyManager ? window.enemyManager.enemies.find(e => e.typeKey === 'warden' && e.alive) : null;
      if (warden) {
        target = warden;
        label = warden.isAwakened ? 'HIVE WARDEN:' : 'WARDEN LAIR:';
        color = '#f687b3';
      } else {
        target = this.landmark;
        label = 'MONUMENT:';
        color = '#cbd5e0';
      }
    } else {
      let closestDist = Infinity;
      for (const nest of this.nests) {
        const d = Math.hypot(nest.x - player.x, nest.y - player.y);
        if (d < closestDist) {
          closestDist = d;
          target = nest;
        }
      }
      label = 'NEST:';
      color = '#e53e3e';
    }

    if (!target) return;

    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const dist = Math.round(Math.hypot(target.x - player.x, target.y - player.y));
    const indicatorDist = 120;
    const indX = canvasWidth / 2 + Math.cos(angle) * indicatorDist;
    const indY = canvasHeight / 2 + Math.sin(angle) * indicatorDist;

    ctx.save();
    ctx.translate(indX, indY);
    ctx.rotate(angle);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = color;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${label} ${dist}m`, canvasWidth / 2, canvasHeight / 2 + 36);
  }
}

window.WorldManager = WorldManager;