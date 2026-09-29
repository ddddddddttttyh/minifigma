import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/mini-figma/',
  server: { host: true },
  plugins: [react(), tailwindcss()],
})
