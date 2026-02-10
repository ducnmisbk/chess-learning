/**
 * Progress Tracker
 * 
 * Tracks user progress, statistics, streaks, and achievements
 */

import { storageManager } from './storage-manager';
import { userManager } from './user-manager';

export interface UserProgress {
  userId: string;
  totalGames: number;
  gamesWon: number;
  gamesLost: number;
  gamesDraw: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string; // YYYY-MM-DD
  aiWins: {
    easy: number;
    medium: number;
    hard: number;
  };
  aiLosses: {
    easy: number;
    medium: number;
    hard: number;
  };
  lessonsCompleted: string[];
  badgesEarned: string[];
}

/**
 * Progress Tracker Manager
 */
export class ProgressTracker {
  /**
   * Get progress for current user
   */
  async getUserProgress(): Promise<UserProgress | null> {
    const currentUser = userManager.getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const progress = await storageManager.get('progress', currentUser.id);
    return progress || null;
  }

  /**
   * Update progress after game completion
   */
  async updateAfterGame(
    result: 'win' | 'loss' | 'draw',
    mode: 'two-player' | 'vs-ai',
    difficulty?: 'easy' | 'medium' | 'hard'
  ): Promise<void> {
    const currentUser = userManager.getCurrentUser();
    if (!currentUser) {
      return;
    }

    let progress = await storageManager.get('progress', currentUser.id);
    if (!progress) {
      // Initialize if doesn't exist
      progress = this.createDefaultProgress(currentUser.id);
    }

    // Update game counts
    progress.totalGames++;
    if (result === 'win') {
      progress.gamesWon++;
    } else if (result === 'loss') {
      progress.gamesLost++;
    } else {
      progress.gamesDraw++;
    }

    // Update AI-specific stats
    if (mode === 'vs-ai' && difficulty) {
      if (result === 'win') {
        progress.aiWins[difficulty]++;
      } else if (result === 'loss') {
        progress.aiLosses[difficulty]++;
      }
    }

    // Update streak
    const today = this.getTodayDateString();
    if (progress.lastPlayedDate === today) {
      // Already played today, streak continues
    } else if (this.isYesterday(progress.lastPlayedDate)) {
      // Played yesterday, increment streak
      progress.currentStreak++;
      if (progress.currentStreak > progress.longestStreak) {
        progress.longestStreak = progress.currentStreak;
      }
    } else {
      // Streak broken, reset
      progress.currentStreak = 1;
    }
    progress.lastPlayedDate = today;

    await storageManager.save('progress', progress);
    console.log('✅ Progress updated');
  }

  /**
   * Add completed lesson
   */
  async addCompletedLesson(lessonId: string): Promise<void> {
    const currentUser = userManager.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const progress = await storageManager.get('progress', currentUser.id);
    if (!progress) {
      return;
    }

    if (!progress.lessonsCompleted.includes(lessonId)) {
      progress.lessonsCompleted.push(lessonId);
      await storageManager.save('progress', progress);
      console.log(`✅ Lesson completed: ${lessonId}`);
    }
  }

  /**
   * Add earned badge
   */
  async addBadge(badgeId: string): Promise<void> {
    const currentUser = userManager.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const progress = await storageManager.get('progress', currentUser.id);
    if (!progress) {
      return;
    }

    if (!progress.badgesEarned.includes(badgeId)) {
      progress.badgesEarned.push(badgeId);
      await storageManager.save('progress', progress);
      console.log(`✅ Badge earned: ${badgeId}`);
      return;
    }
  }

  /**
   * Check if badge is earned
   */
  async hasBadge(badgeId: string): Promise<boolean> {
    const progress = await this.getUserProgress();
    return progress?.badgesEarned.includes(badgeId) || false;
  }

  /**
   * Get win rate
   */
  async getWinRate(): Promise<number> {
    const progress = await this.getUserProgress();
    if (!progress || progress.totalGames === 0) {
      return 0;
    }
    return (progress.gamesWon / progress.totalGames) * 100;
  }

  /**
   * Get AI win rate by difficulty
   */
  async getAIWinRate(difficulty: 'easy' | 'medium' | 'hard'): Promise<number> {
    const progress = await this.getUserProgress();
    if (!progress) {
      return 0;
    }

    const wins = progress.aiWins[difficulty];
    const losses = progress.aiLosses[difficulty];
    const total = wins + losses;

    if (total === 0) {
      return 0;
    }

    return (wins / total) * 100;
  }

  /**
   * Get statistics summary
   */
  async getStatsSummary(): Promise<{
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    currentStreak: number;
    longestStreak: number;
    aiStats: {
      easy: { wins: number; losses: number; winRate: number };
      medium: { wins: number; losses: number; winRate: number };
      hard: { wins: number; losses: number; winRate: number };
    };
  }> {
    const progress = await this.getUserProgress();

    if (!progress) {
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        aiStats: {
          easy: { wins: 0, losses: 0, winRate: 0 },
          medium: { wins: 0, losses: 0, winRate: 0 },
          hard: { wins: 0, losses: 0, winRate: 0 }
        }
      };
    }

    const calculateWinRate = (wins: number, losses: number): number => {
      const total = wins + losses;
      return total > 0 ? (wins / total) * 100 : 0;
    };

    return {
      totalGames: progress.totalGames,
      wins: progress.gamesWon,
      losses: progress.gamesLost,
      draws: progress.gamesDraw,
      winRate: progress.totalGames > 0 
        ? (progress.gamesWon / progress.totalGames) * 100 
        : 0,
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      aiStats: {
        easy: {
          wins: progress.aiWins.easy,
          losses: progress.aiLosses.easy,
          winRate: calculateWinRate(progress.aiWins.easy, progress.aiLosses.easy)
        },
        medium: {
          wins: progress.aiWins.medium,
          losses: progress.aiLosses.medium,
          winRate: calculateWinRate(progress.aiWins.medium, progress.aiLosses.medium)
        },
        hard: {
          wins: progress.aiWins.hard,
          losses: progress.aiLosses.hard,
          winRate: calculateWinRate(progress.aiWins.hard, progress.aiLosses.hard)
        }
      }
    };
  }

  /**
   * Reset progress (for testing or user request)
   */
  async resetProgress(): Promise<void> {
    const currentUser = userManager.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const progress = this.createDefaultProgress(currentUser.id);
    await storageManager.save('progress', progress);
    console.log('✅ Progress reset');
  }

  /**
   * Create default progress object
   */
  private createDefaultProgress(userId: string): UserProgress {
    return {
      userId,
      totalGames: 0,
      gamesWon: 0,
      gamesLost: 0,
      gamesDraw: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: '',
      aiWins: { easy: 0, medium: 0, hard: 0 },
      aiLosses: { easy: 0, medium: 0, hard: 0 },
      lessonsCompleted: [],
      badgesEarned: []
    };
  }

  /**
   * Get today's date as YYYY-MM-DD string
   */
  private getTodayDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Check if date string is yesterday
   */
  private isYesterday(dateString: string): boolean {
    if (!dateString) return false;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    return dateString === yesterdayString;
  }
}

// Singleton instance
export const progressTracker = new ProgressTracker();
