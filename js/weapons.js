class Projectile {
  constructor(x, y, vx, vy, damage, range) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.maxRange = range;
    this.size = (window.CONFIG && window.CONFIG.WEAPONS && window.CONFIG.WEAPONS.blaster && window.CONFIG.WEAPONS.blaster.projectileSize) || 5;
    this.alive = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (Math.hypot(this.x - this.startX, this.y - this.startY) >= this.maxRange) {
      this.alive = false;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.strokeStyle = '#63b3ed';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.02, this.y - this.vy * 0.02);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class MortarShell {
  constructor(startX, startY, targetX, targetY, impactDamage, cloudRadius, cfg) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.x = startX;
    this.y = startY;
    this.impactDamage = impactDamage;
    this.cloudRadius = cloudRadius;
    this.cfg = cfg;

    this.flightTime = cfg.flightDuration;
    this.progress = 0;
    this.alive = true;
    this.peakHeight = 75;
  }

  update(dt, onDetonate) {
    this.progress += dt / this.flightTime;
    if (this.progress >= 1.0) {
      this.progress = 1.0;
      this.alive = false;
      onDetonate(this.targetX, this.targetY, this.impactDamage, this.cloudRadius, this.cfg);
      return;
    }

    this.x = this.startX + (this.targetX - this.startX) * this.progress;
    this.y = this.startY + (this.targetY - this.startY) * this.progress;
  }

  render(ctx) {
    const currentGroundY = this.y;
    const arcOffset = Math.sin(this.progress * Math.PI) * this.peakHeight;
    const drawY = currentGroundY - arcOffset;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(this.x, currentGroundY, 6 * (1 - this.progress * 0.3), 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38a169';
    ctx.strokeStyle = '#68d391';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, drawY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(104, 211, 145, 0.45)';
    ctx.beginPath();
    ctx.arc(this.x - (this.targetX - this.startX) * 0.02, drawY + 3, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class SporeCloud {
  constructor(x, y, radius, duration, dotDamage, tickRate, slowFactor) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.duration = duration;
    this.maxDuration = duration;
    this.dotDamage = dotDamage;
    this.tickRate = tickRate;
    this.tickTimer = 0;
    this.slowFactor = slowFactor;
    this.alive = true;
  }

  update(dt, enemies) {
    this.duration -= dt;
    if (this.duration <= 0) {
      this.alive = false;
      return;
    }

    this.tickTimer += dt;
    const doTick = this.tickTimer >= this.tickRate;
    if (doTick) {
      this.tickTimer = 0;
    }

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist <= this.radius + enemy.radius) {
        enemy.sporeSlowTimer = 0.25;
        enemy.sporeSlowMult = this.slowFactor;

        if (doTick) {
          enemy.takeDamage(this.dotDamage, this.x, this.y);
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const fadeAlpha = Math.min(1.0, this.duration / 0.5) * 0.32;
    const pulse = Math.sin(performance.now() / 200) * 3;

    ctx.fillStyle = `rgba(56, 161, 105, ${fadeAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(154, 230, 180, ${fadeAlpha * 1.5})`;
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 + (performance.now() / 1000);
      const pr = (this.radius * 0.55) + Math.sin(angle * 2) * 6;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * pr, Math.sin(angle) * pr, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = `rgba(104, 211, 145, ${fadeAlpha * 1.8})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }
}

class TechBlaster {
  constructor(owner) {
    this.owner = owner;
    this.cooldown = 0;
    this.cfg = window.CONFIG.WEAPONS.blaster;
    this.name = "Tech Blaster";
  }

  update(dt, enemies, projectiles) {
    if (this.cooldown > 0) this.cooldown -= dt;

    if (this.cooldown <= 0) {
      const target = this.findNearestEnemy(enemies);
      if (target) {
        this.fire(target, projectiles);
        this.cooldown = this.cfg.fireRate;
      }
    }
  }

  findNearestEnemy(enemies) {
    let closestEnemy = null;
    let closestDist = this.cfg.range;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestEnemy = enemy;
      }
    }
    return closestEnemy;
  }

  fire(target, projectiles) {
    const angle = Math.atan2(target.y - this.owner.y, target.x - this.owner.x);
    const vx = Math.cos(angle) * this.cfg.projectileSpeed;
    const vy = Math.sin(angle) * this.cfg.projectileSpeed;

    projectiles.push(new Projectile(
      this.owner.x,
      this.owner.y,
      vx,
      vy,
      this.cfg.damage,
      this.cfg.range
    ));
  }

  render() {}
}

class ScrapSaw {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.saw;
    this.currentAngle = 0;
    this.hitCooldowns = new Map();
    this.name = "Scrap Saw";
  }

  update(dt, enemies, projectiles, spawnParticles) {
    this.currentAngle += this.cfg.orbitSpeed * dt;

    for (const [enemy, timer] of this.hitCooldowns.entries()) {
      if (timer <= dt) this.hitCooldowns.delete(enemy);
      else this.hitCooldowns.set(enemy, timer - dt);
    }

    for (let b = 0; b < this.cfg.bladeCount; b++) {
      const bladeAngle = this.currentAngle + (b * (Math.PI * 2) / this.cfg.bladeCount);
      const bx = this.owner.x + Math.cos(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const by = this.owner.y + Math.sin(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(bx - enemy.x, by - enemy.y);
        if (dist < this.cfg.bladeRadius + enemy.radius) {
          if (!this.hitCooldowns.has(enemy)) {
            enemy.takeDamage(this.cfg.damage, this.owner.x, this.owner.y);
            this.hitCooldowns.set(enemy, 0.28);
            spawnParticles(bx, by);
          }
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    for (let b = 0; b < this.cfg.bladeCount; b++) {
      const bladeAngle = this.currentAngle + (b * (Math.PI * 2) / this.cfg.bladeCount);
      const bx = this.owner.x + Math.cos(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const by = this.owner.y + Math.sin(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      ctx.translate(bx, by);
      ctx.rotate(this.currentAngle * 4);

      ctx.fillStyle = '#cbd5e0';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      const teeth = 8;
      for (let i = 0; i < teeth * 2; i++) {
        const a = (i * Math.PI) / teeth;
        const r = i % 2 === 0 ? this.cfg.bladeRadius : this.cfg.bladeRadius * 0.65;
        const tx = Math.cos(a) * r;
        const ty = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4a5568';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(-this.currentAngle * 4);
      ctx.translate(-bx, -by);
    }
    ctx.restore();
  }
}

class BioSporeMortar {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.mortar;
    this.cooldown = 0;
    this.name = "Bio-Spore Mortar";
  }

  update(dt, enemies, shells) {
    if (this.cooldown > 0) this.cooldown -= dt;

    if (this.cooldown <= 0) {
      const clusterTarget = this.findBestClusterTarget(enemies);
      if (clusterTarget) {
        this.fire(clusterTarget, shells);
        this.cooldown = this.cfg.fireRate;
      }
    }
  }

  findBestClusterTarget(enemies) {
    let bestTarget = null;
    let maxClusterWeight = 0;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (d < this.cfg.minRange || d > this.cfg.maxRange) continue;

      let localWeight = 1;
      const neighbors = (window.enemyManager && window.enemyManager.grid)
        ? window.enemyManager.grid.getNearby(enemy.x, enemy.y, this.cfg.cloudRadius)
        : enemies;

      for (const other of neighbors) {
        if (!other.alive || other === enemy) continue;
        const crowdDist = Math.hypot(enemy.x - other.x, enemy.y - other.y);
        if (crowdDist <= this.cfg.cloudRadius) {
          localWeight++;
        }
      }

      if (localWeight > maxClusterWeight) {
        maxClusterWeight = localWeight;
        bestTarget = enemy;
      }
    }

    return bestTarget;
  }

  fire(target, shells) {
    shells.push(new MortarShell(
      this.owner.x,
      this.owner.y,
      target.x,
      target.y,
      this.cfg.damage,
      this.cfg.cloudRadius,
      this.cfg
    ));
  }

  render() {}
}

class TeslaArc {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.tesla;
    this.cooldown = 0;
    this.activeBolts = [];
    this.name = "Tesla Arc";
  }

  update(dt, enemies, projectiles, spawnParticles) {
    if (this.cooldown > 0) this.cooldown -= dt;

    for (let i = this.activeBolts.length - 1; i >= 0; i--) {
      this.activeBolts[i].life -= dt;
      if (this.activeBolts[i].life <= 0) {
        this.activeBolts.splice(i, 1);
      }
    }

    if (this.cooldown <= 0) {
      const primaryTarget = this.findInitialTarget(enemies);
      if (primaryTarget) {
        this.triggerChainDischarge(primaryTarget, enemies, spawnParticles);
        this.cooldown = this.cfg.cooldown;
      }
    }
  }

  findInitialTarget(enemies) {
    let closest = null;
    let closestDist = this.cfg.initialRange;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }
    return closest;
  }

  triggerChainDischarge(initialTarget, enemies, spawnParticles) {
    const hitChain = [initialTarget];
    let current = initialTarget;

    initialTarget.takeDamage(this.cfg.damage, this.owner.x, this.owner.y);
    if (spawnParticles) spawnParticles(initialTarget.x, initialTarget.y);

    let fromX = this.owner.x;
    let fromY = this.owner.y;

    this.activeBolts.push({
      fromX,
      fromY,
      toX: initialTarget.x,
      toY: initialTarget.y,
      life: 0.12,
      maxLife: 0.12
    });

    for (let step = 1; step < this.cfg.chainCount; step++) {
      let nextTarget = null;
      let nextDist = this.cfg.chainRange;

      for (const enemy of enemies) {
        if (!enemy.alive || hitChain.includes(enemy)) continue;
        const d = Math.hypot(enemy.x - current.x, enemy.y - current.y);
        if (d < nextDist) {
          nextDist = d;
          nextTarget = enemy;
        }
      }

      if (nextTarget) {
        hitChain.push(nextTarget);
        nextTarget.takeDamage(this.cfg.damage * 0.9, current.x, current.y);
        if (spawnParticles) spawnParticles(nextTarget.x, nextTarget.y);

        this.activeBolts.push({
          fromX: current.x,
          fromY: current.y,
          toX: nextTarget.x,
          toY: nextTarget.y,
          life: 0.12,
          maxLife: 0.12
        });
        current = nextTarget;
      } else {
        break;
      }
    }
  }

  render(ctx) {
    for (const bolt of this.activeBolts) {
      this.drawLightning(ctx, bolt.fromX, bolt.fromY, bolt.toX, bolt.toY, bolt.life / bolt.maxLife);
    }
  }

  drawLightning(ctx, x1, y1, x2, y2, alpha) {
    ctx.save();
    ctx.strokeStyle = `rgba(129, 230, 217, ${alpha})`;
    ctx.shadowColor = '#4fd1c5';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;

    const segments = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const lx = x1 + (x2 - x1) * t;
      const ly = y1 + (y2 - y1) * t;
      const offset = (Math.random() - 0.5) * 16;
      ctx.lineTo(lx + offset, ly + offset);
    }

    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}

class AegisDrones {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.drone;
    this.currentAngle = 0;
    this.fireTimer = 0;
    this.laserBeams = [];
    this.name = "Aegis Drones";
  }

  update(dt, enemies, projectiles, spawnParticles) {
    this.currentAngle += this.cfg.orbitSpeed * dt;
    this.fireTimer += dt;

    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      this.laserBeams[i].life -= dt;
      if (this.laserBeams[i].life <= 0) {
        this.laserBeams.splice(i, 1);
      }
    }

    const canFire = this.fireTimer >= this.cfg.fireRate;
    if (canFire) this.fireTimer = 0;

    const count = this.cfg.droneCount;
    for (let i = 0; i < count; i++) {
      const droneAngle = this.currentAngle + (i * (Math.PI * 2) / count);
      const dx = this.owner.x + Math.cos(droneAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const dy = this.owner.y + Math.sin(droneAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const contactDist = Math.hypot(dx - enemy.x, dy - enemy.y);
        if (contactDist < 20 + enemy.radius) {
          enemy.takeDamage(this.cfg.pushbackDamage * dt * 2.5, dx, dy);
          const pushAngle = Math.atan2(enemy.y - dy, enemy.x - dx);
          enemy.x += Math.cos(pushAngle) * 90 * dt;
          enemy.y += Math.sin(pushAngle) * 90 * dt;
        }
      }

      if (canFire) {
        let nearestEnemy = null;
        let nearestDist = this.cfg.firingRange;

        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const dist = Math.hypot(dx - enemy.x, dy - enemy.y);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestEnemy = enemy;
          }
        }

        if (nearestEnemy) {
          nearestEnemy.takeDamage(this.cfg.damage, dx, dy);
          if (spawnParticles) spawnParticles(nearestEnemy.x, nearestEnemy.y);

          this.laserBeams.push({
            fromX: dx,
            fromY: dy,
            toX: nearestEnemy.x,
            toY: nearestEnemy.y,
            life: 0.08,
            maxLife: 0.08
          });
        }
      }
    }
  }

  render(ctx) {
    const count = this.cfg.droneCount;

    for (const beam of this.laserBeams) {
      const alpha = beam.life / beam.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(246, 173, 85, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(beam.fromX, beam.fromY);
      ctx.lineTo(beam.toX, beam.toY);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < count; i++) {
      const droneAngle = this.currentAngle + (i * (Math.PI * 2) / count);
      const dx = this.owner.x + Math.cos(droneAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const dy = this.owner.y + Math.sin(droneAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(droneAngle + Math.PI / 2);

      ctx.fillStyle = '#2d3748';
      ctx.strokeStyle = '#ed8936';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(6, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f6ad55';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}

class PlasmaPurifier {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.flamer;
    this.particles = [];
    this.spawnTimer = 0;
    this.name = "Plasma Purifier";
  }

  update(dt, enemies) {
    this.spawnTimer += dt;
    const baseAngle = this.owner.facingAngle;

    if (this.spawnTimer >= 0.03) {
      this.spawnTimer = 0;
      for (let i = 0; i < 3; i++) {
        const spread = (Math.random() - 0.5) * this.cfg.spreadAngle;
        const speed = 190 + Math.random() * 120;
        this.particles.push({
          x: this.owner.x + Math.cos(baseAngle) * (this.owner.radius * 0.7),
          y: this.owner.y + Math.sin(baseAngle) * (this.owner.radius * 0.7),
          vx: Math.cos(baseAngle + spread) * speed,
          vy: Math.sin(baseAngle + spread) * speed,
          life: 0.38,
          maxLife: 0.38,
          size: 4 + Math.random() * 5
        });
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    const halfSpread = this.cfg.spreadAngle / 2;
    const currentRange = this.cfg.range * this.owner.growthScale;
    const currentRangeSq = currentRange * currentRange;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x - this.owner.x;
      const dy = enemy.y - this.owner.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= currentRangeSq) {
        const angleToEnemy = Math.atan2(dy, dx);
        let diff = Math.abs(angleToEnemy - baseAngle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;

        if (diff <= halfSpread) {
          enemy.takeDamage(this.cfg.damage * dt, this.owner.x, this.owner.y);
          enemy.plasmaBurnTimer = this.cfg.burnDuration;
          enemy.plasmaBurnDmg = this.cfg.burnDamage;
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    for (const p of this.particles) {
      const ratio = p.life / p.maxLife;
      const radius = p.size * (1 - ratio * 0.3);

      if (ratio > 0.6) {
        ctx.fillStyle = `rgba(255, 255, 255, ${ratio})`;
      } else if (ratio > 0.3) {
        ctx.fillStyle = `rgba(246, 173, 85, ${ratio * 0.9})`;
      } else {
        ctx.fillStyle = `rgba(229, 62, 62, ${ratio * 0.7})`;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class VoltHurricane {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.voltHurricane;
    this.currentAngle = 0;
    this.hitCooldowns = new Map();
    this.activeBolts = [];
    this.name = "Volt Hurricane";
    this.isEvolution = true;
    this.slotCost = 1;
  }

  update(dt, enemies, projectiles, spawnParticles) {
    this.currentAngle += this.cfg.orbitSpeed * dt;

    for (let i = this.activeBolts.length - 1; i >= 0; i--) {
      this.activeBolts[i].life -= dt;
      if (this.activeBolts[i].life <= 0) {
        this.activeBolts.splice(i, 1);
      }
    }

    for (const [enemy, timer] of this.hitCooldowns.entries()) {
      if (timer <= dt) this.hitCooldowns.delete(enemy);
      else this.hitCooldowns.set(enemy, timer - dt);
    }

    const count = this.cfg.bladeCount;
    for (let b = 0; b < count; b++) {
      const bladeAngle = this.currentAngle + (b * (Math.PI * 2) / count);
      const bx = this.owner.x + Math.cos(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const by = this.owner.y + Math.sin(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(bx - enemy.x, by - enemy.y);
        if (dist < 16 + enemy.radius) {
          if (!this.hitCooldowns.has(enemy)) {
            enemy.takeDamage(this.cfg.damage, bx, by);
            this.hitCooldowns.set(enemy, 0.22);
            if (spawnParticles) spawnParticles(bx, by);

            this.triggerDischarge(bx, by, enemy, enemies, spawnParticles);
          }
        }
      }
    }
  }

  triggerDischarge(fromX, fromY, hitEnemy, enemies, spawnParticles) {
    let current = hitEnemy;
    const hitChain = [hitEnemy];

    for (let i = 0; i < this.cfg.chainTargets; i++) {
      let nextTarget = null;
      let nextDist = this.cfg.chainRange;

      for (const other of enemies) {
        if (!other.alive || hitChain.includes(other)) continue;
        const d = Math.hypot(other.x - current.x, other.y - current.y);
        if (d < nextDist) {
          nextDist = d;
          nextTarget = other;
        }
      }

      if (nextTarget) {
        hitChain.push(nextTarget);
        nextTarget.takeDamage(this.cfg.chainDamage, current.x, current.y);
        if (spawnParticles) spawnParticles(nextTarget.x, nextTarget.y);

        this.activeBolts.push({
          fromX: current.x,
          fromY: current.y,
          toX: nextTarget.x,
          toY: nextTarget.y,
          life: 0.1,
          maxLife: 0.1
        });
        current = nextTarget;
      } else {
        break;
      }
    }
  }

  render(ctx) {
    for (const bolt of this.activeBolts) {
      const alpha = bolt.life / bolt.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(129, 230, 217, ${alpha})`;
      ctx.shadowColor = '#4fd1c5';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bolt.fromX, bolt.fromY);
      ctx.lineTo(bolt.toX, bolt.toY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    const count = this.cfg.bladeCount;
    for (let b = 0; b < count; b++) {
      const bladeAngle = this.currentAngle + (b * (Math.PI * 2) / count);
      const bx = this.owner.x + Math.cos(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);
      const by = this.owner.y + Math.sin(bladeAngle) * (this.cfg.orbitRadius * this.owner.growthScale);

      ctx.translate(bx, by);
      ctx.rotate(this.currentAngle * 6);

      ctx.fillStyle = '#81e6d9';
      ctx.strokeStyle = '#e6fffa';
      ctx.lineWidth = 2;

      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8;
        const r = i % 2 === 0 ? 15 : 9;
        const tx = Math.cos(a) * r;
        const ty = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#234e52';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(-this.currentAngle * 6);
      ctx.translate(-bx, -by);
    }
    ctx.restore();
  }
}

class IncineratorShell {
  constructor(startX, startY, targetX, targetY, cfg) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.x = startX;
    this.y = startY;
    this.cfg = cfg;
    this.flightTime = cfg.flightDuration;
    this.progress = 0;
    this.alive = true;
    this.peakHeight = 85;
  }

  update(dt, onDetonate) {
    this.progress += dt / this.flightTime;
    if (this.progress >= 1.0) {
      this.progress = 1.0;
      this.alive = false;
      onDetonate(this.targetX, this.targetY, this.cfg);
      return;
    }
    this.x = this.startX + (this.targetX - this.startX) * this.progress;
    this.y = this.startY + (this.targetY - this.startY) * this.progress;
  }

  render(ctx) {
    const currentGroundY = this.y;
    const arcOffset = Math.sin(this.progress * Math.PI) * this.peakHeight;
    const drawY = currentGroundY - arcOffset;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(this.x, currentGroundY, 8 * (1 - this.progress * 0.3), 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dd6b20';
    ctx.strokeStyle = '#fbd38d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(this.x, drawY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#48bb78';
    ctx.beginPath();
    ctx.arc(this.x, drawY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class CleansingAshZone {
  constructor(x, y, cfg) {
    this.x = x;
    this.y = y;
    this.cfg = cfg;
    this.duration = cfg.zoneDuration;
    this.radius = cfg.zoneRadius;
    this.alive = true;
  }

  update(dt, enemies, player) {
    this.duration -= dt;
    if (this.duration <= 0) {
      this.alive = false;
      return;
    }

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (d <= this.radius + enemy.radius) {
        enemy.takeDamage(this.cfg.zoneDamage * dt, this.x, this.y);
        enemy.sporeSlowTimer = 0.2;
        enemy.sporeSlowMult = this.cfg.slowFactor;
      }
    }

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    if (distToPlayer <= this.radius + player.radius) {
      player.heal(this.cfg.healPerSec * dt);
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const fadeAlpha = Math.min(1.0, this.duration / 0.6) * 0.38;
    const pulse = Math.sin(performance.now() / 150) * 4;

    ctx.fillStyle = `rgba(221, 107, 32, ${fadeAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(72, 187, 120, ${fadeAlpha * 1.3})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.55 + pulse * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(246, 224, 94, ${fadeAlpha * 1.8})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }
}

class BiomassIncinerator {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.biomassIncinerator;
    this.cooldown = 0;
    this.shells = [];
    this.zones = [];
    this.name = "Biomass Incinerator";
    this.isEvolution = true;
    this.slotCost = 1;
  }

  update(dt, enemies, projectiles, spawnParticles) {
    if (this.cooldown > 0) this.cooldown -= dt;

    if (this.cooldown <= 0) {
      const clusterTarget = this.findBestClusterTarget(enemies);
      if (clusterTarget) {
        this.fire(clusterTarget);
        this.cooldown = this.cfg.fireRate;
      }
    }

    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.update(dt, (tx, ty, cfg) => {
        this.detonateShell(tx, ty, cfg, enemies, spawnParticles);
      });
      if (!s.alive) this.shells.splice(i, 1);
    }

    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.update(dt, enemies, this.owner);
      if (!z.alive) this.zones.splice(i, 1);
    }
  }

  findBestClusterTarget(enemies) {
    let best = null;
    let maxWeight = 0;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (d < this.cfg.minRange || d > this.cfg.maxRange) continue;

      let weight = 1;
      const neighbors = (window.enemyManager && window.enemyManager.grid)
        ? window.enemyManager.grid.getNearby(enemy.x, enemy.y, this.cfg.zoneRadius)
        : enemies;

      for (const other of neighbors) {
        if (!other.alive || other === enemy) continue;
        if (Math.hypot(enemy.x - other.x, enemy.y - other.y) <= this.cfg.zoneRadius) {
          weight++;
        }
      }

      if (weight > maxWeight) {
        maxWeight = weight;
        best = enemy;
      }
    }
    return best;
  }

  fire(target) {
    this.shells.push(new IncineratorShell(this.owner.x, this.owner.y, target.x, target.y, this.cfg));
  }

  detonateShell(x, y, cfg, enemies, spawnParticles) {
    let killCount = 0;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (Math.hypot(enemy.x - x, enemy.y - y) <= cfg.zoneRadius + enemy.radius) {
        const wasAlive = enemy.alive;
        enemy.takeDamage(cfg.impactDamage, x, y);
        if (wasAlive && !enemy.alive) killCount++;
      }
    }

    const isMultiKill = killCount >= 3;
    const bonusScale = isMultiKill ? Math.min(1.7, 1.0 + (killCount * 0.09)) : 1.0;

    if (window.spawnShockwave) {
      window.spawnShockwave(x, y, {
        radius: 14,
        maxRadius: (cfg.zoneRadius * 1.4) * bonusScale,
        color: isMultiKill ? '#fed7aa' : '#f6ad55',
        speed: 380 * bonusScale,
        lineWidth: isMultiKill ? 8.5 : 6.5
      });
    }

    const traumaAmount = 0.44 + (isMultiKill ? Math.min(0.38, killCount * 0.06) : 0);
    const hitStopAmount = 0.038 + (isMultiKill ? Math.min(0.045, killCount * 0.008) : 0);

    if (window.camera) window.camera.addTrauma(traumaAmount);
    if (window.triggerHitStop) window.triggerHitStop(hitStopAmount);

    if (window.decalManager) {
      window.decalManager.addScorch(x, y, cfg.zoneRadius * 0.75 * bonusScale);
      window.decalManager.addSplatter(x, y, { type: 'amber', radius: cfg.zoneRadius * 0.45 * bonusScale, count: 14 + killCount * 2 });
    }

    this.zones.push(new CleansingAshZone(x, y, cfg));

    if (spawnParticles) {
      for (let i = 0; i < 20; i++) {
        spawnParticles(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
      }
    }
  }

  render(ctx) {
    for (const z of this.zones) z.render(ctx);
    for (const s of this.shells) s.render(ctx);
  }
}

class HyperionProjectile {
  constructor(x, y, vx, vy, damage, range, maxPierce) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.maxRange = range;
    this.size = 7;
    this.pierceLeft = maxPierce;
    this.hitEnemies = new Set();
    this.alive = true;
  }

  update(dt, enemies, spawnParticles) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (Math.hypot(this.x - this.startX, this.y - this.startY) >= this.maxRange) {
      this.alive = false;
      return;
    }

    if (window.worldManager && window.worldManager.obstacles) {
      for (const wall of window.worldManager.obstacles) {
        if (Math.abs(wall.x - this.x) < 200 && Math.abs(wall.y - this.y) < 200) {
          const hit = wall.intersectsProjectile ? wall.intersectsProjectile(this, dt) : (wall.intersectsPoint && wall.intersectsPoint(this.x, this.y));
          if (hit) {
            this.alive = false;
            if (spawnParticles) spawnParticles(this.x, this.y);
            return;
          }
        }
      }
    }

    for (const enemy of enemies) {
      if (!enemy.alive || this.hitEnemies.has(enemy)) continue;
      const d = Math.hypot(this.x - enemy.x, this.y - enemy.y);
      if (d <= this.size + enemy.radius) {
        enemy.takeDamage(this.damage, this.x - this.vx, this.y - this.vy);
        this.hitEnemies.add(enemy);
        if (spawnParticles) spawnParticles(this.x, this.y);
        this.pierceLeft--;
        if (this.pierceLeft <= 0) {
          this.alive = false;
          break;
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.strokeStyle = '#63b3ed';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.03, this.y - this.vy * 0.03);
    ctx.stroke();

    ctx.fillStyle = '#ebf8ff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class HyperionTurret {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.hyperionTurret;
    this.cooldown = 0;
    this.salvoTimer = 0;
    this.orbitAngle = 0;
    this.projectiles = [];
    this.name = "Hyperion Turret";
    this.isEvolution = true;
    this.slotCost = 1;
  }

  update(dt, enemies, globalProjectiles, spawnParticles) {
    this.orbitAngle += 1.2 * dt;
    if (this.cooldown > 0) this.cooldown -= dt;
    this.salvoTimer += dt;

    const tx = this.owner.x + Math.cos(this.orbitAngle) * (60 * this.owner.growthScale);
    const ty = this.owner.y + Math.sin(this.orbitAngle) * (60 * this.owner.growthScale);

    if (this.cooldown <= 0) {
      const target = this.findNearestEnemy(tx, ty, enemies);
      if (target) {
        this.fire(tx, ty, target);
        this.cooldown = this.cfg.fireRate;
      }
    }

    if (this.salvoTimer >= this.cfg.salvoCooldown) {
      this.salvoTimer = 0;
      this.triggerSalvo(tx, ty);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, enemies, spawnParticles);
      if (!p.alive) this.projectiles.splice(i, 1);
    }
  }

  findNearestEnemy(fromX, fromY, enemies) {
    let nearest = null;
    let minDist = this.cfg.range;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - fromX, enemy.y - fromY);
      if (d < minDist) {
        minDist = d;
        nearest = enemy;
      }
    }
    return nearest;
  }

  fire(fromX, fromY, target) {
    const angle = Math.atan2(target.y - fromY, target.x - fromX);
    const vx = Math.cos(angle) * this.cfg.projectileSpeed;
    const vy = Math.sin(angle) * this.cfg.projectileSpeed;
    this.projectiles.push(new HyperionProjectile(
      fromX, fromY, vx, vy, this.cfg.damage, this.cfg.range, this.cfg.pierceCount
    ));
  }

  triggerSalvo(fromX, fromY) {
    if (window.spawnShockwave) {
      window.spawnShockwave(fromX, fromY, { radius: 15, maxRadius: 140, color: '#63b3ed', speed: 440, lineWidth: 4.5 });
    }
    if (window.camera) window.camera.addTrauma(0.32);

    const count = this.cfg.salvoCount;
    for (let i = 0; i < count; i++) {
      const a = (i * Math.PI * 2) / count;
      const vx = Math.cos(a) * (this.cfg.projectileSpeed * 0.85);
      const vy = Math.sin(a) * (this.cfg.projectileSpeed * 0.85);
      this.projectiles.push(new HyperionProjectile(
        fromX, fromY, vx, vy, this.cfg.salvoDamage, 280, 1
      ));
    }
  }

  render(ctx) {
    for (const p of this.projectiles) p.render(ctx);

    const tx = this.owner.x + Math.cos(this.orbitAngle) * (60 * this.owner.growthScale);
    const ty = this.owner.y + Math.sin(this.orbitAngle) * (60 * this.owner.growthScale);

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(this.orbitAngle + Math.PI / 2);

    ctx.fillStyle = '#1a365d';
    ctx.strokeStyle = '#63b3ed';
    ctx.lineWidth = 2;
    ctx.fillRect(-10, -10, 20, 20);
    ctx.strokeRect(-10, -10, 20, 20);

    ctx.fillStyle = '#90cdf4';
    ctx.fillRect(-6, -16, 4, 10);
    ctx.fillRect(2, -16, 4, 10);

    ctx.fillStyle = '#ecc94b';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class StormSporeCloud {
  constructor(x, y, cfg) {
    this.x = x;
    this.y = y;
    this.cfg = cfg;
    this.duration = cfg.cloudDuration;
    this.radius = cfg.cloudRadius;
    this.dotTimer = 0;
    this.chainTimer = 0;
    this.activeArcs = [];
    this.alive = true;
  }

  update(dt, enemies, player, spawnParticles) {
    this.duration -= dt;
    if (this.duration <= 0) {
      this.alive = false;
      return;
    }

    for (let i = this.activeArcs.length - 1; i >= 0; i--) {
      this.activeArcs[i].life -= dt;
      if (this.activeArcs[i].life <= 0) this.activeArcs.splice(i, 1);
    }

    this.dotTimer += dt;
    const doDot = this.dotTimer >= this.cfg.dotTickRate;
    if (doDot) this.dotTimer = 0;

    const trappedEnemies = [];
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (d <= this.radius + enemy.radius) {
        enemy.sporeSlowTimer = 0.2;
        enemy.sporeSlowMult = this.cfg.slowFactor;
        trappedEnemies.push(enemy);
        if (doDot) enemy.takeDamage(this.cfg.dotDamage, this.x, this.y);
      }
    }

    if (Math.hypot(player.x - this.x, player.y - this.y) <= this.radius + player.radius) {
      if (player.shieldCharges < player.maxShieldCharges) {
        player.shieldTimer += dt * 0.35;
      }
    }

    this.chainTimer += dt;
    if (this.chainTimer >= this.cfg.chainInterval && trappedEnemies.length > 0) {
      this.chainTimer = 0;
      const source = trappedEnemies[Math.floor(Math.random() * trappedEnemies.length)];

      let target = null;
      let targetDist = 170;
      for (const enemy of enemies) {
        if (!enemy.alive || enemy === source) continue;
        const d = Math.hypot(enemy.x - source.x, enemy.y - source.y);
        if (d < targetDist) {
          targetDist = d;
          target = enemy;
        }
      }

      if (target) {
        target.takeDamage(this.cfg.chainDamage, source.x, source.y);
        if (spawnParticles) spawnParticles(target.x, target.y);
        this.activeArcs.push({
          fromX: source.x,
          fromY: source.y,
          toX: target.x,
          toY: target.y,
          life: 0.12,
          maxLife: 0.12
        });
      }
    }
  }

  render(ctx) {
    for (const arc of this.activeArcs) {
      const alpha = arc.life / arc.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(129, 230, 217, ${alpha})`;
      ctx.shadowColor = '#4fd1c5';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arc.fromX, arc.fromY);
      ctx.lineTo(arc.toX, arc.toY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    const fadeAlpha = Math.min(1.0, this.duration / 0.6) * 0.35;
    const pulse = Math.sin(performance.now() / 160) * 4;

    ctx.fillStyle = `rgba(72, 187, 120, ${fadeAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(129, 230, 217, ${fadeAlpha * 1.6})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = `rgba(226, 232, 240, ${fadeAlpha * 1.8})`;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + (performance.now() / 400);
      const pr = this.radius * 0.45;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * pr, Math.sin(a) * pr, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class StormSpore {
  constructor(owner) {
    this.owner = owner;
    this.cfg = window.CONFIG.WEAPONS.stormSpore;
    this.cooldown = 0;
    this.shells = [];
    this.clouds = [];
    this.name = "Storm Spore";
    this.isEvolution = true;
    this.slotCost = 1;
  }

  update(dt, enemies, globalProjectiles, spawnParticles) {
    if (this.cooldown > 0) this.cooldown -= dt;

    if (this.cooldown <= 0) {
      const target = this.findClusterTarget(enemies);
      if (target) {
        this.fire(target);
        this.cooldown = this.cfg.fireRate;
      }
    }

    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.update(dt, (tx, ty, cfg) => {
        this.detonateShell(tx, ty, cfg, enemies, spawnParticles);
      });
      if (!s.alive) this.shells.splice(i, 1);
    }

    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const c = this.clouds[i];
      c.update(dt, enemies, this.owner, spawnParticles);
      if (!c.alive) this.clouds.splice(i, 1);
    }
  }

  findClusterTarget(enemies) {
    let best = null;
    let maxWeight = 0;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (d < this.cfg.minRange || d > this.cfg.maxRange) continue;

      let weight = 1;
      for (const other of enemies) {
        if (!other.alive || other === enemy) continue;
        if (Math.hypot(enemy.x - other.x, enemy.y - other.y) <= this.cfg.cloudRadius) {
          weight++;
        }
      }
      if (weight > maxWeight) {
        maxWeight = weight;
        best = enemy;
      }
    }
    return best;
  }

  fire(target) {
    this.shells.push(new IncineratorShell(this.owner.x, this.owner.y, target.x, target.y, this.cfg));
  }

  detonateShell(x, y, cfg, enemies, spawnParticles) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (Math.hypot(enemy.x - x, enemy.y - y) <= cfg.cloudRadius + enemy.radius) {
        enemy.takeDamage(cfg.impactDamage, x, y);
      }
    }

    this.clouds.push(new StormSporeCloud(x, y, cfg));

    if (spawnParticles) {
      for (let i = 0; i < 16; i++) {
        spawnParticles(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
      }
    }
  }

  render(ctx) {
    for (const c of this.clouds) c.render(ctx);
    for (const s of this.shells) s.render(ctx);
  }
}

class WeaponManager {
  constructor(owner) {
    this.owner = owner;
    this.slots = [new TechBlaster(owner)];
    this.maxSlots = 6;
    this.projectiles = [];
    this.mortarShells = [];
    this.sporeClouds = [];
    this.particles = [];
  }

  hasWeapon(name) {
    return this.slots.some(w => w.name === name);
  }

  addWeapon(weaponInstance) {
    if (this.slots.length < this.maxSlots) {
      this.slots.push(weaponInstance);
      return true;
    }
    return false;
  }

  evolveWeapons(evolutionKey) {
    const evo = window.CONFIG.EVOLUTIONS[evolutionKey];
    if (!evo) return false;

    const hasAll = evo.ingredients.every(name => this.hasWeapon(name));
    if (!hasAll) return false;

    this.slots = this.slots.filter(w => !evo.ingredients.includes(w.name));

    if (evo.resultWeapon === 'Volt Hurricane') {
      this.slots.push(new VoltHurricane(this.owner));
    } else if (evo.resultWeapon === 'Biomass Incinerator') {
      this.slots.push(new BiomassIncinerator(this.owner));
    } else if (evo.resultWeapon === 'Hyperion Turret') {
      this.slots.push(new HyperionTurret(this.owner));
    } else if (evo.resultWeapon === 'Storm Spore') {
      this.slots.push(new StormSpore(this.owner));
    }

    if (window.Telemetry) {
      window.Telemetry.recordEvent('EVOLUTION', `WEAPON EVOLVED: ${evo.name}! Slot compressed.`);
    }
    return true;
  }

  reset() {
    this.slots = [new TechBlaster(this.owner)];
    this.projectiles = [];
    this.mortarShells = [];
    this.sporeClouds = [];
    this.particles = [];
  }

  update(dt, enemies) {
    for (const enemy of enemies) {
      if (enemy.sporeSlowTimer && enemy.sporeSlowTimer > 0) {
        enemy.sporeSlowTimer -= dt;
        enemy.currentSlow = enemy.sporeSlowMult || 0.55;
      } else {
        enemy.currentSlow = 1.0;
      }
    }

    for (const weapon of this.slots) {
      if (weapon instanceof ScrapSaw) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else if (weapon instanceof BioSporeMortar) {
        weapon.update(dt, enemies, this.mortarShells);
      } else if (weapon instanceof TeslaArc) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else if (weapon instanceof AegisDrones) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else if (weapon instanceof PlasmaPurifier) {
        weapon.update(dt, enemies);
      } else if (weapon instanceof VoltHurricane) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else if (weapon instanceof BiomassIncinerator) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else if (weapon instanceof HyperionTurret) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else if (weapon instanceof StormSpore) {
        weapon.update(dt, enemies, this.projectiles, (x, y) => this.spawnImpactParticles(x, y));
      } else {
        weapon.update(dt, enemies, this.projectiles);
      }
    }

    for (let i = this.mortarShells.length - 1; i >= 0; i--) {
      const shell = this.mortarShells[i];
      shell.update(dt, (tx, ty, impactDmg, cloudRadius, cfg) => {
        this.detonateSporeShell(tx, ty, impactDmg, cloudRadius, cfg, enemies);
      });
      if (!shell.alive) {
        this.mortarShells.splice(i, 1);
      }
    }

    for (let i = this.sporeClouds.length - 1; i >= 0; i--) {
      const cloud = this.sporeClouds[i];
      cloud.update(dt, enemies);
      if (!cloud.alive) {
        this.sporeClouds.splice(i, 1);
      }
    }

    // Проверка пуль с двойной страховкой от падения
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);

      let hitWall = false;
      if (window.worldManager && window.worldManager.obstacles) {
        for (const wall of window.worldManager.obstacles) {
          if (Math.abs(wall.x - p.x) < 220 && Math.abs(wall.y - p.y) < 220) {
            const isHit = wall.intersectsProjectile ? wall.intersectsProjectile(p, dt) : (wall.intersectsPoint && wall.intersectsPoint(p.x, p.y));
            if (isHit) {
              p.alive = false;
              this.spawnImpactParticles(p.x, p.y);
              hitWall = true;
              break;
            }
          }
        }
      }

      if (hitWall) {
        this.projectiles.splice(i, 1);
        continue;
      }

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (dist < p.size + enemy.radius) {
          enemy.takeDamage(p.damage, p.x - p.vx, p.y - p.vy);
          this.spawnImpactParticles(p.x, p.y);
          p.alive = false;
          break;
        }
      }

      if (!p.alive) {
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  detonateSporeShell(x, y, impactDmg, radius, cfg, enemies) {
    let killCount = 0;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - x, enemy.y - y);
      if (d <= radius + enemy.radius) {
        const wasAlive = enemy.alive;
        enemy.takeDamage(impactDmg, x, y);
        if (wasAlive && !enemy.alive) killCount++;
      }
    }

    const isMultiKill = killCount >= 3;
    const bonusScale = isMultiKill ? Math.min(1.6, 1.0 + (killCount * 0.08)) : 1.0;

    if (window.spawnShockwave) {
      window.spawnShockwave(x, y, {
        radius: 10,
        maxRadius: (radius * 1.3) * bonusScale,
        color: isMultiKill ? '#9ae6b4' : '#48bb78',
        speed: 340 * bonusScale,
        lineWidth: isMultiKill ? 7 : 5
      });
    }

    const traumaAmount = 0.34 + (isMultiKill ? Math.min(0.35, killCount * 0.05) : 0);
    const hitStopAmount = 0.028 + (isMultiKill ? Math.min(0.04, killCount * 0.007) : 0);

    if (window.camera) window.camera.addTrauma(traumaAmount);
    if (window.triggerHitStop) window.triggerHitStop(hitStopAmount);

    if (window.decalManager) {
      window.decalManager.addSplatter(x, y, { type: 'slime', radius: radius * 0.6 * bonusScale, count: 12 + killCount * 2 });
      window.decalManager.addScorch(x, y, radius * 0.45 * bonusScale);
    }

    this.sporeClouds.push(new SporeCloud(
      x,
      y,
      radius,
      cfg.cloudDuration,
      cfg.dotDamage,
      cfg.dotTickRate,
      cfg.slowFactor
    ));

    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45,
        maxLife: 0.45,
        color: '#68d391'
      });
    }
  }

  spawnImpactParticles(x, y) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.2,
        maxLife: 0.2,
        color: '#63b3ed'
      });
    }
  }

  render(ctx) {
    for (const cloud of this.sporeClouds) cloud.render(ctx);
    for (const shell of this.mortarShells) shell.render(ctx);
    for (const p of this.projectiles) p.render(ctx);
    for (const w of this.slots) w.render(ctx);

    for (const pt of this.particles) {
      const alpha = pt.life / pt.maxLife;
      ctx.fillStyle = pt.color ? pt.color : `rgba(99, 179, 237, ${alpha})`;
      ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
    }
  }
}

window.WeaponManager = WeaponManager;
window.TechBlaster = TechBlaster;
window.ScrapSaw = ScrapSaw;
window.BioSporeMortar = BioSporeMortar;
window.TeslaArc = TeslaArc;
window.AegisDrones = AegisDrones;
window.PlasmaPurifier = PlasmaPurifier;
window.VoltHurricane = VoltHurricane;
window.BiomassIncinerator = BiomassIncinerator;
window.HyperionTurret = HyperionTurret;
window.StormSpore = StormSpore;