import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The /n8n prefix is proxied to the local n8n instance so the browser never
// makes a cross-origin call (no CORS setup needed on the webhook node).
// Frontend calls /n8n/webhook/github-code-review -> http://localhost:5678/webhook/github-code-review
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/n8n': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/n8n/, ''),
      },
    },
  },
})
