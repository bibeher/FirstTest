/**
 * Draws a 2D array of color strings as chunky pixel art.
 * null / undefined cells are transparent (skipped).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<Array<string|null>>} sprite  - 2D array [row][col]
 * @param {number} x     - top-left x in canvas space
 * @param {number} y     - top-left y in canvas space
 * @param {number} scale - real pixels per logical pixel (default 3)
 */
export function drawSprite(ctx, sprite, x, y, scale = 3) {
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      const color = sprite[row][col];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x + col * scale),
        Math.round(y + row * scale),
        scale,
        scale
      );
    }
  }
}

/**
 * Same as drawSprite but tints every non-null pixel with `tintColor`.
 * Used for hit-flash effects.
 */
export function drawSpriteTinted(ctx, sprite, x, y, scale, tintColor) {
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      if (!sprite[row][col]) continue;
      ctx.fillStyle = tintColor;
      ctx.fillRect(
        Math.round(x + col * scale),
        Math.round(y + row * scale),
        scale,
        scale
      );
    }
  }
}
