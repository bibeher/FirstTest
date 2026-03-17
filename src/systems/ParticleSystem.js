import { ObjectPool } from '../utils/ObjectPool.js';

// ---------------------------------------------------------------------------
// Single particle — pooled, no external deps
// ---------------------------------------------------------------------------
class Particle {
  constructor() {
    this.x           = 0;
    this.y           = 0;
    this.vx          = 0;
    this.vy          = 0;
    this.color       = '#ffffff';
    this.size        = 3;
    this.alpha       = 1;
    this.lifetime    = 0;
    this.maxLifetime = 0.5;
    this.friction    = 0.88;
    this.active      = false;
  }

  spawn(x, y, vx, vy, color, size, lifetime, friction = 0.88) {
    this.x           = x;
    this.y           = y;
    this.vx          = vx;
    this.vy          = vy;
    this.color       = color;
    this.size        = size;
    this.lifetime    = lifetime;
    this.maxLifetime = lifetime;
    this.friction    = friction;
    this.alpha       = 1;
    this.active      = true;
  }

  update(dt) {
    if (!this.active) return;
    this.x        += this.vx * dt;
    this.y        += this.vy * dt;
    this.vx       *= this.friction;
    this.vy       *= this.friction;
    this.lifetime -= dt;
    this.alpha     = Math.max(0, this.lifetime / this.maxLifetime);
    if (this.lifetime <= 0) this.active = false;
  }

  draw(ctx) {
    if (!this.active || this.alpha <= 0) return;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = this.color;
    const h = this.size / 2;
    ctx.fillRect(this.x - h, this.y - h, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------------
// ParticleSystem — manages a pool of particles
// ---------------------------------------------------------------------------
export class ParticleSystem {
  constructor(poolSize = 300) {
    this._pool = new ObjectPool(() => new Particle(), poolSize);
  }

  /**
   * Death burst: 10-14 particles exploding outward.
   * @param {string} color  - primary color (secondary: white)
   */
  spawnDeath(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle    = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.6;
      const speed    = 70 + Math.random() * 140;
      const size     = 3 + Math.random() * 4;
      const lifetime = 0.35 + Math.random() * 0.45;
      const p        = this._pool.get();
      p.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, size, lifetime, 0.86);
    }
    // Bright white flash shards
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      const p     = this._pool.get();
      p.spawn(
        x + (Math.random() - 0.5) * 6,
        y + (Math.random() - 0.5) * 6,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        '#ffffff', 2, 0.15 + Math.random() * 0.15, 0.9
      );
    }
  }

  /**
   * Hit spark: 4 small sparks on bullet impact (non-lethal hit).
   */
  spawnHit(x, y, color = '#ffffff') {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 90;
      const p     = this._pool.get();
      p.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        color, 2, 0.12 + Math.random() * 0.1, 0.85);
    }
  }

  /**
   * Pickup collect: upward sparkle burst.
   */
  spawnPickup(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 40 + Math.random() * 80;
      const p     = this._pool.get();
      p.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        i % 2 === 0 ? '#00ff44' : '#ffffff',
        2 + Math.random() * 2, 0.4 + Math.random() * 0.3, 0.9);
    }
  }

  update(dt) { this._pool.update(dt); }
  draw(ctx)   { this._pool.draw(ctx); }
}
