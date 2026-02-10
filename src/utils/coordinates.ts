/**
 * Coordinate Utilities
 * 
 * Functions for converting between different coordinate systems:
 * - Array indices (0-7, 0-7)
 * - Algebraic notation (e2, d4, etc.)
 * - Screen coordinates
 */

import type { Position } from '../core/types';
import { FILES, RANKS } from '../core/types';
import { BOARD_SIZE } from './constants';

/**
 * Check if a position is within board bounds
 */
export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && 
         pos.col >= 0 && pos.col < BOARD_SIZE;
}

/**
 * Convert position to algebraic notation (e.g., {row: 6, col: 4} -> "e2")
 */
export function toAlgebraic(pos: Position): string {
  if (!isValidPosition(pos)) {
    throw new Error(`Invalid position: row=${pos.row}, col=${pos.col}`);
  }
  return `${FILES[pos.col]}${RANKS[pos.row]}`;
}

/**
 * Convert algebraic notation to position (e.g., "e2" -> {row: 6, col: 4})
 */
export function fromAlgebraic(notation: string): Position {
  if (notation.length !== 2) {
    throw new Error(`Invalid algebraic notation: ${notation}`);
  }

  const file = notation[0].toLowerCase();
  const rank = notation[1];

  const col = FILES.indexOf(file as any);
  const row = RANKS.indexOf(rank as any);

  if (col === -1 || row === -1) {
    throw new Error(`Invalid algebraic notation: ${notation}`);
  }

  return { row, col };
}

/**
 * Check if two positions are equal
 */
export function positionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.row === pos2.row && pos1.col === pos2.col;
}

/**
 * Create a copy of a position
 */
export function clonePosition(pos: Position): Position {
  return { row: pos.row, col: pos.col };
}

/**
 * Calculate Manhattan distance between two positions
 */
export function manhattanDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

/**
 * Calculate Chebyshev distance (max of row/col distance)
 */
export function chebyshevDistance(pos1: Position, pos2: Position): number {
  return Math.max(Math.abs(pos1.row - pos2.row), Math.abs(pos1.col - pos2.col));
}

/**
 * Check if a position is on the board edge
 */
export function isEdgePosition(pos: Position): boolean {
  return pos.row === 0 || pos.row === BOARD_SIZE - 1 || 
         pos.col === 0 || pos.col === BOARD_SIZE - 1;
}

/**
 * Check if a position is in the center 4 squares (d4, d5, e4, e5)
 */
export function isCenterPosition(pos: Position): boolean {
  return (pos.row === 3 || pos.row === 4) && (pos.col === 3 || pos.col === 4);
}

/**
 * Check if a position is in the extended center (16 squares)
 */
export function isExtendedCenterPosition(pos: Position): boolean {
  return pos.row >= 2 && pos.row <= 5 && pos.col >= 2 && pos.col <= 5;
}

/**
 * Get all positions on the board
 */
export function getAllPositions(): Position[] {
  const positions: Position[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      positions.push({ row, col });
    }
  }
  return positions;
}

/**
 * Convert screen coordinates to board position
 * @param x - X coordinate in pixels
 * @param y - Y coordinate in pixels
 * @param squareSize - Size of each square in pixels
 * @param boardOrientation - 'white' or 'black'
 */
export function screenToBoard(
  x: number, 
  y: number, 
  squareSize: number,
  boardOrientation: 'white' | 'black' = 'white'
): Position | null {
  const col = Math.floor(x / squareSize);
  const row = Math.floor(y / squareSize);

  // Flip if board is oriented for black
  const finalRow = boardOrientation === 'black' ? (BOARD_SIZE - 1 - row) : row;
  const finalCol = boardOrientation === 'black' ? (BOARD_SIZE - 1 - col) : col;

  const pos = { row: finalRow, col: finalCol };
  return isValidPosition(pos) ? pos : null;
}

/**
 * Convert board position to screen coordinates (top-left corner of square)
 * @param pos - Board position
 * @param squareSize - Size of each square in pixels
 * @param boardOrientation - 'white' or 'black'
 */
export function boardToScreen(
  pos: Position, 
  squareSize: number,
  boardOrientation: 'white' | 'black' = 'white'
): { x: number; y: number } {
  // Flip if board is oriented for black
  const displayRow = boardOrientation === 'black' ? (BOARD_SIZE - 1 - pos.row) : pos.row;
  const displayCol = boardOrientation === 'black' ? (BOARD_SIZE - 1 - pos.col) : pos.col;

  return {
    x: displayCol * squareSize,
    y: displayRow * squareSize
  };
}
