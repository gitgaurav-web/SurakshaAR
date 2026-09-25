import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Force relative paths for Capacitor Android WebView
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    target: ['es2015', 'chrome64', 'edge79', 'firefox67', 'safari12'],
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: true, // Allow mobile devices on LAN to access WebAR
  }
})
