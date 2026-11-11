class Gib {
  constructor(x, y, vx, vy, options = {}) {
    this.x = x;
    this.y = y;
    this.z = 2 + Math.random() * 8;
    this.vx = vx;
    this.vy = vy;
    this.vz = 90 + Math.random() * 140;
    this.gravity = -480;

    this.angle = Math.random() * Math.PI * 2;
    this.angularVelocity = (Math.random() - 0.5) * 16;
    this.friction = 0.88;

    this.size = options.size || (4 + Math.random() * 6);
    this.color = options.color || '#48bb78';
    this.outline = options.outline || '#276749';
    this.shape = options.shape || 'chunk';
    this.type = options.type || 'slime';

    this.alive = true;
    this.bouncesLeft = 2;
    this.stoppedTimer = 0;
  }

  update(dt, decalManager) {
    if (!this.alive) return;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const f = Math.pow(this.friction, dt * 60);
    this.vx *= f;
    this.vy *= f;
    this.angularVelocity *= f;
    this.angle += this.angularVelocity * dt;

    this.vz += this.gravity * dt;
    this.z += this.vz * dt;

    if (this.z <= 0) {
      this.z = 0;
      if (this.bouncesLeft > 0 && Math.abs(this.vz) > 40) {
        this.vz = -this.vz * 0.35;
        this.bouncesLeft--;
        this.vx *= 0.65;
        this.vy *= 0.65;

        if (decalManager && Math.random() < 0.6) {
          decalManager.addSplatter(this.x, this.y, {
            type: this.type,
            radius: this.size * 0.9,
            count: 3
          });
        }
      } else {
        this.vz = 0;
        const groundSpeed = Math.hypot(this.vx, this.vy);
        if (groundSpeed < 8) {
          this.stoppedTimer += dt;
          if (this.stoppedTimer >= 0.15) {
            this.bakePermanentDecal(decalManager);
            this.alive = false;
          }
        }
      }
    }
  }

  bakePermanentDecal(decalManager) {
    if (!decalManager) return;
    decalManager.paintOnWorld(this.x, this.y, this.size * 1.5, (ctx, lx, ly) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.outline;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.75, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  render(ctx) {
    if (!this.alive) return;

    // Тень на полу под осколком
    const shadowScale = Math.max(0.2, 1 - (this.z / 90));
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * shadowScale})`;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.size * shadowScale, (this.size * 0.5) * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Сам осколок на высоте Z
    ctx.save();
    ctx.translate(this.x, this.y - this.z);
    ctx.rotate(this.angle);

    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.outline;
    ctx.lineWidth = 1.2;

    if (this.shape === 'shard') {
      ctx.beginPath();
      ctx.moveTo(this.size * 1.4, 0);
      ctx.lineTo(-this.size * 0.8, -this.size * 0.6);
      ctx.lineTo(-this.size * 0.4, 0);
      ctx.lineTo(-this.size * 0.8, this.size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.shape === 'plate') {
      ctx.beginPath();
      ctx.rect(-this.size * 0.7, -this.size * 0.5, this.size * 1.4, this.size);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}

class GibManager {
  constructor() {
    this.gibs = [];
    this.maxGibs = 140;
  }

  spawnForEnemy(enemy, sourceX, sourceY) {
    let fatalAngle = Math.random() * Math.PI * 2;
    if (sourceX !== undefined && sourceY !== undefined) {
      fatalAngle = Math.atan2(enemy.y - sourceY, enemy.x - sourceX);
    }

    let count = 5;
    let baseSpeed = 190;
    let type = 'slime';
    let color = '#48bb78';
    let outline = '#22543d';
    let shape = 'chunk';

    if (enemy.typeKey === 'sprout') {
      count = 5;
      baseSpeed = 220;
      type = 'slime';
      color = '#68d391';
      outline = '#276749';
      shape = Math.random() > 0.5 ? 'shard' : 'chunk';
    } else if (enemy.typeKey === 'stalker') {
      count = 9;
      baseSpeed = 260;
      type = 'corrupt';
      color = '#e53e3e';
      outline = '#551a1a';
      shape = 'plate';
    } else if (enemy.typeKey === 'dasher') {
      count = 7;
      baseSpeed = 340;
      type = 'amber';
      color = '#ed8936';
      outline = '#7b341e';
      shape = 'shard';
    } else if (enemy.typeKey === 'warden') {
      count = 22;
      baseSpeed = 420;
      type = 'oil';
      color = '#f687b3';
      outline = '#702459';
      shape = 'plate';
    }

    for (let i = 0; i < count; i++) {
      if (this.gibs.length >= this.maxGibs) {
        const oldest = this.gibs.shift();
        if (window.decalManager) oldest.bakePermanentDecal(window.decalManager);
      }

      const spread = 0.95;
      const angle = fatalAngle + (Math.random() - 0.5) * spread;
      const speed = baseSpeed * (0.6 + Math.random() * 0.9);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.gibs.push(new Gib(enemy.x, enemy.y, vx, vy, {
        size: (enemy.radius * 0.28) + Math.random() * 3,
        color: i % 2 === 0 ? color : '#e2e8f0',
        outline,
        shape,
        type
      }));
    }
  }

  update(dt, decalManager) {
    for (let i = this.gibs.length - 1; i >= 0; i--) {
      const g = this.gibs[i];
      g.update(dt, decalManager);
      if (!g.alive) {
        this.gibs.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const g of this.gibs) {
      g.render(ctx);
    }
  }

  clear() {
    this.gibs = [];
  }
}

window.GibManager = GibManager;