/**
 * Move History Module
 * 
 * Tracks all moves made in a game and provides undo/redo functionality.
 */

import type { Move, GameState } from './types';

/**
 * History entry containing move and full game state
 */
export interface HistoryEntry {
  move: Move;
  stateBefore: GameState;
  stateAfter: GameState;
  notation: string; // Algebraic notation (e.g., "e4", "Nf3", "O-O")
}

/**
 * Move history manager
 */
export class MoveHistory {
  private history: HistoryEntry[] = [];
  private currentIndex: number = -1;

  /**
   * Add a move to history
   */
  addMove(entry: HistoryEntry): void {
    // Remove any moves after current position (if user undid and made a new move)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    this.history.push(entry);
    this.currentIndex++;
  }

  /**
   * Get the last move made
   */
  getLastMove(): HistoryEntry | null {
    return this.currentIndex >= 0 ? this.history[this.currentIndex] : null;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Undo the last move
   */
  undo(): GameState | null {
    if (!this.canUndo()) return null;

    const entry = this.history[this.currentIndex];
    this.currentIndex--;
    
    return entry.stateBefore;
  }

  /**
   * Redo a previously undone move
   */
  redo(): GameState | null {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    const entry = this.history[this.currentIndex];
    
    return entry.stateAfter;
  }

  /**
   * Get all moves as array
   */
  getAllMoves(): HistoryEntry[] {
    return this.history.slice(0, this.currentIndex + 1);
  }

  /**
   * Get move count
   */
  getMoveCount(): number {
    return this.currentIndex + 1;
  }

  /**
   * Get move at specific index
   */
  getMoveAt(index: number): HistoryEntry | null {
    return index >= 0 && index < this.history.length ? this.history[index] : null;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get moves in PGN format
   */
  toPGN(): string {
    const moves = this.getAllMoves();
    let pgn = '';
    
    for (let i = 0; i < moves.length; i++) {
      if (i % 2 === 0) {
        // White's move
        pgn += `${Math.floor(i / 2) + 1}. ${moves[i].notation} `;
      } else {
        // Black's move
        pgn += `${moves[i].notation} `;
      }
    }
    
    return pgn.trim();
  }

  /**
   * Get moves in simple list format for display
   */
  toDisplayList(): string[] {
    const moves = this.getAllMoves();
    const displayList: string[] = [];
    
    for (let i = 0; i < moves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = moves[i].notation;
      const blackMove = moves[i + 1]?.notation || '';
      
      displayList.push(`${moveNum}. ${whiteMove} ${blackMove}`.trim());
    }
    
    return displayList;
  }

  /**
   * Get moves in algebraic notation as array (for saving games)
   */
  toAlgebraicNotation(): string[] {
    return this.getAllMoves().map(entry => entry.notation);
  }
}
