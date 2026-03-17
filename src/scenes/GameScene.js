import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PLAYER_FIRE_RATE } from '../constants.js';
import { Player }     from '../entities/Player.js';
import { Bullet }     from '../entities/Bullet.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import { HUD }        from '../ui/HUD.js';

const GRID_STEP    = 40;
const MUZZLE_TIME  = 0.06; // seconds muzzle flash shows

export class GameScene {
  constructor(game) {
    this.game = game;
    this.hud  = new HUD();

    this.player     = null;
    this.bulletPool = null;

    this.score    = 0;
    this.wave     = 1;
    this.fireRate = PLAYER_FIRE_RATE;

    this.muzzleFlash = 0;   // countdown timer
    this.muzzlePos   = { x: 0, y: 0 };
  }

  enter(data = {}) {
    const cx = CANVAS_WIDTH  / 2;
    const cy = CANVAS_HEIGHT / 2;

    this.player     = new Player(cx, cy);
    this.bulletPool = new ObjectPool(() => new Bullet(), 40);

    this.score       = data.score    ?? 0;
    this.wave        = data.wave     ?? 1;
    this.fireRate    = data.fireRate ?? PLAYER_FIRE_RATE;
    this.muzzleFlash = 0;
  }

  exit() {
    if (this.bulletPool) this.bulletPool.releaseAll();
  }

  update(dt) {
    const { input } = this.game;

    // ESC → menu
    if (input.isDown('Escape')) {
      this.game.switchScene('menu');
      return;
    }

    // Player update
    this.player.update(dt, input, this.bulletPool, this.fireRate);

    // Muzzle flash
    if (this.player.justFired) {
      this.muzzleFlash = MUZZLE_TIME;
      this.muzzlePos   = { ...this.player.gunTip };
    }
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;

    // Bullets
    this.bulletPool.update(dt);
  }

  draw(ctx) {
    // --- Background ---
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this._drawGrid(ctx);

    // --- Bullets (below player) ---
    this.bulletPool.draw(ctx);

    // --- Muzzle flash ---
    if (this.muzzleFlash > 0) {
      const alpha = this.muzzleFlash / MUZZLE_TIME;
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      // Outer glow
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(this.muzzlePos.x - 7, this.muzzlePos.y - 7, 14, 14);
      // Inner bright
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.muzzlePos.x - 3, this.muzzlePos.y - 3, 6, 6);
      ctx.restore();
    }

    // --- Player ---
    this.player.draw(ctx);

    // --- HUD ---
    this.hud.draw(ctx, this.player, this.score, this.wave);

    // --- ESC hint ---
    ctx.fillStyle    = '#333344';
    ctx.font         = '11px monospace';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('ESC — Menu', CANVAS_WIDTH - 12, CANVAS_HEIGHT - 10);
  }

  // -------------------------------------------------------------------------
  _drawGrid(ctx) {
    ctx.strokeStyle = COLORS.GRID_LINE;
    ctx.lineWidth   = 0.5;

    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_STEP) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_STEP) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }
}
