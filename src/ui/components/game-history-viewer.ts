/**
 * Game History Viewer
 * 
 * Displays saved games and allows replay
 */

import { gameHistoryManager, GameHistoryManager, SavedGame } from '../../data/game-history';
import { userManager } from '../../data/user-manager';

export class GameHistoryViewer {
  private container: HTMLElement;
  private games: SavedGame[] = [];
  private onReplayCallback?: (game: SavedGame) => void;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Set callback for game replay
   */
  setOnReplay(callback: (game: SavedGame) => void): void {
    this.onReplayCallback = callback;
  }

  /**
   * Render game history
   */
  async render(): Promise<void> {
    const user = userManager.getCurrentUser();
    if (!user) {
      this.container.innerHTML = '<p>Please log in to view game history</p>';
      return;
    }

    this.games = await gameHistoryManager.getUserGames();
    
    this.container.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'game-history card';

    // Header
    const header = document.createElement('div');
    header.className = 'history-header';
    header.innerHTML = `
      <h2>📚 Game History</h2>
      <div class="history-actions">
        <button class="button-secondary filter-button">Filter</button>
        <button class="button-danger clear-button">Clear All</button>
      </div>
    `;
    wrapper.appendChild(header);

    // Game count
    const count = document.createElement('p');
    count.className = 'game-count';
    count.textContent = `Total Games: ${this.games.length}`;
    wrapper.appendChild(count);

    // Games list
    if (this.games.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <p>No games played yet</p>
        <p class="subtitle">Start playing to build your game history!</p>
      `;
      wrapper.appendChild(emptyState);
    } else {
      const gamesList = document.createElement('div');
      gamesList.className = 'games-list';
      
      this.games.forEach(game => {
        gamesList.appendChild(this.renderGameCard(game));
      });
      
      wrapper.appendChild(gamesList);
    }

    this.container.appendChild(wrapper);

    // Setup event handlers
    this.setupEventHandlers(wrapper);
  }

  /**
   * Render individual game card
   */
  private renderGameCard(game: SavedGame): HTMLElement {
    const card = document.createElement('div');
    card.className = `game-card ${game.result}`;
    
    // Result icon
    const resultIcon = this.getResultIcon(game.result);
    const modeText = game.mode === 'vs-ai' 
      ? `vs AI (${game.difficulty})` 
      : '2-Player';

    card.innerHTML = `
      <div class="game-result-icon">${resultIcon}</div>
      <div class="game-details">
        <div class="game-title">
          <strong>${game.result === 'win' ? 'Victory' : game.result === 'loss' ? 'Defeat' : 'Draw'}</strong>
          <span class="game-mode">${modeText}</span>
        </div>
        <div class="game-info">
          <span>📅 ${GameHistoryManager.formatDate(game.completedAt)}</span>
          <span>⏱️ ${GameHistoryManager.formatDuration(game.duration)}</span>
          <span>♟️ ${game.moves.length} moves</span>
        </div>
      </div>
      <div class="game-actions">
        <button class="button-small replay-button" data-game-id="${game.id}">
          🔄 Replay
        </button>
        <button class="button-small delete-button" data-game-id="${game.id}">
          🗑️
        </button>
      </div>
    `;

    return card;
  }

  /**
   * Get result icon
   */
  private getResultIcon(result: string): string {
    switch (result) {
      case 'win':
        return '🏆';
      case 'loss':
        return '😢';
      case 'draw':
        return '🤝';
      default:
        return '♟️';
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(wrapper: HTMLElement): void {
    // Replay buttons
    wrapper.querySelectorAll('.replay-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const gameId = (btn as HTMLElement).dataset.gameId;
        if (gameId) {
          this.handleReplay(gameId);
        }
      });
    });

    // Delete buttons
    wrapper.querySelectorAll('.delete-button').forEach(btn => {
      btn.addEventListener('click', async () => {
        const gameId = (btn as HTMLElement).dataset.gameId;
        if (gameId && confirm('Delete this game?')) {
          await gameHistoryManager.deleteGame(gameId);
          this.render(); // Refresh
        }
      });
    });

    // Clear all button
    const clearBtn = wrapper.querySelector('.clear-button');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        if (confirm('Delete all games? This cannot be undone.')) {
          await gameHistoryManager.clearUserGames();
          this.render(); // Refresh
        }
      });
    }
  }

  /**
   * Handle game replay
   */
  private async handleReplay(gameId: string): Promise<void> {
    const game = await gameHistoryManager.getGame(gameId);
    if (game && this.onReplayCallback) {
      this.onReplayCallback(game);
    }
  }

  /**
   * Filter games by criteria
   */
  async filterGames(filter: 'all' | 'wins' | 'losses' | 'ai' | 'two-player'): Promise<void> {
    const allGames = await gameHistoryManager.getUserGames();
    
    switch (filter) {
      case 'wins':
        this.games = allGames.filter(g => g.result === 'win');
        break;
      case 'losses':
        this.games = allGames.filter(g => g.result === 'loss');
        break;
      case 'ai':
        this.games = allGames.filter(g => g.mode === 'vs-ai');
        break;
      case 'two-player':
        this.games = allGames.filter(g => g.mode === 'two-player');
        break;
      default:
        this.games = allGames;
    }
    
    this.render();
  }
}
