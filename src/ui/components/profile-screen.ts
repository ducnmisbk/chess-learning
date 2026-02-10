/**
 * Profile Screen Component
 * 
 * Displays user skill profile, rating, tactical skills, and progress
 */

import { User, SkillProfile, SkillEngine, progressTracker, storageManager } from '../../data';

export class ProfileScreen {
  private container: HTMLElement;
  private user: User;
  private onBack?: () => void;

  constructor(container: HTMLElement, user: User) {
    this.container = container;
    this.user = user;
  }

  /**
   * Set callback for back navigation
   */
  setOnBack(callback: () => void): void {
    this.onBack = callback;
  }

  /**
   * Render the profile screen
   */
  async render(): Promise<void> {
    // Load or create skill profile
    const rawProfile = await storageManager.get<any>('skills', this.user.id);
    let skillProfile: SkillProfile = rawProfile || SkillEngine.createInitialProfile(this.user.id);
    
    if (!rawProfile) {
      // Create initial profile if doesn't exist
      await storageManager.save('skills', skillProfile);
    }

    // Load progress
    const progress = await progressTracker.getUserProgress();

    this.container.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'profile-screen';

    // Header
    const header = this.createHeader();
    wrapper.appendChild(header);

    // Profile content
    const content = document.createElement('div');
    content.className = 'profile-content';

    // User info card
    const userCard = this.createUserCard(skillProfile);
    content.appendChild(userCard);

    // Rating card
    const ratingCard = this.createRatingCard(skillProfile);
    content.appendChild(ratingCard);

    // Tactical skills card
    const tacticalCard = this.createTacticalSkillsCard(skillProfile);
    content.appendChild(tacticalCard);

    // Phase scores card
    const phaseCard = this.createPhaseScoresCard(skillProfile);
    content.appendChild(phaseCard);

    // Statistics card
    const statsCard = this.createStatisticsCard(progress);
    content.appendChild(statsCard);

    // Recent games (if any)
    if (progress && progress.totalGames > 0) {
      const recentCard = this.createRecentGamesCard();
      content.appendChild(recentCard);
    }

    wrapper.appendChild(content);
    this.container.appendChild(wrapper);
  }

  /**
   * Create profile header
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'profile-header';
    
    const backBtn = document.createElement('button');
    backBtn.className = 'back-button';
    backBtn.innerHTML = '← Back';
    backBtn.onclick = () => {
      if (this.onBack) this.onBack();
    };

    const title = document.createElement('h1');
    title.textContent = 'My Profile';

    header.appendChild(backBtn);
    header.appendChild(title);
    
    return header;
  }

  /**
   * Create user info card
   */
  private createUserCard(skillProfile: SkillProfile): HTMLElement {
    const card = document.createElement('div');
    card.className = 'profile-card user-info-card';

    const badge = SkillEngine.getRatingBadge(skillProfile.level);
    const tier = SkillEngine.getRatingTier(skillProfile.rating);

    card.innerHTML = `
      <div class="user-avatar-huge">${this.user.avatar}</div>
      <h2 class="user-name">${this.user.username}</h2>
      <div class="skill-badge">${badge} ${tier}</div>
      <div class="games-count">${skillProfile.gamesPlayed} games played</div>
    `;

    return card;
  }

  /**
   * Create rating card with progress bar
   */
  private createRatingCard(skillProfile: SkillProfile): HTMLElement {
    const card = document.createElement('div');
    card.className = 'profile-card rating-card';

    const progress = SkillEngine.getProgressToNextTier(skillProfile.rating);
    const currentTier = SkillEngine.getRatingTier(skillProfile.rating);
    const nextTier = SkillEngine.getRatingTier(progress.next);

    card.innerHTML = `
      <h3>📊 Chess Rating</h3>
      <div class="rating-display">
        <div class="current-rating">${skillProfile.rating}</div>
        <div class="rating-level">${skillProfile.level}</div>
      </div>
      
      <div class="tier-progress">
        <div class="tier-labels">
          <span>${currentTier}</span>
          <span>${progress.percentage}%</span>
          <span>${nextTier}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress.percentage}%"></div>
        </div>
        <div class="progress-text">${progress.next - skillProfile.rating} points to ${nextTier}</div>
      </div>

      ${skillProfile.ratingHistory.length > 0 ? `
        <div class="rating-history-mini">
          <h4>Recent Progress</h4>
          ${this.renderRatingHistoryMini(skillProfile.ratingHistory.slice(-5))}
        </div>
      ` : ''}
    `;

    return card;
  }

