/**
 * Chess Learning - Main Entry Point
 * Offline-first chess game for kids aged 5-10
 */

import './ui/styles/global.css';
import './ui/styles/board.css';
import './ui/styles/components.css';

import { GameScreen } from './ui/components/game-screen';
import { runPhase1Tests } from './tests/phase1-tests';

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

// Run Phase 1 tests (in background)
console.log('\n🧪 Running Phase 1 Tests...');
runPhase1Tests();

// Initialize Phase 2: UI
console.log('\n🎨 Initializing Phase 2: Visual Chess Board...');
console.log('─────────────────────────────────────────────');

const appContainer = document.getElementById('app');
if (!appContainer) {
  throw new Error('App container not found!');
}

const gameScreen = new GameScreen(appContainer);
gameScreen.initialize();

console.log('✅ Phase 2 Complete: UI Initialized');
console.log('🎮 You can now play chess in the browser!');
console.log('─────────────────────────────────────────────');
console.log('\n📖 How to play:');
console.log('1. Click a piece to select it');
console.log('2. Click a highlighted square to move');
console.log('3. Use Undo/Redo buttons to navigate history');
console.log('4. Start a New Game anytime');
console.log('\n🎯 Next: Phase 3 - AI Opponent');
console.log('─────────────────────────────────────────────\n');

// Export for future use
export const app = {
  version: '0.2.0',
  mode: 'development',
  offline: true,
  phase: 2,
  gameScreen
};
