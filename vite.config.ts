import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/banana-resume-as-code/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