  /**
   * Create tactical skills card with radar chart
   */
  private createTacticalSkillsCard(skillProfile: SkillProfile): HTMLElement {
    const card = document.createElement('div');
    card.className = 'profile-card tactical-skills-card';

    card.innerHTML = `
      <h3>⚔️ Tactical Skills</h3>
      <div class="skills-list">
        <div class="skill-item">
          <div class="skill-name">Fork Recognition</div>
          <div class="skill-bar">
            <div class="skill-fill" style="width: ${skillProfile.tacticalSkills.forks}%"></div>
          </div>
          <div class="skill-value">${skillProfile.tacticalSkills.forks}/100</div>
        </div>
        
        <div class="skill-item">
          <div class="skill-name">Pin Recognition</div>
          <div class="skill-bar">
            <div class="skill-fill" style="width: ${skillProfile.tacticalSkills.pins}%"></div>
          </div>
          <div class="skill-value">${skillProfile.tacticalSkills.pins}/100</div>
        </div>
        
        <div class="skill-item">
          <div class="skill-name">Skewer Recognition</div>
          <div class="skill-bar">
            <div class="skill-fill" style="width: ${skillProfile.tacticalSkills.skewers}%"></div>
          </div>
          <div class="skill-value">${skillProfile.tacticalSkills.skewers}/100</div>
        </div>
        
        <div class="skill-item">
          <div class="skill-name">Discovered Attacks</div>
          <div class="skill-bar">
            <div class="skill-fill" style="width: ${skillProfile.tacticalSkills.discoveredAttacks}%"></div>
          </div>
          <div class="skill-value">${skillProfile.tacticalSkills.discoveredAttacks}/100</div>
        </div>
      </div>
    `;

    return card;
  }

  /**
   * Create phase scores card
   */
  private createPhaseScoresCard(skillProfile: SkillProfile): HTMLElement {
    const card = document.createElement('div');
    card.className = 'profile-card phase-scores-card';

    const phases = [
      { name: 'Opening', icon: '📖', score: skillProfile.phaseScores.opening },
      { name: 'Middlegame', icon: '⚔️', score: skillProfile.phaseScores.middlegame },
      { name: 'Endgame', icon: '🏆', score: skillProfile.phaseScores.endgame },
    ];

    const phasesHTML = phases.map(phase => `
      <div class="phase-item">
        <div class="phase-header">
          <span class="phase-icon">${phase.icon}</span>
          <span class="phase-name">${phase.name}</span>
        </div>
        <div class="phase-score-bar">
          <div class="phase-score-fill" style="width: ${phase.score}%"></div>
        </div>
        <div class="phase-score-value">${phase.score}/100</div>
      </div>
    `).join('');

    card.innerHTML = `
      <h3>🎯 Game Phases</h3>
      <div class="phases-list">
        ${phasesHTML}
      </div>
    `;

    return card;
  }

  /**
   * Create statistics card
   */
  private createStatisticsCard(progress: any): HTMLElement {
    const card = document.createElement('div');
    card.className = 'profile-card statistics-card';

    const winRate = progress.totalGames > 0 
      ? Math.round((progress.gamesWon / progress.totalGames) * 100)
      : 0;

    card.innerHTML = `
      <h3>📈 Statistics</h3>
      <div class="stats-grid">
        <h4>Overall Stats</h4>
        <div class="stat-item">
          <div class="stat-value">${progress.totalGames}</div>
          <div class="stat-label">Total Games</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">${winRate}%</div>
          <div class="stat-label">Win Rate</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">${progress.currentStreak}🔥</div>
          <div class="stat-label">Current Streak</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">${progress.longestStreak}🏆</div>
          <div class="stat-label">Longest Streak</div>
        </div>
      </div>

      <div class="ai-performance">
        <h4>vs AI Performance</h4>
        <div class="ai-stats">
          <div class="ai-stat">
            <span class="ai-difficulty">Easy:</span>
            <span class="ai-record">${progress.aiWins.easy}W - ${progress.aiLosses.easy}L</span>
          </div>
          <div class="ai-stat">
            <span class="ai-difficulty">Medium:</span>
            <span class="ai-record">${progress.aiWins.medium}W - ${progress.aiLosses.medium}L</span>
          </div>
          <div class="ai-stat">
            <span class="ai-difficulty">Hard:</span>
            <span class="ai-record">${progress.aiWins.hard}W - ${progress.aiLosses.hard}L</span>
          </div>
        </div>
      </div>
    `;

    return card;
  }

  /**
   * Create recent games card
   */
  private createRecentGamesCard(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'profile-card recent-games-card';

    card.innerHTML = `
      <h3>📚 Recent Games</h3>
      <div class="view-history-link">
        <button class="button-secondary view-history-btn">View Full History</button>
      </div>
    `;

    // Add click handler for view history
    setTimeout(() => {
      const btn = card.querySelector('.view-history-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          // This would navigate to game history view
          console.log('Navigate to game history');
        });
      }
    }, 0);

    return card;
  }

  /**
   * Render mini rating history chart
   */
  private renderRatingHistoryMini(history: any[]): string {
    if (history.length === 0) return '<p>No history yet</p>';

    const entries = history.map(entry => `
      <div class="history-entry">
        <span class="history-change ${entry.change >= 0 ? 'positive' : 'negative'}">
          ${entry.change >= 0 ? '+' : ''}${entry.change}
        </span>
        <span class="history-rating">${entry.rating}</span>
        <span class="history-opponent">${entry.opponent}</span>
      </div>
    `).join('');

    return `<div class="history-list">${entries}</div>`;
  }
}
