/**
 * Theme Manager
 * 
 * Manages theme loading, switching, and persistence
 */

import type { Theme, ThemeConfig, PieceColors } from './theme-types';
import { ThemeId } from './theme-types';
import themesData from '../../../assets/themes.json';

const STORAGE_KEY = 'chess-theme';
const PIECE_COLOR_STORAGE_KEY = 'chess-theme-piece-colors';

/**
 * Theme Manager Class
 */
export class ThemeManager {
  private themes: Map<string, Theme>;
  private currentTheme: Theme;
  private currentPieceColors: PieceColors;

  constructor() {
    // Load themes from configuration
    const config = themesData as ThemeConfig;
    this.themes = new Map(config.themes.map(theme => [theme.id, theme]));

    // Load saved theme or use default
    const savedThemeId = this.loadSavedTheme();
    this.currentTheme = this.themes.get(savedThemeId) || this.themes.get(config.defaultTheme)!;

    // Load saved piece colors or use theme defaults
    this.currentPieceColors = this.loadSavedPieceColors() || { ...this.currentTheme.pieceColors };
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get current piece colors
   */
  getCurrentPieceColors(): PieceColors {
    return this.currentPieceColors;
  }

  /**
   * Get all available themes
   */
  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Get theme by ID
   */
  getTheme(id: string): Theme | undefined {
    return this.themes.get(id);
  }

  /**
   * Set theme by ID
   */
  setTheme(id: string): boolean {
    const theme = this.themes.get(id);
    if (!theme) {
      console.error(`Theme '${id}' not found`);
      return false;
    }

    this.currentTheme = theme;
    this.currentPieceColors = { ...theme.pieceColors };
    this.saveTheme(id);
    this.savePieceColors(this.currentPieceColors);
    this.applyTheme();
    return true;
  }

  /**
   * Set custom piece colors (for minimalist theme)
   */
  setPieceColors(colors: PieceColors): void {
    if (!this.currentTheme.supportsColorCustomization) {
      console.warn('Current theme does not support color customization');
      return;
    }

    this.currentPieceColors = { ...colors };
    this.savePieceColors(colors);
    this.applyTheme();
  }

  /**
   * Apply current theme to the DOM
   */
  applyTheme(): void {
    const theme = this.currentTheme;
    const root = document.documentElement;

    // Apply CSS variables
    root.style.setProperty('--color-light-square', theme.colors.lightSquare);
    root.style.setProperty('--color-dark-square', theme.colors.darkSquare);
    root.style.setProperty('--color-highlight', theme.colors.highlight);
    root.style.setProperty('--color-check', theme.colors.check);

    // Set theme ID as data attribute for potential CSS targeting
    root.setAttribute('data-theme', theme.id);

    console.log(`Theme applied: ${theme.name}`);
  }

  /**
   * Get piece image path
   */
  getPieceImagePath(color: 'white' | 'black', pieceType: string): string {
    const pieceColor = this.currentPieceColors[color];
    return `${this.currentTheme.pieces}/${pieceColor}-${pieceType}.png`;
  }

  /**
   * Load saved theme from localStorage
   */
  private loadSavedTheme(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) || ThemeId.CLASSIC;
    } catch (error) {
      console.error('Failed to load saved theme:', error);
      return ThemeId.CLASSIC;
    }
  }

  /**
   * Save theme to localStorage
   */
  private saveTheme(themeId: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  /**
   * Load saved piece colors from localStorage
   */
  private loadSavedPieceColors(): PieceColors | null {
    try {
      const saved = localStorage.getItem(PIECE_COLOR_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load saved piece colors:', error);
      return null;
    }
  }

  /**
   * Save piece colors to localStorage
   */
  private savePieceColors(colors: PieceColors): void {
    try {
      localStorage.setItem(PIECE_COLOR_STORAGE_KEY, JSON.stringify(colors));
    } catch (error) {
      console.error('Failed to save piece colors:', error);
    }
  }

  /**
   * Reset to default theme
   */
  resetToDefault(): void {
    this.setTheme(ThemeId.CLASSIC);
  }
}

// Export singleton instance
export const themeManager = new ThemeManager();
