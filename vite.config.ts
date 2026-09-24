import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Required for GitHub Pages subfolder deployment. Override with VITE_BASE_PATH
  // to build a branch preview into a subfolder (e.g. /wahome-foundation-website/v2/).
  base: process.env.VITE_BASE_PATH || '/wahome-foundation-website/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})