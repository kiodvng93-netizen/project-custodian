class Player {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 18;
    this.growthScale = 1.0;
    this.facingAngle = 0;

    this.applyMetaUpgrades();

        this.invulnerableTimer = 0;
    this.healthRegenRate = 0.5;
    this.carryingCore = false;
    this.godMode = false;

        // Механика рывка (Space Dash) — чтение из CONFIG
    const dashCfg = window.CONFIG.PLAYER.DASH || { speed: 740, duration: 0.22, cooldown: 2.2, iFrames: 0.28 };
    this.dashCooldown = dashCfg.cooldown;
    this.dashTimer = 0;
    this.isDashing = false;
    this.dashTimeLeft = 0;
    this.dashSpeed = dashCfg.speed;
    this.dashDuration = dashCfg.duration;
    this.dashIFrames = dashCfg.iFrames;
    this.dashDirX = 0;
    this.dashDirY = 0;
    this.afterimages = [];

    // Круиз-контроль для дальних переходов — чтение из CONFIG
    const cruiseCfg = window.CONFIG.PLAYER.CRUISE || { activationTime: 2.2, speedMultiplier: 1.45 };
    this.cruiseActivationTime = cruiseCfg.activationTime;
    this.cruiseSpeedMultiplier = cruiseCfg.speedMultiplier;
    this.cruiseTimer = 0;
    this.isCruising = false;

    this.level = 1;
    this.xp = 0;
    this.xpToNext = 4;

    this.keys = { up: false, down: false, left: false, right: false };
    this.bindInputs();
  }

  applyMetaUpgrades() {
    const perks = (window.MetaProgression && window.MetaProgression.perks) ? window.MetaProgression.perks : { chassisArmor: 0, engineSpeed: 0, shieldCapacitor: 0 };

    this.speed = window.CONFIG.PLAYER.baseSpeed + (perks.engineSpeed * 8);
    this.maxHealth = window.CONFIG.PLAYER.baseHealth + (perks.chassisArmor * 15);
    this.health = this.maxHealth;
    this.maxShieldCharges = window.CONFIG.PLAYER.baseShieldCharges;
    this.shieldCharges = this.maxShieldCharges;
    this.shieldTimer = 0;
    this.shieldRechargeTime = Math.max(12.0, window.CONFIG.PLAYER.shieldRechargeTime - (perks.shieldCapacitor * 2.0));
  }

    bindInputs() {
    window.addEventListener('keydown', (e) => {
      this.handleKey(e.code, true);
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerDash();
      }
    });
    window.addEventListener('keyup', (e) => this.handleKey(e.code, false));
  }

  handleKey(code, pressed) {
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = pressed;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = pressed;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = pressed;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = pressed;
  }

  triggerDash() {
    if (this.dashTimer > 0 || this.isDashing) return;

    let dx = 0, dy = 0;
    if (this.keys.left) dx -= 1;
    if (this.keys.right) dx += 1;
    if (this.keys.up) dy -= 1;
    if (this.keys.down) dy += 1;

    if (dx === 0 && dy === 0) {
      dx = Math.cos(this.facingAngle);
      dy = Math.sin(this.facingAngle);
    } else {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

        this.isDashing = true;
    this.dashTimeLeft = this.dashDuration;
    this.dashTimer = this.dashCooldown;
    this.dashDirX = dx;
    this.dashDirY = dy;
    this.invulnerableTimer = Math.max(this.invulnerableTimer, this.dashIFrames);

    const traumaVal = (window.CONFIG.JUICE && window.CONFIG.JUICE.trauma.dash) || 0.20;
    if (window.camera) window.camera.addTrauma(traumaVal);
    if (window.spawnShockwave) {
      const swR = (window.CONFIG.PLAYER.DASH && window.CONFIG.PLAYER.DASH.shockwaveRadius) || 55;
      window.spawnShockwave(this.x, this.y, { radius: 8, maxRadius: swR, color: '#63b3ed', speed: 280, lineWidth: 3.5 });
    }
  }

  addXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.25) + 2;
      return true;
    }
    return false;
  }

  grow() {
    this.growthScale = Math.min(1.35, this.growthScale + 0.04);
    this.radius = 18 * this.growthScale;
  }

  takeDamage(amount = 20) {
    if (this.godMode) return;
    if (this.invulnerableTimer > 0) return;

        if (this.shieldCharges > 0) {
      this.shieldCharges--;
      this.invulnerableTimer = 0.7;
      this.shieldTimer = 0;
      window.Telemetry.metrics.shieldHitsAbsorbed++;
      this.pushCrowdBack(80, 160);

      if (window.spawnShockwave) {
        window.spawnShockwave(this.x, this.y, { radius: 15, maxRadius: 150, color: '#4299e1', speed: 420, lineWidth: 6 });
      }
      if (window.camera) window.camera.addTrauma(0.48);
      if (window.triggerHitStop) window.triggerHitStop(0.04);
      return;
    }

    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = 0.65;
    window.Telemetry.metrics.damageTaken += amount;
    this.pushCrowdBack(85, 220);

    if (window.camera) window.camera.addTrauma(0.75);
    if (window.triggerHitStop) window.triggerHitStop(0.06);

    if (this.health <= 0) {
      if (window.camera) window.camera.addTrauma(0.95);
      if (window.triggerHitStop) window.triggerHitStop(0.12);
      this.die();
    }
  }

  pushCrowdBack(radius, force) {
    if (!window.enemyManager) return;
    for (const e of window.enemyManager.enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < radius + e.radius) {
        e.x += (dx / d) * force * 0.15;
        e.y += (dy / d) * force * 0.15;
      }
    }
  }

  heal(amount = 15) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  die() {
    window.Telemetry.metrics.deaths++;
    window.Telemetry.metrics.resourcesLostOnDeath.techScrap += window.Telemetry.metrics.resourcesCollected.techScrap;
    window.Telemetry.metrics.resourcesCollected.techScrap = 0;
    window.Telemetry.metrics.resourcesCollected.bioEssence = 0;

    window.Telemetry.recordEvent('DEATH', 'Robot destroyed! Lost unbanked scrap.');

    this.resetRunProgression();

    if (window.triggerFullRunRestart) {
      window.triggerFullRunRestart();
    }
  }

  resetRunProgression() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 4;
    this.growthScale = 1.0;
    this.radius = 18;
    this.applyMetaUpgrades();
    this.healthRegenRate = 0.5;
    this.carryingCore = false;
    this.invulnerableTimer = 1.5;
  }

  update(dt) {
    let mx = 0, my = 0;
    if (this.keys.left) mx -= 1;
    if (this.keys.right) mx += 1;
    if (this.keys.up) my -= 1;
    if (this.keys.down) my += 1;

    if (mx !== 0 && my !== 0) {
      mx *= 0.7071;
      my *= 0.7071;
    }

    this.vx = mx * this.speed;
    this.vy = my * this.speed;

        const isMoving = mx !== 0 || my !== 0;

        // Круиз-контроль (разгон турбин на дальних переходах)
    if (isMoving && this.invulnerableTimer <= 0) {
      this.cruiseTimer += dt;
      this.isCruising = this.cruiseTimer >= this.cruiseActivationTime;
    } else {
      this.cruiseTimer = 0;
      this.isCruising = false;
    }

    const currentSpeed = this.speed * (this.isCruising ? this.cruiseSpeedMultiplier : 1.0);
    this.vx = mx * currentSpeed;
    this.vy = my * currentSpeed;

    // Обработка рывка [Space]
    if (this.dashTimer > 0) this.dashTimer -= dt;

    if (this.isDashing) {
      this.dashTimeLeft -= dt;
      this.vx = this.dashDirX * this.dashSpeed;
      this.vy = this.dashDirY * this.dashSpeed;

      this.afterimages.push({
        x: this.x,
        y: this.y,
        angle: this.facingAngle,
        radius: this.radius,
        alpha: 0.6
      });

      if (this.dashTimeLeft <= 0) {
        this.isDashing = false;
      }
    }

    const prevX = this.x;
    const prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    window.Telemetry.metrics.distanceTraveled += Math.round(Math.hypot(this.x - prevX, this.y - prevY));

    if (isMoving) {
      this.facingAngle = Math.atan2(my, mx);
    }

    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].alpha -= dt * 3.5;
      if (this.afterimages[i].alpha <= 0) this.afterimages.splice(i, 1);
    }

    if (this.shieldCharges < this.maxShieldCharges) {
      this.shieldTimer += dt;
      if (this.shieldTimer >= this.shieldRechargeTime) {
        this.shieldCharges++;
        this.shieldTimer = 0;
      }
    }

    if (this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + this.healthRegenRate * dt);
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
  }

    render(ctx) {
    // Отрисовка призрачного следа рывка
    for (const ghost of this.afterimages) {
      ctx.save();
      ctx.translate(ghost.x, ghost.y);
      ctx.rotate(ghost.angle);
      ctx.strokeStyle = `rgba(99, 179, 237, ${ghost.alpha * 0.7})`;
      ctx.fillStyle = `rgba(49, 130, 206, ${ghost.alpha * 0.35})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        if (i === 0) ctx.moveTo(Math.cos(a) * ghost.radius, Math.sin(a) * ghost.radius);
        else ctx.lineTo(Math.cos(a) * ghost.radius, Math.sin(a) * ghost.radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.invulnerableTimer > 0 && Math.floor(performance.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    if (this.godMode) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 15 + Math.sin(performance.now() / 100) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.carryingCore) {
      const corePulse = Math.sin(performance.now() / 150) * 3;
      ctx.strokeStyle = '#ecc94b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 12 + corePulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.shieldCharges > 0) {
      ctx.strokeStyle = '#4299e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 7 + Math.sin(performance.now() / 200) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.rotate(this.facingAngle);
    ctx.fillStyle = this.godMode ? '#d69e2e' : '#2b6cb0';
    ctx.strokeStyle = this.godMode ? '#fff' : '#e2e8f0';
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      if (i === 0) ctx.moveTo(Math.cos(a) * this.radius, Math.sin(a) * this.radius);
      else ctx.lineTo(Math.cos(a) * this.radius, Math.sin(a) * this.radius);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#63b3ed';
    ctx.beginPath();
    ctx.arc(this.radius * 0.65, 0, 4 * this.growthScale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.carryingCore ? '#ecc94b' : '#48bb78';
    ctx.beginPath();
    ctx.arc(0, 0, 5 * this.growthScale, 0, Math.PI * 2);
    ctx.fill();

        // Пламя форсажных турбин при круиз-контроле
    if (this.isCruising) {
      ctx.fillStyle = Math.random() > 0.5 ? '#f6ad55' : '#ed8936';
      ctx.beginPath();
      ctx.arc(-this.radius * 0.9, 0, 5 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    this.renderHUD(ctx);
  }

  renderHUD(ctx) {
    // Индикатор готовности рывка [Space] под роботом
    if (this.dashTimer > 0) {
      const cdRatio = 1 - (this.dashTimer / this.dashCooldown);
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y + this.radius + 10, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#63b3ed';
      ctx.beginPath();
      ctx.arc(this.x, this.y + this.radius + 10, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cdRatio);
      ctx.stroke();
    }
    const w = 38 * this.growthScale;
    const h = 4;
    const bx = this.x - w / 2;
    const by = this.y - this.radius - 14;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);

    ctx.fillStyle = this.health / this.maxHealth > 0.5 ? '#48bb78' : '#f56565';
    ctx.fillRect(bx, by, w * (this.health / this.maxHealth), h);

    for (let i = 0; i < this.maxShieldCharges; i++) {
      ctx.fillStyle = i < this.shieldCharges ? '#4299e1' : '#4a5568';
      ctx.fillRect(bx + i * 9, by - 7, 6, 6);
    }
  }
}

window.Player = Player;