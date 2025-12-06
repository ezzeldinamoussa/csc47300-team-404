import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// 1. Import 'fileURLToPath' from 'url'
import { fileURLToPath } from 'url';
// 2. Import 'resolve' and 'dirname' from 'path'
import { resolve, dirname } from 'path';

// Helper function to calculate the directory path correctly using ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: '.', 
  build: {
    outDir: '../dist/frontend', 
    emptyOutDir: true, 
    rollupOptions: {
      input: {
        // We use the corrected __dirname substitute for path resolution
        main: resolve(__dirname, 'index.html'), 
        admin: resolve(__dirname, 'admin.html'),
        tasks: resolve(__dirname, 'tasks.html'),
        friends: resolve(__dirname, 'friends.html'),
        login: resolve(__dirname, 'login.html'),
        signup: resolve(__dirname, 'signup.html'),
        stats: resolve(__dirname, 'stats.html'),
        task_history: resolve(__dirname, 'task-history.html'),
      },
    },
  },
});