/**
 * Retro sound effects via Web Audio API oscillators.
 * No audio files — everything synthesized on the fly.
 */
export class AudioManager {
  constructor() {
    this._ctx     = null;
    this.enabled  = true;
  }

  /** Unlock / lazily create AudioContext (requires user gesture first). */
  _ctx_() {
    if (!this._ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this._ctx = new Ctx();
    }
    return this._ctx;
  }

  /** Low-level: single oscillator beep. */
  _beep(freq, duration, type = 'square', volume = 0.25, freqEnd = null) {
    if (!this.enabled) return;
    const ctx = this._ctx_();
    if (!ctx) return;
    try {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (freqEnd !== null) {
        osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.01);
    } catch (_) {}
  }

  /** Two oscillators for richer sounds. */
  _chord(freqs, duration, type = 'square', volume = 0.18) {
    freqs.forEach(f => this._beep(f, duration, type, volume));
  }

  /** Schedule a sequence of notes. */
  _sequence(notes, type = 'square', volume = 0.2) {
    if (!this.enabled) return;
    const ctx = this._ctx_();
    if (!ctx) return;
    let t = ctx.currentTime;
    for (const [freq, duration] of notes) {
      try {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        osc.start(t);
        osc.stop(t + duration + 0.01);
        t += duration;
      } catch (_) {}
    }
  }

  // ---------------------------------------------------------------------------
  // Game sounds
  // ---------------------------------------------------------------------------

  /** Player fires a bullet. */
  shoot() {
    this._beep(880, 0.065, 'square', 0.1, 660);
  }

  /** Bullet hits enemy (non-lethal). */
  enemyHit() {
    this._beep(320, 0.08, 'sawtooth', 0.15, 180);
  }

  /** Runner / Shooter dies. */
  enemyDie() {
    this._beep(280, 0.12, 'square', 0.22, 90);
  }

  /** Tank dies (heavier). */
  tankDie() {
    this._chord([140, 105], 0.18, 'sawtooth', 0.2);
  }

  /** Boss takes a hit. */
  bossHit() {
    this._beep(200, 0.14, 'sawtooth', 0.28, 80);
  }

  /** Boss dies — big multi-oscillator explosion. */
  bossDie() {
    this._sequence([
      [440, 0.08], [330, 0.08], [220, 0.08], [110, 0.25],
    ], 'sawtooth', 0.28);
    setTimeout(() => this._chord([55, 73, 82], 0.4, 'square', 0.15), 100);
  }

  /** Player takes damage. */
  playerHit() {
    this._beep(160, 0.22, 'square', 0.3, 120);
    setTimeout(() => this._beep(140, 0.12, 'square', 0.2), 60);
  }

  /** Health pickup collected. */
  pickup() {
    this._sequence([[440, 0.05], [660, 0.05], [880, 0.1]], 'triangle', 0.22);
  }

  /** Wave cleared. */
  waveComplete() {
    this._sequence([[330, 0.08], [440, 0.08], [550, 0.12]], 'square', 0.18);
  }

  /** New wave starting (regular). */
  waveStart() {
    this._sequence([[220, 0.07], [330, 0.1]], 'square', 0.15);
  }

  /** Boss wave incoming — ominous descending tones. */
  bossWaveStart() {
    this._sequence([[880, 0.1], [660, 0.1], [440, 0.1], [220, 0.25]], 'sawtooth', 0.22);
  }

  /** Game over sting. */
  gameOver() {
    this._sequence([[440, 0.1], [330, 0.1], [220, 0.1], [110, 0.4]], 'sawtooth', 0.25);
  }

  /** New high score fanfare. */
  newHighScore() {
    this._sequence([
      [330, 0.07], [440, 0.07], [550, 0.07], [660, 0.07],
      [880, 0.07], [1100, 0.12],
    ], 'triangle', 0.2);
  }
}
