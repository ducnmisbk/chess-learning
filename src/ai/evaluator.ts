/**
 * Position Evaluator
 * 
 * Evaluates chess positions for the AI engine.
 * Higher scores favor White, lower scores favor Black.
 */

import type { Board, Piece, PieceType, PieceColor, Position } from '../core/types';
import { PieceType as PT, PieceColor as PC } from '../core/types';

/**
 * Material values for each piece type
 */
export const PIECE_VALUES: Record<PieceType, number> = {
  [PT.PAWN]: 100,
  [PT.KNIGHT]: 320,
  [PT.BISHOP]: 330,
  [PT.ROOK]: 500,
  [PT.QUEEN]: 900,
  [PT.KING]: 20000
};

/**
 * Piece-square tables for positional bonuses
 * Values from Black's perspective (flip for White)
 */
export const PIECE_SQUARE_TABLES: Record<PieceType, number[][]> = {
  [PT.PAWN]: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  [PT.KNIGHT]: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  [PT.BISHOP]: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  [PT.ROOK]: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ],
  [PT.QUEEN]: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  [PT.KING]: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

/**
 * Center squares (d4, d5, e4, e5) - bonus for controlling these
 */
const CENTER_SQUARES: Position[] = [
  { row: 3, col: 3 }, // d5
  { row: 3, col: 4 }, // e5
  { row: 4, col: 3 }, // d4
  { row: 4, col: 4 }  // e4
];

/**
 * Evaluate the material on the board
 */
function evaluateMaterial(board: Board): number {
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = PIECE_VALUES[piece.type];
        score += piece.color === PC.WHITE ? value : -value;
      }
    }
  }

  return score;
}

/**
 * Evaluate positional advantages using piece-square tables
 */
function evaluatePosition(board: Board): number {
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const table = PIECE_SQUARE_TABLES[piece.type];
        // For white, flip the table vertically
        const tableRow = piece.color === PC.WHITE ? 7 - row : row;
        const bonus = table[tableRow][col];
        score += piece.color === PC.WHITE ? bonus : -bonus;
      }
    }
  }

  return score;
}

/**
 * Evaluate center control
 */
function evaluateCenterControl(board: Board): number {
  let score = 0;

  for (const pos of CENTER_SQUARES) {
    const piece = board[pos.row][pos.col];
    if (piece && piece.type !== PT.KING) {
      score += piece.color === PC.WHITE ? 10 : -10;
    }
  }

  return score;
}

/**
 * Check if position is on the board
 */
function isInBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
}

/**
 * Evaluate king safety (basic: count friendly pieces around king)
 */
function evaluateKingSafety(board: Board): number {
  let score = 0;

  // Find kings
  let whiteKingPos: Position | null = null;
  let blackKingPos: Position | null = null;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === PT.KING) {
        if (piece.color === PC.WHITE) {
          whiteKingPos = { row, col };
        } else {
          blackKingPos = { row, col };
        }
      }
    }
  }

  // Evaluate white king safety
  if (whiteKingPos) {
    let defenders = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const pos = { row: whiteKingPos.row + dr, col: whiteKingPos.col + dc };
        if (isInBounds(pos)) {
          const piece = board[pos.row][pos.col];
          if (piece && piece.color === PC.WHITE) {
            defenders++;
          }
        }
      }
    }
    score += defenders * 5;
  }

  // Evaluate black king safety
  if (blackKingPos) {
    let defenders = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const pos = { row: blackKingPos.row + dr, col: blackKingPos.col + dc };
        if (isInBounds(pos)) {
          const piece = board[pos.row][pos.col];
          if (piece && piece.color === PC.BLACK) {
            defenders++;
          }
        }
      }
    }
    score -= defenders * 5;
  }

  return score;
}

/**
 * Main evaluation function
 * Returns a score from the perspective of White
 * Positive = White is winning
 * Negative = Black is winning
 * 
 * @param board - Current board state
 * @param includePositional - Whether to include positional evaluation
 * @returns Evaluation score in centipawns
 */
export function evaluateBoard(board: Board, includePositional: boolean = true): number {
  let score = 0;

  // Material (most important)
  score += evaluateMaterial(board);

  if (includePositional) {
    // Positional advantages
    score += evaluatePosition(board);

    // Center control
    score += evaluateCenterControl(board);

    // King safety
    score += evaluateKingSafety(board);
  }

  return score;
}
