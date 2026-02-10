/**
 * Game Analyzer - Provides post-game analysis and enriched game records
 * Analyzes completed games for blunders, brilliant moves, tactical patterns, etc.
 */

import { Board, Move, PieceColor } from '../core/types';
import { TacticalAnalyzer, DetectedTactic } from './tactical-analyzer';
import type { AIDifficulty } from './skill-engine';

export interface GameAnalysis {
  blunders: number;
  mistakes: number;
  brilliantMoves: number;
  avgThinkTime: number;        // Seconds per move
  openingName?: string;
  ratingChange: number;
  tacticsUsed: string[];       // ['fork', 'pin', ...]
  phaseQuality: {
    opening: number;           // 0-100
    middlegame: number;
    endgame: number;
  };
  totalMoves: number;
  duration: number;            // Total game time in seconds
}

export interface EnrichedGameRecord {
  id: string;
  userId: string;
  mode: 'pvp' | 'ai';
  difficulty?: AIDifficulty;
  playerColor: 'white' | 'black';
  result: 'win' | 'loss' | 'draw';
  moves: string[];             // Algebraic notation
  timestamp: number;
  duration: number;
  analysis: GameAnalysis;
}

export interface MoveAnalysis {
  moveNumber: number;
  move: string;
  isBlunder: boolean;
  isMistake: boolean;
  isBrilliant: boolean;
  tactics: DetectedTactic[];
  evaluation: number;
  thinkTime: number;
}

export class GameAnalyzer {
  /**
   * Analyze a completed game
   */
  static analyzeGame(
    moves: Move[],
    boards: Board[],  // Board state after each move
    playerColor: PieceColor,
    moveTimes: number[],  // Time taken for each move (in seconds)
    _result: 'win' | 'loss' | 'draw',
    _opponent: AIDifficulty | 'player',
    ratingChange: number
  ): GameAnalysis {
    const moveAnalyses: MoveAnalysis[] = [];
    let blunders = 0;
    let mistakes = 0;
    let brilliantMoves = 0;
    const tacticsUsed = new Set<string>();

    // Analyze each player move
    for (let i = 0; i < moves.length; i++) {
      const  move = moves[i];
      const boardBefore = i > 0 ? boards[i - 1] : this.getInitialBoard();
      const boardAfter = boards[i];
      
      // Only analyze player's moves
      if (this.isPlayerMove(i, playerColor)) {
        const quality = TacticalAnalyzer.evaluateMoveQuality(
          boardBefore,
          boardAfter,
          move,
          playerColor
        );

        if (quality.isBlunder) blunders++;
        if (quality.isMistake) mistakes++;
        if (quality.isBrilliant) brilliantMoves++;

        // Detect tactics
        const tactics = TacticalAnalyzer.analyzeMoveForTactics(
          boardBefore,
          boardAfter,
          move
        );

        tactics.forEach(t => tacticsUsed.add(t.type));

        moveAnalyses.push({
          moveNumber: Math.floor(i / 2) + 1,
          move: this.moveToAlgebraic(move, boardBefore),
          isBlunder: quality.isBlunder,
          isMistake: quality.isMistake,
          isBrilliant: quality.isBrilliant,
          tactics,
          evaluation: quality.evaluation,
          thinkTime: moveTimes[i] || 0,
        });
      }
    }

    // Calculate average think time (player moves only)
    const playerMoveTimes = moveTimes.filter((_, i) => this.isPlayerMove(i, playerColor));
    const avgThinkTime = playerMoveTimes.length > 0
      ? playerMoveTimes.reduce((sum, t) => sum + t, 0) / playerMoveTimes.length
      : 0;

    // Determine game phases
    const phases = this.divideIntoPhases(moves.length);
    const phaseQuality = this.evaluatePhaseQuality(
      moveAnalyses,
      phases,
      blunders,
      mistakes,
      brilliantMoves
    );

    // Detect opening
    const openingName = this.detectOpening(moves.slice(0, 8));

    // Calculate total duration
    const duration = moveTimes.reduce((sum, t) => sum + t, 0);

    return {
      blunders,
      mistakes,
      brilliantMoves,
      avgThinkTime: Math.round(avgThinkTime * 10) / 10,
      openingName,
      ratingChange,
      tacticsUsed: Array.from(tacticsUsed),
      phaseQuality,
      totalMoves: Math.floor(moves.length / 2),
      duration: Math.round(duration),
    };
  }

