import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  PLAYER_SPEED, PLAYER_MAX_HP, PLAYER_FIRE_RATE,
  PLAYER_BULLET_SPEED, PIXEL_SIZE
} from '../constants.js';
import { drawSprite } from '../utils/SpriteRenderer.js';

// ---------------------------------------------------------------------------
// Pixel sprite definitions — 8 cols × 8 rows, scale = PIXEL_SIZE (3)
// Origin drawn at (-4s, -3s) so the body-center aligns with world position.
// Player faces RIGHT at angle 0 (gun tip is on the right side).
// ---------------------------------------------------------------------------
const _ = null;
const H = '#88eeff'; // head
const h = '#55ccee'; // head shadow
const B = '#0099cc'; // body
const b = '#007aaa'; // body shadow
const L = '#005577'; // legs
const G = '#aaaaaa'; // gun metal
const E = '#dddddd'; // gun tip highlight

// Walk frame 0 — neutral / left foot forward
const FRAME_0 = [
  [_, _, H, H, H, H, _, _],
  [_, H, H, h, h, H, H, _],
  [_, B, B, B, B, B, B, _],
  [_, B, b, b, b, G, G, E],  // gun row — gun extends right past body
  [_, B, B, B, B, B, B, _],
  [_, L, L, _, _, L, L, _],
  [_, L, L, _, _, L, L, _],
  [_, _, _, _, _, _, _, _],
];

// Walk frame 1 — right foot forward (legs shifted)
const FRAME_1 = [
  [_, _, H, H, H, H, _, _],
  [_, H, H, h, h, H, H, _],
  [_, B, B, B, B, B, B, _],
  [_, B, b, b, b, G, G, E],
  [_, B, B, B, B, B, B, _],
  [_, _, L, L, L, L, _, _],
  [L, _, L, L, L, L, _, L],
  [_, _, _, _, _, _, _, _],
];

const FRAMES        = [FRAME_0, FRAME_1];
const SPRITE_COLS   = 8;
const SPRITE_ROWS   = 8;
const ANIM_SPEED    = 0.14; // seconds per walk frame
const GUN_LENGTH    = 22;   // px from center to gun tip (for bullet spawn)
const INVULN_TIME   = 1.0;  // seconds of invincibility after taking a hit

export class Player {
  constructor(x, y) {
    this.x          = x;
    this.y          = y;
    this.angle      = 0;           // radians — points toward mouse
    this.hp         = PLAYER_MAX_HP;
    this.maxHp      = PLAYER_MAX_HP;

    // Firing
    this.fireCooldown = 0;

    // Animation
    this.animFrame  = 0;
    this.animTimer  = 0;
    this.isMoving   = false;

    // Damage / invincibility
    this.invuln     = 0;
    this.hitFlash   = 0;           // white flash duration

    // Muzzle flash (for GameScene to read)
    this.justFired  = false;

    // Collision (axis-aligned bounding box centered at x,y)
    this.width      = 20;
    this.height     = 20;

    this.active     = true;
  }

  /** World position of the gun tip, used to spawn bullets. */
  get gunTip() {
    return {
      x: this.x + Math.cos(this.angle) * GUN_LENGTH,
      y: this.y + Math.sin(this.angle) * GUN_LENGTH,
    };
  }

  /**
   * @param {number}      dt
   * @param {InputManager} input
   * @param {ObjectPool}  bulletPool
   * @param {number}      fireRate  - seconds between shots (from GameScene)
   */
  update(dt, input, bulletPool, fireRate) {
    this.justFired = false;

    // --- Movement ---
    let dx = 0, dy = 0;
    if (input.isDown('ArrowLeft')  || input.isDown('KeyA')) dx -= 1;
    if (input.isDown('ArrowRight') || input.isDown('KeyD')) dx += 1;
    if (input.isDown('ArrowUp')    || input.isDown('KeyW')) dy -= 1;
    if (input.isDown('ArrowDown')  || input.isDown('KeyS')) dy += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

    this.isMoving = dx !== 0 || dy !== 0;

    const half = Math.max(this.width, this.height) / 2;
    this.x = Math.max(half, Math.min(CANVAS_WIDTH  - half, this.x + dx * PLAYER_SPEED * dt));
    this.y = Math.max(half, Math.min(CANVAS_HEIGHT - half, this.y + dy * PLAYER_SPEED * dt));

    // --- Aim at mouse ---
    this.angle = Math.atan2(input.mouse.y - this.y, input.mouse.x - this.x);

    // --- Shoot ---
    this.fireCooldown -= dt;
    if (input.isMouseDown() && this.fireCooldown <= 0) {
      this.fireCooldown = fireRate;
      const tip    = this.gunTip;
      const bullet = bulletPool.get();
      bullet.fire(tip.x, tip.y, this.angle, PLAYER_BULLET_SPEED, true);
      this.justFired = true;
    }

    // --- Timers ---
    if (this.invuln   > 0) this.invuln   -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // --- Walk animation ---
    if (this.isMoving) {
      this.animTimer += dt;
      if (this.animTimer >= ANIM_SPEED) {
        this.animTimer = 0;
        this.animFrame = 1 - this.animFrame;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  /**
   * Apply damage. Returns true if damage was actually taken.
   * Ignores hits while invulnerable.
   */
  takeDamage(amount) {
    if (this.invuln > 0) return false;
    this.hp        = Math.max(0, this.hp - amount);
    this.invuln    = INVULN_TIME;
    this.hitFlash  = 0.12;
    return true;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  draw(ctx) {
    const s = PIXEL_SIZE;
    // Offset so body-center aligns with (this.x, this.y)
    const offX = -(SPRITE_COLS / 2) * s;
    const offY = -(SPRITE_ROWS / 2) * s + s; // nudge up slightly

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Blink while invulnerable
    if (this.invuln > 0 && Math.floor(this.invuln * 10) % 2 === 1) {
      ctx.globalAlpha = 0.35;
    }

    if (this.hitFlash > 0) {
      // White tint on hit
      ctx.globalAlpha = 1;
      ctx.save();
      // Draw normal sprite then overlay white
      drawSprite(ctx, FRAMES[this.animFrame], offX, offY, s);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(offX, offY, SPRITE_COLS * s, SPRITE_ROWS * s);
      ctx.restore();
    } else {
      drawSprite(ctx, FRAMES[this.animFrame], offX, offY, s);
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
