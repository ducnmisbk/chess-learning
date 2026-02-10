/**
 * Move Validator Module
 * 
 * Validates chess moves according to all rules including:
 * - Basic piece movement
 * - Special moves (castling, en passant, promotion)
 * - Check and checkmate prevention
 * - Legal move filtering
 */

import type { Board, Piece, Position, CastlingRights, EnPassantTarget } from './types';
import { PieceType, PieceColor, GameStatus } from './types';
import { getPieceAt, setPieceAt, cloneBoard, findKing, findPieces } from './board';
import { getPseudoLegalMoves, canAttackSquare } from './pieces';
import { positionsEqual } from '../utils/coordinates';

/**
 * Get all legal moves for a piece at a position
 * (filters out moves that would leave king in check)
 */
export function getLegalMoves(
  board: Board,
  from: Position,
  castlingRights: CastlingRights,
  enPassantTarget: EnPassantTarget
): Position[] {
  const piece = getPieceAt(board, from);
  if (!piece) return [];

  let moves = getPseudoLegalMoves(board, from, piece);

  // Add castling moves
  if (piece.type === PieceType.KING) {
    const castlingMoves = getCastlingMoves(board, from, piece, castlingRights);
    moves = [...moves, ...castlingMoves];
  }

  // Add en passant moves
  if (piece.type === PieceType.PAWN && enPassantTarget) {
    const enPassantMoves = getEnPassantMoves(board, from, piece, enPassantTarget);
    moves = [...moves, ...enPassantMoves];
  }

  // Filter out moves that would leave king in check
  return moves.filter((to) => {
    return !wouldBeInCheckAfterMove(board, from, to, piece.color);
  });
}

/**
 * Check if a color is currently in check
 */
export function isInCheck(board: Board, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false; // Should never happen in valid game

  const opponentColor = color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
  const opponentPieces = findPieces(board, (piece) => piece.color === opponentColor);

  // Check if any opponent piece can attack the king
  return opponentPieces.some(({ position }) => 
    canAttackSquare(board, position, kingPos)
  );
}

/**
 * Check if making a move would leave the moving player in check
 */
function wouldBeInCheckAfterMove(
  board: Board,
  from: Position,
  to: Position,
  color: PieceColor
): boolean {
  // Simulate the move
  const boardCopy = cloneBoard(board);
  const piece = getPieceAt(boardCopy, from);
  if (!piece) return true;

  setPieceAt(boardCopy, to, piece);
  setPieceAt(boardCopy, from, null);

  return isInCheck(boardCopy, color);
}

/**
 * Get castling moves for the king
 */
function getCastlingMoves(
  board: Board,
  _kingPos: Position,
  king: Piece,
  castlingRights: CastlingRights
): Position[] {
  const moves: Position[] = [];

  // Can't castle if king has moved or is in check
  if (king.hasMoved || isInCheck(board, king.color)) {
    return moves;
  }

  const row = king.color === PieceColor.WHITE ? 7 : 0;

  // King-side castling (O-O)
  if (king.color === PieceColor.WHITE ? castlingRights.whiteKingSide : castlingRights.blackKingSide) {
    if (canCastle(board, king.color, row, 'kingside')) {
      moves.push({ row, col: 6 }); // g1 or g8
    }
  }

  // Queen-side castling (O-O-O)
  if (king.color === PieceColor.WHITE ? castlingRights.whiteQueenSide : castlingRights.blackQueenSide) {
    if (canCastle(board, king.color, row, 'queenside')) {
      moves.push({ row, col: 2 }); // c1 or c8
    }
  }

  return moves;
}

/**
 * Check if castling is possible on a specific side
 */
function canCastle(
  board: Board,
  color: PieceColor,
  row: number,
  side: 'kingside' | 'queenside'
): boolean {
  const kingCol = 4;
  const rookCol = side === 'kingside' ? 7 : 0;
  
  // Check rook is there and hasn't moved
  const rook = getPieceAt(board, { row, col: rookCol });
  if (!rook || rook.type !== PieceType.ROOK || rook.hasMoved) {
    return false;
  }

  // Check squares between king and rook are empty
  const start = side === 'kingside' ? kingCol + 1 : rookCol + 1;
  const end = side === 'kingside' ? rookCol : kingCol;
  
  for (let col = start; col < end; col++) {
    if (getPieceAt(board, { row, col })) {
      return false;
    }
  }

  // Check that king doesn't pass through or land in check
  const kingDestCol = side === 'kingside' ? 6 : 2;
  const squaresToCheck = side === 'kingside' 
    ? [kingCol, kingCol + 1, kingDestCol]
    : [kingDestCol, kingCol - 1, kingCol];

  for (const col of squaresToCheck) {
    if (wouldBeInCheckAfterMove(board, { row, col: kingCol }, { row, col }, color)) {
      return false;
    }
  }

  return true;
}

