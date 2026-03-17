import { Enemy } from './Enemy.js';
import {
  ENEMY_RUNNER_SPEED, ENEMY_RUNNER_HP,
  ENEMY_RUNNER_SIZE, ENEMY_RUNNER_DAMAGE,
  SCORE_RUNNER, WAVE_SPEED_SCALE, WAVE_HP_SCALE,
} from '../constants.js';

// ---------------------------------------------------------------------------
// Sprite: 8 cols × 6 rows, scale 3 → 24 × 18 px
// Viewed top-down: round orange-red body, two yellow eyes, twitchy legs
// ---------------------------------------------------------------------------
const _ = null;
const R = '#ff5533'; // body red-orange
const r = '#cc2211'; // dark red
const Y = '#ffee00'; // eyes
const L = '#881100'; // legs / shadow

const FRAME_0 = [
  [_, _, R, R, R, R, _, _],
  [_, R, r, r, r, r, R, _],
  [R, R, r, Y, r, Y, r, R],
  [R, r, r, r, r, r, r, R],
  [_, R, R, R, R, R, R, _],
  [_, L, L, _, _, L, L, _],
];

const FRAME_1 = [
  [_, _, R, R, R, R, _, _],
  [_, R, r, r, r, r, R, _],
  [R, R, r, Y, r, Y, r, R],
  [R, r, r, r, r, r, r, R],
  [_, R, R, R, R, R, R, _],
  [L, _, _, L, L, _, _, L],
];

const FRAMES = [FRAME_0, FRAME_1];
const SCALE  = 3;
const OFF_X  = -4 * SCALE; // -12
const OFF_Y  = -3 * SCALE; // -9

export class EnemyRunner extends Enemy {
  constructor(x, y, waveNum = 1) {
    const speedMult = 1 + (waveNum - 1) * WAVE_SPEED_SCALE;
    const hpMult    = 1 + (waveNum - 1) * WAVE_HP_SCALE;

    super(x, y, {
      hp:         Math.max(1, Math.round(ENEMY_RUNNER_HP * hpMult)),
      speed:      Math.min(ENEMY_RUNNER_SPEED * speedMult, ENEMY_RUNNER_SPEED * 2.5),
      damage:     ENEMY_RUNNER_DAMAGE,
      scoreValue: SCORE_RUNNER,
      width:      ENEMY_RUNNER_SIZE,
      height:     ENEMY_RUNNER_SIZE,
      animSpeed:  0.15, // fast twitchy legs
      showHPBar:  false,
    });
  }

  update(dt, playerX, playerY) {
    this._moveToward(dt, playerX, playerY);
    this._tickTimers(dt);
  }

  draw(ctx) {
    this._drawSprite(ctx, FRAMES, SCALE, OFF_X, OFF_Y);
    this._drawHPBar(ctx);
  }
}
