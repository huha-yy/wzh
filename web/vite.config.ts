import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        // target: 'http://146.56.198.185:8080',
        changeOrigin: true
      }
    }
  }
})
