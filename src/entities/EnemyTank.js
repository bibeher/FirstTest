import { Enemy } from './Enemy.js';
import {
  ENEMY_TANK_SPEED, ENEMY_TANK_HP,
  ENEMY_TANK_SIZE, ENEMY_TANK_DAMAGE,
  SCORE_TANK, WAVE_SPEED_SCALE, WAVE_HP_SCALE,
} from '../constants.js';

// ---------------------------------------------------------------------------
// Sprite: 10 cols × 8 rows, scale 3 → 30 × 24 px
// Heavy armored unit viewed top-down; no walk animation (single frame)
// Damage visual: darker palette as HP drops
// ---------------------------------------------------------------------------
const _ = null;
const G = '#33bb44'; // green armor
const g = '#1a7a2a'; // dark green interior
const M = '#88aa88'; // metal trim
const C = '#66ee77'; // cockpit highlight
const T = '#112211'; // tracks

const FRAME_0 = [
  [_, _, G, G, G, G, G, G, _, _],
  [_, G, G, g, g, g, g, G, G, _],
  [G, G, g, g, g, g, g, g, G, G],
  [G, G, g, g, C, C, g, g, G, G],
  [G, G, g, g, C, C, g, g, G, G],
  [G, G, g, g, g, g, g, g, G, G],
  [_, G, G, g, g, g, g, G, G, _],
  [T, T, _, T, T, T, T, _, T, T],
];

// Damaged palette — used when HP < 50%
const Gd = '#226633';
const gd = '#113322';
const Cd = '#44cc55';
const FRAME_DAMAGED = [
  [_, _, Gd, Gd, Gd, Gd, Gd, Gd, _, _],
  [_, Gd, Gd, gd, gd, gd, gd, Gd, Gd, _],
  [Gd, Gd, gd, gd, gd, gd, gd, gd, Gd, Gd],
  [Gd, Gd, gd, gd, Cd, Cd, gd, gd, Gd, Gd],
  [Gd, Gd, gd, gd, Cd, Cd, gd, gd, Gd, Gd],
  [Gd, Gd, gd, gd, gd, gd, gd, gd, Gd, Gd],
  [_, Gd, Gd, gd, gd, gd, gd, Gd, Gd, _],
  [T,  T,  _, T,   T,  T,  T,  _, T,  T],
];

const FRAMES_HEALTHY  = [FRAME_0, FRAME_0]; // no walk anim
const FRAMES_DAMAGED  = [FRAME_DAMAGED, FRAME_DAMAGED];
const SCALE = 3;
const OFF_X = -5 * SCALE; // -15
const OFF_Y = -4 * SCALE; // -12

export class EnemyTank extends Enemy {
  constructor(x, y, waveNum = 1) {
    const speedMult = 1 + (waveNum - 1) * WAVE_SPEED_SCALE;
    const hpMult    = 1 + (waveNum - 1) * WAVE_HP_SCALE;

    super(x, y, {
      hp:         Math.max(5, Math.round(ENEMY_TANK_HP * hpMult)),
      speed:      Math.min(ENEMY_TANK_SPEED * speedMult, ENEMY_TANK_SPEED * 2.2),
      damage:     ENEMY_TANK_DAMAGE,
      scoreValue: SCORE_TANK,
      width:      ENEMY_TANK_SIZE,
      height:     ENEMY_TANK_SIZE,
      animSpeed:  9999, // effectively no animation
      showHPBar:  true,
    });
  }

  update(dt, playerX, playerY) {
    this._moveToward(dt, playerX, playerY);
    this._tickTimers(dt);
  }

  draw(ctx) {
    const isDamaged = this.hp / this.maxHp < 0.5;
    const frames    = isDamaged ? FRAMES_DAMAGED : FRAMES_HEALTHY;
    this._drawSprite(ctx, frames, SCALE, OFF_X, OFF_Y);
    this._drawHPBar(ctx);
  }
}
