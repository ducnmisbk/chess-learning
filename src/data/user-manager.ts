/**
 * User Manager
 * 
 * Handles user account creation, login, and profile management
 * All data stored locally (no server, no passwords)
 */

import { storageManager } from './storage-manager';

export interface User {
  id: string;
  username: string;
  avatar: string;
  createdAt: number;
  lastLogin: number;
}

const CURRENT_USER_KEY = 'current-user-id';

/**
 * Available user avatars
 */
export const AVATARS = [
  '🦁', '🐯', '🐻', '🦊', '🐼', '🐨',
  '🦉', '🦅', '🐸', '🐙', '🦄', '🐲'
] as const;

export type Avatar = typeof AVATARS[number];

/**
 * User Manager Class
 */
export class UserManager {
  private currentUser: User | null = null;

  constructor() {
    // Initialize storage
    storageManager.initialize();
  }

  /**
   * Create a new user account
   */
  async createUser(username: string, avatar: Avatar): Promise<User> {
    // Validate username
    if (!username || username.length < 2 || username.length > 20) {
      throw new Error('Username must be 2-20 characters');
    }

    // Check if username exists
    const existingUsers = await this.getAllUsers();
    const userExists = existingUsers.some(
      u => u.username.toLowerCase() === username.toLowerCase()
    );

    if (userExists) {
      throw new Error('Username already exists');
    }

    // Create new user
    const user: User = {
      id: this.generateUserId(),
      username,
      avatar,
      createdAt: Date.now(),
      lastLogin: Date.now()
    };

    // Save to storage
    await storageManager.save('users', user);

    // Initialize user progress
    await this.initializeUserProgress(user.id);

    console.log(`✅ User created: ${username}`);
    return user;
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return await storageManager.getAll('users');
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | undefined> {
    return await storageManager.get('users', userId);
  }

  /**
   * Login user (set as current user)
   */
  async login(userId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update last login
    user.lastLogin = Date.now();
    await storageManager.save('users', user);

    // Set as current user
    this.currentUser = user;
    localStorage.setItem(CURRENT_USER_KEY, userId);

    console.log(`✅ Logged in as: ${user.username}`);
    return user;
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    console.log('✅ Logged out');
  }

  /**
   * Get current logged-in user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Load current user from storage
   */
  async loadCurrentUser(): Promise<User | null> {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) {
      return null;
    }

    const user = await this.getUser(userId);
    if (user) {
      this.currentUser = user;
      return user;
    }

    return null;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<void> {
    await storageManager.delete('users', userId);
    await storageManager.delete('progress', userId);
    
    // If it's the current user, logout
    if (this.currentUser?.id === userId) {
      this.logout();
    }

    console.log('✅ User deleted');
  }

  /**
   * Initialize progress tracker for new user
   */
  private async initializeUserProgress(userId: string): Promise<void> {
    const progress = {
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

    await storageManager.save('progress', progress);
  }

  /**
   * Generate unique user ID
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const userManager = new UserManager();
