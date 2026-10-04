import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Dev proxy: the browser only talks to the Vite origin, so the backend's self-signed certificate
  // and CORS never get in the way. Used when VITE_API_URL is empty (the default in .env.example).
  const backend = loadEnv(mode, process.cwd(), '').BACKEND_PROXY_TARGET || 'https://localhost:8443'
  const proxy = { target: backend, changeOrigin: true, secure: false }

  return {
    server: {
      proxy: { '/api': proxy, '/.well-known/mercure': proxy },
    },
    plugins: [
      react(),
      tailwindcss(),
      // @coral-xyz/anchor and spl-token expect Buffer/process in the browser
      nodePolyfills({ include: ['buffer', 'process'], globals: { Buffer: true, process: true } }),
    ],
  }
})
