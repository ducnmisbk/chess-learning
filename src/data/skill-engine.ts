/**
 * Skill Engine - Rating calculation and skill tracking for players
 * Implements kid-friendly Elo system and tactical skill analysis
 */

export type SkillLevel = 'beginner' | 'developing' | 'intermediate' | 'advanced';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface TacticalSkills {
  forks: number;           // 0-100 recognition score
  pins: number;
  skewers: number;
  discoveredAttacks: number;
}

export interface PhaseScores {
  opening: number;          // 0-100
  middlegame: number;
  endgame: number;
}

export interface SkillProfile {
  userId: string;
  rating: number;                    // 400-1600 (kid-friendly Elo)
  level: SkillLevel;
  tacticalSkills: TacticalSkills;
  phaseScores: PhaseScores;
  mistakePatterns: string[];         // e.g., ['hangs_pieces', 'ignores_checks']
  adaptiveDifficulty: number;        // 0.0 - 1.0 (interpolated AI level)
  gamesPlayed: number;
  lastUpdated: number;
  ratingHistory: RatingHistoryEntry[];
}

export interface RatingHistoryEntry {
  timestamp: number;
  rating: number;
  change: number;
  opponent: string;                  // 'AI-Easy', 'AI-Medium', 'AI-Hard', or 'Player'
}

export interface RatingChange {
  newRating: number;
  change: number;
  reason: string;
}

export class SkillEngine {
  private static readonly K_FACTOR = 32;  // Standard Elo K-factor
  private static readonly MIN_RATING = 400;
  private static readonly MAX_RATING = 1600;
  private static readonly STARTING_RATING = 600;
  
  // AI difficulty mapped to approximate ratings
  private static readonly AI_RATINGS = {
    easy: 600,
    medium: 900,
    hard: 1200,
  };

  /**
   * Create initial skill profile for new user
   */
  static createInitialProfile(userId: string): SkillProfile {
    return {
      userId,
      rating: this.STARTING_RATING,
      level: 'beginner',
      tacticalSkills: {
        forks: 0,
        pins: 0,
        skewers: 0,
        discoveredAttacks: 0,
      },
      phaseScores: {
        opening: 50,
        middlegame: 50,
        endgame: 50,
      },
      mistakePatterns: [],
      adaptiveDifficulty: 0.0,  // Start at easiest
      gamesPlayed: 0,
      lastUpdated: Date.now(),
      ratingHistory: [],
    };
  }

  /**
   * Calculate new rating after a game (kid-friendly adjustments)
   */
  static calculateRatingChange(
    playerRating: number,
    opponent: AIDifficulty | 'player',
    result: 'win' | 'loss' | 'draw',
    opponentRating?: number
  ): RatingChange {
    // Get opponent strength
    const opponentStrength = opponent === 'player' 
      ? (opponentRating || playerRating)
      : this.AI_RATINGS[opponent];

    // Calculate expected score (standard Elo)
    const expected = 1 / (1 + Math.pow(10, (opponentStrength - playerRating) / 400));
    
    // Actual score
    const actual = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
    
    // Calculate base change
    let change = Math.round(this.K_FACTOR * (actual - expected));
    
    // Kid-friendly adjustments:
    // 1. Minimum +5 for a win (always feel rewarded)
    // 2. Maximum -10 for a loss (not too punishing)
    // 3. Bonus for beating higher-rated opponent
    if (result === 'win') {
      change = Math.max(change, 5);
      
      // Bonus for upset victory
      if (opponentStrength > playerRating) {
        const upset = Math.min((opponentStrength - playerRating) / 100, 2);
        change = Math.round(change * (1 + upset * 0.25));
      }
    } else if (result === 'loss') {
      // Floor on losses - don't lose more than 10 points
      change = Math.max(change, -10);
    }
    
    // Calculate new rating (enforce bounds)
    const newRating = Math.max(
      this.MIN_RATING,
      Math.min(this.MAX_RATING, playerRating + change)
    );
    
    // Generate reason text
    const reason = this.generateRatingReason(result, change, opponent);
    
    return {
      newRating,
      change: newRating - playerRating,
      reason,
    };
  }

  /**
   * Determine skill level from rating
   */
  static getSkillLevel(rating: number): SkillLevel {
    if (rating < 700) return 'beginner';
    if (rating < 1000) return 'developing';
    if (rating < 1300) return 'intermediate';
    return 'advanced';
  }

  /**
   * Get adaptive difficulty recommendation (0.0 - 1.0)
   */
  static getAdaptiveDifficulty(rating: number, recentPerformance: number[]): number {
    // Base difficulty on rating
    let difficulty = (rating - 400) / 1200;  // 0.0 at 400, 1.0 at 1600
    
    // Adjust based on recent performance (win rate in last 5 games)
    if (recentPerformance.length >= 3) {
      const wins = recentPerformance.filter(r => r === 1).length;
      const winRate = wins / recentPerformance.length;
      
      // If winning too much (>70%), increase difficulty
      if (winRate > 0.7) {
        difficulty = Math.min(1.0, difficulty + 0.15);
      }
      // If losing too much (<30%), decrease difficulty
      else if (winRate < 0.3) {
        difficulty = Math.max(0.0, difficulty - 0.15);
      }
    }
    
    return Math.max(0.0, Math.min(1.0, difficulty));
  }