  /**
   * Check if move index is player's move
   */
  private static isPlayerMove(moveIndex: number, playerColor: PieceColor): boolean {
    const isWhiteMove = moveIndex % 2 === 0;
    return (playerColor === PieceColor.WHITE && isWhiteMove) ||
           (playerColor === PieceColor.BLACK && !isWhiteMove);
  }

  /**
   * Divide game into phases (opening, middlegame, endgame)
   */
  private static divideIntoPhases(totalMoves: number): {
    opening: [number, number];
    middlegame: [number, number];
    endgame: [number, number];
  } {
    // Opening: first 10-12 moves
    // Middlegame: 13-30 moves
    // Endgame: 31+ moves
    
    const openingEnd = Math.min(12, Math.floor(totalMoves * 0.3));
    const middlegameEnd = Math.min(30, Math.floor(totalMoves * 0.7));

    return {
      opening: [0, openingEnd],
      middlegame: [openingEnd + 1, middlegameEnd],
      endgame: [middlegameEnd + 1, totalMoves - 1],
    };
  }

  /**
   * Evaluate quality of play in each phase (0-100)
   */
  private static evaluatePhaseQuality(
    moveAnalyses: MoveAnalysis[],
    phases: ReturnType<typeof GameAnalyzer.divideIntoPhases>,
    _totalBlunders: number,
    _totalMistakes: number,
    _totalBrilliantMoves: number
  ): { opening: number; middlegame: number; endgame: number } {
    const evaluatePhase = (moves: MoveAnalysis[]): number => {
      if (moves.length === 0) return 50;  // Default

      let score = 70;  // Base score
      
      // Penalize blunders and mistakes
      const blunders = moves.filter(m => m.isBlunder).length;
      const mistakes = moves.filter(m => m.isMistake).length;
      const brilliant = moves.filter(m => m.isBrilliant).length;
      
      score -= blunders * 15;
      score -= mistakes * 7;
      score += brilliant * 10;

      // Bonus for finding tactics
      const tacticsFound = moves.filter(m => m.tactics.length > 0).length;
      score += Math.min(tacticsFound * 5, 20);

      return Math.max(0, Math.min(100, score));
    };

    const openingMoves = moveAnalyses.filter(m => 
      m.moveNumber >= phases.opening[0] && m.moveNumber <= phases.opening[1]
    );
    const middlegameMoves = moveAnalyses.filter(m => 
      m.moveNumber >= phases.middlegame[0] && m.moveNumber <= phases.middlegame[1]
    );
    const endgameMoves = moveAnalyses.filter(m => 
      m.moveNumber >= phases.endgame[0] && m.moveNumber <= phases.endgame[1]
    );

    return {
      opening: evaluatePhase(openingMoves),
      middlegame: evaluatePhase(middlegameMoves),
      endgame: evaluatePhase(endgameMoves),
    };
  }

  /**
   * Detect opening name from first few moves
   */
  private static detectOpening(firstMoves: Move[]): string | undefined {
    if (firstMoves.length < 2) return undefined;

    // Simple opening detection based on first moves
    // This is a simplified version - could be expanded with a proper opening database
    
    const moveString = firstMoves.slice(0, 4).map(m => 
      this.moveToSimpleNotation(m)
    ).join(' ');

    const openings: Record<string, string> = {
      'e4 e5': 'King\'s Pawn Game',
      'e4 e5 Nf3 Nc6': 'King\'s Knight Opening',
      'e4 e5 Nf3 Nc6 Bb5': 'Ruy Lopez',
      'e4 e5 Nf3 Nc6 Bc4': 'Italian Game',
      'e4 c5': 'Sicilian Defense',
      'e4 c6': 'Caro-Kann Defense',
      'e4 e6': 'French Defense',
      'd4 d5': 'Queen\'s Pawn Game',
      'd4 Nf6': 'Indian Defense',
      'd4 d5 c4': 'Queen\'s Gambit',
      'Nf3 Nf6': 'Reti Opening',
      'c4': 'English Opening',
    };

    // Check for exact matches first
    for (const [pattern, name] of Object.entries(openings)) {
      if (moveString.startsWith(pattern)) {
        return name;
      }
    }

    return undefined;
  }

