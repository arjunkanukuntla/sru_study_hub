import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('recharts')) return 'charts'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('@tanstack')) return 'query'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },

})
