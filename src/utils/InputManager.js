export class InputManager {
  constructor(canvas) {
    this.keys     = {};
    this.mouse    = { x: 0, y: 0, down: false, clicked: false };
    this._canvas  = canvas;

    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      // Prevent arrow keys from scrolling the page
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width  / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top)  * scaleY;
    });

    canvas.addEventListener('mousedown', e => {
      if (e.button === 0) {
        this.mouse.down    = true;
        this.mouse.clicked = true;
      }
    });

    canvas.addEventListener('mouseup', e => {
      if (e.button === 0) this.mouse.down = false;
    });

    // Prevent right-click context menu on canvas
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  isDown(code)    { return !!this.keys[code]; }
  isMouseDown()   { return this.mouse.down; }

  // Call once per frame after processing — clears single-frame flags
  flush() {
    this.mouse.clicked = false;
  }
}
