/**
 * Core Chess Types and Constants
 * 
 * Defines fundamental types used throughout the chess game engine.
 * These types provide type safety and clear documentation of the game's data structures.
 */

/**
 * Chess piece types
 */
export enum PieceType {
  PAWN = 'pawn',
  KNIGHT = 'knight',
  BISHOP = 'bishop',
  ROOK = 'rook',
  QUEEN = 'queen',
  KING = 'king'
}

/**
 * Chess piece colors
 */
export enum PieceColor {
  WHITE = 'white',
  BLACK = 'black'
}

/**
 * Chess piece representation
 */
export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved: boolean; // For castling and pawn double-move
}

/**
 * Board position (0-indexed)
 * Row 0 = rank 8 (black's back rank)
 * Row 7 = rank 1 (white's back rank)
 * Col 0 = a-file
 * Col 7 = h-file
 */
export interface Position {
  row: number; // 0-7
  col: number; // 0-7
}

/**
 * Chess move representation
 */
export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  isEnPassant?: boolean;
  isCastling?: boolean;
  isPromotion?: boolean;
  promotionPiece?: PieceType;
}

/**
 * Board representation (8x8 grid)
 * board[row][col] where:
 * - null = empty square
 * - Piece = occupied square
 */
export type Board = (Piece | null)[][];

/**
 * Game status
 */
export enum GameStatus {
  PLAYING = 'playing',
  CHECK = 'check',
  CHECKMATE = 'checkmate',
  STALEMATE = 'stalemate',
  DRAW = 'draw'
}

/**
 * Castling rights
 */
export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

/**
 * En passant target square (if a pawn just moved two squares)
 */
export type EnPassantTarget = Position | null;

/**
 * Complete game state
 */
export interface GameState {
  board: Board;
  currentPlayer: PieceColor;
  status: GameStatus;
  castlingRights: CastlingRights;
  enPassantTarget: EnPassantTarget;
  halfMoveClock: number; // For 50-move rule
  fullMoveNumber: number;
}

/**
 * Piece value constants (for AI evaluation)
 */
export const PIECE_VALUES: Record<PieceType, number> = {
  [PieceType.PAWN]: 100,
  [PieceType.KNIGHT]: 320,
  [PieceType.BISHOP]: 330,
  [PieceType.ROOK]: 500,
  [PieceType.QUEEN]: 900,
  [PieceType.KING]: 20000
};

/**
 * Files (columns) in algebraic notation
 */
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

/**
 * Ranks (rows) in algebraic notation
 */
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;
