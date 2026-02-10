/**
 * Game Screen Component
 * 
 * Main game UI that combines board, controls, game flow, and AI opponent.
 */

import { ChessGame } from '../../core/game-state';
import { GameStatus, PieceColor } from '../../core/types';
import type { Position } from '../../core/types';
import { BoardRenderer } from '../board/board-renderer';
import { InteractionHandler } from '../board/interaction-handler';
import { AIPlayer, AIDifficulty } from '../../ai/ai-interface';
import { AIEasy } from '../../ai/ai-easy';
import { AIMedium } from '../../ai/ai-medium';
import { AIHard } from '../../ai/ai-hard';
import { themeManager, ThemeSelector } from '../themes';
import { ProfileScreen } from './profile-screen';
import { lessons, TutorialManager, LessonStage } from '../../tutorial';
import { fromAlgebraic } from '../../utils/coordinates';
import { 
  userManager, 
  gameHistoryManager, 
  progressTracker, 
  User,
  SkillEngine,
  storageManager
} from '../../data';

/**
 * Game modes
 */
enum GameMode {
  TWO_PLAYER = 'two-player',
  VS_AI = 'vs-ai'
}

/**
 * Main Game Screen
 */
export class GameScreen {
  private game: ChessGame;
  private renderer: BoardRenderer;
  private interaction: InteractionHandler;
  private container: HTMLElement;
  private themeSelector: ThemeSelector;
  
  // Game mode and AI
  private gameMode: GameMode = GameMode.TWO_PLAYER;
  private aiPlayer: AIPlayer | null = null;
  private aiColor: PieceColor = PieceColor.BLACK;
  private isAiThinking: boolean = false;
  
  // Game tracking (Phase 5)
  private gameStartTime: number = Date.now();
  private moveTimes: number[] = [];
  private lastMoveTime: number = Date.now();
  private currentDifficulty: AIDifficulty = AIDifficulty.EASY;
  private currentUser: User | null = null;
  private onLogoutCallback?: () => void;
  private onProfileCallback?: () => void;
  private profileOverlay: HTMLElement | null = null;
  private tutorialManager: TutorialManager;
  private tutorialPanel: HTMLElement | null = null;
  private tutorialModal: HTMLElement | null = null;
  private tutorialActive: boolean = false;
  private tutorialLessonTitleEl: HTMLElement | null = null;
  private tutorialObjectiveEl: HTMLElement | null = null;
  private tutorialHintEl: HTMLElement | null = null;
  private tutorialFeedbackEl: HTMLElement | null = null;
  private twoPlayerBtn: HTMLButtonElement | null = null;
  private vsAiBtn: HTMLButtonElement | null = null;
  
  // UI Elements
  private gameModeSection!: HTMLElement;
  private turnIndicator!: HTMLElement;
  private gameStatusElement!: HTMLElement;
  private moveListElement!: HTMLElement;
  private undoButton!: HTMLButtonElement;
  private redoButton!: HTMLButtonElement;
  private newGameButton!: HTMLButtonElement;
  private aiThinkingIndicator!: HTMLElement;
  private menuOverlay!: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.game = new ChessGame();
    
    // Initialize renderer with theme manager
    const boardContainer = document.createElement('div');
    boardContainer.className = 'board-wrapper';
    this.renderer = new BoardRenderer(boardContainer);
    this.renderer.setThemeManager(themeManager);
    
    // Initialize interaction
    this.interaction = new InteractionHandler(this.game, this.renderer);

    this.tutorialManager = new TutorialManager(lessons);
    
