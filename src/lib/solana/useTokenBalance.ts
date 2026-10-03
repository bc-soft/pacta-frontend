import { BN } from '@coral-xyz/anchor'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { useConnection } from '@solana/wallet-adapter-react'
import type { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

/** Token balance of a wallet's associated account, in base units. 0 when the account doesn't exist yet. */
export function useTokenBalance(owner: PublicKey | null, mint: PublicKey | null) {
  const { connection } = useConnection()
  return useQuery({
    queryKey: ['tokenBalance', owner?.toBase58(), mint?.toBase58()],
    queryFn: async () => {
      const ata = getAssociatedTokenAddressSync(mint!, owner!)
      const info = await connection.getTokenAccountBalance(ata, 'confirmed').catch(() => null)
      return new BN(info?.value.amount ?? '0')
    },
    enabled: !!owner && !!mint,
  })
}
