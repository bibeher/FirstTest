import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants.js';
import { Button } from '../ui/Button.js';

const HS_KEY = 'topdown_highscore';

export class GameOverScene {
  constructor(game) {
    this.game    = game;
    this.buttons = [];
    this.data    = {};

    this._elapsed      = 0;
    this._displayScore = 0;
    this._isNewHS      = false;
    this._hsFanfare    = false;
  }

  enter(data = {}) {
    this.data          = data;
    this._elapsed      = 0;
    this._displayScore = 0;
    this._hsFanfare    = false;

    // High score
    const prev  = parseInt(localStorage.getItem(HS_KEY) ?? '0', 10);
    this._isNewHS = (data.score ?? 0) > prev;
    if (this._isNewHS) {
      localStorage.setItem(HS_KEY, String(data.score));
      this._highScore = data.score;
    } else {
      this._highScore = prev;
    }

    // Buttons
    const cx = CANVAS_WIDTH  / 2;
    const cy = CANVAS_HEIGHT / 2;
    const bw = 210, bh = 46;
    this.buttons = [
      new Button(cx - bw / 2, cy + 80,  bw, bh, 'PLAY AGAIN', () => this.game.switchScene('game')),
      new Button(cx - bw / 2, cy + 140, bw, bh, 'MAIN MENU',  () => this.game.switchScene('menu')),
    ];

    // Sounds
    setTimeout(() => {
      this.game.audio.gameOver();
      if (this._isNewHS) {
        setTimeout(() => {
          this.game.audio.newHighScore();
          this._hsFanfare = true;
        }, 900);
      }
    }, 400);
  }

  exit() {}

  update(dt) {
    this._elapsed += dt;

    // Score count-up
    const target = this.data.score ?? 0;
    if (this._displayScore < target) {
      const speed = Math.max(1, Math.ceil((target - this._displayScore) * 4 * dt));
      this._displayScore = Math.min(target, this._displayScore + speed);
    }

    this.buttons.forEach(b => b.update(this.game.input.mouse));
  }

  draw(ctx) {
    // Dark background
    ctx.fillStyle = '#060608';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Scanline overlay
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 2);
    }

    const cx = CANVAS_WIDTH  / 2;
    const cy = CANVAS_HEIGHT / 2;

    // --- "GAME OVER" with glitch effect ---
    const glitchIntensity = Math.max(0, 1 - this._elapsed * 0.55);
    const gx = (Math.random() - 0.5) * 10 * glitchIntensity;
    const gy = (Math.random() - 0.5) * 5  * glitchIntensity;

    // Red ghost offset
    ctx.fillStyle = 'rgba(255,0,0,0.5)';
    ctx.font      = 'bold 58px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', cx + gx + 3, cy - 90 + gy + 2);

    // Main text
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur  = 28;
    ctx.fillStyle   = '#ff3333';
    ctx.fillText('GAME OVER', cx + gx, cy - 90 + gy);
    ctx.shadowBlur  = 0;

    // --- Score count-up ---
    ctx.fillStyle    = '#ffffff';
    ctx.font         = 'bold 22px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`SCORE   ${String(this._displayScore).padStart(6, '0')}`, cx, cy - 22);

    ctx.fillStyle = '#aaaaaa';
    ctx.font      = '18px monospace';
    ctx.fillText(`WAVE    ${this.data.wave ?? 1}`, cx, cy + 10);

    // --- High score ---
    const hsAlpha = this._isNewHS
      ? 0.7 + Math.sin(this._elapsed * 6) * 0.3
      : 1;
    ctx.globalAlpha = hsAlpha;

    if (this._isNewHS) {
      ctx.fillStyle    = '#ffcc00';
      ctx.font         = 'bold 20px monospace';
      ctx.shadowColor  = '#ffaa00';
      ctx.shadowBlur   = 16;
      ctx.fillText('✦  NEW HIGH SCORE!  ✦', cx, cy + 42);
      ctx.shadowBlur   = 0;
    } else {
      ctx.fillStyle = '#556677';
      ctx.font      = '14px monospace';
      ctx.fillText(`BEST  ${String(this._highScore).padStart(6, '0')}`, cx, cy + 46);
    }
    ctx.globalAlpha = 1;

    // --- Buttons ---
    this.buttons.forEach(b => b.draw(ctx));

    // --- Footer tip ---
    if (this._elapsed > 1.5) {
      ctx.fillStyle    = '#333344';
      ctx.font         = '11px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Arrow keys / WASD  ·  Mouse aim  ·  Click to shoot', cx, CANVAS_HEIGHT - 14);
    }
  }
}