    // Initialize theme selector
    this.themeSelector = new ThemeSelector(themeManager);
    this.themeSelector.setOnThemeChange(() => this.handleThemeChange());
  }

  /**
   * Set current user
   */
  setCurrentUser(user: User): void {
    this.currentUser = user;
  }

  /**
   * Set callback for logout
   */
  setOnLogout(callback: () => void): void {
    this.onLogoutCallback = callback;
  }

  /**
   * Set callback for profile view
   */
  setOnProfile(callback: () => void): void {
    this.onProfileCallback = callback;
  }

  /**
   * Initialize and render the game screen
   */
  initialize(): void {
    this.createLayout();
    this.renderer.initialize();
    this.interaction.initialize();
    
    // Setup callbacks
    this.interaction.setOnMove((from, to) => this.onMoveComplete(from, to));
    
    // Initial render
    this.renderer.renderBoard(this.game.getBoard());
    this.updateUI();
  }

  /**
   * Create the game layout
   */
  private createLayout(): void {
    this.container.innerHTML = '';
    
    // Header with hamburger menu
    const header = this.createHeader();
    this.container.appendChild(header);
    
    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';
    
    // Board section (already created)
    const boardWrapper = this.renderer['container'];
    gameContainer.appendChild(boardWrapper);
    
    // Controls panel
    const controlsPanel = this.createControlsPanel();
    gameContainer.appendChild(controlsPanel);
    
    this.container.appendChild(gameContainer);
    
    // Menu overlay (hidden by default)
    this.menuOverlay = this.createMenuOverlay();
    this.container.appendChild(this.menuOverlay);
  }

  /**
   * Create header with hamburger menu
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'game-header';
    
    const title = document.createElement('h1');
    title.textContent = '♟️ Chess Learning';
    title.className = 'game-title';
    
    const menuButton = document.createElement('button');
    menuButton.className = 'hamburger-button';
    menuButton.innerHTML = '☰';
    menuButton.onclick = () => this.toggleMenu();
    
    header.appendChild(title);
    header.appendChild(menuButton);
    
    return header;
  }

  /**
   * Create menu overlay
   */
  private createMenuOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    overlay.style.display = 'none';
    
    const menu = document.createElement('div');
    menu.className = 'menu-panel';
    
    const menuHeader = document.createElement('div');
    menuHeader.className = 'menu-header';
    
    const menuTitle = document.createElement('h2');
    menuTitle.textContent = 'Settings';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '✕';
    closeButton.onclick = () => this.toggleMenu();
    
    menuHeader.appendChild(menuTitle);
    menuHeader.appendChild(closeButton);
    menu.appendChild(menuHeader);
    
    // User Profile Section
    if (this.currentUser) {
      const profileSection = document.createElement('div');
      profileSection.className = 'menu-section';
      
      const profileTitle = document.createElement('h3');
      profileTitle.textContent = '👤 My Profile';
      profileTitle.className = 'menu-section-title';
      profileSection.appendChild(profileTitle);
      
      const profileInfo = document.createElement('div');
      profileInfo.className = 'menu-profile-info';
      profileInfo.innerHTML = `
        <div class="menu-user-avatar">${this.currentUser.avatar}</div>
        <div class="menu-user-name">${this.currentUser.username}</div>
      `;
      profileSection.appendChild(profileInfo);
      
      const accountActionsDiv = document.createElement('div');
      accountActionsDiv.className = 'menu-account-actions';
      
      const viewProfileBtn = document.createElement('button');
      viewProfileBtn.className = 'button-primary button-small';
      viewProfileBtn.textContent = '📊 View Profile';
      viewProfileBtn.onclick = () => this.handleViewProfile();
      accountActionsDiv.appendChild(viewProfileBtn);

      const switchAccountBtn = document.createElement('button');
      switchAccountBtn.className = 'button-secondary button-small';
      switchAccountBtn.textContent = '🔄 Switch Account';
      switchAccountBtn.onclick = () => this.handleSwitchAccount();
      accountActionsDiv.appendChild(switchAccountBtn);
      
      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'button-secondary button-small';
      logoutBtn.textContent = '🚪 Logout';
      logoutBtn.onclick = () => this.handleLogout();
      accountActionsDiv.appendChild(logoutBtn);
      
      profileSection.appendChild(accountActionsDiv);
      menu.appendChild(profileSection);
      
      const divider = document.createElement('hr');
      divider.className = 'menu-divider';
      menu.appendChild(divider);
    }

    // Tutorial section
    const tutorialSection = document.createElement('div');
    tutorialSection.className = 'menu-section';

    const tutorialTitle = document.createElement('h3');
    tutorialTitle.textContent = '📘 Tutorials';
    tutorialTitle.className = 'menu-section-title';
    tutorialSection.appendChild(tutorialTitle);

    const tutorialButton = document.createElement('button');
    tutorialButton.className = 'button-primary';
    tutorialButton.textContent = 'Start a Lesson';
    tutorialButton.onclick = () => {
      this.toggleMenu();
      this.showTutorialModal();
    };
    tutorialSection.appendChild(tutorialButton);

    menu.appendChild(tutorialSection);

    const tutorialDivider = document.createElement('hr');
    tutorialDivider.className = 'menu-divider';
    menu.appendChild(tutorialDivider);
    
    // Theme selector in menu
    const themeSectionTitle = document.createElement('h3');
    themeSectionTitle.textContent = '🎨 Themes';
    themeSectionTitle.className = 'menu-section-title';
    menu.appendChild(themeSectionTitle);
    
    const themeSelectorElement = this.themeSelector.render();
    themeSelectorElement.classList.remove('card'); // Remove card styling in menu
    menu.appendChild(themeSelectorElement);
    
    overlay.appendChild(menu);
    
    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.toggleMenu();
      }
    };
    
    return overlay;
  }

  /**
   * Toggle menu visibility
   */
  private toggleMenu(): void {
    if (this.menuOverlay.style.display === 'none') {
      this.menuOverlay.style.display = 'flex';
    } else {
      this.menuOverlay.style.display = 'none';
    }
  }

  /**
   * Handle view profile
   */
  private async handleViewProfile(): Promise<void> {
    this.toggleMenu();
    if (this.onProfileCallback) {
      this.onProfileCallback();
      return;
    }
    await this.showProfileModal();
  }

  /**
   * Show profile as a modal overlay
   */
  private async showProfileModal(): Promise<void> {
    if (this.profileOverlay || !this.currentUser) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay profile-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal profile-modal';

    const content = document.createElement('div');
    content.className = 'profile-modal-content';

    modal.appendChild(content);
    overlay.appendChild(modal);

    overlay.onclick = (event) => {
      if (event.target === overlay) {
        this.closeProfileModal();
      }
    };

    document.body.appendChild(overlay);
    this.profileOverlay = overlay;

    const profileScreen = new ProfileScreen(content, this.currentUser);
    profileScreen.setOnBack(() => this.closeProfileModal());
    await profileScreen.render();
  }

  /**
   * Close profile modal
   */
  private closeProfileModal(): void {
    if (this.profileOverlay) {
      document.body.removeChild(this.profileOverlay);
      this.profileOverlay = null;
    }
  }

  /**
   * Handle switch account
   */
  private handleSwitchAccount(): void {
    userManager.logout();
    this.toggleMenu();
    if (this.onLogoutCallback) {
      this.onLogoutCallback();
    }
  }

  /**
   * Handle logout
   */
  private handleLogout(): void {
    userManager.logout();
    this.toggleMenu();
    if (this.onLogoutCallback) {
      this.onLogoutCallback();
    }
  }

  /**
   * Create tutorial panel (hidden by default)
   */
  private createTutorialPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'tutorial-panel card';
    panel.style.display = 'none';

    panel.innerHTML = `
      <div class="tutorial-panel-header">
        <div>
          <h3>📘 Tutorial</h3>
          <div class="tutorial-lesson-title"></div>
        </div>
        <button class="button-secondary button-small tutorial-exit">Exit</button>
      </div>
      <div class="tutorial-objective"></div>
      <div class="tutorial-hint"></div>
      <div class="tutorial-feedback"></div>
      <div class="tutorial-actions">
        <button class="button-primary button-small tutorial-hint-btn">Get Hint</button>
      </div>
    `;

    const exitBtn = panel.querySelector('.tutorial-exit') as HTMLButtonElement;
    const hintBtn = panel.querySelector('.tutorial-hint-btn') as HTMLButtonElement;

    exitBtn.onclick = () => this.stopTutorial();
    hintBtn.onclick = () => this.handleHint();

    this.tutorialLessonTitleEl = panel.querySelector('.tutorial-lesson-title');
    this.tutorialObjectiveEl = panel.querySelector('.tutorial-objective');
    this.tutorialHintEl = panel.querySelector('.tutorial-hint');
    this.tutorialFeedbackEl = panel.querySelector('.tutorial-feedback');

    return panel;
  }

  /**
   * Show tutorial selection modal
   */
  private showTutorialModal(): void {
    if (this.tutorialModal) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal tutorial-modal';

    const title = document.createElement('h2');
    title.textContent = 'Choose a Lesson';
    modal.appendChild(title);

    const list = document.createElement('div');
    list.className = 'tutorial-lesson-list';

    this.tutorialManager.getLessons().forEach(lesson => {
      const card = document.createElement('div');
      card.className = 'tutorial-lesson-card';

      card.innerHTML = `
        <div class="tutorial-lesson-title">${lesson.title}</div>
        <div class="tutorial-lesson-desc">${lesson.description}</div>
        <div class="tutorial-lesson-meta">
          <span>${lesson.category}</span>
          <span>${lesson.stages.length} step${lesson.stages.length > 1 ? 's' : ''}</span>
        </div>
      `;

      const startBtn = document.createElement('button');
      startBtn.className = 'button-primary button-small';
      startBtn.textContent = 'Start Lesson';
      startBtn.onclick = () => {
        this.closeTutorialModal();
        this.startTutorial(lesson.id);
      };
      card.appendChild(startBtn);

      list.appendChild(card);
    });

    modal.appendChild(list);
    overlay.appendChild(modal);
    overlay.onclick = (event) => {
      if (event.target === overlay) {
        this.closeTutorialModal();
      }
    };

    document.body.appendChild(overlay);
    this.tutorialModal = overlay;
  }

  /**
   * Close tutorial selection modal
   */
  private closeTutorialModal(): void {
    if (this.tutorialModal) {
      document.body.removeChild(this.tutorialModal);
      this.tutorialModal = null;
    }
  }

  /**
   * Start a tutorial lesson
   */
  private startTutorial(lessonId: string): void {
    const stage = this.tutorialManager.startLesson(lessonId);
    if (!stage) return;

    this.tutorialActive = true;
    this.renderer.clearTutorialHints();

    if (this.gameModeSection) {
      this.gameModeSection.style.display = 'none';
    }

    if (this.twoPlayerBtn && this.vsAiBtn) {
      this.setGameMode(GameMode.TWO_PLAYER, this.twoPlayerBtn, this.vsAiBtn);
    } else {
      this.gameMode = GameMode.TWO_PLAYER;
      this.aiPlayer = null;
    }

    this.applyTutorialStage(stage);
    this.updateTutorialPanel(stage, '');
    if (this.tutorialPanel) this.tutorialPanel.style.display = 'block';
  }

  /**
   * Stop tutorial mode
   */
  private stopTutorial(): void {
    this.tutorialActive = false;
    this.tutorialManager.reset();
    this.renderer.clearTutorialHints();
    if (this.tutorialPanel) this.tutorialPanel.style.display = 'none';

    if (this.gameModeSection) {
      this.gameModeSection.style.display = '';
    }

    this.game.reset();
    this.renderer.renderBoard(this.game.getBoard());
    this.renderer.clearHighlights();
    this.interaction.reset();
    this.updateUI();
  }

  /**
   * Apply tutorial stage setup to the board
   */
  private applyTutorialStage(stage: LessonStage): void {
    if (!stage.setup) return;

    const setup = this.tutorialManager.getStageSetup(stage);
    if (!setup) {
      this.game.reset();
    } else {
      this.game.setCustomState({
        board: setup.board,
        currentPlayer: setup.currentPlayer,
        castlingRights: setup.castlingRights,
        enPassantTarget: setup.enPassantTarget
      });
    }

    this.renderer.renderBoard(this.game.getBoard());
    this.renderer.clearHighlights();
    this.interaction.reset();
    this.updateUI();
  }

  /**
   * Update tutorial panel content
   */
  private updateTutorialPanel(stage: LessonStage | null, feedback: string, isError: boolean = false): void {
    const lesson = this.tutorialManager.getCurrentLesson();
    const progress = this.tutorialManager.getProgress();

    if (this.tutorialLessonTitleEl && lesson && progress) {
      this.tutorialLessonTitleEl.textContent = `${lesson.title} (Step ${progress.stageNumber}/${progress.totalStages})`;
    }
    if (this.tutorialObjectiveEl) {
      this.tutorialObjectiveEl.textContent = stage ? `Goal: ${stage.objective}` : '';
    }
    if (this.tutorialHintEl) {
      this.tutorialHintEl.textContent = stage ? `Hint: ${stage.hints[0]}` : '';
    }
    if (this.tutorialFeedbackEl) {
      this.tutorialFeedbackEl.textContent = feedback;
      this.tutorialFeedbackEl.className = isError
        ? 'tutorial-feedback error'
        : 'tutorial-feedback success';
    }
  }

  /**
   * Handle hint request
   */
  private handleHint(): void {
    if (!this.tutorialActive) return;
    const hint = this.tutorialManager.getHint();
    if (!hint) return;

    if (this.tutorialHintEl) {
      this.tutorialHintEl.textContent = `Hint: ${hint.text}`;
    }

    this.renderer.clearTutorialHints();
    if (hint.suggestedMove) {
      const fromPos = fromAlgebraic(hint.suggestedMove.from);
      const toPos = fromAlgebraic(hint.suggestedMove.to);
      this.renderer.highlightSquares([fromPos, toPos], 'tutorial-hint');
    }
  }

  /**
   * Show tutorial completion modal
   */
  private showTutorialCompletionModal(): void {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';

    const title = document.createElement('h2');
    title.textContent = '🎉 Lesson Complete!';
    modal.appendChild(title);

    const message = document.createElement('p');
    message.textContent = 'Great job! You finished this lesson.';
    modal.appendChild(message);

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';

    const nextLessonId = this.tutorialManager.getCurrentLesson()
      ? this.tutorialManager.getNextLessonId(this.tutorialManager.getCurrentLesson()!.id)
      : null;

    if (nextLessonId) {
      const nextButton = document.createElement('button');
      nextButton.className = 'button-primary';
      nextButton.textContent = 'Next Lesson';
      nextButton.onclick = () => {
        document.body.removeChild(overlay);
        this.startTutorial(nextLessonId);
      };
      buttonGroup.appendChild(nextButton);
    }

    const lessonListButton = document.createElement('button');
    lessonListButton.className = 'button-secondary';
    lessonListButton.textContent = 'Back to Lessons';
    lessonListButton.onclick = () => {
      document.body.removeChild(overlay);
      this.showTutorialModal();
    };
    buttonGroup.appendChild(lessonListButton);

    const doneButton = document.createElement('button');
    doneButton.className = 'button-secondary';
    doneButton.textContent = 'Exit Tutorial';
    doneButton.onclick = () => {
      document.body.removeChild(overlay);
      this.stopTutorial();
    };
    buttonGroup.appendChild(doneButton);

    modal.appendChild(buttonGroup);
    overlay.appendChild(modal);

    overlay.onclick = (event) => {
      if (event.target === overlay) {
        document.body.removeChild(overlay);
        this.stopTutorial();
      }
    };

    document.body.appendChild(overlay);
  }

  /**
   * Create controls panel
   */
  private createControlsPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'controls-panel';
    
    // Game mode section
    this.gameModeSection = this.createGameModeSection();
    panel.appendChild(this.gameModeSection);
    
    // Game info section
    const gameInfo = this.createGameInfo();
    panel.appendChild(gameInfo);
    
    // Move history section
    const moveHistory = this.createMoveHistory();
    panel.appendChild(moveHistory);

    // Tutorial panel (hidden until active)
    this.tutorialPanel = this.createTutorialPanel();
    panel.appendChild(this.tutorialPanel);
    
    return panel;
  }

  /**
   * Create game mode selection section
   */
  private createGameModeSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'game-mode-section card';
    
    const title = document.createElement('h3');
    title.textContent = '🎮 Game Mode';
    section.appendChild(title);
    
    // Mode buttons
    const modeButtons = document.createElement('div');
    modeButtons.className = 'button-group';
    
    const twoPlayerBtn = document.createElement('button');
    twoPlayerBtn.textContent = '👥 Two Players';
    twoPlayerBtn.className = 'button-primary active';
    twoPlayerBtn.onclick = () => this.setGameMode(GameMode.TWO_PLAYER, twoPlayerBtn, vsAiBtn);
    modeButtons.appendChild(twoPlayerBtn);
    
    const vsAiBtn = document.createElement('button');
    vsAiBtn.textContent = '🤖 vs AI';
    vsAiBtn.className = 'button-primary';
    vsAiBtn.onclick = () => this.setGameMode(GameMode.VS_AI, vsAiBtn, twoPlayerBtn);
    modeButtons.appendChild(vsAiBtn);

    this.twoPlayerBtn = twoPlayerBtn;
    this.vsAiBtn = vsAiBtn;
    
    section.appendChild(modeButtons);
    
    // AI difficulty section (hidden by default)
    const difficultySection = document.createElement('div');
    difficultySection.className = 'difficulty-section';
    difficultySection.style.display = 'none';
    
    const difficultyTitle = document.createElement('h4');
    difficultyTitle.textContent = '🎯 Difficulty';
    difficultySection.appendChild(difficultyTitle);
    
    const difficultyButtons = document.createElement('div');
    difficultyButtons.className = 'button-group';
    
    const easyBtn = document.createElement('button');
    easyBtn.textContent = '😊 Easy';
    easyBtn.className = 'button-secondary active';
    easyBtn.onclick = () => this.setAIDifficulty(AIDifficulty.EASY, easyBtn, [mediumBtn, hardBtn]);
    difficultyButtons.appendChild(easyBtn);
    
    const mediumBtn = document.createElement('button');
    mediumBtn.textContent = '🤔 Medium';
    mediumBtn.className = 'button-secondary';
    mediumBtn.onclick = () => this.setAIDifficulty(AIDifficulty.MEDIUM, mediumBtn, [easyBtn, hardBtn]);
    difficultyButtons.appendChild(mediumBtn);
    
    const hardBtn = document.createElement('button');
    hardBtn.textContent = '🧠 Hard';
    hardBtn.className = 'button-secondary';
    hardBtn.onclick = () => this.setAIDifficulty(AIDifficulty.HARD, hardBtn, [easyBtn, mediumBtn]);
    difficultyButtons.appendChild(hardBtn);
    
    difficultySection.appendChild(difficultyButtons);
    section.appendChild(difficultySection);
    
    return section;
  }

  /**
   * Set game mode
   */
  private setGameMode(mode: GameMode, activeBtn: HTMLButtonElement, inactiveBtn: HTMLButtonElement): void {
    this.gameMode = mode;
    
    // Update button states
    activeBtn.classList.add('active');
    inactiveBtn.classList.remove('active');
    
    // Show/hide difficulty section
    const difficultySection = this.gameModeSection.querySelector('.difficulty-section') as HTMLElement;
    if (mode === GameMode.VS_AI) {
      difficultySection.style.display = 'block';
      // Default to easy - difficulty can be adjusted via buttons
      if (!this.aiPlayer) {
        this.setAIDifficulty(AIDifficulty.EASY); // Default to easy
      }
    } else {
      difficultySection.style.display = 'none';
      this.aiPlayer = null;
    }
    
    // Reset game
    this.game.reset();
    this.renderer.renderBoard(this.game.getBoard());
    this.renderer.clearHighlights();
    this.interaction.reset();
    this.interaction.setEnabled(true);
    this.updateUI();
  }

  /**
   * Set AI difficulty
   */
  private setAIDifficulty(
    difficulty: AIDifficulty,
    activeBtn?: HTMLButtonElement,
    inactiveBtns?: HTMLButtonElement[]
  ): void {
    // Update button states
    if (activeBtn && inactiveBtns) {
      activeBtn.classList.add('active');
      inactiveBtns.forEach(btn => btn.classList.remove('active'));
    }
    
    // Track difficulty for saving (Phase 5)
    this.currentDifficulty = difficulty;
    
    // Create AI player
    switch (difficulty) {
      case AIDifficulty.EASY:
        this.aiPlayer = new AIEasy();
        break;
      case AIDifficulty.MEDIUM:
        this.aiPlayer = new AIMedium();
        break;
      case AIDifficulty.HARD:
        this.aiPlayer = new AIHard();
        break;
    }
    
    console.log(`AI difficulty set to: ${difficulty}`);
  }

  /**
   * Create game info section
   */
  private createGameInfo(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'game-info card';
    
    const title = document.createElement('h2');
    title.textContent = 'Chess Game';
    section.appendChild(title);
    
    // AI Thinking indicator
    this.aiThinkingIndicator = document.createElement('div');
    this.aiThinkingIndicator.className = 'ai-thinking';
    this.aiThinkingIndicator.style.display = 'none';
    this.aiThinkingIndicator.innerHTML = '🤖 <span>AI is thinking...</span>';
    section.appendChild(this.aiThinkingIndicator);
    
    // Turn indicator
    this.turnIndicator = document.createElement('div');
    this.turnIndicator.className = 'turn-indicator';
    section.appendChild(this.turnIndicator);
    
    // Game status
    this.gameStatusElement = document.createElement('div');
    this.gameStatusElement.className = 'game-status';
    section.appendChild(this.gameStatusElement);
    
    // Control buttons
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    
    this.newGameButton = document.createElement('button');
    this.newGameButton.textContent = '🔄 New Game';
    this.newGameButton.className = 'button-primary';
    this.newGameButton.onclick = () => this.handleNewGame();
    buttonGroup.appendChild(this.newGameButton);
    
    this.undoButton = document.createElement('button');
    this.undoButton.textContent = '↶ Undo';
    this.undoButton.className = 'button-secondary';
    this.undoButton.onclick = () => this.handleUndo();
    buttonGroup.appendChild(this.undoButton);
    
    this.redoButton = document.createElement('button');
    this.redoButton.textContent = '↷ Redo';
    this.redoButton.className = 'button-secondary';
    this.redoButton.onclick = () => this.handleRedo();
    buttonGroup.appendChild(this.redoButton);
    
    section.appendChild(buttonGroup);
    
    return section;
  }

  /**
   * Create move history section
   */
  private createMoveHistory(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'move-history card';
    
    const title = document.createElement('h3');
    title.textContent = '📜 Move History';
    section.appendChild(title);
    
    this.moveListElement = document.createElement('div');
    this.moveListElement.className = 'move-list';
    section.appendChild(this.moveListElement);
    
    return section;
  }

  /**
   * Update all UI elements
   */
  private updateUI(): void {
    this.updateTurnIndicator();
    this.updateGameStatus();
    this.updateMoveHistory();
    this.updateButtons();
    this.updateAIThinkingIndicator();
  }

  /**
   * Update AI thinking indicator
   */
  private updateAIThinkingIndicator(): void {
    if (this.isAiThinking) {
      this.aiThinkingIndicator.style.display = 'flex';
    } else {
      this.aiThinkingIndicator.style.display = 'none';
    }
  }

  /**
   * Update turn indicator
   */
  private updateTurnIndicator(): void {
    const currentPlayer = this.game.getCurrentPlayer();
    const icon = document.createElement('div');
    icon.className = `player-icon ${currentPlayer}`;
    
    const text = document.createElement('span');
    text.textContent = currentPlayer === PieceColor.WHITE ? "White's Turn" : "Black's Turn";
    
    this.turnIndicator.innerHTML = '';
    this.turnIndicator.appendChild(icon);
    this.turnIndicator.appendChild(text);
  }

  /**
   * Update game status display
   */
  private updateGameStatus(): void {
    const status = this.game.getStatus();
    const currentPlayer = this.game.getCurrentPlayer();
    const oppositePlayer = currentPlayer === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    
    this.gameStatusElement.className = 'game-status';
    
    switch (status) {
      case GameStatus.PLAYING:
        this.gameStatusElement.classList.add('playing');
        this.gameStatusElement.textContent = 'Game in Progress';
        break;
      
      case GameStatus.CHECK:
        this.gameStatusElement.classList.add('check');
        this.gameStatusElement.textContent = `${currentPlayer.toUpperCase()} is in Check!`;
        break;
      
      case GameStatus.CHECKMATE:
        this.gameStatusElement.classList.add('checkmate');
        this.gameStatusElement.textContent = `Checkmate! ${oppositePlayer.toUpperCase()} Wins!`;
        this.showGameOverModal('Checkmate', `${oppositePlayer} wins!`);
        this.interaction.setEnabled(false);
        break;
      
      case GameStatus.STALEMATE:
        this.gameStatusElement.classList.add('stalemate');
        this.gameStatusElement.textContent = 'Stalemate - Draw!';
        this.showGameOverModal('Stalemate', "It's a draw!");
        this.interaction.setEnabled(false);
        break;
      
      case GameStatus.DRAW:
        this.gameStatusElement.classList.add('draw');
        this.gameStatusElement.textContent = 'Draw!';
        this.showGameOverModal('Draw', "It's a draw!");
        this.interaction.setEnabled(false);
        break;
    }
  }

  /**
   * Update move history display
   */
  private updateMoveHistory(): void {
    const history = this.game.getHistory();
    const moves = history.toDisplayList();
    
    this.moveListElement.innerHTML = '';
    
    moves.forEach((move, index) => {
      const item = document.createElement('div');
      item.className = 'move-item';
      if (index === moves.length - 1) {
        item.classList.add('current');
      }
      item.textContent = move;
      this.moveListElement.appendChild(item);
    });
    
    // Scroll to bottom
    this.moveListElement.scrollTop = this.moveListElement.scrollHeight;
  }

  /**
   * Update button states
   */
  private updateButtons(): void {
    this.undoButton.disabled = !this.game.canUndo();
    this.redoButton.disabled = !this.game.canRedo();
  }

  /**
   * Handle move completion
   */
  private async onMoveComplete(from: Position, to: Position): Promise<void> {
    if (this.tutorialActive) {
      this.renderer.clearTutorialHints();
      const result = this.tutorialManager.validateMove(from, to);

      if (!result.correct) {
        this.game.undo();
        this.renderer.renderBoard(this.game.getBoard());
        this.renderer.clearHighlights();
        this.updateTutorialPanel(this.tutorialManager.getCurrentStage(), result.message, true);
        this.updateUI();
        return;
      }

      this.updateTutorialPanel(this.tutorialManager.getCurrentStage(), result.message, false);

      if (result.stageComplete && result.nextStage) {
        this.applyTutorialStage(result.nextStage);
        this.updateTutorialPanel(result.nextStage, '', false);
      }

      if (result.lessonComplete) {
        const lesson = this.tutorialManager.getCurrentLesson();
        if (lesson) {
          await progressTracker.addCompletedLesson(lesson.id);
        }
        this.showTutorialCompletionModal();
      }
    }

    const now = Date.now();
    const moveTime = (now - this.lastMoveTime) / 1000;
    this.moveTimes.push(moveTime);
    this.lastMoveTime = now;

    this.updateUI();
    
    // Check if it's AI's turn
    if (this.gameMode === GameMode.VS_AI && 
        this.aiPlayer && 
        this.game.getCurrentPlayer() === this.aiColor &&
        this.game.getStatus() === GameStatus.PLAYING) {
      await this.makeAIMove();
    }
  }

  /**
   * Make AI move
   */
  private async makeAIMove(): Promise<void> {
    if (!this.aiPlayer || this.isAiThinking) {
      return;
    }

    this.isAiThinking = true;
    this.interaction.setEnabled(false);
    this.updateUI();

    try {
      const move = await this.aiPlayer.getBestMove(this.game, this.aiColor);
      
      if (move) {
        // Execute AI move
        const success = this.game.makeMove(move.from, move.to, move.promotionPiece);
        
        if (success) {
          // Update board rendering
          this.renderer.renderBoard(this.game.getBoard());
          this.renderer.highlightLastMove(move.from, move.to);
          
          console.log(`AI moved: ${JSON.stringify(move.from)} → ${JSON.stringify(move.to)}`);
        }
      }
    } catch (error) {
      console.error('AI move error:', error);
    } finally {
      this.isAiThinking = false;
      this.interaction.setEnabled(this.game.getStatus() === GameStatus.PLAYING);
      this.updateUI();
    }
  }

  /**
   * Handle new game
   */
  private async handleNewGame(): Promise<void> {
    if (this.tutorialActive) {
      const exitTutorial = confirm('Exit the tutorial and start a new game?');
      if (!exitTutorial) return;
      this.stopTutorial();
    }

    if (confirm('Start a new game? Current game will be lost.')) {
      this.game.reset();
      this.gameStartTime = Date.now(); // Reset game timer
      this.moveTimes = [];
      this.lastMoveTime = Date.now();
      
      // Suggest difficulty based on skill (Phase 5.7)
      await this.suggestDifficulty();
      
      this.renderer.renderBoard(this.game.getBoard());
      this.renderer.clearHighlights();
      this.interaction.reset();
      this.interaction.setEnabled(true);
      this.updateUI();
    }
  }

  /**
   * Handle undo
   */
  private handleUndo(): void {
    if (this.game.undo()) {
      // In AI mode, undo twice to undo both player and AI moves
      if (this.gameMode === GameMode.VS_AI && this.game.canUndo()) {
        this.game.undo();
      }
      
      this.renderer.renderBoard(this.game.getBoard());
      this.renderer.clearHighlights();
      this.interaction.reset();
      this.interaction.setEnabled(true);
      this.updateUI();
    }
  }

  /**
   * Handle redo
   */
  private handleRedo(): void {
    if (this.game.redo()) {
      this.renderer.renderBoard(this.game.getBoard());
      const lastMove = this.game.getHistory().getLastMove();
      if (lastMove) {
        this.renderer.highlightLastMove(lastMove.move.from, lastMove.move.to);
      }
      this.updateUI();
    }
  }

  /**
   * Show game over modal
   */
  private async showGameOverModal(title: string, message: string): Promise<void> {
    // Save game and analyze if user is logged in (Phase 5)
    const analysis = await this.saveGameResult(title);
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const modalTitle = document.createElement('h2');
    modalTitle.textContent = title;
    modal.appendChild(modalTitle);
    
    const modalMessage = document.createElement('p');
    modalMessage.textContent = message;
    modal.appendChild(modalMessage);

    // Show skill update if available (Phase 5.5)
    if (analysis) {
      const analysisDiv = document.createElement('div');
      analysisDiv.className = 'game-analysis-summary';
      const change = analysis.ratingChange >= 0 ? `+${analysis.ratingChange}` : analysis.ratingChange;
      analysisDiv.innerHTML = `
        <h3>📊 Skill Update</h3>
        <p>New Rating: <strong>${analysis.newRating}</strong> (${change})</p>
        <div class="analysis-stats">
          <div class="stat"><strong>Level:</strong> ${analysis.level}</div>
        </div>
      `;
      modal.appendChild(analysisDiv);
    }
    
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    
    const newGameBtn = document.createElement('button');
    newGameBtn.textContent = 'New Game';
    newGameBtn.className = 'button-primary';
    newGameBtn.onclick = () => {
      document.body.removeChild(overlay);
      this.handleNewGame();
    };
    buttonGroup.appendChild(newGameBtn);
    
    modal.appendChild(buttonGroup);
    overlay.appendChild(modal);
    
    // Add to body
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    };
  }

  /**
   * Handle theme change
   */
  private handleThemeChange(): void {
    // Re-render board with new theme
    this.renderer.renderBoard(this.game.getBoard());
    
    // Restore highlights if any
    const lastMove = this.game.getHistory().getLastMove();
    if (lastMove) {
      this.renderer.highlightLastMove(lastMove.move.from, lastMove.move.to);
    }
    
    console.log('Theme changed:', themeManager.getCurrentTheme().name);
  }

  /**
   * Save game result (Phase 5)
   */
  private async saveGameResult(_gameOverTitle: string): Promise<any> {
    const user = userManager.getCurrentUser();
    if (!user) {
      console.log('No user logged in, game not saved');
      return;
    }

    try {
      // Get game moves
      const history = this.game.getHistory();
      const moves = history.toAlgebraicNotation();
      
      // Determine result
      const status = this.game.getStatus();
      const currentPlayer = this.game.getCurrentPlayer();
      const playerColor = this.gameMode === GameMode.VS_AI 
        ? (this.aiColor === PieceColor.WHITE ? 'black' : 'white')
        : 'white';
      
      let result: 'win' | 'loss' | 'draw';
      let winner: 'white' | 'black' | 'draw';
      
      if (status === GameStatus.CHECKMATE) {
        const winnerColor: 'white' | 'black' = currentPlayer === PieceColor.WHITE ? 'black' : 'white';
        winner = winnerColor;
        
        if (this.gameMode === GameMode.VS_AI) {
          result = winnerColor === playerColor ? 'win' : 'loss';
        } else {
          result = 'win'; // For 2-player, we just track it as a win
        }
      } else {
        result = 'draw';
        winner = 'draw';
      }
      
      // Save game
      await gameHistoryManager.saveGame(
        this.gameMode === GameMode.VS_AI ? 'vs-ai' : 'two-player',
        moves,
        result,
        winner,
        this.gameStartTime,
        {
          difficulty: this.gameMode === GameMode.VS_AI ? this.currentDifficulty : undefined,
          playerColor: this.gameMode === GameMode.VS_AI ? playerColor : undefined
        }
      );
      
      // Update progress
      await progressTracker.updateAfterGame(
        result,
        this.gameMode === GameMode.VS_AI ? 'vs-ai' : 'two-player',
        this.gameMode === GameMode.VS_AI ? this.currentDifficulty : undefined
      );

      // Analyze game and update skill profile (Phase 5.5, 5.6)
      const analysis = await this.analyzeAndUpdateSkills(result);
      
      console.log('✅ Game saved, progress updated, and skills analyzed');
      return analysis;
    } catch (error) {
      console.error('Failed to save game:', error);
      return null;
    }
  }

  /**
   * Analyze game and update skill profile (Phase 5.5, 5.6)
   */
  private async analyzeAndUpdateSkills(result: 'win' | 'loss' | 'draw'): Promise<any> {
    const user = userManager.getCurrentUser();
    if (!user) return null;

    try {
      // Load or create skill profile
      const rawProfile = await storageManager.get<any>('skills', user.id);
      let skillProfile: any = rawProfile || SkillEngine.createInitialProfile(user.id);
      
      // Calculate rating change
      const ratingChange = SkillEngine.calculateRatingChange(
        skillProfile.rating,
        this.gameMode === GameMode.VS_AI ? this.currentDifficulty : 'player',
        result
      );

      // Update rating
      skillProfile.rating = ratingChange.newRating;
      skillProfile.level = SkillEngine.getSkillLevel(skillProfile.rating);
      skillProfile.gamesPlayed++;
      skillProfile.lastUpdated = Date.now();

      // Add to rating history
      if (!skillProfile.ratingHistory) skillProfile.ratingHistory = [];
      skillProfile.ratingHistory.push({
        timestamp: Date.now(),
        rating: skillProfile.rating,
        change: ratingChange.change,
        opponent: this.gameMode === GameMode.VS_AI 
          ? `AI-${this.currentDifficulty.charAt(0).toUpperCase() + this.currentDifficulty.slice(1)}`
          : 'Player'
      });

      // Keep only last 20 rating history entries
      if (skillProfile.ratingHistory.length > 20) {
        skillProfile.ratingHistory = skillProfile.ratingHistory.slice(-20);
      }

      // Note: Full game analysis (Phase 5.6) requires board state tracking throughout the game
      // This will be implemented when we add board state history to the game engine

      // Update adaptive difficulty (Phase 5.7)
      const recentResults = skillProfile.ratingHistory.slice(-5).map((entry: any) => 
        entry.change > 0 ? 1 : (entry.change === 0 ? 0.5 : 0)
      );
      skillProfile.adaptiveDifficulty = SkillEngine.getAdaptiveDifficulty(
        skillProfile.rating,
        recentResults
      );

      // Save updated skill profile
      await storageManager.save('skills', skillProfile);

      console.log(`📊 Skill profile updated: Rating ${skillProfile.rating} (${ratingChange.change >= 0 ? '+' : ''}${ratingChange.change})`);
      
      // Return rating change info
      return {
        ratingChange: ratingChange.change,
        newRating: skillProfile.rating,
        level: skillProfile.level
      };
    } catch (error) {
      console.error('Failed to analyze game:', error);
      return null;
    }
  }

  /**
   * Suggest difficulty based on player's skill (Phase 5.7)
   */
  private async suggestDifficulty(): Promise<void> {
    const user = userManager.getCurrentUser();
    if (!user || this.gameMode !== GameMode.VS_AI) return;

    try {
      const rawProfile = await storageManager.get<any>('skills', user.id);
      const skillProfile: any = rawProfile;
      if (!skillProfile || skillProfile.gamesPlayed < 3) return;

      const suggested = SkillEngine.suggestAIDifficulty(skillProfile.rating);
      
      if (suggested !== this.currentDifficulty) {
        const message = `Based on your skill level (${skillProfile.rating}), we recommend trying ${suggested.toUpperCase()} difficulty. Would you like to switch?`;
        
        if (confirm(message)) {
          this.setAIDifficulty(suggested as AIDifficulty);
        }
      }
    } catch (error) {
      console.error('Failed to suggest difficulty:', error);
    }
  }

  /**
   * Destroy and clean up
   */
  destroy(): void {
    this.closeTutorialModal();
    this.closeProfileModal();
    this.renderer.destroy();
    this.themeSelector.destroy();
    this.container.innerHTML = '';
  }
}
