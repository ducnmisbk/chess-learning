/**
 * AI Interface
 * 
 * Common interface for all AI difficulty levels.
 * Provides a consistent API for the game to interact with different AI implementations.
 */

import type { Move, PieceColor } from '../core/types';
import type { ChessGame } from '../core/game-state';

/**
 * AI difficulty levels
 */
export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

/**
 * AI player interface
 */
export interface AIPlayer {
  /**
   * Get the difficulty level
   */
  getDifficulty(): AIDifficulty;

  /**
   * Calculate the best move for the current position
   * @param game - Current game state
   * @param color - AI's color
   * @returns Promise resolving to the best move
   */
  getBestMove(game: ChessGame, color: PieceColor): Promise<Move | null>;

  /**
   * Set thinking time delay (milliseconds)
   */
  setThinkingDelay(ms: number): void;
}

/**
 * Generic AI move result with evaluation
 */
export interface AIMoveResult {
  move: Move | null;
  evaluation: number;
  depth: number;
}
