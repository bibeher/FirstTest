import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants.js';
import { Button } from '../ui/Button.js';

// Simple decorative "enemy" dots drifting in the background
class DemoDot {
  constructor() { this.reset(); }
  reset() {
    this.x     = Math.random() * CANVAS_WIDTH;
    this.y     = Math.random() * CANVAS_HEIGHT;
    this.vx    = (Math.random() - 0.5) * 40;
    this.vy    = (Math.random() - 0.5) * 40;
    this.size  = 4 + Math.random() * 6;
    this.color = [COLORS.ENEMY_RUNNER, COLORS.ENEMY_TANK, COLORS.ENEMY_SHOOTER][Math.floor(Math.random() * 3)];
    this.alpha = 0.15 + Math.random() * 0.2;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -20 || this.x > CANVAS_WIDTH + 20 ||
        this.y < -20 || this.y > CANVAS_HEIGHT + 20) {
      this.reset();
    }
  }
  draw(ctx) {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

export class MenuScene {
  constructor(game) {
    this.game    = game;
    this.buttons = [];
    this.dots    = [];
    this.showHelp = false;
    this._titlePulse = 0;
  }

  enter() {
    this.showHelp = false;

    const cx = CANVAS_WIDTH  / 2;
    const cy = CANVAS_HEIGHT / 2;
    const bw = 220;
    const bh = 48;

    this.buttons = [
      new Button(cx - bw / 2, cy + 20,  bw, bh, 'PLAY GAME',    () => this.game.switchScene('game')),
      new Button(cx - bw / 2, cy + 84,  bw, bh, 'HOW TO PLAY',  () => { this.showHelp = !this.showHelp; }),
    ];

    this.dots = Array.from({ length: 30 }, () => new DemoDot());
  }

  exit() {}

  update(dt) {
    this._titlePulse += dt * 2;
    this.dots.forEach(d => d.update(dt));
    this.buttons.forEach(b => b.update(this.game.input.mouse));
  }

  draw(ctx) {
    // Background
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid overlay
    this._drawGrid(ctx);

    // Drifting background dots
    this.dots.forEach(d => d.draw(ctx));

    // Title glow
    const pulse = 0.85 + Math.sin(this._titlePulse) * 0.15;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.shadowColor  = COLORS.MENU_TITLE;
    ctx.shadowBlur   = 24;
    ctx.fillStyle    = COLORS.MENU_TITLE;
    ctx.font         = 'bold 64px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TOP-DOWN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 120);
    ctx.fillStyle = COLORS.MENU_SUBTITLE;
    ctx.shadowColor = COLORS.MENU_SUBTITLE;
    ctx.fillText('SHOOTER',  CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 55);
    ctx.restore();

    // Subtitle
    ctx.fillStyle    = COLORS.MENU_TEXT;
    ctx.font         = '14px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SURVIVE THE WAVES', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

    // Buttons
    this.buttons.forEach(b => b.draw(ctx));

    // Help overlay
    if (this.showHelp) this._drawHelp(ctx);

    // High score
    const hs = parseInt(localStorage.getItem('topdown_highscore') ?? '0', 10);
    if (hs > 0) {
      ctx.fillStyle    = '#776633';
      ctx.font         = '14px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`BEST SCORE  ${String(hs).padStart(6, '0')}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 34);
    }

    // Footer
    ctx.fillStyle = '#444444';
    ctx.font      = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('© 2026  |  RETRO ARCADE', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 16);
  }

  _drawGrid(ctx) {
    ctx.strokeStyle = COLORS.GRID_LINE;
    ctx.lineWidth   = 0.5;
    const step = 40;
    for (let x = 0; x <= CANVAS_WIDTH; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }

  _drawHelp(ctx) {
    const pw = 420, ph = 260;
    const px = (CANVAS_WIDTH  - pw) / 2;
    const py = (CANVAS_HEIGHT - ph) / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = COLORS.MENU_TITLE;
    ctx.lineWidth   = 2;
    ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);

    ctx.fillStyle    = COLORS.MENU_TITLE;
    ctx.font         = 'bold 20px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('CONTROLS', CANVAS_WIDTH / 2, py + 20);

    const lines = [
      ['MOVE',    '← ↑ → ↓  Arrow Keys'],
      ['AIM',     'Move Mouse'],
      ['SHOOT',   'Left Mouse Button'],
      ['SURVIVE', 'Don\'t get hit!'],
    ];

    ctx.font      = '15px monospace';
    ctx.textAlign = 'left';
    let ly = py + 60;
    for (const [key, val] of lines) {
      ctx.fillStyle = COLORS.MENU_SUBTITLE;
      ctx.fillText(key, px + 30, ly);
      ctx.fillStyle = COLORS.MENU_TEXT;
      ctx.fillText(val, px + 140, ly);
      ly += 36;
    }

    ctx.fillStyle    = '#555555';
    ctx.font         = '12px monospace';
    ctx.textAlign    = 'center';
    ctx.fillText('Click HOW TO PLAY again to close', CANVAS_WIDTH / 2, py + ph - 22);
  }
}
