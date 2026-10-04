import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { env } from '../env'
import { AuthProvider } from '../features/auth/AuthProvider'

import '@solana/wallet-adapter-react-ui/styles.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: false } },
})

// Installed wallets (Phantom, Solflare, Backpack) register themselves via Wallet Standard. These adapters are
// the fallback when no extension is detected: without them the modal is empty and offers nothing to click.
// Solflare also works without an extension, as a web wallet.
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()]

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={env.rpcUrl} config={{ commitment: 'confirmed' }}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  )
}
