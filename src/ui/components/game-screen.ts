/**
 * Game Screen Component
 * 
 * Main game UI that combines board, controls, game flow, and AI opponent.
 */

import { ChessGame } from '../../core/game-state';
import { GameStatus, PieceColor } from '../../core/types';
import { BoardRenderer } from '../board/board-renderer';
import { InteractionHandler } from '../board/interaction-handler';
import { AIPlayer, AIDifficulty } from '../../ai/ai-interface';
import { AIEasy } from '../../ai/ai-easy';
import { AIMedium } from '../../ai/ai-medium';
import { AIHard } from '../../ai/ai-hard';

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
  
  // Game mode and AI
  private gameMode: GameMode = GameMode.TWO_PLAYER;
  private aiPlayer: AIPlayer | null = null;
  private aiColor: PieceColor = PieceColor.BLACK;
  private isAiThinking: boolean = false;
  
  // UI Elements
  private gameModeSection!: HTMLElement;
  private turnIndicator!: HTMLElement;
  private gameStatusElement!: HTMLElement;
  private moveListElement!: HTMLElement;
  private undoButton!: HTMLButtonElement;
  private redoButton!: HTMLButtonElement;
  private newGameButton!: HTMLButtonElement;
  private aiThinkingIndicator!: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.game = new ChessGame();
    
    // Initialize renderer
    const boardContainer = document.createElement('div');
    boardContainer.className = 'board-wrapper';
    this.renderer = new BoardRenderer(boardContainer);
    
    // Initialize interaction
    this.interaction = new InteractionHandler(this.game, this.renderer);
  }

  /**
   * Initialize and render the game screen
   */
  initialize(): void {
    this.createLayout();
    this.renderer.initialize();
    this.interaction.initialize();
    
    // Setup callbacks
    this.interaction.setOnMove(() => this.onMoveComplete());
    
    // Initial render
    this.renderer.renderBoard(this.game.getBoard());
    this.updateUI();
  }

  /**
   * Create the game layout
   */
  private createLayout(): void {
    this.container.innerHTML = '';
    
    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';
    
    // Board section (already created)
    const boardWrapper = this.renderer['container'];
    gameContainer.appendChild(boardWrapper);
    
    // Controls panel
    const controlsPanel = this.createControlsPanel();
    gameContainer.appendChild(controlsPanel);
    
    this.container.appendChild(gameContainer);
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
      this.setAIDifficulty(AIDifficulty.EASY); // Default to easy
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
  private async onMoveComplete(): Promise<void> {
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
  private handleNewGame(): void {
    if (confirm('Start a new game? Current game will be lost.')) {
      this.game.reset();
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
  private showGameOverModal(title: string, message: string): void {
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
   * Destroy and clean up
   */
  destroy(): void {
    this.renderer.destroy();
    this.container.innerHTML = '';
  }
}
