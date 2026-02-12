/**
 * AI Engine Player - Uses js-chess-engine for move calculation
 * 
 * Replaces the custom AI implementations (AIEasy, AIMedium, AIHard) with
 * the battle-tested js-chess-engine library. This provides:
 * - Correct legal move generation
 * - Alpha-beta pruning with transposition tables
 * - Quiescence search to prevent horizon effect
 * - 5 configurable difficulty levels (mapped from our 3 levels)
 * 
 * Mapping:
 *   AIDifficulty.EASY   → js-chess-engine level 1 (Beginner, 1 ply)
 *   AIDifficulty.MEDIUM → js-chess-engine level 2 (Easy, 3 ply)
 *   AIDifficulty.HARD   → js-chess-engine level 4 (Advanced, 8 ply)
 */

import { Game } from 'js-chess-engine';
import type { Move } from '../core/types';
import { PieceColor } from '../core/types';
import type { ChessGame } from '../core/game-state';
import { AIDifficulty, type AIPlayer } from './ai-interface';
import { gameStateToFEN, convertEngineMove } from './chess-engine-adapter';

/**
 * Mapping from our difficulty levels to js-chess-engine AI levels
 */
const DIFFICULTY_TO_ENGINE_LEVEL: Record<AIDifficulty, number> = {
  [AIDifficulty.EASY]: 1,     // Beginner: 1 ply, very weak
  [AIDifficulty.MEDIUM]: 2,   // Easy: 3 ply, suitable for kids
  [AIDifficulty.HARD]: 4,     // Advanced: 8 ply, strong play
};

/**
 * Thinking delay per difficulty (milliseconds)
 * Makes AI feel more natural and less robotic for kids
 */
const THINKING_DELAYS: Record<AIDifficulty, number> = {
  [AIDifficulty.EASY]: 400,
  [AIDifficulty.MEDIUM]: 800,
  [AIDifficulty.HARD]: 1200,
};

/**
 * AI Player implementation using js-chess-engine
 * 
 * Single class that handles all difficulty levels, replacing
 * the separate AIEasy, AIMedium, and AIHard classes.
 */
export class AIEnginePlayer implements AIPlayer {
  private difficulty: AIDifficulty;
  private engineLevel: number;
  private thinkingDelay: number;

  constructor(difficulty: AIDifficulty) {
    this.difficulty = difficulty;
    this.engineLevel = DIFFICULTY_TO_ENGINE_LEVEL[difficulty];
    this.thinkingDelay = THINKING_DELAYS[difficulty];
  }

  getDifficulty(): AIDifficulty {
    return this.difficulty;
  }

  setThinkingDelay(ms: number): void {
    this.thinkingDelay = ms;
  }

  /**
   * Get the js-chess-engine level (1-5)
   */
  getEngineLevel(): number {
    return this.engineLevel;
  }

  /**
   * Set a custom engine level (1-5) for fine-grained control
   */
  setEngineLevel(level: number): void {
    this.engineLevel = Math.max(1, Math.min(5, level));
  }

  /**
   * Calculate the best move using js-chess-engine
   */
  async getBestMove(game: ChessGame, _color: PieceColor): Promise<Move | null> {
    // Add artificial delay for a more natural feel
    await this.delay(this.thinkingDelay);

    try {
      // Convert current game state to FEN
      const state = game.getState();
      const fen = gameStateToFEN(state);

      // Create a js-chess-engine Game from FEN
      const engineGame = new Game(fen);

      // Get AI move using js-chess-engine's built-in AI
      // play: false means don't apply the move to the engine's internal state
      const result = engineGame.ai({ level: this.engineLevel, play: false });

      if (!result || !result.move) {
        console.warn('js-chess-engine returned no move');
        return null;
      }

      // Convert the engine move to our internal Move format
      const convertedMove = convertEngineMove(result.move, state.board);
      if (!convertedMove) {
        console.warn('Failed to convert engine move:', result.move);
        return null;
      }

      // Build our Move object
      const move: Move = {
        from: convertedMove.from,
        to: convertedMove.to,
        piece: convertedMove.piece,
        capturedPiece: convertedMove.capturedPiece,
        isEnPassant: convertedMove.isEnPassant,
        isCastling: convertedMove.isCastling,
        isPromotion: convertedMove.isPromotion,
        promotionPiece: convertedMove.promotionPiece,
      };

      return move;
    } catch (error) {
      console.error('AIEnginePlayer error:', error);
      return null;
    }
  }

  /**
   * Delay utility for artificial thinking time
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
