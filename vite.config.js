import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, 'full/public'), // 👈 tu index.html está aquí
  build: {
    outDir: resolve(__dirname, 'dist'),
  },
  server: {
    open: true, // abre automáticamente el navegador
  },
})
