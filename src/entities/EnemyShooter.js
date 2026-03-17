import { Enemy } from './Enemy.js';
import {
  ENEMY_SHOOTER_SPEED, ENEMY_SHOOTER_HP,
  ENEMY_SHOOTER_SIZE, ENEMY_SHOOTER_DAMAGE,
  ENEMY_SHOOTER_RANGE, ENEMY_SHOOTER_FIRE_RATE,
  ENEMY_BULLET_SPEED, SCORE_SHOOTER,
  WAVE_SPEED_SCALE, WAVE_HP_SCALE,
} from '../constants.js';

// ---------------------------------------------------------------------------
// Sprite: 8 cols × 7 rows, scale 3 → 24 × 21 px
// Floating purple crystalline form with glowing eyes.
// Two frames: normal vs "charged" (eyes brighten when about to fire).
// ---------------------------------------------------------------------------
const _ = null;
const P = '#cc44ff'; // purple
const p = '#882299'; // dark purple
const E = '#ffee00'; // eye
const e = '#ffffff'; // charged eye
const C = '#ee88ff'; // crystal highlight

// Frame 0 — normal
const FRAME_NORM = [
  [_, _, P, P, P, P, _, _],
  [_, P, p, p, p, p, P, _],
  [P, P, p, E, p, E, p, P],
  [P, p, C, p, p, p, p, P],
  [P, p, p, p, p, C, p, P],
  [_, P, p, p, p, p, P, _],
  [_, _, P, P, P, P, _, _],
];

// Frame 1 — charged (brighter eyes, slightly pulsed)
const FRAME_CHARGED = [
  [_, _, P, P, P, P, _, _],
  [_, P, p, C, C, p, P, _],
  [P, P, C, e, p, e, C, P],
  [P, p, C, p, p, p, p, P],
  [P, p, p, p, p, C, p, P],
  [_, P, p, C, C, p, P, _],
  [_, _, P, P, P, P, _, _],
];

const FRAMES_NORMAL  = [FRAME_NORM,    FRAME_NORM];
const FRAMES_CHARGED = [FRAME_CHARGED, FRAME_CHARGED];
const SCALE = 3;
const OFF_X = -4 * SCALE; // -12
const OFF_Y = -(3.5 * SCALE); // -10.5 → -11

const RETREAT_DIST = ENEMY_SHOOTER_RANGE - 60; // too close → back off

export class EnemyShooter extends Enemy {
  constructor(x, y, waveNum = 1) {
    const speedMult = 1 + (waveNum - 1) * WAVE_SPEED_SCALE;
    const hpMult    = 1 + (waveNum - 1) * WAVE_HP_SCALE;

    super(x, y, {
      hp:         Math.max(3, Math.round(ENEMY_SHOOTER_HP * hpMult)),
      speed:      Math.min(ENEMY_SHOOTER_SPEED * speedMult, ENEMY_SHOOTER_SPEED * 2),
      damage:     ENEMY_SHOOTER_DAMAGE,
      scoreValue: SCORE_SHOOTER,
      width:      ENEMY_SHOOTER_SIZE,
      height:     ENEMY_SHOOTER_SIZE,
      animSpeed:  0.4,
      showHPBar:  true,
    });

    this.deathColor   = '#cc44ff';
    this._shootState  = 'approaching'; // 'approaching' | 'shooting' | 'retreating'
    this._fireCooldown = 1.2;          // initial delay before first shot
    this._chargeTimer  = 0;            // shows charged frame near fire time
  }

  /** @param {ObjectPool|null} bulletPool */
  update(dt, playerX, playerY, bulletPool = null) {
    this._tickTimers(dt);

    const dx   = playerX - this.x;
    const dy   = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.angle = Math.atan2(dy, dx);

    // State transitions
    if (dist > ENEMY_SHOOTER_RANGE + 50) {
      this._shootState = 'approaching';
    } else if (dist < RETREAT_DIST) {
      this._shootState = 'retreating';
    } else if (this._shootState === 'approaching' && dist <= ENEMY_SHOOTER_RANGE) {
      this._shootState = 'shooting';
    }

    switch (this._shootState) {
      case 'approaching':
        this._moveToward(dt, playerX, playerY);
        break;

      case 'retreating': {
        // Move away from player
        const inv = 1 / (dist || 1);
        this.x -= dx * inv * this.speed * dt;
        this.y -= dy * inv * this.speed * dt;
        break;
      }

      case 'shooting':
        this._fireCooldown -= dt;
        this._chargeTimer   = Math.max(0, this._chargeTimer - dt);

        // Enter "charge" visual half a second before firing
        if (this._fireCooldown < 0.5) this._chargeTimer = this._fireCooldown;

        if (this._fireCooldown <= 0 && bulletPool) {
          this._fireCooldown = ENEMY_SHOOTER_FIRE_RATE;
          this._chargeTimer  = 0;

          const bullet = bulletPool.get();
          bullet.fire(this.x, this.y, this.angle, ENEMY_BULLET_SPEED, false);
          bullet.damage = 1;
        }
        break;
    }
  }

  draw(ctx) {
    const isCharging = this._chargeTimer > 0;
    const frames     = isCharging ? FRAMES_CHARGED : FRAMES_NORMAL;

    this._drawSprite(ctx, frames, SCALE, OFF_X, -11);

    // Gun line toward player when shooting
    if (this._shootState === 'shooting') {
      const alpha = isCharging ? 0.9 : 0.45;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.globalAlpha   = alpha;
      ctx.strokeStyle   = isCharging ? '#ffee00' : '#cc44ff';
      ctx.lineWidth     = isCharging ? 3 : 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(this.angle) * 18, Math.sin(this.angle) * 18);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    this._drawHPBar(ctx);
  }
}
