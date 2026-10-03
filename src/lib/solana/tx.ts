import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, type PublicKey, type VersionedTransaction } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { api } from '../api'

export type TxPhase = 'idle' | 'signing' | 'confirming'

/**
 * One path for every program instruction: wallet signs → confirm on chain → tell backend to sync → refetch chain state.
 * The backend sync is best effort — the chain is the source of truth.
 */
export function useSendAndSync() {
  const { connection } = useConnection()
  const { sendTransaction } = useWallet()
  const queryClient = useQueryClient()

  return useCallback(
    async (
      build: () => Promise<Transaction | VersionedTransaction>,
      pda: PublicKey,
      onPhase?: (phase: TxPhase) => void,
    ): Promise<string> => {
      onPhase?.('signing')
      const tx = await build()
      const latest = await connection.getLatestBlockhash('confirmed')
      // Pin the blockhash we confirm against, so confirmation expiry matches the signed tx
      if (tx instanceof Transaction && !tx.recentBlockhash) tx.recentBlockhash = latest.blockhash
      const signature = await sendTransaction(tx, connection)

      onPhase?.('confirming')
      const { value } = await connection.confirmTransaction({ signature, ...latest }, 'confirmed')
      if (value.err) throw new Error(`Transaction failed: ${JSON.stringify(value.err)}`)

      await api.syncProject(pda.toBase58(), signature).catch(() => {})
      await queryClient.invalidateQueries({ queryKey: ['chain', pda.toBase58()] })
      await queryClient.invalidateQueries({ queryKey: ['project', pda.toBase58()] })
      return signature
    },
    [connection, sendTransaction, queryClient],
  )
}
