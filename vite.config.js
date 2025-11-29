import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, 'full/public'),
  publicDir: resolve(__dirname, 'full/public'), // ← Agrega esto
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    copyPublicDir: true  // ← Agrega esto para copiar archivos públicos
  },
  server: {
    open: true,
  },
})