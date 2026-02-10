/**
 * Data Layer Exports
 * 
 * Central export file for all data management modules
 */

export { storageManager, StorageManager } from './storage-manager';
export { 
  userManager, 
  UserManager, 
  AVATARS 
} from './user-manager';
export type { User, Avatar } from './user-manager';
export { 
  gameHistoryManager, 
  GameHistoryManager 
} from './game-history';
export type { SavedGame } from './game-history';
export { 
  progressTracker, 
  ProgressTracker 
} from './progress-tracker';
export type { UserProgress } from './progress-tracker';

// Skill tracking and analysis
export { SkillEngine } from './skill-engine';
export type { 
  SkillProfile,
  SkillLevel,
  TacticalSkills,
  PhaseScores,
  RatingHistoryEntry,
  RatingChange,
  AIDifficulty
} from './skill-engine';

export { TacticalAnalyzer } from './tactical-analyzer';
export type {
  DetectedTactic,
  TacticType,
  MoveQuality
} from './tactical-analyzer';

export { GameAnalyzer } from './game-analyzer';
export type {
  GameAnalysis,
  EnrichedGameRecord,
  MoveAnalysis
} from './game-analyzer';
