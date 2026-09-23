import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base wird beim Pages-Deploy über die Umgebungsvariable gesetzt:
//   BASE_PATH=/brauchwasser-wp-vergleich/ npm run build
// Lokal (npm run dev) bleibt es '/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
})
