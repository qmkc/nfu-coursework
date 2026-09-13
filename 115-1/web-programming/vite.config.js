import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'dist/assets/js',
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/client/nav-menu.tsx',
      output: {
        entryFileNames: 'nav-menu.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
