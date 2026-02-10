/**
 * Theme Types
 * 
 * Type definitions for the chess theme system
 */

/**
 * Theme color configuration
 */
export interface ThemeColors {
  lightSquare: string;
  darkSquare: string;
  highlight: string;
  check: string;
}

/**
 * Piece color mapping (which color pieces to use)
 */
export interface PieceColors {
  white: string;
  black: string;
}

/**
 * Color preset for minimalist theme
 */
export interface ColorPreset {
  name: string;
  white: string;
  black: string;
}

/**
 * Complete theme configuration
 */
export interface Theme {
  id: string;
  name: string;
  description: string;
  pieces: string; // Path to pieces directory
  board: string; // Path to board assets
  pieceColors: PieceColors;
  colors: ThemeColors;
  supportsColorCustomization?: boolean;
  availableColors?: string[];
  colorPresets?: ColorPreset[];
}

/**
 * Theme configuration file structure
 */
export interface ThemeConfig {
  themes: Theme[];
  defaultTheme: string;
}

/**
 * Theme IDs
 */
export enum ThemeId {
  CLASSIC = 'classic',
  MINIMALIST = 'minimalist',
  FUN = 'fun'
}
