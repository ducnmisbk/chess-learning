/**
 * Easy AI - Random Moves with Blunder Prevention
 * 
 * Strategy: Pick random legal moves, but avoid obvious blunders
 * (losing queen or rook without compensation)
 */

import type { Move, PieceColor } from '../core/types';
import { PieceType } from '../core/types';
import type { ChessGame } from '../core/game-state';
import { AIDifficulty, type AIPlayer } from './ai-interface';
import { PIECE_VALUES } from './evaluator';

export class AIEasy implements AIPlayer {
  private thinkingDelay: number = 500; // milliseconds

  getDifficulty(): AIDifficulty {
    return AIDifficulty.EASY;
  }

  setThinkingDelay(ms: number): void {
    this.thinkingDelay = ms;
  }

  async getBestMove(game: ChessGame, color: PieceColor): Promise<Move | null> {
    // Add artificial delay to make AI feel less robotic
    await this.delay(this.thinkingDelay);

    const state = game.getState();
    const allMoves = game.getAllLegalMoves(color);

    if (allMoves.length === 0) {
      return null; // No legal moves (checkmate or stalemate)
    }

    // Filter out obvious blunders (losing valuable pieces for nothing)
    const safeMoves = this.filterBlunders(game, allMoves);

    // If all moves are blunders, just pick from all legal moves
    const movesToChooseFrom = safeMoves.length > 0 ? safeMoves : allMoves;

    // Pick a random move
    const randomIndex = Math.floor(Math.random() * movesToChooseFrom.length);
    return movesToChooseFrom[randomIndex];
  }

  /**
   * Filter out moves that lose valuable pieces without compensation
   */
  private filterBlunders(game: ChessGame, moves: Move[]): Move[] {
    const nonBlunders: Move[] = [];

    for (const move of moves) {
      if (!this.isBlunder(game, move)) {
        nonBlunders.push(move);
      }
    }

    return nonBlunders;
  }

  /**
   * Check if a move is an obvious blunder
   * A blunder is defined as losing a queen or rook without capturing anything
   */
  private isBlunder(game: ChessGame, move: Move): boolean {
    const pieceValue = PIECE_VALUES[move.piece.type];
    const captureValue = move.capturedPiece ? PIECE_VALUES[move.capturedPiece.type] : 0;

    // Only consider queen and rook as "valuable pieces" for blunder detection
    if (move.piece.type !== PieceType.QUEEN && move.piece.type !== PieceType.ROOK) {
      return false; // Not a high-value piece, so not a blunder
    }

    // Simulate the move to check if the piece is immediately recaptured
    const testGame = game.clone();
    testGame.makeMove(move.from, move.to);

    const opposingColor = move.piece.color === 'white' ? 'black' : 'white';
    const opponentMoves = testGame.getAllLegalMoves(opposingColor);

    // Check if opponent can capture our piece
    for (const opponentMove of opponentMoves) {
      if (opponentMove.to.row === move.to.row && 
          opponentMove.to.col === move.to.col &&
          opponentMove.capturedPiece) {
        // Opponent can capture our piece
        const lossValue = PIECE_VALUES[opponentMove.capturedPiece.type];
        
        // If we lose more than we gain, it's a blunder
        if (lossValue > captureValue + 100) { // +100 tolerance
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Delay utility for artificial thinking time
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
