const LIFETIME    = 9;    // seconds before disappearing
const BLINK_START = 3;    // seconds left when blinking begins

export class HealthPickup {
  constructor(x, y) {
    this.x       = x;
    this.y       = y;
    this.width   = 14;
    this.height  = 14;
    this.active  = true;
    this.lifetime = LIFETIME;
    this._pulse   = Math.random() * Math.PI * 2; // random phase offset
  }

  update(dt) {
    if (!this.active) return;
    this.lifetime -= dt;
    this._pulse   += dt * 3.5;
    if (this.lifetime <= 0) this.active = false;
  }

  draw(ctx) {
    if (!this.active) return;

    // Rapid blink in final seconds
    if (this.lifetime < BLINK_START && Math.floor(this.lifetime * 7) % 2 === 0) return;

    const pulse = 0.65 + Math.sin(this._pulse) * 0.35;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Soft glow
    ctx.globalAlpha = 0.18 * pulse;
    ctx.fillStyle   = '#00ff44';
    ctx.fillRect(-11, -11, 22, 22);

    // Cross arms
    ctx.globalAlpha = pulse;
    ctx.fillStyle   = '#00ff44';
    ctx.fillRect(-7, -2, 14, 5);  // horizontal
    ctx.fillRect(-2, -7, 5, 14);  // vertical

    // Bright center pixel
    ctx.globalAlpha = 1;
    ctx.fillStyle   = '#aaffcc';
    ctx.fillRect(-2, -2, 4, 4);

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
