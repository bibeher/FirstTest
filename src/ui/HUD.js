import { CANVAS_WIDTH, COLORS } from '../constants.js';

const BAR_X = 16;
const BAR_Y = 14;
const BAR_W = 140;
const BAR_H = 14;

export class HUD {
  draw(ctx, player, score, wave, waveMessage = null) {
    // --- Health bar ---
    const hpRatio = player.hp / player.maxHp;

    ctx.fillStyle = COLORS.HUD_HEALTH_BG;
    ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);

    const r = Math.round(255 * (1 - hpRatio));
    const g = Math.round(200 * hpRatio);
    ctx.fillStyle = `rgb(${r},${g},30)`;
    ctx.fillRect(BAR_X, BAR_Y, Math.round(BAR_W * hpRatio), BAR_H);

    ctx.strokeStyle = '#445566';
    ctx.lineWidth   = 1;
    ctx.strokeRect(BAR_X + 0.5, BAR_Y + 0.5, BAR_W - 1, BAR_H - 1);

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

    // --- Wave message overlay ---
    if (waveMessage) {
      const alpha = Math.max(0, Math.min(1, waveMessage.alpha));
      ctx.globalAlpha  = alpha;
      ctx.fillStyle    = waveMessage.boss ? '#ff8800' : '#ffffff';
      ctx.font         = `bold ${waveMessage.boss ? 36 : 30}px monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor  = waveMessage.boss ? '#ff4400' : COLORS.MENU_TITLE;
      ctx.shadowBlur   = waveMessage.boss ? 30 : 18;
      ctx.fillText(waveMessage.text, CANVAS_WIDTH / 2, 110);
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;
    }
  }

  /** Prominent boss HP bar at the bottom of the screen. */
  drawBossBar(ctx, boss) {
    const bw = 360;
    const bh = 18;
    const bx = CANVAS_WIDTH / 2 - bw / 2;
    const by = 44;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 20);

    // Empty bar
    ctx.fillStyle = '#330000';
    ctx.fillRect(bx, by, bw, bh);

    // Health fill — pulses red→orange in phase 2
    const ratio = Math.max(0, boss.hp / boss.maxHp);
    const pulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
    const inP2  = ratio < 0.5;
    ctx.fillStyle = inP2
      ? `rgba(255,${Math.round(100 * pulse)},0,1)`
      : '#cc2200';
    ctx.fillRect(bx, by, Math.round(bw * ratio), bh);

    // Border
    ctx.strokeStyle = inP2 ? '#ff6600' : '#882200';
    ctx.lineWidth   = 2;
    ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);

    // Label
    ctx.fillStyle    = '#ffffff';
    ctx.font         = 'bold 11px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
      `⚠ BOSS  ${boss.hp} / ${boss.maxHp}`,
      CANVAS_WIDTH / 2,
      by + bh + 3
    );
  }
}
