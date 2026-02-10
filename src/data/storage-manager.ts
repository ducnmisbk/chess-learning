/**
 * Storage Manager
 * 
 * Provides IndexedDB abstraction with LocalStorage fallback
 * Handles all data persistence for the chess game
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * Database schema
 */
interface ChessDB extends DBSchema {
  users: {
    key: string; // userId
    value: {
      id: string;
      username: string;
      avatar: string;
      createdAt: number;
      lastLogin: number;
    };
  };
  games: {
    key: string; // gameId
    value: {
      id: string;
      userId: string;
      mode: 'two-player' | 'vs-ai';
      difficulty?: 'easy' | 'medium' | 'hard';
      playerColor?: 'white' | 'black'; // For AI games
      moves: string[]; // Algebraic notation
      result: 'win' | 'loss' | 'draw';
      winner?: 'white' | 'black' | 'draw';
      startedAt: number;
      completedAt: number;
      duration: number; // seconds
    };
    indexes: { 'by-user': string; 'by-date': number };
  };
  progress: {
    key: string; // userId
    value: {
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
    };
  };
}

const DB_NAME = 'chess-learning-db';
const DB_VERSION = 1;

/**
 * Storage Manager Class
 */
export class StorageManager {
  private db: IDBPDatabase<ChessDB> | null = null;
  private isIndexedDBAvailable: boolean = true;

  constructor() {
    this.checkIndexedDBSupport();
  }

  /**
   * Check if IndexedDB is supported
   */
  private checkIndexedDBSupport(): void {
    this.isIndexedDBAvailable = 'indexedDB' in window;
    if (!this.isIndexedDBAvailable) {
      console.warn('IndexedDB not available, falling back to LocalStorage');
    }
  }

  /**
   * Initialize database
   */
  async initialize(): Promise<void> {
    if (!this.isIndexedDBAvailable) {
      console.log('Using LocalStorage fallback');
      return;
    }

    try {
      this.db = await openDB<ChessDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Users store
          if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'id' });
          }

          // Games store
          if (!db.objectStoreNames.contains('games')) {
            const gameStore = db.createObjectStore('games', { keyPath: 'id' });
            gameStore.createIndex('by-user', 'userId');
            gameStore.createIndex('by-date', 'completedAt');
          }

          // Progress store
          if (!db.objectStoreNames.contains('progress')) {
            db.createObjectStore('progress', { keyPath: 'userId' });
          }
        },
      });

      console.log('✅ IndexedDB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      this.isIndexedDBAvailable = false;
    }
  }

  /**
   * Save data to store
   */
  async save<K extends keyof ChessDB>(
    storeName: K,
    data: ChessDB[K]['value']
  ): Promise<void> {
    if (this.db) {
      await this.db.put(storeName as 'users' | 'games' | 'progress', data);
    } else {
      // LocalStorage fallback
      this.saveToLocalStorage(storeName as 'users' | 'games' | 'progress', data);
    }
  }

  /**
   * Get data by key
   */
  async get<K extends keyof ChessDB>(
    storeName: K,
    key: string
  ): Promise<ChessDB[K]['value'] | undefined> {
    if (this.db) {
      return await this.db.get(storeName as 'users' | 'games' | 'progress', key);
    } else {
      // LocalStorage fallback
      return this.getFromLocalStorage(storeName as 'users' | 'games' | 'progress', key);
    }
  }

  /**
   * Get all items from store
   */
  async getAll<K extends keyof ChessDB>(
    storeName: K
  ): Promise<ChessDB[K]['value'][]> {
    if (this.db) {
      return await this.db.getAll(storeName as 'users' | 'games' | 'progress');
    } else {
      // LocalStorage fallback
      return this.getAllFromLocalStorage(storeName as 'users' | 'games' | 'progress');
    }
  }

  /**
   * Get items by index
   */
  async getAllByIndex<K extends keyof ChessDB>(
    storeName: K,
    indexName: string,
    query: any
  ): Promise<ChessDB[K]['value'][]> {
    if (this.db && storeName === 'games') {
      const tx = this.db.transaction('games', 'readonly');
      const index = tx.store.index(indexName as 'by-user' | 'by-date');
      return await index.getAll(query);
    }
    return [];
  }

  /**
   * Delete data by key
   */
  async delete<K extends keyof ChessDB>(
    storeName: K,
    key: string
  ): Promise<void> {
    if (this.db) {
      await this.db.delete(storeName as 'users' | 'games' | 'progress', key);
    } else {
      this.deleteFromLocalStorage(storeName as 'users' | 'games' | 'progress', key);
    }
  }

  /**
   * Clear entire store
   */
  async clear<K extends keyof ChessDB>(storeName: K): Promise<void> {
    if (this.db) {
      await this.db.clear(storeName as 'users' | 'games' | 'progress');
    } else {
      this.clearLocalStorage(storeName as 'users' | 'games' | 'progress');
    }
  }

  // LocalStorage fallback methods
  private saveToLocalStorage<K extends keyof ChessDB>(
    storeName: K,
    data: ChessDB[K]['value']
  ): void {
    const key = `${storeName}:${(data as any).id || (data as any).userId}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  private getFromLocalStorage<K extends keyof ChessDB>(
    storeName: K,
    id: string
  ): ChessDB[K]['value'] | undefined {
    const key = `${storeName}:${id}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : undefined;
  }

  private getAllFromLocalStorage<K extends keyof ChessDB>(
    storeName: K
  ): ChessDB[K]['value'][] {
    const results: ChessDB[K]['value'][] = [];
    const prefix = `${storeName}:`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const data = localStorage.getItem(key);
        if (data) {
          results.push(JSON.parse(data));
        }
      }
    }
    
    return results;
  }

  private deleteFromLocalStorage<K extends keyof ChessDB>(
    storeName: K,
    id: string
  ): void {
    const key = `${storeName}:${id}`;
    localStorage.removeItem(key);
  }

  private clearLocalStorage<K extends keyof ChessDB>(storeName: K): void {
    const prefix = `${storeName}:`;
    const keysToDelete: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => localStorage.removeItem(key));
  }
}

// Singleton instance
export const storageManager = new StorageManager();
