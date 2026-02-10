/**
 * Hard AI - Minimax with Alpha-Beta Pruning
 * 
 * Strategy: Minimax algorithm with depth 3-4 and alpha-beta pruning
 * Evaluation: Material + position tables + king safety + center control
 */

import type { Move } from '../core/types';
import { PieceColor, GameStatus } from '../core/types';
import type { ChessGame } from '../core/game-state';
import { AIDifficulty, type AIPlayer, type AIMoveResult } from './ai-interface';
import { evaluateBoard, PIECE_VALUES } from './evaluator';

export class AIHard implements AIPlayer {
  private thinkingDelay: number = 1500; // milliseconds
  private readonly maxDepth: number = 4;

  getDifficulty(): AIDifficulty {
    return AIDifficulty.HARD;
  }

  setThinkingDelay(ms: number): void {
    this.thinkingDelay = ms;
  }

  async getBestMove(game: ChessGame, color: PieceColor): Promise<Move | null> {
    // Add artificial delay
    await this.delay(this.thinkingDelay);

    const result = this.alphaBeta(
      game,
      this.maxDepth,
      -Infinity,
      Infinity,
      color === 'white',
      color
    );
    
    return result.move;
  }

  /**
   * Minimax with Alpha-Beta Pruning
   * 
   * @param game - Current game state
   * @param depth - Remaining search depth
   * @param alpha - Best value for maximizing player
   * @param beta - Best value for minimizing player
   * @param maximizing - True if maximizing player (White)
   * @param aiColor - AI's color
   * @returns Best move and evaluation
   */
  private alphaBeta(
    game: ChessGame,
    depth: number,
    alpha: number,
    beta: number,
    maximizing: boolean,
    aiColor: PieceColor
  ): AIMoveResult {
    const state = game.getState();

    // Terminal conditions
    if (depth === 0 || state.status !== GameStatus.PLAYING) {
      return {
        move: null,
        evaluation: this.evaluatePosition(game),
        depth: 0
      };
    }

    const currentColor: PieceColor = maximizing ? PieceColor.WHITE : PieceColor.BLACK;
    const moves = game.getAllLegalMoves(currentColor);

    if (moves.length === 0) {
      return {
        move: null,
        evaluation: this.evaluatePosition(game),
        depth: 0
      };
    }

    // Order moves for better pruning
    const orderedMoves = this.orderMovesAdvanced(moves);

    if (maximizing) {
      let maxEval = -Infinity;
      let bestMove: Move | null = null;

      for (const move of orderedMoves) {
        const testGame = game.clone();
        testGame.makeMove(move.from, move.to);

        const result = this.alphaBeta(testGame, depth - 1, alpha, beta, false, aiColor);
        
        if (result.evaluation > maxEval) {
          maxEval = result.evaluation;
          bestMove = move;
        }

        alpha = Math.max(alpha, result.evaluation);
        
        // Beta cutoff (pruning)
        if (beta <= alpha) {
          break;
        }
      }

      return {
        move: bestMove,
        evaluation: maxEval,
        depth
      };
    } else {
      let minEval = Infinity;
      let bestMove: Move | null = null;

      for (const move of orderedMoves) {
        const testGame = game.clone();
        testGame.makeMove(move.from, move.to);

        const result = this.alphaBeta(testGame, depth - 1, alpha, beta, true, aiColor);
        
        if (result.evaluation < minEval) {
          minEval = result.evaluation;
          bestMove = move;
        }

        beta = Math.min(beta, result.evaluation);
        
        // Alpha cutoff (pruning)
        if (beta <= alpha) {
          break;
        }
      }

      return {
        move: bestMove,
        evaluation: minEval,
        depth
      };
    }
  }

  /**
   * Advanced move ordering for better alpha-beta pruning
   * Priority: High-value captures > Promotions > Other captures > Other moves
   */
  private orderMovesAdvanced(moves: Move[]): Move[] {
    return moves.sort((a, b) => {
      // Score each move
      const scoreA = this.scoreMoveForOrdering(a);
      const scoreB = this.scoreMoveForOrdering(b);
      return scoreB - scoreA; // Higher score first
    });
  }

  /**
   * Score a move for move ordering
   */
  private scoreMoveForOrdering(move: Move): number {
    let score = 0;

    // Captures: victim value - attacker value (MVV-LVA heuristic)
    if (move.capturedPiece) {
      score += PIECE_VALUES[move.capturedPiece.type] - PIECE_VALUES[move.piece.type] / 10;
    }

    // Promotions are valuable
    if (move.isPromotion) {
      score += 800;
    }

    // Center moves are slightly better
    const centerBonus = this.getCenterBonus(move.to.row, move.to.col);
    score += centerBonus;

    return score;
  }

  /**
   * Get bonus for center control
   */
  private getCenterBonus(row: number, col: number): number {
    // Center 4 squares
    if ((row === 3 || row === 4) && (col === 3 || col === 4)) {
      return 10;
    }
    // Extended center (12 squares)
    if (row >= 2 && row <= 5 && col >= 2 && col <= 5) {
      return 5;
    }
    return 0;
  }

  /**
   * Evaluate the current position with full evaluation
   */
  private evaluatePosition(game: ChessGame): number {
    const state = game.getState();

    // Check for terminal states
    if (state.status === GameStatus.CHECKMATE) {
      return state.currentPlayer === 'white' ? -100000 : 100000;
    }

    if (state.status === GameStatus.STALEMATE || state.status === GameStatus.DRAW) {
      return 0;
    }

    // Use full positional evaluation
    return evaluateBoard(state.board, true);
  }

  /**
   * Delay utility for artificial thinking time
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
