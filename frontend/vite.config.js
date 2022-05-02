import { resolve } from 'path'

import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess'

export default defineConfig({
  root: './',
  plugins: [
    svelte({
      preprocess: sveltePreprocess({
        sourceMap: true
      })
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 8080,
    strictPort: true,
    proxy: {
      '^/api/.*': {
        target: `http://localhost:3100`,
        ws: true
      }
    }
  },
  build: {
    minify: true,
    target: 'esnext',
    outDir: resolve(__dirname, './build'),
    emptyOutDir: true,
  },
  clearScreen: false
})