import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Garante que os caminhos sejam absolutos na raiz
  build: {
    outDir: 'dist', // Pasta de saída padrão
  }
})