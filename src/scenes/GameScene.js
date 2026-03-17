import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants.js';

// Stub — will be fully implemented in Phase 2+
export class GameScene {
  constructor(game) { this.game = game; }

  enter() {}
  exit()  {}

  update(dt) {
    // Back to menu on Escape
    if (this.game.input.isDown('Escape')) {
      this.game.switchScene('menu');
    }
  }

  draw(ctx) {
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle    = COLORS.HUD_TEXT;
    ctx.font         = 'bold 24px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME SCENE — COMING IN PHASE 2', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.font = '14px monospace';
    ctx.fillStyle = COLORS.MENU_TEXT;
    ctx.fillText('Press ESC to return to menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 36);
  }
}
