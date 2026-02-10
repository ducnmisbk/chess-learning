/**
 * Board Module
 * 
 * Handles board representation and initialization.
 * The board is represented as an 8x8 2D array where:
 * - board[0] = rank 8 (black's back rank)
 * - board[7] = rank 1 (white's back rank)
 * - board[row][0] = a-file
 * - board[row][7] = h-file
 */

import type { Board, Piece, Position } from './types';
import { PieceType, PieceColor } from './types';
import { BOARD_SIZE } from '../utils/constants';

/**
 * Create an empty 8x8 chess board
 */
export function createEmptyBoard(): Board {
  const board: Board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = null;
    }
  }
  return board;
}

/**
 * Initialize board with starting chess position
 */
export function initializeBoard(): Board {
  const board = createEmptyBoard();

  // Black pieces (top of board, row 0-1)
  board[0][0] = { type: PieceType.ROOK, color: PieceColor.BLACK, hasMoved: false };
  board[0][1] = { type: PieceType.KNIGHT, color: PieceColor.BLACK, hasMoved: false };
  board[0][2] = { type: PieceType.BISHOP, color: PieceColor.BLACK, hasMoved: false };
  board[0][3] = { type: PieceType.QUEEN, color: PieceColor.BLACK, hasMoved: false };
  board[0][4] = { type: PieceType.KING, color: PieceColor.BLACK, hasMoved: false };
  board[0][5] = { type: PieceType.BISHOP, color: PieceColor.BLACK, hasMoved: false };
  board[0][6] = { type: PieceType.KNIGHT, color: PieceColor.BLACK, hasMoved: false };
  board[0][7] = { type: PieceType.ROOK, color: PieceColor.BLACK, hasMoved: false };

  for (let col = 0; col < BOARD_SIZE; col++) {
    board[1][col] = { type: PieceType.PAWN, color: PieceColor.BLACK, hasMoved: false };
  }

  // White pieces (bottom of board, row 6-7)
  for (let col = 0; col < BOARD_SIZE; col++) {
    board[6][col] = { type: PieceType.PAWN, color: PieceColor.WHITE, hasMoved: false };
  }

  board[7][0] = { type: PieceType.ROOK, color: PieceColor.WHITE, hasMoved: false };
  board[7][1] = { type: PieceType.KNIGHT, color: PieceColor.WHITE, hasMoved: false };
  board[7][2] = { type: PieceType.BISHOP, color: PieceColor.WHITE, hasMoved: false };
  board[7][3] = { type: PieceType.QUEEN, color: PieceColor.WHITE, hasMoved: false };
  board[7][4] = { type: PieceType.KING, color: PieceColor.WHITE, hasMoved: false };
  board[7][5] = { type: PieceType.BISHOP, color: PieceColor.WHITE, hasMoved: false };
  board[7][6] = { type: PieceType.KNIGHT, color: PieceColor.WHITE, hasMoved: false };
  board[7][7] = { type: PieceType.ROOK, color: PieceColor.WHITE, hasMoved: false };

  return board;
}

/**
 * Get piece at a specific position
 */
export function getPieceAt(board: Board, pos: Position): Piece | null {
  if (pos.row < 0 || pos.row >= BOARD_SIZE || pos.col < 0 || pos.col >= BOARD_SIZE) {
    return null;
  }
  return board[pos.row][pos.col];
}

/**
 * Set piece at a specific position
 */
export function setPieceAt(board: Board, pos: Position, piece: Piece | null): void {
  if (pos.row < 0 || pos.row >= BOARD_SIZE || pos.col < 0 || pos.col >= BOARD_SIZE) {
    throw new Error(`Invalid position: row=${pos.row}, col=${pos.col}`);
  }
  board[pos.row][pos.col] = piece;
}

/**
 * Create a deep copy of the board
 */
export function cloneBoard(board: Board): Board {
  const cloned: Board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    cloned[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      cloned[row][col] = piece ? { ...piece } : null;
    }
  }
  return cloned;
}

/**
 * Find all positions of pieces matching criteria
 */
export function findPieces(
  board: Board,
  predicate: (piece: Piece) => boolean
): Array<{ position: Position; piece: Piece }> {
  const results: Array<{ position: Position; piece: Piece }> = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && predicate(piece)) {
        results.push({ position: { row, col }, piece });
      }
    }
  }

  return results;
}

/**
 * Find the king of a specific color
 */
export function findKing(board: Board, color: PieceColor): Position | null {
  const kings = findPieces(
    board,
    (piece) => piece.type === PieceType.KING && piece.color === color
  );

  return kings.length > 0 ? kings[0].position : null;
}

/**
 * Count total material value for a color
 */
export function getMaterialValue(board: Board, color: PieceColor): number {
  const pieces = findPieces(board, (piece) => piece.color === color);
  
  const values: Record<PieceType, number> = {
    [PieceType.PAWN]: 1,
    [PieceType.KNIGHT]: 3,
    [PieceType.BISHOP]: 3,
    [PieceType.ROOK]: 5,
    [PieceType.QUEEN]: 9,
    [PieceType.KING]: 0 // King is invaluable
  };

  return pieces.reduce((total, { piece }) => total + values[piece.type], 0);
}

/**
 * Check if the board is in starting position
 */
export function isStartingPosition(board: Board): boolean {
  const startBoard = initializeBoard();
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      const startPiece = startBoard[row][col];
      
      if (piece === null && startPiece === null) continue;
      if (piece === null || startPiece === null) return false;
      if (piece.type !== startPiece.type || piece.color !== startPiece.color) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Print board to console (for debugging)
 */
export function printBoard(board: Board): void {
  console.log('\n  a b c d e f g h');
  for (let row = 0; row < BOARD_SIZE; row++) {
    let line = `${8 - row} `;
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece) {
        const symbol = getPieceSymbol(piece);
        line += symbol + ' ';
      } else {
        line += '. ';
      }
    }
    line += `${8 - row}`;
    console.log(line);
  }
  console.log('  a b c d e f g h\n');
}

/**
 * Get Unicode symbol for a piece (for console output)
 */
function getPieceSymbol(piece: Piece): string {
  const symbols: Record<PieceColor, Record<PieceType, string>> = {
    [PieceColor.WHITE]: {
      [PieceType.KING]: '♔',
      [PieceType.QUEEN]: '♕',
      [PieceType.ROOK]: '♖',
      [PieceType.BISHOP]: '♗',
      [PieceType.KNIGHT]: '♘',
      [PieceType.PAWN]: '♙'
    },
    [PieceColor.BLACK]: {
      [PieceType.KING]: '♚',
      [PieceType.QUEEN]: '♛',
      [PieceType.ROOK]: '♜',
      [PieceType.BISHOP]: '♝',
      [PieceType.KNIGHT]: '♞',
      [PieceType.PAWN]: '♟'
    }
  };

  return symbols[piece.color][piece.type];
}
