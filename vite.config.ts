import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // @coral-xyz/anchor and spl-token expect Buffer/process in the browser
    nodePolyfills({ include: ['buffer', 'process'], globals: { Buffer: true, process: true } }),
  ],
})
