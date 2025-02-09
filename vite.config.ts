import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import * as Sentry from "@sentry/vite-plugin"
import envPlugin from 'vite-plugin-environment'

export default defineConfig(({ mode }) => {
  // Carregar variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      envPlugin('all'),
      Sentry.sentryVitePlugin({
        org: "vem-simbora",
        project: "javascript-react",
        authToken: env.SENTRY_AUTH_TOKEN
      })
    ],
    server: {
      port: 3000,
      open: true,
      cors: true
    },
    preview: {
      port: 8080
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html']
      }
    },
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  }
})
