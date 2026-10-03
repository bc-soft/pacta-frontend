import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, type PublicKey, type VersionedTransaction } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { api } from '../api'

export type TxPhase = 'idle' | 'signing' | 'confirming'

/** After a confirmed tx: tell the backend to sync (best effort — the chain is the source of truth) and refetch. */
function useAfterConfirmed() {
  const queryClient = useQueryClient()

  return useCallback(
    async (pda: PublicKey, signatures: string[]) => {
      for (const signature of signatures) await api.syncProject(pda.toBase58(), signature).catch(() => {})
      await queryClient.invalidateQueries({ queryKey: ['chain', pda.toBase58()] })
      await queryClient.invalidateQueries({ queryKey: ['project', pda.toBase58()] })
      await queryClient.invalidateQueries({ queryKey: ['history', pda.toBase58()] })
    },
    [queryClient],
  )
}

/** One path for every program instruction: wallet signs → confirm on chain → backend sync → refetch chain state. */
export function useSendAndSync() {
  const { connection } = useConnection()
  const { sendTransaction } = useWallet()
  const afterConfirmed = useAfterConfirmed()

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

      await afterConfirmed(pda, [signature])
      return signature
    },
    [connection, sendTransaction, afterConfirmed],
  )
}

/**
 * Several transactions that must land in order (e.g. createProject, then milestones that don't fit in the same tx).
 * One wallet popup via signAllTransactions; each tx is confirmed before the next is sent.
 */
export function useSendAllAndSync() {
  const { connection } = useConnection()
  const { publicKey, signAllTransactions } = useWallet()
  const afterConfirmed = useAfterConfirmed()

  return useCallback(
    async (
      build: () => Promise<Transaction[]>,
      pda: PublicKey,
      onPhase?: (phase: TxPhase) => void,
    ): Promise<string[]> => {
      if (!publicKey || !signAllTransactions) throw new Error('Wallet does not support signing multiple transactions')

      onPhase?.('signing')
      const txs = await build()
      const latest = await connection.getLatestBlockhash('confirmed')
      for (const tx of txs) {
        tx.recentBlockhash = latest.blockhash
        tx.feePayer = publicKey
      }
      const signed = await signAllTransactions(txs)

      onPhase?.('confirming')
      const signatures: string[] = []
      try {
        for (const tx of signed) {
          const signature = await connection.sendRawTransaction(tx.serialize())
          const { value } = await connection.confirmTransaction({ signature, ...latest }, 'confirmed')
          if (value.err) throw new Error(`Transaction failed: ${JSON.stringify(value.err)}`)
          signatures.push(signature)
        }
      } finally {
        // Sync whatever did land, even if a later tx failed
        if (signatures.length > 0) await afterConfirmed(pda, signatures)
      }
      return signatures
    },
    [connection, publicKey, signAllTransactions, afterConfirmed],
  )
}
