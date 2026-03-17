import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { InputManager } from './utils/InputManager.js';
import { MenuScene }    from './scenes/MenuScene.js';

// Scenes are lazy-imported to avoid circular deps at boot
let GameScene;
let GameOverScene;

export class Game {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.input   = new InputManager(canvas);

    canvas.width  = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    this._scenes       = {};
    this._currentScene = null;
    this._lastTime     = null;
    this._running      = false;

    // Register built-in scenes
    this._scenes['menu']     = new MenuScene(this);
    // GameScene and GameOverScene registered lazily on first switch
  }

  async switchScene(name, data = {}) {
    // Lazy-load gameplay scenes to keep initial parse fast
    if (name === 'game' && !this._scenes['game']) {
      const mod = await import('./scenes/GameScene.js');
      this._scenes['game'] = new mod.GameScene(this);
    }
    if (name === 'gameover' && !this._scenes['gameover']) {
      const mod = await import('./scenes/GameOverScene.js');
      this._scenes['gameover'] = new mod.GameOverScene(this);
    }

    if (this._currentScene) this._currentScene.exit();
    this._currentScene = this._scenes[name];
    this._currentScene.enter(data);
  }

  start() {
    this._running = true;
    this.switchScene('menu');
    requestAnimationFrame(ts => this._loop(ts));
  }

  _loop(timestamp) {
    if (!this._running) return;

    const dt = this._lastTime === null
      ? 0
      : Math.min((timestamp - this._lastTime) / 1000, 0.05); // cap at 50ms
    this._lastTime = timestamp;

    if (this._currentScene) {
      this._currentScene.update(dt);
      this._currentScene.draw(this.ctx);
    }

    this.input.flush();
    requestAnimationFrame(ts => this._loop(ts));
  }
}
