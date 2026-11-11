class Pickup {
  constructor(x, y, type = 'bio', value = 1) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 50;
    this.vy = (Math.random() - 0.5) * 50;
    this.type = type;
    this.value = value;
    this.radius = 6;
    this.alive = true;
    this.isMagnetized = false;
    this.homingSpeed = 220;
  }

  update(dt, player) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);

    if (dist <= window.CONFIG.PLAYER.pickupRadius) {
      this.isMagnetized = true;
    }

    if (this.isMagnetized) {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);

      this.homingSpeed = Math.min(
        this.homingSpeed + window.CONFIG.PICKUPS.magnetAcceleration * dt * 1.5,
        900
      );

      this.vx = Math.cos(angle) * this.homingSpeed;
      this.vy = Math.sin(angle) * this.homingSpeed;

      // Anti-tunneling snap: absorbs instantly if within step distance
      const stepDistance = this.homingSpeed * dt;
      if (dist <= stepDistance + this.radius + player.radius) {
        this.collect();
        return;
      }
    } else {
      this.vx *= 0.90;
      this.vy *= 0.90;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  collect() {
    this.alive = false;
    if (this.type === 'bio') {
      window.Telemetry.metrics.resourcesCollected.bioEssence += this.value;
      window.Telemetry.recordEvent('LOOT', `+${this.value} Bio-Essence collected!`);
    } else {
      window.Telemetry.metrics.resourcesCollected.techScrap += this.value;
      window.Telemetry.recordEvent('LOOT', `+${this.value} Tech Scrap collected!`);
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = Math.sin(performance.now() / 200) * 1.5;

    if (this.type === 'bio') {
      ctx.fillStyle = '#48bb78';
      ctx.strokeStyle = '#9ae6b4';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(0, -this.radius - pulse);
      ctx.lineTo(this.radius + pulse, 0);
      ctx.lineTo(0, this.radius + pulse);
      ctx.lineTo(-this.radius - pulse, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ecc94b';
      ctx.fillRect(-this.radius / 2, -this.radius / 2, this.radius, this.radius);
    }

    ctx.restore();
  }
}

class PickupManager {
  constructor() {
    this.pickups = [];
  }

  spawn(x, y, type = 'bio', val = 1) {
    this.pickups.push(new Pickup(x, y, type, val));
  }

  update(dt, player) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      this.pickups[i].update(dt, player);
      if (!this.pickups[i].alive) {
        this.pickups.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.pickups) {
      p.render(ctx);
    }
  }
}

window.PickupManager = PickupManager;