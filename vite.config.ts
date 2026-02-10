import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@assets': resolve(__dirname, './assets')
    }
  },
  server: {
    host: true, // For Docker
    port: 5173,
    watch: {
      usePolling: true // For Docker file watching
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
