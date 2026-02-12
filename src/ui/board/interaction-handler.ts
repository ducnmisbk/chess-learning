/**
 * Board Interaction Handler
 * 
 * Manages user interaction with the chess board (clicks, selections, moves).
 */

import type { Position } from '../../core/types';
import type { ChessGame } from '../../core/game-state';
import type { BoardRenderer } from './board-renderer';
import { GameStatus } from '../../core/types';

export type MoveCallback = (from: Position, to: Position) => void;

/**
 * Interaction Handler class
 */
export class InteractionHandler {
  private game: ChessGame;
  private renderer: BoardRenderer;
  private selectedPosition: Position | null = null;
  private legalMoves: Position[] = [];
  private onMove: MoveCallback | null = null;
  private enabled: boolean = true;

  constructor(game: ChessGame, renderer: BoardRenderer) {
    this.game = game;
    this.renderer = renderer;
  }

  /**
   * Initialize event listeners
   */
  initialize(): void {
    this.attachEventListeners();
  }

  /**
   * Attach click event listeners to squares
   */
  private attachEventListeners(): void {
    // Use event delegation for better performance
    const boardElement = this.renderer['boardElement'];
    if (!boardElement) return;

    boardElement.addEventListener('click', (e) => this.handleSquareClick(e));
  }

  /**
   * Handle square click
   */
  private handleSquareClick(event: Event): void {
    if (!this.enabled) return;

    const target = event.target as HTMLElement;
    const square = target.closest('.square') as HTMLElement;
    
    if (!square) return;

    const position = this.renderer.getPositionFromSquare(square);
    if (!position) return;

    this.handlePositionClick(position);
  }

  /**
   * Handle position click logic
   */
  private handlePositionClick(position: Position): void {
    // If a piece is selected
    if (this.selectedPosition) {
      // Check if clicked square is a legal move
      if (this.isLegalMoveTarget(position)) {
        this.executeMove(this.selectedPosition, position);
      } else {
        // Try to select a new piece
        this.selectPosition(position);
      }
    } else {
      // No piece selected, try to select one
      this.selectPosition(position);
    }
  }

  /**
   * Select a position
   */
  private selectPosition(position: Position): void {
    // Clear previous selection
    this.clearSelection();

    // Get legal moves for this position
    const moves = this.game.getLegalMovesFor(position);
    
    if (moves.length === 0) {
      // No legal moves, don't select
      return;
    }

    // Select the position
    this.selectedPosition = position;
    this.legalMoves = moves;

    // Highlight selected square
    this.renderer.highlightSquares([position], 'selected');
    
    // Highlight legal moves
    this.renderer.highlightSquares(moves, 'legal-move');
  }

  /**
   * Clear current selection
   */
  private clearSelection(): void {
    this.selectedPosition = null;
    this.legalMoves = [];
    this.renderer.clearHighlights();
    
    // Re-highlight last move if exists
    const lastMove = this.game.getHistory().getLastMove();
    if (lastMove) {
      this.renderer.highlightLastMove(lastMove.move.from, lastMove.move.to);
    }
  }

  /**
   * Check if position is a legal move target
   */
  private isLegalMoveTarget(position: Position): boolean {
    return this.legalMoves.some(
      move => move.row === position.row && move.col === position.col
    );
  }

  /**
   * Execute a move
   */
  private executeMove(from: Position, to: Position): void {
    // Check if pawn promotion
    const piece = this.game.getBoard()[from.row][from.col];
    let promotionPiece = undefined;
    
    if (piece && piece.type === 'pawn') {
      const promotionRank = piece.color === 'white' ? 0 : 7;
      if (to.row === promotionRank) {
        // For now, always promote to queen
        // TODO: Add promotion dialog in future
        promotionPiece = 'queen' as any;
      }
    }

    // Make the move
    const success = this.game.makeMove(from, to, promotionPiece);
    
    if (success) {
      // Clear selection
      this.clearSelection();
      
      // Render updated board
      this.renderer.renderBoard(this.game.getBoard());
      
      // Highlight the move that was just made
      this.renderer.highlightLastMove(from, to);
      
      // Check for check
      const status = this.game.getStatus();
      if (status === GameStatus.CHECK || status === GameStatus.CHECKMATE) {
        // Highlight the king that is in check (current player to move)
        const checkedColor = this.game.getCurrentPlayer();
        const kingPos = this.findKingPosition(checkedColor);
        if (kingPos) {
          this.renderer.highlightCheck(kingPos);
        }
      }
      
      // Call move callback
      if (this.onMove) {
        this.onMove(from, to);
      }
    }
  }

  /**
   * Find king position (helper method)
   */
  private findKingPosition(color: 'white' | 'black'): Position | null {
    const board = this.game.getBoard();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }

  /**
   * Set move callback
   */
  setOnMove(callback: MoveCallback): void {
    this.onMove = callback;
  }

  /**
   * Enable/disable interaction
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clearSelection();
    }
  }

  /**
   * Reset interaction state
   */
  reset(): void {
    this.clearSelection();
    this.enabled = true;
  }
}
