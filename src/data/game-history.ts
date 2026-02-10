/**
 * Game History Manager
 * 
 * Handles saving, loading, and replaying chess games
 */

import { storageManager } from './storage-manager';
import { userManager } from './user-manager';

export interface SavedGame {
  id: string;
  userId: string;
  mode: 'two-player' | 'vs-ai';
  difficulty?: 'easy' | 'medium' | 'hard';
  playerColor?: 'white' | 'black'; // String literals to match storage
  moves: string[]; // Algebraic notation
  result: 'win' | 'loss' | 'draw';
  winner?: 'white' | 'black' | 'draw';
  startedAt: number;
  completedAt: number;
  duration: number; // seconds
}

/**
 * Game History Manager
 */
export class GameHistoryManager {
  /**
   * Save completed game
   */
  async saveGame(
    mode: 'two-player' | 'vs-ai',
    moves: string[],
    result: 'win' | 'loss' | 'draw',
    winner: 'white' | 'black' | 'draw',
    startedAt: number,
    options?: {
      difficulty?: 'easy' | 'medium' | 'hard';
      playerColor?: 'white' | 'black';
    }
  ): Promise<SavedGame> {
    const currentUser = userManager.getCurrentUser();
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    const game: SavedGame = {
      id: this.generateGameId(),
      userId: currentUser.id,
      mode,
      difficulty: options?.difficulty,
      playerColor: options?.playerColor,
      moves,
      result,
      winner,
      startedAt,
      completedAt: Date.now(),
      duration: Math.floor((Date.now() - startedAt) / 1000)
    };

    await storageManager.save('games', game);
    console.log(`✅ Game saved: ${game.id}`);

    return game;
  }

  /**
   * Get all games for current user
   */
  async getUserGames(): Promise<SavedGame[]> {
    const currentUser = userManager.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    const allGames = await storageManager.getAll('games');
    return allGames
      .filter(game => game.userId === currentUser.id)
      .sort((a, b) => b.completedAt - a.completedAt); // Most recent first
  }

  /**
   * Get game by ID
   */
  async getGame(gameId: string): Promise<SavedGame | undefined> {
    return await storageManager.get('games', gameId);
  }

  /**
   * Get recent games (last N games)
   */
  async getRecentGames(limit: number = 10): Promise<SavedGame[]> {
    const games = await this.getUserGames();
    return games.slice(0, limit);
  }

  /**
   * Get games by mode
   */
  async getGamesByMode(mode: 'two-player' | 'vs-ai'): Promise<SavedGame[]> {
    const games = await this.getUserGames();
    return games.filter(game => game.mode === mode);
  }

  /**
   * Get games by difficulty (AI games only)
   */
  async getGamesByDifficulty(
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<SavedGame[]> {
    const games = await this.getUserGames();
    return games.filter(
      game => game.mode === 'vs-ai' && game.difficulty === difficulty
    );
  }

  /**
   * Delete game
   */
  async deleteGame(gameId: string): Promise<void> {
    await storageManager.delete('games', gameId);
    console.log(`✅ Game deleted: ${gameId}`);
  }

  /**
   * Clear all games for current user
   */
  async clearUserGames(): Promise<void> {
    const games = await this.getUserGames();
    for (const game of games) {
      await this.deleteGame(game.id);
    }
    console.log('✅ All games cleared');
  }

  /**
   * Get game statistics
   */
  async getGameStats(): Promise<{
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    averageDuration: number;
    longestGame: number;
    shortestGame: number;
  }> {
    const games = await this.getUserGames();

    if (games.length === 0) {
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        averageDuration: 0,
        longestGame: 0,
        shortestGame: 0
      };
    }

    const wins = games.filter(g => g.result === 'win').length;
    const losses = games.filter(g => g.result === 'loss').length;
    const draws = games.filter(g => g.result === 'draw').length;
    const durations = games.map(g => g.duration);

    return {
      totalGames: games.length,
      wins,
      losses,
      draws,
      winRate: games.length > 0 ? (wins / games.length) * 100 : 0,
      averageDuration: durations.reduce((a, b) => a + b, 0) / games.length,
      longestGame: Math.max(...durations),
      shortestGame: Math.min(...durations)
    };
  }

  /**
   * Generate unique game ID
   */
  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format duration for display
   */
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  /**
   * Format date for display
   */
  static formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Singleton instance
export const gameHistoryManager = new GameHistoryManager();
