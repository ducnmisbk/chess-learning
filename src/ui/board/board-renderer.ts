/**
 * Board Renderer
 * 
 * Responsible for rendering the chess board and pieces visually.
 */

import type { Board, Position, Piece } from '../../core/types';
import { PieceColor } from '../../core/types';
import { BOARD_SIZE } from '../../utils/constants';
import { FILES, RANKS } from '../../core/types';
import type { ThemeManager } from '../themes/theme-manager';

export interface BoardConfig {
  size: number;
  orientation: PieceColor;
  showCoordinates: boolean;
}

/**
 * Board Renderer class
 */
export class BoardRenderer {
  private container: HTMLElement;
  private boardElement: HTMLElement | null = null;
  private config: BoardConfig;
  private squares: HTMLElement[][] = [];
  private themeManager: ThemeManager | null = null;

  constructor(container: HTMLElement, config?: Partial<BoardConfig>) {
    this.container = container;
    this.config = {
      size: config?.size || 600,
      orientation: config?.orientation || PieceColor.WHITE,
      showCoordinates: config?.showCoordinates !== false
    };
  }

  /**
   * Set theme manager for dynamic piece loading
   */
  setThemeManager(themeManager: ThemeManager): void {
    this.themeManager = themeManager;
  }

  /**
   * Initialize and render the board
   */
  initialize(): void {
    this.createBoardStructure();
    this.createSquares();
  }

  /**
   * Create board HTML structure
   */
  private createBoardStructure(): void {
    this.container.innerHTML = '';
    
    const boardContainer = document.createElement('div');
    boardContainer.className = 'board-container';
    
    if (this.config.orientation === PieceColor.BLACK) {
      boardContainer.classList.add('rotated');
    }

    const chessboard = document.createElement('div');
    chessboard.className = 'chessboard';
    
    boardContainer.appendChild(chessboard);
    this.container.appendChild(boardContainer);
    
    this.boardElement = chessboard;
  }

  /**
   * Create all 64 squares
   */
  private createSquares(): void {
    if (!this.boardElement) return;

    this.squares = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      this.squares[row] = [];
      
      for (let col = 0; col < BOARD_SIZE; col++) {
        const square = this.createSquare(row, col);
        this.boardElement.appendChild(square);
        this.squares[row][col] = square;
      }
    }
  }

  /**
   * Create a single square element
   */
  private createSquare(row: number, col: number): HTMLElement {
    const square = document.createElement('div');
    square.className = 'square';
    square.dataset.row = row.toString();
    square.dataset.col = col.toString();

    // Determine square color (light/dark)
    const isLight = (row + col) % 2 === 0;
    square.classList.add(isLight ? 'light' : 'dark');

    // Add coordinates if enabled
    if (this.config.showCoordinates) {
      this.addCoordinates(square, row, col);
    }

    return square;
  }

  /**
   * Add coordinate labels to edge squares
   */
  private addCoordinates(square: HTMLElement, row: number, col: number): void {
    // File labels (a-h) on bottom row
    if (row === BOARD_SIZE - 1) {
      const fileLabel = document.createElement('span');
      fileLabel.className = 'coordinate file';
      fileLabel.textContent = FILES[col];
      square.appendChild(fileLabel);
    }

    // Rank labels (1-8) on left column
    if (col === 0) {
      const rankLabel = document.createElement('span');
      rankLabel.className = 'coordinate rank';
      rankLabel.textContent = RANKS[row];
      square.appendChild(rankLabel);
    }
  }

  /**
   * Render pieces on the board
   */
  renderBoard(board: Board): void {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];
        const square = this.squares[row][col];
        
        this.clearSquareContent(square);
        
        if (piece) {
          this.renderPiece(square, piece);
        }
      }
    }
  }

  /**
   * Clear square content (except coordinates)
   */
  private clearSquareContent(square: HTMLElement): void {
    const coordinates = square.querySelectorAll('.coordinate');
    square.innerHTML = '';
    coordinates.forEach(coord => square.appendChild(coord));
  }

  /**
   * Render a piece on a square
   */
  private renderPiece(square: HTMLElement, piece: Piece): void {
    const img = document.createElement('img');
    img.className = 'piece';
    img.src = this.getPieceImagePath(piece);
    img.alt = `${piece.color} ${piece.type}`;
    img.draggable = false; // Prevent browser default drag
    
    square.appendChild(img);
  }

  /**
   * Get image path for a piece
   */
  private getPieceImagePath(piece: Piece): string {
    if (this.themeManager) {
      return this.themeManager.getPieceImagePath(piece.color, piece.type);
    }
    // Fallback to classic theme if no theme manager
    return `/assets/pieces/classic/${piece.color}-${piece.type}.png`;
  }

  /**
   * Get square element at position
   */
  getSquareElement(position: Position): HTMLElement | null {
    if (position.row < 0 || position.row >= BOARD_SIZE ||
        position.col < 0 || position.col >= BOARD_SIZE) {
      return null;
    }
    return this.squares[position.row][position.col];
  }

  /**
   * Get position from square element
   */
  getPositionFromSquare(square: HTMLElement): Position | null {
    const row = parseInt(square.dataset.row || '', 10);
    const col = parseInt(square.dataset.col || '', 10);
    
    if (isNaN(row) || isNaN(col)) return null;
    
    return { row, col };
  }

  /**
   * Highlight squares (selected, legal moves, etc.)
   */
  highlightSquares(positions: Position[], className: string): void {
    positions.forEach(pos => {
      const square = this.getSquareElement(pos);
      if (square) {
        square.classList.add(className);
        
        // Check if square has a piece for different indicator
        if (className === 'legal-move' && square.querySelector('.piece')) {
          square.classList.add('has-piece');
        }
      }
    });
  }

  /**
   * Clear all highlights
   */
  clearHighlights(): void {
    const highlightClasses = ['selected', 'legal-move', 'highlighted', 'last-move', 'has-piece'];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const square = this.squares[row][col];
        highlightClasses.forEach(cls => square.classList.remove(cls));
      }
    }
  }

  /**
   * Clear tutorial hint highlights
   */
  clearTutorialHints(): void {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        this.squares[row][col].classList.remove('tutorial-hint');
      }
    }
  }

  /**
   * Highlight last move
   */
  highlightLastMove(from: Position, to: Position): void {
    this.clearHighlights();
    this.highlightSquares([from, to], 'last-move');
  }

  /**
   * Highlight check
   */
  highlightCheck(kingPosition: Position): void {
    const square = this.getSquareElement(kingPosition);
    if (square) {
      square.classList.add('in-check');
    }
  }

  /**
   * Set board orientation
   */
  setOrientation(color: PieceColor): void {
    this.config.orientation = color;
    const container = this.container.querySelector('.board-container');
    if (container) {
      if (color === PieceColor.BLACK) {
        container.classList.add('rotated');
      } else {
        container.classList.remove('rotated');
      }
    }
  }

  /**
   * Get board configuration
   */
  getConfig(): Readonly<BoardConfig> {
    return { ...this.config };
  }

  /**
   * Destroy board and clean up
   */
  destroy(): void {
    this.container.innerHTML = '';
    this.squares = [];
    this.boardElement = null;
  }
}
