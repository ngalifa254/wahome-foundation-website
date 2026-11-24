import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const configDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // Production is served from the root custom domain. VITE_BASE_PATH remains
  // available for explicit local or branch preview builds.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(configDir, './src'),
    },
  },
})
