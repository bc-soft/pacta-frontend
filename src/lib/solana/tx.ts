import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, type PublicKey, type VersionedTransaction } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAuth } from '../../features/auth/useAuth'
import { api } from '../api'
import { confirmSignature } from './confirm'

export type TxPhase = 'idle' | 'signing' | 'confirming'

/**
 * Backend sync needs a session, so the first transaction of a session also asks the wallet to sign in.
 * Best effort: if the user declines or the backend is down, the transaction still goes through — the backend
 * catches up from the chain on its own.
 */
function useBestEffortSignIn() {
  const { ensureSignedIn } = useAuth()
  return useCallback(() => ensureSignedIn().catch(() => {}), [ensureSignedIn])
}

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
  const signIn = useBestEffortSignIn()

  return useCallback(
    async (
      build: () => Promise<Transaction | VersionedTransaction>,
      pda: PublicKey,
      onPhase?: (phase: TxPhase) => void,
    ): Promise<string> => {
      onPhase?.('signing')
      await signIn()
      const tx = await build()
      const latest = await connection.getLatestBlockhash('confirmed')
      // Pin the blockhash we confirm against, so confirmation expiry matches the signed tx
      if (tx instanceof Transaction && !tx.recentBlockhash) tx.recentBlockhash = latest.blockhash
      const signature = await sendTransaction(tx, connection)

      onPhase?.('confirming')
      await confirmSignature(connection, signature, latest.lastValidBlockHeight)

      await afterConfirmed(pda, [signature])
      return signature
    },
    [connection, sendTransaction, afterConfirmed, signIn],
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
  const signIn = useBestEffortSignIn()

  return useCallback(
    async (
      build: () => Promise<Transaction[]>,
      pda: PublicKey,
      onPhase?: (phase: TxPhase) => void,
    ): Promise<string[]> => {
      if (!publicKey || !signAllTransactions) throw new Error('Wallet does not support signing multiple transactions')

      onPhase?.('signing')
      await signIn()
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
          await confirmSignature(connection, signature, latest.lastValidBlockHeight)
          signatures.push(signature)
        }
      } finally {
        // Sync whatever did land, even if a later tx failed
        if (signatures.length > 0) await afterConfirmed(pda, signatures)
      }
      return signatures
    },
    [connection, publicKey, signAllTransactions, afterConfirmed, signIn],
  )
}
