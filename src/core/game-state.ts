/**
 * Game State Module
 * 
 * Main chess game state management.
 * Handles move execution, game status, and state transitions.
 */

import type { Board, Piece, Position, Move, GameState, CastlingRights } from './types';
import { PieceType, PieceColor, GameStatus } from './types';
import { 
  initializeBoard, 
  cloneBoard, 
  getPieceAt, 
  setPieceAt,
  printBoard 
} from './board';
import { 
  getLegalMoves, 
  isLegalMove, 
  getGameStatus,
  isPromotion,
  isCastlingMove,
  isEnPassantMove 
} from './move-validator';
import { MoveHistory, HistoryEntry } from './move-history';
import { toAlgebraic } from '../utils/coordinates';

/**
 * Chess Game Manager
 */
export class ChessGame {
  private state: GameState;
  private history: MoveHistory;

  constructor(state?: GameState) {
    this.state = state || this.createInitialState();
    this.history = new MoveHistory();
  }

  /**
   * Create initial game state
   */
  private createInitialState(): GameState {
    return {
      board: initializeBoard(),
      currentPlayer: PieceColor.WHITE,
      status: GameStatus.PLAYING,
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true
      },
      enPassantTarget: null,
      halfMoveClock: 0,
      fullMoveNumber: 1
    };
  }

  /**
   * Get current game state (read-only copy)
   */
  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  /**
   * Get current board
   */
  getBoard(): Board {
    return this.state.board;
  }

  /**
   * Get current player
   */
  getCurrentPlayer(): PieceColor {
    return this.state.currentPlayer;
  }

  /**
   * Get game status
   */
  getStatus(): GameStatus {
    return this.state.status;
  }

  /**
   * Get legal moves for a piece at a position
   */
  getLegalMovesFor(position: Position): Position[] {
    const piece = getPieceAt(this.state.board, position);
    if (!piece || piece.color !== this.state.currentPlayer) {
      return [];
    }

    return getLegalMoves(
      this.state.board,
      position,
      this.state.castlingRights,
      this.state.enPassantTarget
    );
  }

  /**
   * Attempt to make a move
   * Returns true if move was legal and executed, false otherwise
   */
  makeMove(from: Position, to: Position, promotionPiece?: PieceType): boolean {
    // Validate move
    if (!isLegalMove(
      this.state.board,
      from,
      to,
      this.state.castlingRights,
      this.state.enPassantTarget
    )) {
      return false;
    }

    const piece = getPieceAt(this.state.board, from);
    if (!piece || piece.color !== this.state.currentPlayer) {
      return false;
    }

    // Save state before move
    const stateBefore = this.cloneState();

    // Execute the move
    const move = this.executeMoveInternal(from, to, promotionPiece);

    // Save state after move
    const stateAfter = this.cloneState();

    // Add to history
    const notation = this.getMoveNotation(move, stateBefore);
    this.history.addMove({
      move,
      stateBefore,
      stateAfter,
      notation
    });

    // Update game status
    this.updateGameStatus();

    return true;
  }

  /**
   * Execute move and update game state
   */
  private executeMoveInternal(
    from: Position,
    to: Position,
    promotionPiece?: PieceType
  ): Move {
    const piece = getPieceAt(this.state.board, from)!;
    const capturedPiece = getPieceAt(this.state.board, to);

    // Create move record
    const move: Move = {
      from,
      to,
      piece: { ...piece },
      capturedPiece: capturedPiece ? { ...capturedPiece } : undefined
    };

    // Handle special moves
    const isEnPassant = isEnPassantMove(from, to, piece, this.state.enPassantTarget);
    const isCastling = isCastlingMove(from, to, piece);
    const isPromotionMove = isPromotion(from, to, piece);

    if (isEnPassant) {
      move.isEnPassant = true;
      // Remove captured pawn
      const capturedPawnRow = from.row;
      const capturedPawnCol = to.col;
      move.capturedPiece = { ...getPieceAt(this.state.board, { row: capturedPawnRow, col: capturedPawnCol })! };
      setPieceAt(this.state.board, { row: capturedPawnRow, col: capturedPawnCol }, null);
    }

    if (isCastling) {
      move.isCastling = true;
      // Move rook
      const rookFromCol = to.col > from.col ? 7 : 0;
      const rookToCol = to.col > from.col ? to.col - 1 : to.col + 1;
      const row = from.row;
      
      const rook = getPieceAt(this.state.board, { row, col: rookFromCol })!;
      setPieceAt(this.state.board, { row, col: rookToCol }, { ...rook, hasMoved: true });
      setPieceAt(this.state.board, { row, col: rookFromCol }, null);
    }

    if (isPromotionMove) {
      move.isPromotion = true;
      move.promotionPiece = promotionPiece || PieceType.QUEEN;
    }

    // Execute basic move
    const movedPiece = isPromotionMove && move.promotionPiece
      ? { type: move.promotionPiece, color: piece.color, hasMoved: true }
      : { ...piece, hasMoved: true };

    setPieceAt(this.state.board, to, movedPiece);
    setPieceAt(this.state.board, from, null);

    // Update castling rights
    this.updateCastlingRights(from, piece);

    // Update en passant target
    this.updateEnPassantTarget(from, to, piece);

    // Update move clocks
    if (piece.type === PieceType.PAWN || capturedPiece) {
      this.state.halfMoveClock = 0;
    } else {
      this.state.halfMoveClock++;
    }

    if (this.state.currentPlayer === PieceColor.BLACK) {
      this.state.fullMoveNumber++;
    }

    // Switch players
    this.state.currentPlayer = this.state.currentPlayer === PieceColor.WHITE
      ? PieceColor.BLACK
      : PieceColor.WHITE;

    return move;
  }

  /**
   * Update castling rights after a move
   */
  private updateCastlingRights(from: Position, piece: Piece): void {
    // King moved
    if (piece.type === PieceType.KING) {
      if (piece.color === PieceColor.WHITE) {
        this.state.castlingRights.whiteKingSide = false;
        this.state.castlingRights.whiteQueenSide = false;
      } else {
        this.state.castlingRights.blackKingSide = false;
        this.state.castlingRights.blackQueenSide = false;
      }
    }

    // Rook moved
    if (piece.type === PieceType.ROOK) {
      if (piece.color === PieceColor.WHITE) {
        if (from.row === 7 && from.col === 7) {
          this.state.castlingRights.whiteKingSide = false;
        } else if (from.row === 7 && from.col === 0) {
          this.state.castlingRights.whiteQueenSide = false;
        }
      } else {
        if (from.row === 0 && from.col === 7) {
          this.state.castlingRights.blackKingSide = false;
        } else if (from.row === 0 && from.col === 0) {
          this.state.castlingRights.blackQueenSide = false;
        }
      }
    }
  }

  /**
   * Update en passant target after a pawn move
   */
  private updateEnPassantTarget(from: Position, to: Position, piece: Piece): void {
    // Clear previous en passant target
    this.state.enPassantTarget = null;

    // Set new target if pawn moved two squares
    if (piece.type === PieceType.PAWN && Math.abs(to.row - from.row) === 2) {
      const targetRow = (from.row + to.row) / 2;
      this.state.enPassantTarget = { row: targetRow, col: from.col };
    }
  }

  /**
   * Update game status (check, checkmate, stalemate)
   */
  private updateGameStatus(): void {
    this.state.status = getGameStatus(
      this.state.board,
      this.state.currentPlayer,
      this.state.castlingRights,
      this.state.enPassantTarget
    );

    // Check for draw by 50-move rule
    if (this.state.halfMoveClock >= 100) { // 50 moves = 100 half-moves
      this.state.status = GameStatus.DRAW;
    }
  }

  /**
   * Undo last move
   */
  undo(): boolean {
    const previousState = this.history.undo();
    if (!previousState) return false;

    this.state = previousState;
    return true;
  }

  /**
   * Redo previously undone move
   */
  redo(): boolean {
    const nextState = this.history.redo();
    if (!nextState) return false;

    this.state = nextState;
    return true;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.history.canUndo();
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.history.canRedo();
  }

  /**
   * Get move history
   */
  getHistory(): MoveHistory {
    return this.history;
  }

  /**
   * Get all legal moves for a color
   * Used by AI to explore possible moves
   */
  getAllLegalMoves(color: PieceColor): Move[] {
    const moves: Move[] = [];

    // Iterate through all squares to find pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = getPieceAt(this.state.board, { row, col });
        
        // Skip if square is empty or piece is not the right color
        if (!piece || piece.color !== color) {
          continue;
        }

        const from: Position = { row, col };
        const legalPositions = getLegalMoves(
          this.state.board,
          from,
          this.state.castlingRights,
          this.state.enPassantTarget
        );

        // Convert positions to moves
        for (const to of legalPositions) {
          const capturedPiece = getPieceAt(this.state.board, to);
          
          const move: Move = {
            from,
            to,
            piece: { ...piece },
            capturedPiece: capturedPiece ? { ...capturedPiece } : undefined,
            isEnPassant: isEnPassantMove(from, to, piece, this.state.enPassantTarget),
            isCastling: isCastlingMove(from, to, piece),
            isPromotion: isPromotion(from, to, piece)
          };

          // If promotion, we need to consider all promotion pieces
          if (move.isPromotion) {
            // For AI purposes, just use Queen promotion
            // (can be expanded to consider all promotion options)
            move.promotionPiece = PieceType.QUEEN;
            moves.push(move);
          } else {
            moves.push(move);
          }
        }
      }
    }

    return moves;
  }

  /**
   * Clone the game
   * Creates a deep copy of the game state for AI simulation
   */
  clone(): ChessGame {
    const clonedState = this.cloneState();
    return new ChessGame(clonedState);
  }

  /**
   * Reset game to initial state
   */
  reset(): void {
    this.state = this.createInitialState();
    this.history.clear();
  }

  /**
   * Clone current state
   */
  private cloneState(): GameState {
    return {
      board: cloneBoard(this.state.board),
      currentPlayer: this.state.currentPlayer,
      status: this.state.status,
      castlingRights: { ...this.state.castlingRights },
      enPassantTarget: this.state.enPassantTarget 
        ? { ...this.state.enPassantTarget } 
        : null,
      halfMoveClock: this.state.halfMoveClock,
      fullMoveNumber: this.state.fullMoveNumber
    };
  }

  /**
   * Get algebraic notation for a move
   */
  private getMoveNotation(move: Move, stateBefore: GameState): string {
    const { from, to, piece } = move;

    // Castling
    if (move.isCastling) {
      return to.col > from.col ? 'O-O' : 'O-O-O';
    }

    let notation = '';

    // Piece prefix (pawns don't get a letter)
    if (piece.type !== PieceType.PAWN) {
      notation += piece.type.charAt(0).toUpperCase();
    }

    // Capture (pawns include starting file)
    if (move.capturedPiece || move.isEnPassant) {
      if (piece.type === PieceType.PAWN) {
        notation += toAlgebraic(from).charAt(0); // File letter
      }
      notation += 'x';
    }

    // Destination square
    notation += toAlgebraic(to);

    // Promotion
    if (move.isPromotion && move.promotionPiece) {
      notation += '=' + move.promotionPiece.charAt(0).toUpperCase();
    }

    // Check/Checkmate (will be added after updating state)
    // This is a simplified version - proper notation requires checking the new state
    if (this.state.status === GameStatus.CHECKMATE) {
      notation += '#';
    } else if (this.state.status === GameStatus.CHECK) {
      notation += '+';
    }

    return notation;
  }

  /**
   * Print board to console (for debugging)
   */
  printBoard(): void {
    printBoard(this.state.board);
    console.log(`Current player: ${this.state.currentPlayer}`);
    console.log(`Status: ${this.state.status}`);
    console.log(`Move #${this.state.fullMoveNumber}`);
  }
}
