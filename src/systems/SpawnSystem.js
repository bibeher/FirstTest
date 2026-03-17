import { CANVAS_WIDTH, CANVAS_HEIGHT, WAVE_INTER_DELAY } from '../constants.js';

const SPAWN_MARGIN = 40; // px outside canvas edge

/**
 * Manages wave spawning lifecycle.
 *
 * Usage:
 *   spawnSystem.startWave(waveNum)
 *   const events = spawnSystem.update(dt, liveEnemyCount)
 *   // events: [{ type, x, y }]
 *   // read spawnSystem.waveCompleted / .readyForNext after update()
 */
export class SpawnSystem {
  constructor() {
    this._state        = 'idle';
    this._queue        = [];
    this._spawnDelay   = 0;
    this._betweenTimer = 0;
    this.wave          = 0;

    // One-frame flags — read in GameScene after update()
    this.waveCompleted = false;
    this.readyForNext  = false;
  }

  get isBetweenWaves() { return this._state === 'between'; }
  get betweenTimeLeft() { return this._betweenTimer; }

  startWave(waveNum) {
    this.wave          = waveNum;
    this._queue        = this._buildQueue(waveNum);
    this._spawnDelay   = this._queue.length > 0 ? this._queue[0].delay : 0;
    this._state        = 'spawning';
    this.waveCompleted = false;
    this.readyForNext  = false;
  }

  /**
   * @param {number} dt
   * @param {number} liveEnemyCount  - enemies still alive in GameScene
   * @returns {Array<{type:string, x:number, y:number}>}
   */
  update(dt, liveEnemyCount) {
    // Reset one-frame flags
    this.waveCompleted = false;
    this.readyForNext  = false;

    const spawns = [];

    switch (this._state) {
      case 'spawning': {
        this._spawnDelay -= dt;
        // Spawn as many as the timer allows this frame
        while (this._spawnDelay <= 0 && this._queue.length > 0) {
          const entry = this._queue.shift();
          spawns.push({ type: entry.type, ...this._randomEdge() });

          if (this._queue.length > 0) {
            this._spawnDelay += this._queue[0].delay;
          } else {
            this._spawnDelay = 0;
            this._state      = 'waiting';
            break;
          }
        }
        break;
      }

      case 'waiting':
        if (liveEnemyCount === 0) {
          this._state        = 'between';
          this._betweenTimer = WAVE_INTER_DELAY;
          this.waveCompleted = true;
        }
        break;

      case 'between':
        this._betweenTimer -= dt;
        if (this._betweenTimer <= 0) {
          this._state       = 'idle';
          this.readyForNext = true;
        }
        break;
    }

    return spawns;
  }

  // ---------------------------------------------------------------------------

  _randomEdge() {
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: return { x: Math.random() * CANVAS_WIDTH,  y: -SPAWN_MARGIN };
      case 1: return { x: Math.random() * CANVAS_WIDTH,  y: CANVAS_HEIGHT + SPAWN_MARGIN };
      case 2: return { x: -SPAWN_MARGIN,                 y: Math.random() * CANVAS_HEIGHT };
      case 3: return { x: CANVAS_WIDTH + SPAWN_MARGIN,   y: Math.random() * CANVAS_HEIGHT };
    }
  }

  _buildQueue(wave) {
    const runnerCount = 2 + Math.floor(wave * 1.5);
    const tankCount   = Math.floor(wave / 3);
    const queue       = [];

    for (let i = 0; i < runnerCount; i++) {
      queue.push({ type: 'runner', delay: 0.35 + Math.random() * 0.3 });
    }
    for (let i = 0; i < tankCount; i++) {
      queue.push({ type: 'tank', delay: 0.7 + Math.random() * 0.5 });
    }

    // Shuffle so runners and tanks are interleaved
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    // Give the very first enemy a short lead-in delay
    if (queue.length > 0) queue[0].delay = 0.6;

    return queue;
  }
}
