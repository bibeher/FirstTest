import { CANVAS_WIDTH, COLORS, PLAYER_MAX_HP } from '../constants.js';

const BAR_X      = 16;
const BAR_Y      = 14;
const BAR_W      = 140;
const BAR_H      = 14;
const HEART_SIZE = 14;

export class HUD {
  draw(ctx, player, score, wave, waveMessage = null) {
    // --- Health bar ---
    const hpRatio = player.hp / player.maxHp;

    // Background
    ctx.fillStyle = COLORS.HUD_HEALTH_BG;
    ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);

    // Fill — color shifts from green → yellow → red
    const r = Math.round(255 * (1 - hpRatio));
    const g = Math.round(200 * hpRatio);
    ctx.fillStyle = `rgb(${r},${g},30)`;
    ctx.fillRect(BAR_X, BAR_Y, Math.round(BAR_W * hpRatio), BAR_H);

    // Border
    ctx.strokeStyle = '#445566';
    ctx.lineWidth   = 1;
    ctx.strokeRect(BAR_X + 0.5, BAR_Y + 0.5, BAR_W - 1, BAR_H - 1);

    // HP text
    ctx.fillStyle    = '#ffffff';
    ctx.font         = 'bold 11px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`HP  ${player.hp} / ${player.maxHp}`, BAR_X + BAR_W + 10, BAR_Y + BAR_H / 2);

    // --- Score (top center) ---
    ctx.fillStyle    = COLORS.HUD_TEXT;
    ctx.font         = 'bold 16px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`SCORE  ${String(score).padStart(6, '0')}`, CANVAS_WIDTH / 2, 12);

    // --- Wave (top right) ---
    ctx.fillStyle    = COLORS.MENU_SUBTITLE;
    ctx.font         = 'bold 16px monospace';
    ctx.textAlign    = 'right';
    ctx.fillText(`WAVE  ${wave}`, CANVAS_WIDTH - 16, 12);

    // --- Between-wave message (centered) ---
    if (waveMessage) {
      ctx.globalAlpha  = waveMessage.alpha;
      ctx.fillStyle    = '#ffffff';
      ctx.font         = 'bold 32px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor  = COLORS.MENU_TITLE;
      ctx.shadowBlur   = 20;
      ctx.fillText(waveMessage.text, CANVAS_WIDTH / 2, 120);
      ctx.shadowBlur   = 0;
      ctx.globalAlpha  = 1;
    }
  }
}
