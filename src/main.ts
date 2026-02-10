/**
 * Chess Learning - Main Entry Point
 * Offline-first chess game for kids aged 5-10
 */

import './ui/styles/global.css';
import './ui/styles/board.css';
import './ui/styles/components.css';
import './ui/styles/theme-selector.css';
import './ui/styles/data-persistence.css'; // Phase 5

import { GameScreen } from './ui/components/game-screen';
import { runPhase1Tests } from './tests/phase1-tests';
import { themeManager } from './ui/themes';
import { storageManager, userManager } from './data'; // Phase 5

// Module-level variable for GameScreen instance
let gameScreen: GameScreen | null = null;

// Main initialization function
async function initializeApp() {
  console.log('🎮 Chess Learning App Starting...');
  console.log('─────────────────────────────────────────────');

  // Check environment
  const isDocker = window.location.port === '5173';
  if (isDocker) {
    console.log('✅ Running in Docker development environment');
  }

  // Check features
  console.log('✅ IndexedDB:', 'indexedDB' in window ? 'Available' : 'Not available');
  console.log('✅ Service Worker:', 'serviceWorker' in navigator ? 'Supported' : 'Not supported');
  console.log('✅ Assets: 72 chess pieces available');

  // Initialize theme system (Phase 4)
  console.log('\n🎨 Initializing Phase 4: Theme System...');
  themeManager.applyTheme();
  console.log(`✅ Current theme: ${themeManager.getCurrentTheme().name}`);

  // Initialize storage (Phase 5)
  console.log('\n💾 Initializing Phase 5: Data Persistence...');
  await storageManager.initialize();
  const currentUser = await userManager.loadCurrentUser();
  if (currentUser) {
    console.log(`✅ Logged in as: ${currentUser.username}`);
  } else {
    console.log('⚠️ No user logged in (guest mode)');
  }

  // Run Phase 1 tests (in background)
  console.log('\n🧪 Running Phase 1 Tests...');
  runPhase1Tests();

  // Initialize Phase 2: UI (with Phase 3: AI)
  console.log('\n🎨 Initializing Chess Game UI...');
  console.log('─────────────────────────────────────────────');

  const appContainer = document.getElementById('app');
  if (!appContainer) {
    throw new Error('App container not found!');
  }

  gameScreen = new GameScreen(appContainer);
  gameScreen.initialize();

  console.log('✅ Game UI Initialized');
  console.log('✅ Phase 2: Visual Board ✓');
  console.log('✅ Phase 3: AI Opponent ✓');
  console.log('✅ Phase 4: Theme System ✓');
  console.log('✅ Phase 5: Data Persistence ✓');
  console.log('─────────────────────────────────────────────');
  console.log('\n📖 How to play:');
  console.log('1. Choose game mode: 2-Player or vs AI');
  console.log('2. Select difficulty (Easy/Medium/Hard) for AI');
  console.log('3. Pick your favorite theme');
  console.log('4. Click a piece to select it');
  console.log('5. Click a highlighted square to move');
  console.log('6. Use Undo/Redo to navigate history');
  console.log('\n🎨 Features:');
  console.log('• 3 AI difficulty levels');
  console.log('• 3 visual themes (Classic, Minimalist, Fun)');
  console.log('• Color customization for Minimalist theme');
  console.log('• Undo/Redo moves');
  console.log('• Move history with PGN notation');
  console.log('• User accounts and game saving (Phase 5)');
  console.log('• Statistics tracking and progress');
}

// Start the application
initializeApp().catch(error => {
  console.error('❌ Failed to initialize app:', error);
});
console.log('─────────────────────────────────────────────\n');

// Export for future use
export const app = {
  version: '0.2.0',
  mode: 'development',
  offline: true,
  phase: 2,
  gameScreen
};
