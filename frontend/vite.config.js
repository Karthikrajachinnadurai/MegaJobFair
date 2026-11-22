import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Port 5173 matches FRONTEND_ORIGINS and FRONTEND_LOGIN_URL in backend/application.yml
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  build: { chunkSizeWarningLimit: 800 },
})
