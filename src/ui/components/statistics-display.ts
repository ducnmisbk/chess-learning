/**
 * Statistics Display
 * 
 * Shows user progress and statistics
 */

import { progressTracker } from '../../data/progress-tracker';
import { userManager } from '../../data/user-manager';

export class StatisticsDisplay {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Render statistics
   */
  async render(): Promise<void> {
    const user = userManager.getCurrentUser();
    if (!user) {
      this.container.innerHTML = '<p>Please log in to view statistics</p>';
      return;
    }

    const stats = await progressTracker.getStatsSummary();
    
    this.container.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'statistics-display card';

    wrapper.innerHTML = `
      <div class="stats-header">
        <h2>📊 Your Statistics</h2>
        <div class="user-info">
          <span class="user-avatar-small">${user.avatar}</span>
          <span>${user.username}</span>
        </div>
      </div>

      ${stats.totalGames === 0 ? `
        <div class="empty-state">
          <p>No games played yet</p>
          <p class="subtitle">Start playing to see your statistics!</p>
        </div>
      ` : `
        <div class="stats-grid">
          <!-- Overall Stats -->
          <div class="stat-section">
            <h3>Overall Performance</h3>
            <div class="stat-cards">
              <div class="stat-card">
                <div class="stat-value">${stats.totalGames}</div>
                <div class="stat-label">Total Games</div>
              </div>
              <div class="stat-card win">
                <div class="stat-value">${stats.wins}</div>
                <div class="stat-label">Wins</div>
              </div>
              <div class="stat-card loss">
                <div class="stat-value">${stats.losses}</div>
                <div class="stat-label">Losses</div>
              </div>
              <div class="stat-card draw">
                <div class="stat-value">${stats.draws}</div>
                <div class="stat-label">Draws</div>
              </div>
            </div>
            <div class="win-rate">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${stats.winRate}%"></div>
              </div>
              <div class="progress-label">Win Rate: ${stats.winRate.toFixed(1)}%</div>
            </div>
          </div>

          <!-- Streak Stats -->
          <div class="stat-section">
            <h3>🔥 Streaks</h3>
            <div class="stat-cards">
              <div class="stat-card streak">
                <div class="stat-value">${stats.currentStreak}</div>
                <div class="stat-label">Current Streak</div>
              </div>
              <div class="stat-card streak">
                <div class="stat-value">${stats.longestStreak}</div>
                <div class="stat-label">Longest Streak</div>
              </div>
            </div>
          </div>

          <!-- AI Stats -->
          <div class="stat-section">
            <h3>🤖 AI Performance</h3>
            <div class="ai-stats">
              ${this.renderAIDifficulty('Easy', stats.aiStats.easy)}
              ${this.renderAIDifficulty('Medium', stats.aiStats.medium)}
              ${this.renderAIDifficulty('Hard', stats.aiStats.hard)}
            </div>
          </div>
        </div>
      `}
    `;

    this.container.appendChild(wrapper);
  }

  /**
   * Render AI difficulty stats
   */
  private renderAIDifficulty(
    difficulty: string,
    stats: { wins: number; losses: number; winRate: number }
  ): string {
    const total = stats.wins + stats.losses;
    
    if (total === 0) {
      return `
        <div class="ai-difficulty">
          <div class="difficulty-header">
            <strong>${difficulty}</strong>
            <span class="no-games">No games played</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="ai-difficulty">
        <div class="difficulty-header">
          <strong>${difficulty}</strong>
          <span class="win-loss">${stats.wins}W - ${stats.losses}L</span>
        </div>
        <div class="progress-bar small">
          <div class="progress-fill" style="width: ${stats.winRate}%"></div>
        </div>
        <div class="progress-label small">${stats.winRate.toFixed(1)}% Win Rate</div>
      </div>
    `;
  }

  /**
   * Update stats (call after game completion)
   */
  async update(): Promise<void> {
    await this.render();
  }
}
