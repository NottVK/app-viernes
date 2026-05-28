import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // '/' para Vercel y web; './' solo si construyes APK/Electron: VITE_APP_BASE=./ npm run build
  base: process.env.VITE_APP_BASE || '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})