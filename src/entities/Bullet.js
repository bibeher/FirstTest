import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PLAYER_BULLET_SPEED } from '../constants.js';

export class Bullet {
  constructor() {
    this.x              = 0;
    this.y              = 0;
    this.vx             = 0;
    this.vy             = 0;
    this.angle          = 0;
    this.active         = false;
    this.lifetime       = 0;
    this.maxLifetime    = 1.6;
    this.isPlayerBullet = true;
    this.damage         = 1;
    this.width          = 8;
    this.height         = 4;
  }

  fire(x, y, angle, speed, isPlayerBullet = true) {
    this.x              = x;
    this.y              = y;
    this.angle          = angle;
    this.vx             = Math.cos(angle) * speed;
    this.vy             = Math.sin(angle) * speed;
    this.active         = true;
    this.lifetime       = 0;
    this.isPlayerBullet = isPlayerBullet;
    this.damage         = 1;
  }

  update(dt) {
    if (!this.active) return;
    this.x        += this.vx * dt;
    this.y        += this.vy * dt;
    this.lifetime += dt;

    if (
      this.lifetime >= this.maxLifetime ||
      this.x < -16 || this.x > CANVAS_WIDTH  + 16 ||
      this.y < -16 || this.y > CANVAS_HEIGHT + 16
    ) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;

    const isPlayer = this.isPlayerBullet;
    const coreColor = isPlayer ? COLORS.BULLET       : '#ff7733';
    const glowColor = isPlayer ? COLORS.BULLET_GLOW  : '#ff3300';

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Glow trail
    ctx.globalAlpha = 0.35;
    ctx.fillStyle   = glowColor;
    ctx.fillRect(-10, -4, 20, 8);

    // Core
    ctx.globalAlpha = 1;
    ctx.fillStyle   = coreColor;
    ctx.fillRect(-6, -2, 12, 4);

    // Bright tip
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, -1, 3, 2);

    ctx.restore();
  }
}
