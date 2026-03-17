import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants.js';
import { Button } from '../ui/Button.js';

// Stub — will be fully implemented in Phase 5
export class GameOverScene {
  constructor(game) {
    this.game    = game;
    this.buttons = [];
    this.data    = {};
  }

  enter(data = {}) {
    this.data = data;
    const cx = CANVAS_WIDTH  / 2;
    const cy = CANVAS_HEIGHT / 2;
    const bw = 200, bh = 44;
    this.buttons = [
      new Button(cx - bw / 2, cy + 60,  bw, bh, 'PLAY AGAIN', () => this.game.switchScene('game')),
      new Button(cx - bw / 2, cy + 118, bw, bh, 'MAIN MENU',  () => this.game.switchScene('menu')),
    ];
  }

  exit() {}

  update(dt) {
    this.buttons.forEach(b => b.update(this.game.input.mouse));
  }

  draw(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle    = '#ff3333';
    ctx.font         = 'bold 64px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor  = '#ff3333';
    ctx.shadowBlur   = 30;
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.font      = '20px monospace';
    ctx.fillText(`SCORE: ${this.data.score ?? 0}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillText(`WAVE:  ${this.data.wave  ?? 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 28);

    this.buttons.forEach(b => b.draw(ctx));
  }
}
