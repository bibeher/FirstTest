# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

The game uses ES modules (`type="module"`), so it **must** be served over HTTP — opening `index.html` directly as a `file://` URL will fail with CORS errors.

```bash
# Serve locally (auto-installs serve if not present)
npx serve . -p 3000
# then open http://localhost:3000
```

There is no build step, bundler, transpiler, or package.json. All source is plain ES2020 modules that run directly in the browser.

## Architecture

### Game Loop (`src/Game.js`)
Central orchestrator. Owns the canvas, `InputManager`, and `AudioManager`. Runs a `requestAnimationFrame` loop capped at 50ms delta. Scenes are **lazy-loaded** on first `switchScene()` call to keep initial parse fast.

```
Game
 ├── input: InputManager   (keyboard state map + mouse position/clicks)
 ├── audio: AudioManager   (Web Audio oscillator sounds, no files)
 └── currentScene          (MenuScene | GameScene | GameOverScene)
       enter(data?) → update(dt) → draw(ctx) → exit()
```

### Scene Lifecycle
Every scene implements `enter(data)`, `update(dt)`, `draw(ctx)`, `exit()`. Data flows between scenes via the `data` object passed to `switchScene(name, data)`. GameScene → GameOverScene passes `{ score, wave }`.

### GameScene (`src/scenes/GameScene.js`)
The main gameplay scene. Owns all runtime state:
- `player`, `bulletPool` (ObjectPool), `enemies[]`, `pickups[]`
- `spawnSystem` (wave lifecycle), `particles` (ParticleSystem), `collision` (CollisionSystem)
- `_boss` reference — set when a boss spawns, cleared on death or wave complete
- `_shake` — screen shake intensity, decays each frame; applied as `ctx.translate` before world drawing, restored before HUD drawing so HUD never shakes

### Entity Model
Plain classes, no ECS. All entities have `x`, `y`, `width`, `height`, `active`. When `active` becomes `false`, they are pruned from their owning array or returned to their `ObjectPool`.

Enemy subclasses inherit from `Enemy` (`src/entities/Enemy.js`) which provides `_moveToward`, `takeDamage`, `_tickTimers`, `_drawSprite`, and `_drawHPBar`. Subclass `update(dt, playerX, playerY, bulletPool)` — `bulletPool` is optional and only used by `EnemyShooter` and `EnemyBoss`.

### Sprite Rendering
No image files. All sprites are **2D color arrays** (`null` = transparent pixel) drawn via `drawSprite()` in `src/utils/SpriteRenderer.js`. Each logical pixel is `PIXEL_SIZE = 3` real pixels. Sprites are drawn after `ctx.translate(entity.x, entity.y)` so the array origin must be offset by `(-halfWidth, -halfHeight)` to center them.

Hit-flash tint is applied with `ctx.globalCompositeOperation = 'source-atop'` inside the same `save/restore` block as the sprite draw.

### Wave & Spawning (`src/systems/SpawnSystem.js`)
State machine: `idle → spawning → waiting → between → idle`. Enemy types and delays are built in `_buildQueue(wave)`. Every 5th wave is a boss wave (reduced minion count, boss spawns last with a 2.5s delay). Flags `waveCompleted` and `readyForNext` are set for **one frame only** — read them immediately in `GameScene.update()`.

### Collision (`src/systems/CollisionSystem.js`)
AABB only. `resolve(bulletPool, enemies, player)` checks:
1. Player bullets → enemies (bullet deactivated on hit, `takeDamage` called)
2. Enemy bullets → player
3. Enemy bodies → player (melee contact)

Returns `{ kills, hits }` arrays for GameScene to handle score, particles, and audio.

### Object Pool (`src/utils/ObjectPool.js`)
Used for `Bullet` (capacity 100) and `Particle` (capacity 300). Call `pool.get()` to retrieve an object, set `obj.active = false` to return it automatically on next `pool.update(dt)`.

### Audio (`src/utils/AudioManager.js`)
Web Audio API, lazily initializes `AudioContext` on first call (browser requires user gesture). All sounds are oscillator-based — no files, no loading. Methods: `shoot`, `enemyHit`, `enemyDie`, `tankDie`, `bossHit`, `bossDie`, `playerHit`, `pickup`, `waveStart`, `waveComplete`, `bossWaveStart`, `gameOver`, `newHighScore`.

### High Score
Stored in `localStorage` under the key `topdown_highscore`. Read/written in `GameOverScene`. Displayed in `MenuScene` when non-zero.

## Git Workflow

After completing any meaningful unit of work — a new feature, a bug fix, a phase of development — commit and push to GitHub immediately. Work should never exist only locally.

```bash
git add <specific files>
git commit -m "feat: short description of what and why"
git push
```

Commit message conventions used in this repo:
- `feat:` — new feature or capability
- `fix:` — bug fix
- `docs:` — documentation only

Keep commit messages specific: describe *what changed and why*, not just "update files". Each commit should leave the game in a runnable state.

## Key Constants (`src/constants.js`)
All gameplay tuning values live here: speeds, HP values, wave scaling formulas (`WAVE_SPEED_SCALE`, `WAVE_HP_SCALE`), score values, fire rates, spawn margins. Change values here, not inline in entity constructors.

## Adding a New Enemy Type
1. Create `src/entities/EnemyFoo.js` extending `Enemy`, set `this.deathColor`
2. Add a `case 'foo'` in `GameScene._createEnemy()`
3. Push `{ type: 'foo', delay: N }` entries in `SpawnSystem._buildQueue()`
4. Add score constant to `constants.js`
