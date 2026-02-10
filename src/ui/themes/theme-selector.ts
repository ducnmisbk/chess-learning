/**
 * Theme Selector Component
 * 
 * UI component for selecting and customizing themes
 */

import { ThemeManager } from './theme-manager';
import type { Theme, ColorPreset } from './theme-types';

/**
 * Theme Selector UI
 */
export class ThemeSelector {
  private themeManager: ThemeManager;
  private container: HTMLElement;
  private onThemeChange?: () => void;

  constructor(themeManager: ThemeManager) {
    this.themeManager = themeManager;
    this.container = document.createElement('div');
    this.container.className = 'theme-selector card';
  }

  /**
   * Set theme change callback
   */
  setOnThemeChange(callback: () => void): void {
    this.onThemeChange = callback;
  }

  /**
   * Render the theme selector
   */
  render(): HTMLElement {
    this.container.innerHTML = '';

    // Title
    const title = document.createElement('h3');
    title.textContent = '🎨 Themes';
    this.container.appendChild(title);

    // Theme grid
    const themeGrid = document.createElement('div');
    themeGrid.className = 'theme-grid';

    const themes = this.themeManager.getAllThemes();
    const currentTheme = this.themeManager.getCurrentTheme();

    themes.forEach(theme => {
      const card = this.createThemeCard(theme, theme.id === currentTheme.id);
      themeGrid.appendChild(card);
    });

    this.container.appendChild(themeGrid);

    // Color customization (for minimalist theme)
    const colorCustomization = this.createColorCustomization();
    this.container.appendChild(colorCustomization);

    return this.container;
  }

  /**
   * Create theme card
   */
  private createThemeCard(theme: Theme, isActive: boolean): HTMLElement {
    const card = document.createElement('div');
    card.className = `theme-card ${isActive ? 'active' : ''}`;

    // Theme preview (colors)
    const preview = document.createElement('div');
    preview.className = 'theme-preview';
    
    const lightSquare = document.createElement('div');
    lightSquare.className = 'preview-square light';
    lightSquare.style.backgroundColor = theme.colors.lightSquare;
    
    const darkSquare = document.createElement('div');
    darkSquare.className = 'preview-square dark';
    darkSquare.style.backgroundColor = theme.colors.darkSquare;
    
    preview.appendChild(lightSquare);
    preview.appendChild(darkSquare);
    card.appendChild(preview);

    // Theme name
    const name = document.createElement('div');
    name.className = 'theme-name';
    name.textContent = theme.name;
    card.appendChild(name);

    // Theme description
    const description = document.createElement('div');
    description.className = 'theme-description';
    description.textContent = theme.description;
    card.appendChild(description);

    // Click handler
    card.onclick = () => {
      this.selectTheme(theme.id);
    };

    return card;
  }

  /**
   * Create color customization section
   */
  private createColorCustomization(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'color-customization';
    section.style.display = 'none'; // Hidden by default

    const currentTheme = this.themeManager.getCurrentTheme();
    if (currentTheme.supportsColorCustomization) {
      section.style.display = 'block';
    }

    const title = document.createElement('h4');
    title.textContent = '🎨 Customize Piece Colors';
    section.appendChild(title);

    // Color presets
    if (currentTheme.colorPresets && currentTheme.colorPresets.length > 0) {
      const presetsTitle = document.createElement('div');
      presetsTitle.className = 'presets-title';
      presetsTitle.textContent = 'Presets:';
      section.appendChild(presetsTitle);

      const presetsGrid = document.createElement('div');
      presetsGrid.className = 'presets-grid';

      currentTheme.colorPresets.forEach(preset => {
        const presetBtn = document.createElement('button');
        presetBtn.className = 'button-secondary preset-button';
        presetBtn.textContent = preset.name;
        presetBtn.onclick = () => {
          this.applyColorPreset(preset);
        };
        presetsGrid.appendChild(presetBtn);
      });

      section.appendChild(presetsGrid);
    }

    // Custom color selectors
    const customSection = document.createElement('div');
    customSection.className = 'custom-colors';
    customSection.innerHTML = `
      <div class="color-selector-group">
        <label>White Pieces:</label>
        <div id="white-piece-colors" class="color-buttons"></div>
      </div>
      <div class="color-selector-group">
        <label>Black Pieces:</label>
        <div id="black-piece-colors" class="color-buttons"></div>
      </div>
    `;
    section.appendChild(customSection);

    // Populate color buttons
    if (currentTheme.availableColors) {
      this.populateColorButtons('white');
      this.populateColorButtons('black');
    }

    return section;
  }

  /**
   * Populate color selection buttons
   */
  private populateColorButtons(playerColor: 'white' | 'black'): void {
    const container = document.getElementById(`${playerColor}-piece-colors`);
    if (!container) return;

    const theme = this.themeManager.getCurrentTheme();
    if (!theme.availableColors) return;

    const currentPieceColors = this.themeManager.getCurrentPieceColors();
    const selectedColor = currentPieceColors[playerColor];

    container.innerHTML = '';

    theme.availableColors.forEach(color => {
      const btn = document.createElement('button');
      btn.className = `color-button ${color} ${color === selectedColor ? 'active' : ''}`;
      btn.setAttribute('data-color', color);
      btn.title = color.charAt(0).toUpperCase() + color.slice(1);
      
      btn.onclick = () => {
        this.selectPieceColor(playerColor, color);
      };

      container.appendChild(btn);
    });
  }

  /**
   * Select a theme
   */
  private selectTheme(themeId: string): void {
    const success = this.themeManager.setTheme(themeId);
    
    if (success) {
      // Re-render to update active states
      this.render();
      
      // Trigger callback
      if (this.onThemeChange) {
        this.onThemeChange();
      }
    }
  }

  /**
   * Apply color preset
   */
  private applyColorPreset(preset: ColorPreset): void {
    this.themeManager.setPieceColors({
      white: preset.white,
      black: preset.black
    });

    // Update button states
    this.populateColorButtons('white');
    this.populateColorButtons('black');

    // Trigger callback
    if (this.onThemeChange) {
      this.onThemeChange();
    }
  }

  /**
   * Select piece color
   */
  private selectPieceColor(playerColor: 'white' | 'black', pieceColor: string): void {
    const currentColors = this.themeManager.getCurrentPieceColors();
    currentColors[playerColor] = pieceColor;
    
    this.themeManager.setPieceColors(currentColors);

    // Update button states
    this.populateColorButtons(playerColor);

    // Trigger callback
    if (this.onThemeChange) {
      this.onThemeChange();
    }
  }

  /**
   * Destroy and clean up
   */
  destroy(): void {
    this.container.remove();
  }
}