  /**
   * Suggest AI difficulty based on player rating
   */
  static suggestAIDifficulty(rating: number): AIDifficulty {
    if (rating < 700) return 'easy';
    if (rating < 1000) return 'medium';
    return 'hard';
  }

  /**
   * Update tactical skill score (0-100)
   */
  static updateTacticalSkill(
    currentScore: number,
    success: boolean,
    learningSensitivity: number = 0.1
  ): number {
    // Move score toward 100 (success) or toward current score (failure)
    const target = success ? 100 : Math.max(0, currentScore - 5);
    const newScore = currentScore + (target - currentScore) * learningSensitivity;
    
    return Math.max(0, Math.min(100, Math.round(newScore)));
  }

  /**
   * Update phase score based on quality of play
   */
  static updatePhaseScore(
    currentScore: number,
    quality: number  // 0-100 from game analysis
  ): number {
    // Exponential moving average (70% old, 30% new)
    const newScore = currentScore * 0.7 + quality * 0.3;
    return Math.max(0, Math.min(100, Math.round(newScore)));
  }

  /**
   * Detect mistake patterns from game
   */
  static detectMistakePattern(
    blunders: number,
    checksIgnored: number,
    poorTrades: number,
    castled: boolean,
    queenOutEarly: boolean
  ): string[] {
    const patterns: string[] = [];
    
    if (blunders >= 2) patterns.push('hangs_pieces');
    if (checksIgnored > 0) patterns.push('ignores_checks');
    if (poorTrades >= 2) patterns.push('poor_trades');
    if (!castled) patterns.push('no_castling');
    if (queenOutEarly) patterns.push('queen_too_early');
    
    return patterns;
  }

  /**
   * Update mistake patterns (keep most recent 5)
   */
  static updateMistakePatterns(
    current: string[],
    newPatterns: string[]
  ): string[] {
    const combined = [...current, ...newPatterns];
    // Keep only last 10 patterns
    return combined.slice(-10);
  }

  /**
   * Get rating badge/icon based on level
   */
  static getRatingBadge(level: SkillLevel): string {
    const badges = {
      beginner: '🐣',      // Hatching chick
      developing: '🐥',    // Baby bird
      intermediate: '🦅',  // Eagle
      advanced: '👑',      // Crown
    };
    return badges[level];
  }

  /**
   * Get rating tier name
   */
  static getRatingTier(rating: number): string {
    if (rating < 500) return 'Hatching';
    if (rating < 700) return 'Fledgling';
    if (rating < 1000) return 'Soaring';
    if (rating < 1300) return 'Master';
    return 'Champion';
  }

  /**
   * Calculate progress to next tier
   */
  static getProgressToNextTier(rating: number): { current: number; next: number; percentage: number } {
    const tiers = [400, 500, 700, 1000, 1300, 1600];
    
    // Find current tier
    let currentTier = 400;
    let nextTier = 500;
    
    for (let i = 0; i < tiers.length - 1; i++) {
      if (rating >= tiers[i] && rating < tiers[i + 1]) {
        currentTier = tiers[i];
        nextTier = tiers[i + 1];
        break;
      }
    }
    
    if (rating >= 1600) {
      currentTier = 1600;
      nextTier = 1600;
    }
    
    const range = nextTier - currentTier;
    const progress = rating - currentTier;
    const percentage = range > 0 ? Math.round((progress / range) * 100) : 100;
    
    return { current: currentTier, next: nextTier, percentage };
  }

  /**
   * Generate human-readable reason for rating change
   */
  private static generateRatingReason(
    result: 'win' | 'loss' | 'draw',
    change: number,
    opponent: AIDifficulty | 'player'
  ): string {
    const opponentName = opponent === 'player' 
      ? 'opponent' 
      : `AI (${opponent})`;
    
    if (result === 'win') {
      if (change >= 20) return `🌟 Great victory against ${opponentName}!`;
      if (change >= 10) return `Well played! Beat ${opponentName}`;
      return `Victory against ${opponentName}`;
    } else if (result === 'draw') {
      return `Drew with ${opponentName}`;
    } else {
      if (Math.abs(change) <= 5) return `Tough match with ${opponentName}`;
      return `Lost to ${opponentName}`;
    }
  }

  /**
   * Get tactical skill name
   */
  static getTacticalSkillName(skill: keyof TacticalSkills): string {
    const names = {
      forks: 'Fork Recognition',
      pins: 'Pin Recognition',
      skewers: 'Skewer Recognition',
      discoveredAttacks: 'Discovered Attack Recognition',
    };
    return names[skill];
  }

  /**
   * Get phase name
   */
  static getPhaseName(phase: keyof PhaseScores): string {
    const names = {
      opening: 'Opening Play',
      middlegame: 'Middlegame Tactics',
      endgame: 'Endgame Technique',
    };
    return names[phase];
  }

  /**
   * Format rating with tier and emoji
   */
  static formatRating(rating: number): string {
    const level = this.getSkillLevel(rating);
    const badge = this.getRatingBadge(level);
    const tier = this.getRatingTier(rating);
    
    return `${badge} ${tier} (${rating})`;
  }
}
