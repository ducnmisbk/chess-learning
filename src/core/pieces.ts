/**
 * Pieces Module
 * 
 * Defines movement rules for each chess piece type.
 * Each function returns an array of possible destination positions (not filtered for legality yet).
 */

import type { Board, Piece, Position } from './types';
import { PieceColor } from './types';
import { PieceType as PT } from './types';
import { getPieceAt } from './board';
import { isValidPosition } from '../utils/coordinates';
import { DIRECTIONS, BOARD_SIZE } from '../utils/constants';

/**
 * Get all pseudo-legal moves for a piece at a position
 * (doesn't check if move leaves king in check)
 */
export function getPseudoLegalMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  switch (piece.type) {
    case PT.PAWN:
      return getPawnMoves(board, from, piece);
    case PT.KNIGHT:
      return getKnightMoves(board, from, piece);
    case PT.BISHOP:
      return getBishopMoves(board, from, piece);
    case PT.ROOK:
      return getRookMoves(board, from, piece);
    case PT.QUEEN:
      return getQueenMoves(board, from, piece);
    case PT.KING:
      return getKingMoves(board, from, piece);
    default:
      return [];
  }
}

/**
 * Pawn movement rules
 * - Move forward 1 square (2 if first move)
 * - Capture diagonally
 * - En passant (handled in move-validator.ts)
 */
function getPawnMoves(board: Board, from: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const direction = piece.color === PieceColor.WHITE ? -1 : 1;
  const startRank = piece.color === PieceColor.WHITE ? 6 : 1;

  // Forward moves
  const oneSquareForward: Position = {
    row: from.row + direction,
    col: from.col
  };

  if (isValidPosition(oneSquareForward) && !getPieceAt(board, oneSquareForward)) {
    moves.push(oneSquareForward);

    // Two squares forward on first move
    if (from.row === startRank) {
      const twoSquaresForward: Position = {
        row: from.row + direction * 2,
        col: from.col
      };
      if (!getPieceAt(board, twoSquaresForward)) {
        moves.push(twoSquaresForward);
      }
    }
  }

  // Diagonal captures
  const captureOffsets = [-1, 1];
  for (const colOffset of captureOffsets) {
    const capturePos: Position = {
      row: from.row + direction,
      col: from.col + colOffset
    };

    if (isValidPosition(capturePos)) {
      const targetPiece = getPieceAt(board, capturePos);
      if (targetPiece && targetPiece.color !== piece.color) {
        moves.push(capturePos);
      }
    }
  }

  return moves;
}

/**
 * Knight movement rules (L-shaped moves)
 */
function getKnightMoves(board: Board, from: Position, piece: Piece): Position[] {
  const moves: Position[] = [];

  for (const offset of DIRECTIONS.KNIGHT) {
    const to: Position = {
      row: from.row + offset.row,
      col: from.col + offset.col
    };

    if (isValidPosition(to)) {
      const targetPiece = getPieceAt(board, to);
      // Can move to empty square or capture opponent
      if (!targetPiece || targetPiece.color !== piece.color) {
        moves.push(to);
      }
    }
  }

  return moves;
}

/**
 * Bishop movement rules (diagonal lines)
 */
function getBishopMoves(board: Board, from: Position, piece: Piece): Position[] {
  return getSlidingMoves(board, from, piece, DIRECTIONS.DIAGONAL);
}

/**
 * Rook movement rules (straight lines)
 */
function getRookMoves(board: Board, from: Position, piece: Piece): Position[] {
  return getSlidingMoves(board, from, piece, DIRECTIONS.STRAIGHT);
}

/**
 * Queen movement rules (combination of bishop and rook)
 */
function getQueenMoves(board: Board, from: Position, piece: Piece): Position[] {
  return [
    ...getSlidingMoves(board, from, piece, DIRECTIONS.STRAIGHT),
    ...getSlidingMoves(board, from, piece, DIRECTIONS.DIAGONAL)
  ];
}

/**
 * King movement rules (one square in any direction)
 * Note: Castling is handled separately in move-validator.ts
 */
function getKingMoves(board: Board, from: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const allDirections = [...DIRECTIONS.STRAIGHT, ...DIRECTIONS.DIAGONAL];

  for (const offset of allDirections) {
    const to: Position = {
      row: from.row + offset.row,
      col: from.col + offset.col
    };

    if (isValidPosition(to)) {
      const targetPiece = getPieceAt(board, to);
      if (!targetPiece || targetPiece.color !== piece.color) {
        moves.push(to);
      }
    }
  }

  return moves;
}

/**
 * Helper function for sliding pieces (bishop, rook, queen)
 * Continues in each direction until hitting edge of board or another piece
 */
function getSlidingMoves(
  board: Board,
  from: Position,
  piece: Piece,
  directions: ReadonlyArray<{ row: number; col: number }>
): Position[] {
  const moves: Position[] = [];

  for (const direction of directions) {
    let currentRow = from.row + direction.row;
    let currentCol = from.col + direction.col;

    while (currentRow >= 0 && currentRow < BOARD_SIZE && 
           currentCol >= 0 && currentCol < BOARD_SIZE) {
      const currentPos: Position = { row: currentRow, col: currentCol };
      const targetPiece = getPieceAt(board, currentPos);

      if (!targetPiece) {
        // Empty square - can move here
        moves.push(currentPos);
      } else {
        // Square occupied
        if (targetPiece.color !== piece.color) {
          // Can capture opponent
          moves.push(currentPos);
        }
        // Can't move further in this direction
        break;
      }

      currentRow += direction.row;
      currentCol += direction.col;
    }
  }

  return moves;
}

/**
 * Check if a specific move is a capture
 */
export function isCapture(board: Board, to: Position, movingPiece: Piece): boolean {
  const targetPiece = getPieceAt(board, to);
  return targetPiece !== null && targetPiece.color !== movingPiece.color;
}

/**
 * Check if a piece can attack a specific square
 * (used for check detection)
 */
export function canAttackSquare(
  board: Board,
  attackerPos: Position,
  targetPos: Position
): boolean {
  const attacker = getPieceAt(board, attackerPos);
  if (!attacker) return false;

  const possibleMoves = getPseudoLegalMoves(board, attackerPos, attacker);
  return possibleMoves.some(
    (move) => move.row === targetPos.row && move.col === targetPos.col
  );
}
