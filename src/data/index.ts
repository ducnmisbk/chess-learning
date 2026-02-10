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
