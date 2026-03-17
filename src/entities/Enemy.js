import { drawSprite, drawSpriteTinted } from '../utils/SpriteRenderer.js';

/**
 * Base class for all enemies.
 * Subclasses override update() and draw(), calling _moveToward() and _drawSprite().
 */
export class Enemy {
  constructor(x, y, opts = {}) {
    this.x          = x;
    this.y          = y;
    this.hp         = opts.hp         ?? 1;
    this.maxHp      = this.hp;
    this.speed      = opts.speed      ?? 100;
    this.damage     = opts.damage     ?? 1;
    this.scoreValue = opts.scoreValue ?? 10;
    this.width      = opts.width      ?? 18;
    this.height     = opts.height     ?? 18;
    this.active     = true;
    this.hitFlash   = 0;           // countdown for white tint
    this.animFrame  = 0;
    this.animTimer  = 0;
    this.animSpeed  = opts.animSpeed  ?? 0.18;
    this.angle      = 0;           // radians toward player (used by Shooter)
    this.showHPBar  = opts.showHPBar ?? (this.maxHp > 1);
  }

  /** Move in a straight line toward (px, py). */
  _moveToward(dt, px, py) {
    const dx   = px - this.x;
    const dy   = py - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.angle = Math.atan2(dy, dx);
    if (dist > 1) {
      const inv = 1 / dist;
      this.x += dx * inv * this.speed * dt;
      this.y += dy * inv * this.speed * dt;
    }
  }

  /**
   * Apply damage.
   * @returns {boolean} true if the enemy just died
   */
  takeDamage(amount) {
    this.hp      -= amount;
    this.hitFlash = 0.1;
    if (this.hp <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }

  /** Advance animation frame timer and hitFlash. */
  _tickTimers(dt) {
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.animTimer += dt;
    if (this.animTimer >= this.animSpeed) {
      this.animTimer -= this.animSpeed;
      this.animFrame  = 1 - this.animFrame;
    }
  }

  /**
   * Draw a sprite (pixel array) centered at (this.x, this.y).
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array} frames   - [frame0, frame1]
   * @param {number} scale
   * @param {number} offX    - left edge offset from center (negative = cols*scale/2)
   * @param {number} offY    - top edge offset from center
   */
  _drawSprite(ctx, frames, scale, offX, offY) {
    const frame = frames[this.animFrame] ?? frames[0];
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.hitFlash > 0) {
      // Draw normal sprite, then overlay white using source-atop
      drawSprite(ctx, frame, offX, offY, scale);
      ctx.globalCompositeOperation = 'source-atop';
      const cols = frame[0].length, rows = frame.length;
      ctx.globalAlpha = Math.min(1, this.hitFlash / 0.05);
      ctx.fillStyle   = '#ffffff';
      ctx.fillRect(offX, offY, cols * scale, rows * scale);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    } else {
      drawSprite(ctx, frame, offX, offY, scale);
    }

    ctx.restore();
  }

  /** Draw an HP bar above the enemy. */
  _drawHPBar(ctx) {
    if (!this.showHPBar) return;
    const bw = this.width * 1.6;
    const bh = 4;
    const bx = this.x - bw / 2;
    const by = this.y - this.height / 2 - 8;

    // Background
    ctx.fillStyle = '#330000';
    ctx.fillRect(bx, by, bw, bh);

    // Fill — green → yellow → red
    const ratio = Math.max(0, this.hp / this.maxHp);
    const r     = Math.round(255 * (1 - ratio));
    const g     = Math.round(200 * ratio);
    ctx.fillStyle = `rgb(${r},${g},20)`;
    ctx.fillRect(bx, by, bw * ratio, bh);

    // Border
    ctx.strokeStyle = '#555555';
    ctx.lineWidth   = 0.5;
    ctx.strokeRect(bx, by, bw, bh);
  }
}
