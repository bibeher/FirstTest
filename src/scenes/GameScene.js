import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PLAYER_FIRE_RATE, HEALTH_DROP_CHANCE } from '../constants.js';
import { Player }          from '../entities/Player.js';
import { Bullet }          from '../entities/Bullet.js';
import { EnemyRunner }     from '../entities/EnemyRunner.js';
import { EnemyTank }       from '../entities/EnemyTank.js';
import { EnemyShooter }    from '../entities/EnemyShooter.js';
import { EnemyBoss }       from '../entities/EnemyBoss.js';
import { HealthPickup }    from '../entities/HealthPickup.js';
import { ObjectPool }      from '../utils/ObjectPool.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { SpawnSystem }     from '../systems/SpawnSystem.js';
import { ParticleSystem }  from '../systems/ParticleSystem.js';
import { HUD }             from '../ui/HUD.js';

const GRID_STEP   = 40;
const MUZZLE_TIME = 0.06;
const STATE = { PLAYING: 0, DYING: 2 };

export class GameScene {
  constructor(game) {
    this.game      = game;
    this.hud       = new HUD();
    this.collision = new CollisionSystem();
  }

  enter(data = {}) {
    this.player     = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.bulletPool = new ObjectPool(() => new Bullet(), 100);
    this.enemies    = [];
    this.pickups    = [];

    this.score    = data.score    ?? 0;
    this.wave     = data.wave     ?? 1;
    this.fireRate = data.fireRate ?? PLAYER_FIRE_RATE;

    this.spawnSystem = new SpawnSystem();
    this.particles   = new ParticleSystem(300);

    this.spawnSystem.startWave(this.wave);

    this.state      = STATE.PLAYING;
    this.dyingTimer = 0;

    this.muzzleFlash = 0;
    this.muzzlePos   = { x: 0, y: 0 };

    this._waveMsg  = { text: `WAVE  ${this.wave}`, alpha: 1.3, fadeRate: 0.35, boss: false };
    this._hitFlash = 0;

    // Screen shake
    this._shake = 0;

    // Active boss reference (null when no boss alive)
    this._boss = null;

    // Track last player HP for damage sound
    this._lastPlayerHP = this.player.hp;
  }

  exit() {
    if (this.bulletPool) this.bulletPool.releaseAll();
  }

  // ---------------------------------------------------------------------------
  update(dt) {
    const { input, audio } = this.game;

    if (input.isDown('Escape')) {
      this.game.switchScene('menu');
      return;
    }

    // --- Dying sequence ---
    if (this.state === STATE.DYING) {
      this.dyingTimer -= dt;
      this._hitFlash   = Math.max(0, this._hitFlash - dt * 1.5);
      this._shake      = Math.max(0, this._shake - dt * 15);
      this.particles.update(dt);
      if (this.dyingTimer <= 0) {
        this.game.switchScene('gameover', { score: this.score, wave: this.wave });
      }
      return;
    }

    // --- Player ---
    const prevHP = this.player.hp;
    this.player.update(dt, input, this.bulletPool, this.fireRate);

    if (this.player.justFired) {
      this.muzzleFlash = MUZZLE_TIME;
      this.muzzlePos   = { ...this.player.gunTip };
      audio.shoot();
    }
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;

    // --- Bullets ---
    this.bulletPool.update(dt);

    // --- Enemies ---
    for (const e of this.enemies) {
      if (e.active) e.update(dt, this.player.x, this.player.y, this.bulletPool);
    }

    // --- Spawn system ---
    const spawnEvents = this.spawnSystem.update(dt, this._liveEnemyCount());
    for (const ev of spawnEvents) {
      const enemy = this._createEnemy(ev.type, ev.x, ev.y);
      if (enemy) {
        this.enemies.push(enemy);
        if (enemy.isBoss) this._boss = enemy;
      }
    }

    // --- Wave transitions ---
    if (this.spawnSystem.waveCompleted) {
      this._showWaveMsg(`WAVE  ${this.wave}  CLEAR!`, 0.3, false);
      audio.waveComplete();
      this._boss = null;
    }
    if (this.spawnSystem.readyForNext) {
      this.wave++;
      if (this.wave === 5)  this.fireRate *= 0.72;
      if (this.wave === 10) this.fireRate *= 0.72;
      this.spawnSystem.startWave(this.wave);

      const isBoss = this.wave % 5 === 0;
      this._showWaveMsg(
        isBoss ? `⚠  BOSS  WAVE  ${this.wave}  ⚠` : `WAVE  ${this.wave}`,
        isBoss ? 0.22 : 0.38,
        isBoss
      );
      if (isBoss) {
        audio.bossWaveStart();
        this._shake = 8;
      } else {
        audio.waveStart();
      }
    }

    // --- Collision ---
    const { kills, hits } = this.collision.resolve(this.bulletPool, this.enemies, this.player);

    for (const kill of kills) {
      this.score += Math.round(kill.score * this._scoreMultiplier());
      this.particles.spawnDeath(kill.x, kill.y, kill.enemy.deathColor ?? '#ffffff', 12);

      if (kill.enemy.isBoss) {
        audio.bossDie();
        this._shake = 14;
        this.particles.spawnDeath(kill.x, kill.y, '#ffcc00', 20);
        this._boss = null;
      } else if (kill.enemy.constructor.name === 'EnemyTank') {
        audio.tankDie();
      } else {
        audio.enemyDie();
      }

      if (Math.random() < HEALTH_DROP_CHANCE) {
        this.pickups.push(new HealthPickup(kill.x, kill.y));
      }
    }

    for (const hit of hits) {
      this.particles.spawnHit(hit.enemy.x, hit.enemy.y, '#ffffff');
      if (hit.enemy.isBoss) {
        audio.bossHit();
      } else {
        audio.enemyHit();
      }
    }

    // --- Player damage sound ---
    if (this.player.hp < prevHP) {
      audio.playerHit();
      this._shake = Math.max(this._shake, 5);
    }

    // --- Pickups ---
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      pk.update(dt);
      if (pk.active && this._circleOverlap(pk, this.player, 16)) {
        pk.active = false;
        this.player.heal(1);
        this.particles.spawnPickup(pk.x, pk.y);
        audio.pickup();
      }
      if (!pk.active) this.pickups.splice(i, 1);
    }

