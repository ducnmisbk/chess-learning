/**
 * Constants used throughout the chess application
 */

/** Board dimensions */
export const BOARD_SIZE = 8;

/** Number of squares on the board */
export const TOTAL_SQUARES = BOARD_SIZE * BOARD_SIZE;

/** Initial position indices */
export const INITIAL_RANKS = {
  WHITE_PAWN: 6,
  WHITE_BACK: 7,
  BLACK_PAWN: 1,
  BLACK_BACK: 0
} as const;

/** Direction vectors for piece movement */
export const DIRECTIONS = {
  // Straight (Rook-like)
  STRAIGHT: [
    { row: -1, col: 0 },  // Up
    { row: 1, col: 0 },   // Down
    { row: 0, col: -1 },  // Left
    { row: 0, col: 1 }    // Right
  ],
  // Diagonal (Bishop-like)
  DIAGONAL: [
    { row: -1, col: -1 }, // Up-left
    { row: -1, col: 1 },  // Up-right
    { row: 1, col: -1 },  // Down-left
    { row: 1, col: 1 }    // Down-right
  ],
  // Knight moves
  KNIGHT: [
    { row: -2, col: -1 },
    { row: -2, col: 1 },
    { row: -1, col: -2 },
    { row: -1, col: 2 },
    { row: 1, col: -2 },
    { row: 1, col: 2 },
    { row: 2, col: -1 },
    { row: 2, col: 1 }
  ],
  // Pawn moves (direction depends on color)
  PAWN: {
    WHITE: { row: -1, col: 0 },
    BLACK: { row: 1, col: 0 }
  }
} as const;

/** Animation durations (milliseconds) */
export const ANIMATION_DURATION = {
  PIECE_MOVE: 250,
  PIECE_CAPTURE: 300,
  CHECK_FLASH: 500,
  PROMOTION: 400
} as const;

/** AI thinking delay (milliseconds) */
export const AI_DELAY = {
  EASY: 500,
  MEDIUM: 1000,
  HARD: 1500
} as const;

/** Storage keys for IndexedDB and LocalStorage */
export const STORAGE_KEYS = {
  CURRENT_USER: 'current_user_id',
  THEME: 'theme_preference',
  SOUND_ENABLED: 'sound_enabled',
  VOLUME: 'volume_level'
} as const;

/** Database name and version */
export const DATABASE = {
  NAME: 'chess_game_db',
  VERSION: 1
} as const;
