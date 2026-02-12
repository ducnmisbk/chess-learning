/**
 * Chess Engine Adapter
 * 
 * Bridge between our internal chess types and js-chess-engine library.
 * Handles conversion of board state, positions, pieces, and moves.
 */

import type { Board, Piece, Position, GameState } from '../core/types';
import { PieceType, PieceColor } from '../core/types';
import { getPieceAt } from '../core/board';
import { Game } from 'js-chess-engine';

// ==================== Position Conversion ====================

/**
 * Convert our internal Position {row, col} to algebraic square notation (e.g., "E2")
 * 
 * Our board:
 *   board[0] = rank 8, board[7] = rank 1
 *   board[row][0] = a-file, board[row][7] = h-file
 * 
 * js-chess-engine uses uppercase: "A1" to "H8"
 */
export function posToSquare(pos: Position): string {
  const files = 'ABCDEFGH';
  const rank = 8 - pos.row;
  return `${files[pos.col]}${rank}`;
}

/**
 * Convert algebraic square notation to our internal Position
 * e.g., "E2" → {row: 6, col: 4}
 */
export function squareToPos(square: string): Position {
  const col = square.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
  const row = 8 - parseInt(square[1]);
  return { row, col };
}

// ==================== Piece Conversion ====================

/**
 * Convert our Piece to FEN character
 * White = uppercase, Black = lowercase
 */
export function pieceToFenChar(piece: Piece): string {
  const charMap: Record<string, string> = {
    [PieceType.PAWN]: 'p',
    [PieceType.KNIGHT]: 'n',
    [PieceType.BISHOP]: 'b',
    [PieceType.ROOK]: 'r',
    [PieceType.QUEEN]: 'q',
    [PieceType.KING]: 'k',
  };
  const char = charMap[piece.type];
  return piece.color === PieceColor.WHITE ? char.toUpperCase() : char;
}

/**
 * Convert FEN character to our Piece type and color
 */
export function fenCharToPiece(char: string): { type: PieceType; color: PieceColor } {
  const isWhite = char === char.toUpperCase();
  const lower = char.toLowerCase();
  
  const typeMap: Record<string, PieceType> = {
    'p': PieceType.PAWN,
    'n': PieceType.KNIGHT,
    'b': PieceType.BISHOP,
    'r': PieceType.ROOK,
    'q': PieceType.QUEEN,
    'k': PieceType.KING,
  };
  
  return {
    type: typeMap[lower],
    color: isWhite ? PieceColor.WHITE : PieceColor.BLACK,
  };
}

// ==================== State Conversion ====================

/**
 * Convert our full GameState to FEN string
 * FEN format: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
 */
export function gameStateToFEN(state: Readonly<GameState>): string {
  const parts: string[] = [];

  // 1. Piece placement (from rank 8 to rank 1, i.e., row 0 to row 7)
  const ranks: string[] = [];
  for (let row = 0; row < 8; row++) {
    let rankStr = '';
    let emptyCount = 0;

    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (piece) {
        if (emptyCount > 0) {
          rankStr += emptyCount;
          emptyCount = 0;
        }
        rankStr += pieceToFenChar(piece);
      } else {
        emptyCount++;
      }
    }

    if (emptyCount > 0) {
      rankStr += emptyCount;
    }
    ranks.push(rankStr);
  }
  parts.push(ranks.join('/'));

  // 2. Active color
  parts.push(state.currentPlayer === PieceColor.WHITE ? 'w' : 'b');

  // 3. Castling availability
  let castling = '';
  if (state.castlingRights.whiteKingSide) castling += 'K';
  if (state.castlingRights.whiteQueenSide) castling += 'Q';
  if (state.castlingRights.blackKingSide) castling += 'k';
  if (state.castlingRights.blackQueenSide) castling += 'q';
  parts.push(castling || '-');

  // 4. En passant target square (lowercase in FEN)
  if (state.enPassantTarget) {
    parts.push(posToSquare(state.enPassantTarget).toLowerCase());
  } else {
    parts.push('-');
  }

  // 5. Halfmove clock
  parts.push(String(state.halfMoveClock));

  // 6. Fullmove number
  parts.push(String(state.fullMoveNumber));

  return parts.join(' ');
}

// ==================== Move Conversion ====================

/**
 * Convert js-chess-engine move result to our internal Move format
 * 
 * js-chess-engine move format: {"E2": "E4"} (single key-value pair)
 * Our Move format: { from: Position, to: Position, piece: Piece, ... }
 */
export function convertEngineMove(
  engineMove: Record<string, string>,
  board: Board
): {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  isPromotion: boolean;
  isCastling: boolean;
  isEnPassant: boolean;
  promotionPiece?: PieceType;
} | null {
  const entries = Object.entries(engineMove);
  if (entries.length === 0) return null;

  const [fromSquare, toSquare] = entries[0];
  const from = squareToPos(fromSquare);
  const to = squareToPos(toSquare);

  const piece = getPieceAt(board, from);
  if (!piece) return null;

  const capturedPiece = getPieceAt(board, to) || undefined;

  // Detect special moves
  const isPawn = piece.type === PieceType.PAWN;
  const isKing = piece.type === PieceType.KING;

  // Promotion: pawn reaching the last rank
  const promotionRank = piece.color === PieceColor.WHITE ? 0 : 7;
  const isPromotion = isPawn && to.row === promotionRank;

  // Castling: king moving 2 squares horizontally
  const isCastling = isKing && Math.abs(to.col - from.col) === 2;

  // En passant: pawn capturing diagonally to empty square
  const isEnPassant = isPawn && from.col !== to.col && !capturedPiece;

  return {
    from,
    to,
    piece: { ...piece },
    capturedPiece: capturedPiece ? { ...capturedPiece } : undefined,
    isPromotion,
    isCastling,
    isEnPassant,
    promotionPiece: isPromotion ? PieceType.QUEEN : undefined,
  };
}

/**
 * Get all legal moves from js-chess-engine for the current position.
 * Returns moves in our internal format (Position[]) for each piece position.
 * 
 * This can be used as a validation layer alongside our custom move validator.
 */
export function getEngineLegalMoves(
  state: Readonly<GameState>
): Map<string, Position[]> {
  const fen = gameStateToFEN(state);
  const engineGame = new Game(fen);
  const movesMap: Record<string, string[]> = engineGame.moves();
  
  const result = new Map<string, Position[]>();
  
  for (const [fromSquare, toSquares] of Object.entries(movesMap)) {
    const fromPos = squareToPos(fromSquare);
    const key = `${fromPos.row},${fromPos.col}`;
    const targets = (toSquares as string[]).map((sq: string) => squareToPos(sq));
    result.set(key, targets);
  }
  
  return result;
}