/**
 * Get en passant moves for a pawn
 */
function getEnPassantMoves(
  board: Board,
  from: Position,
  pawn: Piece,
  enPassantTarget: Position
): Position[] {
  const moves: Position[] = [];
  const direction = pawn.color === PieceColor.WHITE ? -1 : 1;

  // Check if en passant target is diagonally adjacent
  const targetRow = from.row + direction;
  const leftCol = from.col - 1;
  const rightCol = from.col + 1;

  if (enPassantTarget.row === targetRow) {
    if (enPassantTarget.col === leftCol || enPassantTarget.col === rightCol) {
      // Verify this move doesn't leave king in check
      if (!wouldBeInCheckAfterEnPassant(board, from, enPassantTarget, pawn.color)) {
        moves.push(enPassantTarget);
      }
    }
  }

  return moves;
}

/**
 * Check if en passant move would leave king in check
 * (special case because captured pawn is not on the destination square)
 */
function wouldBeInCheckAfterEnPassant(
  board: Board,
  from: Position,
  to: Position,
  color: PieceColor
): boolean {
  const boardCopy = cloneBoard(board);
  const pawn = getPieceAt(boardCopy, from);
  if (!pawn) return true;

  // Move pawn to en passant target
  setPieceAt(boardCopy, to, pawn);
  setPieceAt(boardCopy, from, null);

  // Remove captured pawn (on same row as from, same col as to)
  const capturedPawnPos: Position = { row: from.row, col: to.col };
  setPieceAt(boardCopy, capturedPawnPos, null);

  return isInCheck(boardCopy, color);
}

/**
 * Validate if a move is legal
 */
export function isLegalMove(
  board: Board,
  from: Position,
  to: Position,
  castlingRights: CastlingRights,
  enPassantTarget: EnPassantTarget
): boolean {
  const piece = getPieceAt(board, from);
  if (!piece) return false;

  const legalMoves = getLegalMoves(board, from, castlingRights, enPassantTarget);
  return legalMoves.some((move) => positionsEqual(move, to));
}

/**
 * Check if a position is under attack by a specific color
 */
export function isSquareAttacked(
  board: Board,
  position: Position,
  attackerColor: PieceColor
): boolean {
  const attackers = findPieces(board, (piece) => piece.color === attackerColor);
  
  return attackers.some(({ position: attackerPos }) =>
    canAttackSquare(board, attackerPos, position)
  );
}

/**
 * Get the current game status for a color
 */
export function getGameStatus(
  board: Board,
  color: PieceColor,
  castlingRights: CastlingRights,
  enPassantTarget: EnPassantTarget
): GameStatus {
  const inCheck = isInCheck(board, color);
  const hasLegalMoves = hasAnyLegalMoves(board, color, castlingRights, enPassantTarget);

  if (!hasLegalMoves) {
    return inCheck ? GameStatus.CHECKMATE : GameStatus.STALEMATE;
  }

  return inCheck ? GameStatus.CHECK : GameStatus.PLAYING;
}

/**
 * Check if a color has any legal moves
 */
function hasAnyLegalMoves(
  board: Board,
  color: PieceColor,
  castlingRights: CastlingRights,
  enPassantTarget: EnPassantTarget
): boolean {
  const pieces = findPieces(board, (piece) => piece.color === color);

  for (const { position } of pieces) {
    const legalMoves = getLegalMoves(board, position, castlingRights, enPassantTarget);
    if (legalMoves.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a move is a pawn promotion
 */
export function isPromotion(_from: Position, to: Position, piece: Piece): boolean {
  if (piece.type !== PieceType.PAWN) return false;

  const promotionRank = piece.color === PieceColor.WHITE ? 0 : 7;
  return to.row === promotionRank;
}

/**
 * Check if a move is castling
 */
export function isCastlingMove(from: Position, to: Position, piece: Piece): boolean {
  if (piece.type !== PieceType.KING) return false;
  
  // Castling moves the king 2 squares horizontally
  return Math.abs(to.col - from.col) === 2;
}

/**
 * Check if a move is en passant
 */
export function isEnPassantMove(
  _from: Position,
  to: Position,
  piece: Piece,
  enPassantTarget: EnPassantTarget
): boolean {
  if (piece.type !== PieceType.PAWN || !enPassantTarget) return false;
  
  return positionsEqual(to, enPassantTarget);
}
