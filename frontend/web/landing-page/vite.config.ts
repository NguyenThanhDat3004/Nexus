import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const sharedDir = fileURLToPath(new URL('../../shared', import.meta.url))

// Public marketing site. Port 5170 so it can run next to the portals (5173+).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@nexus/ui': `${sharedDir}/ui/src` },
    // Shared packages have no node_modules of their own; resolve React from this app.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5170,
    fs: { allow: ['.', sharedDir] },
  },
})
