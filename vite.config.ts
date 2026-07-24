import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import path from 'path'
import { readFileSync } from 'node:fs'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest: manifest as any }),
    {
      name: 'legal-notices',
      generateBundle() {
        for (const fileName of ['LICENSE', 'THIRD_PARTY_NOTICES.txt']) {
          this.emitFile({
            type: 'asset',
            fileName,
            source: readFileSync(path.resolve(__dirname, fileName))
          })
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        sidepanel: 'src/pages/sidepanel/index.html',
        options: 'src/pages/options/index.html'
      }
    }
  }
})
