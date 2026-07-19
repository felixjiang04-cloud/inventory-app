import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // During development, forward /api/* requests to the FastAPI backend
    // so the browser talks to one origin and CORS never gets in the way.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
