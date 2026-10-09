import react from '@vitejs/plugin-react'
import { defineConfig, type UserConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  }
} as UserConfig & {
  test: {
    environment: string
    globals: boolean
    setupFiles: string
  }
})