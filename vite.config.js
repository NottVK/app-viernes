import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // loadEnv se encarga de buscar y cargar el archivo .env.electron de forma segura
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // Si encuentra la variable usará './' (rutas relativas), si no, usará '/' (rutas web)
    base: env.VITE_APP_BASE || '/',
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})