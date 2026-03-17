export const CANVAS_WIDTH  = 800;
export const CANVAS_HEIGHT = 600;
export const PIXEL_SIZE    = 3; // Each "pixel" is 3x3 real pixels

// Colors
export const COLORS = {
  BG:           '#111111',
  BG_GRID:      '#1a1a2e',
  GRID_LINE:    '#16213e',

  PLAYER_BODY:  '#00d4ff',
  PLAYER_GUN:   '#888888',
  PLAYER_LEGS:  '#0066aa',

  BULLET:       '#ffff00',
  BULLET_GLOW:  '#ff8800',

  ENEMY_RUNNER:  '#ff4444',
  ENEMY_TANK:    '#44ff44',
  ENEMY_SHOOTER: '#cc44ff',
  ENEMY_BOSS:    '#ff8800',

  HUD_TEXT:     '#ffffff',
  HUD_HEALTH:   '#ff3333',
  HUD_HEALTH_BG:'#550000',

  PARTICLE_HIT: '#ffffff',
  MENU_TITLE:   '#00d4ff',
  MENU_SUBTITLE:'#ff8800',
  MENU_TEXT:    '#aaaaaa',
};

// Player
export const PLAYER_SPEED        = 180; // px/s
export const PLAYER_MAX_HP       = 5;
export const PLAYER_FIRE_RATE    = 0.15; // seconds between shots
export const PLAYER_BULLET_SPEED = 500;
export const PLAYER_SIZE         = 24;

// Enemies
export const ENEMY_RUNNER_SPEED  = 120;
export const ENEMY_RUNNER_HP     = 1;
export const ENEMY_RUNNER_SIZE   = 18;
export const ENEMY_RUNNER_DAMAGE = 1;

export const ENEMY_TANK_SPEED    = 50;
export const ENEMY_TANK_HP       = 5;
export const ENEMY_TANK_SIZE     = 30;
export const ENEMY_TANK_DAMAGE   = 1;

export const ENEMY_SHOOTER_SPEED       = 80;
export const ENEMY_SHOOTER_HP          = 3;
export const ENEMY_SHOOTER_SIZE        = 22;
export const ENEMY_SHOOTER_DAMAGE      = 1;
export const ENEMY_SHOOTER_RANGE       = 220;
export const ENEMY_SHOOTER_FIRE_RATE   = 2.5;
export const ENEMY_BULLET_SPEED        = 220;

// Wave scaling (applied per wave number)
export const WAVE_SPEED_SCALE  = 0.08; // +8% speed per wave
export const WAVE_HP_SCALE     = 0.10; // +10% HP per wave
export const WAVE_INTER_DELAY  = 3;    // seconds between waves

// Score
export const SCORE_RUNNER  = 10;
export const SCORE_TANK    = 30;
export const SCORE_SHOOTER = 20;
export const SCORE_BOSS    = 150;

// Health drop chance
export const HEALTH_DROP_CHANCE = 0.15;
