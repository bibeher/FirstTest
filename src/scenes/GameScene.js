import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PLAYER_FIRE_RATE, WAVE_INTER_DELAY } from '../constants.js';
import { Player }          from '../entities/Player.js';
import { Bullet }          from '../entities/Bullet.js';
import { EnemyRunner }     from '../entities/EnemyRunner.js';
import { EnemyTank }       from '../entities/EnemyTank.js';
import { ObjectPool }      from '../utils/ObjectPool.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { SpawnSystem }     from '../systems/SpawnSystem.js';
import { HUD }             from '../ui/HUD.js';

const GRID_STEP   = 40;
const MUZZLE_TIME = 0.06;

// Game flow states
const STATE = { PLAYING: 0, BETWEEN: 1, DYING: 2 };

export class GameScene {
  constructor(game) {
    this.game      = game;
    this.hud       = new HUD();
    this.collision = new CollisionSystem();
  }

  enter(data = {}) {
    this.player     = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.bulletPool = new ObjectPool(() => new Bullet(), 50);
    this.enemies    = [];

    this.score    = data.score    ?? 0;
    this.wave     = data.wave     ?? 1;
    this.fireRate = data.fireRate ?? PLAYER_FIRE_RATE;

    this.spawnSystem = new SpawnSystem();
    this.spawnSystem.startWave(this.wave);

    this.state       = STATE.PLAYING;
    this.dyingTimer  = 0;

    this.muzzleFlash = 0;
    this.muzzlePos   = { x: 0, y: 0 };

    // Wave message overlay: { text, alpha, fadeRate }
    this._waveMsg      = { text: `WAVE  ${this.wave}`, alpha: 1, fadeRate: 0.35 };
    this._waveMsgTimer = 0;

    // Screen flash on hit: { alpha }
    this._hitFlash = 0;
  }

  exit() {
    if (this.bulletPool) this.bulletPool.releaseAll();
  }

  // ---------------------------------------------------------------------------
  update(dt) {
    const { input } = this.game;

    if (input.isDown('Escape')) {
      this.game.switchScene('menu');
      return;
    }

    // --- Dying animation ---
    if (this.state === STATE.DYING) {
      this.dyingTimer -= dt;
      this._hitFlash   = Math.max(0, this._hitFlash - dt * 2);
      if (this.dyingTimer <= 0) {
        this.game.switchScene('gameover', { score: this.score, wave: this.wave });
      }
      return;
    }

    // --- Player ---
    this.player.update(dt, input, this.bulletPool, this.fireRate);

    if (this.player.justFired) {
      this.muzzleFlash = MUZZLE_TIME;
      this.muzzlePos   = { ...this.player.gunTip };
    }
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;

    // --- Bullets ---
    this.bulletPool.update(dt);

    // --- Enemies ---
    for (const e of this.enemies) {
      if (e.active) e.update(dt, this.player.x, this.player.y);
    }

    // --- Spawn system ---
    const spawnEvents = this.spawnSystem.update(dt, this._liveEnemyCount());
    for (const ev of spawnEvents) {
      const enemy = this._createEnemy(ev.type, ev.x, ev.y);
      if (enemy) this.enemies.push(enemy);
    }

    // --- Wave transition messages ---
    if (this.spawnSystem.waveCompleted) {
      this._showWaveMsg(`WAVE  ${this.wave}  CLEAR!`, 0.3);
    }
    if (this.spawnSystem.readyForNext) {
      this.wave++;
      // Upgrade fire rate at waves 5 and 10
      if (this.wave === 5)  this.fireRate *= 0.7;
      if (this.wave === 10) this.fireRate *= 0.7;
      this.spawnSystem.startWave(this.wave);
      this._showWaveMsg(`WAVE  ${this.wave}`, 0.4);
    }

    // --- Collision ---
    const { kills } = this.collision.resolve(this.bulletPool, this.enemies, this.player);
    for (const kill of kills) {
      this.score += kill.score * this._scoreMultiplier();
    }

    // --- Prune dead enemies ---
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (!this.enemies[i].active) this.enemies.splice(i, 1);
    }

