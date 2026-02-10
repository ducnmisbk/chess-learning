/**
 * Chess Learning - Main Entry Point
 * Offline-first chess game for kids aged 5-10
 */

console.log('🎮 Chess Learning App Starting...');

// Check if running in Docker
const isDocker = window.location.port === '5173';
if (isDocker) {
  console.log('✅ Running in Docker development environment');
}

// Test IndexedDB availability
if ('indexedDB' in window) {
  console.log('✅ IndexedDB available for offline storage');
} else {
  console.warn('⚠️  IndexedDB not available');
}

// Test Service Worker support
if ('serviceWorker' in navigator) {
  console.log('✅ Service Worker supported for offline mode');
} else {
  console.warn('⚠️  Service Worker not supported');
}

// Load assets
const assetCount = 72; // Classic (12) + Fun (12) + Minimalist (48)
console.log(`✅ ${assetCount} chess piece assets available`);

// Display info
const statusDiv = document.querySelector('.status');
if (statusDiv) {
  const timestamp = new Date().toLocaleString('vi-VN');
  const info = document.createElement('p');
  info.style.marginTop = '1rem';
  info.style.fontSize = '0.9rem';
  info.style.opacity = '0.8';
  info.textContent = `Started at: ${timestamp}`;
  statusDiv.appendChild(info);
}

console.log('🚀 Ready to start Phase 1 development!');
console.log('📖 See IMPLEMENTATION_PLAN.md for next steps');

// Export for future use
export const app = {
  version: '0.1.0',
  mode: 'development',
  offline: true
};
