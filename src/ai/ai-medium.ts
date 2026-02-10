/**
 * Medium AI - Minimax with Basic Evaluation
 * 
 * Strategy: Minimax algorithm with depth 2-3
 * Evaluation: Material count + center control
 */

import type { Move, PieceColor } from '../core/types';
import type { ChessGame } from '../core/game-state';
import { GameStatus } from '../core/types';
import { AIDifficulty, type AIPlayer, type AIMoveResult } from './ai-interface';
import { evaluateBoard } from './evaluator';

export class AIMedium implements AIPlayer {
  private thinkingDelay: number = 1000; // milliseconds
  private readonly maxDepth: number = 3;

  getDifficulty(): AIDifficulty {
    return AIDifficulty.MEDIUM;
  }

  setThinkingDelay(ms: number): void {
    this.thinkingDelay = ms;
  }

  async getBestMove(game: ChessGame, color: PieceColor): Promise<Move | null> {
    // Add artificial delay
    await this.delay(this.thinkingDelay);

    const result = this.minimax(game, this.maxDepth, color === 'white', color);
    return result.move;
  }

  /**
   * Minimax algorithm (basic, no alpha-beta pruning)
   * 
   * @param game - Current game state
   * @param depth - Remaining search depth
   * @param maximizing - True if maximizing player (White), false if minimizing (Black)
   * @param aiColor - AI's color
   * @returns Best move and evaluation
   */
  private minimax(
    game: ChessGame,
    depth: number,
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

    const currentColor: PieceColor = maximizing ? 'white' : 'black';
    const moves = game.getAllLegalMoves(currentColor);

    if (moves.length === 0) {
      // No legal moves
      return {
        move: null,
        evaluation: this.evaluatePosition(game),
        depth: 0
      };
    }

    // Order moves: captures first for better search
    const orderedMoves = this.orderMoves(moves);

    if (maximizing) {
      let maxEval = -Infinity;
      let bestMove: Move | null = null;

      for (const move of orderedMoves) {
        const testGame = game.clone();
        testGame.makeMove(move.from, move.to);

        const result = this.minimax(testGame, depth - 1, false, aiColor);
        
        if (result.evaluation > maxEval) {
          maxEval = result.evaluation;
          bestMove = move;
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

        const result = this.minimax(testGame, depth - 1, true, aiColor);
        
        if (result.evaluation < minEval) {
          minEval = result.evaluation;
          bestMove = move;
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
   * Order moves for better search efficiency
   * Captures first, then other moves
   */
  private orderMoves(moves: Move[]): Move[] {
    return moves.sort((a, b) => {
      // Captures before non-captures
      if (a.capturedPiece && !b.capturedPiece) return -1;
      if (!a.capturedPiece && b.capturedPiece) return 1;
      return 0;
    });
  }

  /**
   * Evaluate the current position
   */
  private evaluatePosition(game: ChessGame): number {
    const state = game.getState();

    // Check for terminal states
    if (state.status === GameStatus.CHECKMATE) {
      // If White to move and checkmate, Black wins
      return state.currentPlayer === 'white' ? -100000 : 100000;
    }

    if (state.status === GameStatus.STALEMATE || state.status === GameStatus.DRAW) {
      return 0;
    }

    // Use basic positional evaluation (material + center)
    return evaluateBoard(state.board, true);
  }

  /**
   * Delay utility for artificial thinking time
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
