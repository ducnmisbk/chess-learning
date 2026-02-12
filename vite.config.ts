import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/chess-learning/', // GitHub Pages base path
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@assets': resolve(__dirname, './public/assets')
    }
  },
  server: {
    host: true, // Allow Docker container access
    port: 5173,
    watch: {
      usePolling: true // Required for file watching in Docker volumes
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'game-engine': ['./src/main.ts']
        }
      }
    }
  }
});
