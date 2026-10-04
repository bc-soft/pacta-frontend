/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLANA_CLUSTER?: string
  readonly VITE_SOLANA_RPC_URL: string
  readonly VITE_PACTA_PROGRAM_ID?: string
  readonly VITE_USDC_MINT?: string
  readonly VITE_API_URL: string
  readonly VITE_MERCURE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
