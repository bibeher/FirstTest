import { Enemy } from './Enemy.js';
import {
  ENEMY_BULLET_SPEED, SCORE_BOSS,
  WAVE_SPEED_SCALE,
} from '../constants.js';

// ---------------------------------------------------------------------------
// Sprite: 12 cols × 10 rows, scale 3 → 36 × 30 px
// Big armored boss with glowing eyes, two visual phases.
// ---------------------------------------------------------------------------
const _ = null;
const B = '#ff8800'; // orange armor
const b = '#aa4400'; // dark orange
const G = '#ffcc00'; // gold trim
const R = '#ff2200'; // eye / core red
const T = '#221100'; // tracks

// Phase 1 — normal red eyes
const FRAME_P1 = [
  [_, _, B, B, B, B, B, B, B, B, _, _],
  [_, B, B, G, G, G, G, G, G, B, B, _],
  [B, B, G, G, b, b, b, b, G, G, B, B],
  [B, B, G, b, b, R, R, b, b, G, B, B],
  [B, B, G, b, R, G, G, R, b, G, B, B],
  [B, B, G, b, R, G, G, R, b, G, B, B],
  [B, B, G, b, b, R, R, b, b, G, B, B],
  [B, B, G, G, b, b, b, b, G, G, B, B],
  [_, B, B, G, G, G, G, G, G, B, B, _],
  [T, T, _, T, T, T, T, T, T, _, T, T],
];

// Phase 2 — yellow blazing eyes (HP < 50%)
const Y = '#ffff00';
const FRAME_P2 = [
  [_, _, B, B, B, B, B, B, B, B, _, _],
  [_, B, B, G, G, G, G, G, G, B, B, _],
  [B, B, G, G, b, b, b, b, G, G, B, B],
  [B, B, G, b, b, Y, Y, b, b, G, B, B],
  [B, B, G, b, Y, G, G, Y, b, G, B, B],
  [B, B, G, b, Y, G, G, Y, b, G, B, B],
  [B, B, G, b, b, Y, Y, b, b, G, B, B],
  [B, B, G, G, b, b, b, b, G, G, B, B],
  [_, B, B, G, G, G, G, G, G, B, B, _],
  [T, T, _, T, T, T, T, T, T, _, T, T],
];

const SCALE     = 3;
const OFF_X     = -6 * SCALE;  // -18
const OFF_Y     = -5 * SCALE;  // -15
const CHARGE_SPEED = 160;
const CRUISE_SPEED = 90;
const SHOOT_SPEED  = 35;

export class EnemyBoss extends Enemy {
  constructor(x, y, waveNum = 5) {
    const tier = Math.floor(waveNum / 5);
    const hp   = Math.round(25 * (1 + (tier - 1) * 0.45));

    super(x, y, {
      hp,
      speed:      CRUISE_SPEED,
      damage:     1,
      scoreValue: SCORE_BOSS,
      width:      36,
      height:     30,
      animSpeed:  0.35,
      showHPBar:  false,    // drawn by HUD boss bar instead
    });

    this.isBoss     = true;
    this.deathColor = '#ff8800';

    // Behavior phases
    this._phase      = 'charge'; // 'charge' | 'shoot'
    this._phaseTimer = 3.0;
    this._fireCooldown = 1.0;
  }

  update(dt, px, py, bulletPool = null) {
    this._tickTimers(dt);

    const dx   = px - this.x;
    const dy   = py - this.y;
    this.angle = Math.atan2(dy, dx);

    const inPhase2 = this.hp / this.maxHp < 0.5;

    if (!inPhase2) {
      // ── Phase 1: relentless charge ──────────────────────────────────────
      this.speed = CRUISE_SPEED * (1 + (1 - this.hp / this.maxHp));
      this._moveToward(dt, px, py);
    } else {
      // ── Phase 2: charge → shoot cycle ───────────────────────────────────
      this._phaseTimer -= dt;

      if (this._phase === 'charge') {
        this.speed = CHARGE_SPEED;
        this._moveToward(dt, px, py);
        if (this._phaseTimer <= 0) {
          this._phase      = 'shoot';
          this._phaseTimer = 2.8;
          this._fireCooldown = 0.38;
        }
      } else {
        // shoot phase — slow drift, rapid spread fire
        this.speed = SHOOT_SPEED;
        this._moveToward(dt, px, py);
        this._fireCooldown -= dt;
        if (this._fireCooldown <= 0 && bulletPool) {
          this._fireCooldown = 0.38;
          // 3-way spread toward player
          for (let i = -1; i <= 1; i++) {
            const bullet = bulletPool.get();
            bullet.fire(this.x, this.y, this.angle + i * 0.22, ENEMY_BULLET_SPEED * 1.15, false);
            bullet.damage = 1;
          }
        }
        if (this._phaseTimer <= 0) {
          this._phase      = 'charge';
          this._phaseTimer = 3.2;
        }
      }
    }
  }

  draw(ctx) {
    const frame = this.hp / this.maxHp < 0.5 ? FRAME_P2 : FRAME_P1;

    // Pulse glow behind boss
    const pulse = 0.08 + Math.abs(Math.sin(Date.now() * 0.004)) * 0.1;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle   = this.hp / this.maxHp < 0.5 ? '#ffff00' : '#ff6600';
    ctx.fillRect(this.x - 22, this.y - 18, 44, 36);
    ctx.restore();
    ctx.globalAlpha = 1;

    // Sprite (reuses Enemy's _drawSprite with two-frame array)
    this._drawSprite(ctx, [frame, frame], SCALE, OFF_X, OFF_Y);

    // Phase 2 shoot indicator — dashed line toward player
    if (this._phase === 'shoot' && this.hp / this.maxHp < 0.5) {
      const chargeRatio = 1 - Math.max(0, this._fireCooldown / 0.38);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.globalAlpha   = 0.4 + chargeRatio * 0.5;
      ctx.strokeStyle   = '#ffff00';
      ctx.lineWidth     = 2;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(this.angle) * 24, Math.sin(this.angle) * 24);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }
}
