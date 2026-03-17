/**
 * AABB collision resolution for bullets ↔ enemies and enemies ↔ player.
 *
 * All entities are assumed to be axis-aligned rectangles centered at (x, y)
 * with dimensions (width, height).
 */
export class CollisionSystem {
  /**
   * @param {ObjectPool}  bulletPool
   * @param {Enemy[]}     enemies
   * @param {Player}      player
   * @returns {{ kills: Array, hits: Array }}
   *   kills → [{ enemy, x, y, score }]
   *   hits  → [{ enemy }]          (damaged but not killed)
   */
  resolve(bulletPool, enemies, player) {
    const kills = [];
    const hits  = [];

    // --- Player bullets vs enemies ---
    for (const bullet of bulletPool.active) {
      if (!bullet.active || !bullet.isPlayerBullet) continue;

      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (!enemy.active) continue;

        if (this._overlaps(bullet, enemy)) {
          bullet.active = false; // bullet consumed

          const died = enemy.takeDamage(bullet.damage);
          if (died) {
            kills.push({ enemy, x: enemy.x, y: enemy.y, score: enemy.scoreValue });
          } else {
            hits.push({ enemy });
          }
          break; // one bullet hits one enemy only
        }
      }
    }

    // --- Enemies vs player ---
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (this._overlaps(enemy, player)) {
        player.takeDamage(enemy.damage);
      }
    }

    return { kills, hits };
  }

  /** Axis-aligned bounding box overlap test (centers + half-extents). */
  _overlaps(a, b) {
    return (
      Math.abs(a.x - b.x) * 2 < a.width  + b.width &&
      Math.abs(a.y - b.y) * 2 < a.height + b.height
    );
  }
}