  /**
   * Convert move to simple notation (e.g., "e4", "Nf3")
   */
  private static moveToSimpleNotation(move: Move): string {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    const toFile = files[move.to.col];
    const toRank = ranks[move.to.row];
    
    if (move.piece.type === 'pawn') {
      return `${toFile}${toRank}`;
    }
    
    const pieceSymbol = move.piece.type === 'knight' ? 'N' : move.piece.type[0].toUpperCase();
    return `${pieceSymbol}${toFile}${toRank}`;
  }

  /**
   * Convert move to algebraic notation
   */
  private static moveToAlgebraic(move: Move, _board: Board): string {
    // This is a simplified version
    // Full algebraic notation would need to handle disambiguation, check, checkmate
    return this.moveToSimpleNotation(move);
  }

  /**
   * Get initial board position
   */
  private static getInitialBoard(): Board {
    // Return standard starting position
    // This is a placeholder - should use actual board initialization from core
    // Return empty board for now
    return Array(8).fill(null).map(() => Array(8).fill(null)) as Board;
  }

  /**
   * Generate post-game summary text
   */
  static generateGameSummary(analysis: GameAnalysis, result: 'win' | 'loss' | 'draw'): string {
    const parts: string[] = [];

    // Result
    if (result === 'win') {
      parts.push('🎉 Victory!');
    } else if (result === 'loss') {
      parts.push('📚 Learning experience');
    } else {
      parts.push('🤝 Draw');
    }

    // Performance highlights
    if (analysis.brilliantMoves > 0) {
      parts.push(`Found ${analysis.brilliantMoves} brilliant move${analysis.brilliantMoves > 1 ? 's' : ''}! ✨`);
    }

    if (analysis.tacticsUsed.length > 0) {
      parts.push(`Used ${analysis.tacticsUsed.length} tactical pattern${analysis.tacticsUsed.length > 1 ? 's' : ''}`);
    }

    // Areas to improve
    if (analysis.blunders > 0) {
      parts.push(`Watch out for ${analysis.blunders} blunder${analysis.blunders > 1 ? 's' : ''}`);
    }

    // Opening
    if (analysis.openingName) {
      parts.push(`Played the ${analysis.openingName}`);
    }

    // Rating change
    if (analysis.ratingChange > 0) {
      parts.push(`Rating +${analysis.ratingChange} 📈`);
    } else if (analysis.ratingChange < 0) {
      parts.push(`Rating ${analysis.ratingChange} 📉`);
    }

    return parts.join('. ') + '.';
  }

  /**
   * Get weakest phase from analysis
   */
  static getWeakestPhase(phaseQuality: GameAnalysis['phaseQuality']): 'opening' | 'middlegame' | 'endgame' {
    const phases = [
      { name: 'opening' as const, score: phaseQuality.opening },
      { name: 'middlegame' as const, score: phaseQuality.middlegame },
      { name: 'endgame' as const, score: phaseQuality.endgame },
    ];

    phases.sort((a, b) => a.score - b.score);
    return phases[0].name;
  }

  /**
   * Generate improvement suggestions
   */
  static generateImprovementSuggestions(
    analysis: GameAnalysis,
    mistakePatterns: string[]
  ): string[] {
    const suggestions: string[] = [];

    // Phase-specific suggestions
    const weakestPhase = this.getWeakestPhase(analysis.phaseQuality);
    if (analysis.phaseQuality[weakestPhase] < 60) {
      const phaseTips = {
        opening: 'Try the opening tutorial to improve your early game',
        middlegame: 'Practice tactical puzzles to sharpen your middlegame',
        endgame: 'Learn basic endgame techniques like king activation',
      };
      suggestions.push(phaseTips[weakestPhase]);
    }

    // Blunder prevention
    if (analysis.blunders >= 2) {
      suggestions.push('Take more time before moving to avoid hanging pieces');
    }

    // Tactical awareness
    if (analysis.tacticsUsed.length === 0 && analysis.totalMoves > 15) {
      suggestions.push('Look for tactical opportunities like forks and pins');
    }

    // Pattern-specific suggestions
    if (mistakePatterns.includes('no_castling')) {
      suggestions.push('Remember to castle early for king safety');
    }

    if (mistakePatterns.includes('queen_too_early')) {
      suggestions.push('Develop knights and bishops before moving your queen');
    }

    return suggestions.slice(0, 3);  // Return top 3 suggestions
  }
}
