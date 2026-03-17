import { COLORS } from '../constants.js';

export class Button {
  constructor(x, y, width, height, label, onClick) {
    this.x       = x;
    this.y       = y;
    this.width   = width;
    this.height  = height;
    this.label   = label;
    this.onClick = onClick;
    this.hovered = false;
  }

  update(mouse) {
    const wasHovered = this.hovered;
    this.hovered = (
      mouse.x >= this.x &&
      mouse.x <= this.x + this.width &&
      mouse.y >= this.y &&
      mouse.y <= this.y + this.height
    );

    if (this.hovered && mouse.clicked) {
      this.onClick();
    }
  }

  draw(ctx) {
    const borderColor = this.hovered ? COLORS.MENU_TITLE   : '#334455';
    const bgColor     = this.hovered ? 'rgba(0,212,255,0.15)' : 'rgba(0,0,0,0.5)';
    const textColor   = this.hovered ? COLORS.MENU_TITLE   : COLORS.MENU_TEXT;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth   = this.hovered ? 2 : 1;
    ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);

    // Label
    ctx.fillStyle  = textColor;
    ctx.font       = `bold 18px monospace`;
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);
  }
}
