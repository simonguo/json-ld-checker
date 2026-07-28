import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../tmp/visual-dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        report: path.resolve(__dirname, 'report.html'),
        settings: path.resolve(__dirname, 'settings.html'),
        sidepanel: path.resolve(__dirname, 'sidepanel.html'),
        storeAssets: path.resolve(__dirname, 'store-assets.html'),
      },
    },
  },
});