    // --- Wave message fade ---
    if (this._waveMsg) {
      this._waveMsg.alpha -= this._waveMsg.fadeRate * dt;
      if (this._waveMsg.alpha <= 0) this._waveMsg = null;
    }

    // --- Hit flash fade ---
    if (this._hitFlash > 0) this._hitFlash -= dt * 3;

    // --- Player death ---
    if (this.player.hp <= 0 && this.state === STATE.PLAYING) {
      this.state       = STATE.DYING;
      this.dyingTimer  = 1.8;
      this._hitFlash   = 1;
    }

    // --- Trigger hit flash when player takes damage ---
    if (this.player.hitFlash > 0.1) {
      this._hitFlash = Math.max(this._hitFlash, 0.25);
    }
  }

  // ---------------------------------------------------------------------------
  draw(ctx) {
    // Background
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this._drawGrid(ctx);

    // Enemies (below player)
    for (const e of this.enemies) e.draw(ctx);

    // Bullets
    this.bulletPool.draw(ctx);

    // Muzzle flash
    if (this.muzzleFlash > 0) {
      const t = this.muzzleFlash / MUZZLE_TIME;
      ctx.save();
      ctx.globalAlpha = t * 0.85;
      ctx.fillStyle   = '#ff8800';
      ctx.fillRect(this.muzzlePos.x - 7, this.muzzlePos.y - 7, 14, 14);
      ctx.globalAlpha = t;
      ctx.fillStyle   = '#ffffff';
      ctx.fillRect(this.muzzlePos.x - 3, this.muzzlePos.y - 3,  6,  6);
      ctx.restore();
    }

    // Player
    this.player.draw(ctx);

    // Red screen flash on damage / death
    if (this._hitFlash > 0) {
      ctx.fillStyle   = `rgba(255,0,0,${Math.min(0.45, this._hitFlash * 0.45)})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // HUD
    const waveMsg = this._waveMsg
      ? { text: this._waveMsg.text, alpha: Math.max(0, this._waveMsg.alpha) }
      : null;
    this.hud.draw(ctx, this.player, this.score, this.wave, waveMsg);

    // Between-wave countdown
    if (this.spawnSystem.isBetweenWaves) {
      const secs = Math.ceil(this.spawnSystem.betweenTimeLeft);
      ctx.fillStyle    = '#556677';
      ctx.font         = '13px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`Next wave in ${secs}…`, CANVAS_WIDTH / 2, 38);
    }

    // ESC hint
    ctx.fillStyle    = '#2a2a3a';
    ctx.font         = '11px monospace';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('ESC — Menu', CANVAS_WIDTH - 12, CANVAS_HEIGHT - 10);

    // Dying overlay
    if (this.state === STATE.DYING) {
      const t = 1 - this.dyingTimer / 1.8;
      ctx.fillStyle = `rgba(0,0,0,${t * 0.7})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  // ---------------------------------------------------------------------------
  _createEnemy(type, x, y) {
    switch (type) {
      case 'runner': return new EnemyRunner(x, y, this.wave);
      case 'tank':   return new EnemyTank(x, y, this.wave);
      default:
        console.warn('Unknown enemy type:', type);
        return null;
    }
  }

  _liveEnemyCount() {
    let count = 0;
    for (const e of this.enemies) if (e.active) count++;
    return count;
  }

  _scoreMultiplier() {
    if (this.wave >= 10) return 2;
    if (this.wave >= 5)  return 1.5;
    return 1;
  }

  _showWaveMsg(text, fadeRate = 0.4) {
    this._waveMsg = { text, alpha: 1.2, fadeRate };
  }

  _drawGrid(ctx) {
    ctx.strokeStyle = COLORS.GRID_LINE;
    ctx.lineWidth   = 0.5;
    for (let x = 0; x <= CANVAS_WIDTH;  x += GRID_STEP) {
      ctx.beginPath(); ctx.moveTo(x, 0);            ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_STEP) {
      ctx.beginPath(); ctx.moveTo(0, y);             ctx.lineTo(CANVAS_WIDTH, y);  ctx.stroke();
    }
  }
}