    // --- Prune dead enemies ---
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (!this.enemies[i].active) this.enemies.splice(i, 1);
    }

    // --- Particles ---
    this.particles.update(dt);

    // --- Timers ---
    if (this._waveMsg) {
      this._waveMsg.alpha -= this._waveMsg.fadeRate * dt;
      if (this._waveMsg.alpha <= 0) this._waveMsg = null;
    }
    if (this._hitFlash > 0) this._hitFlash -= dt * 3;
    if (this._shake    > 0) this._shake    -= dt * 18;
    if (this.player.hitFlash > 0.09) this._hitFlash = Math.max(this._hitFlash, 0.28);

    // --- Player death ---
    if (this.player.hp <= 0 && this.state === STATE.PLAYING) {
      this.state      = STATE.DYING;
      this.dyingTimer = 1.8;
      this._hitFlash  = 1;
      this._shake     = 12;
      this.particles.spawnDeath(this.player.x, this.player.y, COLORS.PLAYER_BODY, 22);
    }
  }

  // ---------------------------------------------------------------------------
  draw(ctx) {
    // Screen shake transform
    const shakeX = this._shake > 0 ? (Math.random() - 0.5) * this._shake : 0;
    const shakeY = this._shake > 0 ? (Math.random() - 0.5) * this._shake : 0;
    if (this._shake > 0) {
      ctx.save();
      ctx.translate(shakeX, shakeY);
    }

    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(-20, -20, CANVAS_WIDTH + 40, CANVAS_HEIGHT + 40);
    this._drawGrid(ctx);

    // Pickups (floor level)
    for (const pk of this.pickups) pk.draw(ctx);

    // Enemies
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

    // Particles (top layer)
    this.particles.draw(ctx);

    // Restore shake transform before drawing UI
    if (this._shake > 0) ctx.restore();

    // Red screen flash
    if (this._hitFlash > 0) {
      ctx.fillStyle = `rgba(255,0,0,${Math.min(0.5, this._hitFlash * 0.5)})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // HUD
    const waveMsg = this._waveMsg
      ? { text: this._waveMsg.text, alpha: Math.max(0, Math.min(1, this._waveMsg.alpha)), boss: this._waveMsg.boss }
      : null;
    this.hud.draw(ctx, this.player, this.score, this.wave, waveMsg);

    // Boss HP bar
    if (this._boss && this._boss.active) {
      this.hud.drawBossBar(ctx, this._boss);
    }

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

    // Dying fade to black
    if (this.state === STATE.DYING) {
      const t = 1 - this.dyingTimer / 1.8;
      ctx.fillStyle = `rgba(0,0,0,${t * 0.8})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  // ---------------------------------------------------------------------------
  _createEnemy(type, x, y) {
    switch (type) {
      case 'runner':  return new EnemyRunner(x, y, this.wave);
      case 'tank':    return new EnemyTank(x, y, this.wave);
      case 'shooter': return new EnemyShooter(x, y, this.wave);
      case 'boss':    return new EnemyBoss(x, y, this.wave);
      default:
        console.warn('Unknown enemy type:', type);
        return null;
    }
  }

  _liveEnemyCount() {
    let n = 0;
    for (const e of this.enemies) if (e.active) n++;
    return n;
  }

  _scoreMultiplier() {
    if (this.wave >= 10) return 2;
    if (this.wave >= 5)  return 1.5;
    return 1;
  }

  _showWaveMsg(text, fadeRate = 0.4, boss = false) {
    this._waveMsg = { text, alpha: 1.3, fadeRate, boss };
  }

  _circleOverlap(a, b, radius) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx * dx + dy * dy < radius * radius;
  }

  _drawGrid(ctx) {
    ctx.strokeStyle = COLORS.GRID_LINE;
    ctx.lineWidth   = 0.5;
    for (let x = 0; x <= CANVAS_WIDTH;  x += GRID_STEP) {
      ctx.beginPath(); ctx.moveTo(x, 0);  ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_STEP) {
      ctx.beginPath(); ctx.moveTo(0, y);  ctx.lineTo(CANVAS_WIDTH, y);  ctx.stroke();
    }
  }
}
