import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Public marketing site. Port 5170 so it can run next to the portals (5173+).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5170 },
})
