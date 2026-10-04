import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import type { PublicKey, Transaction } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAuth } from '../../features/auth/useAuth'
import { api } from '../api'
import { confirmSignature, sendSignedTransaction } from './confirm'
import { signForCluster } from './sign'

export type TxPhase = 'idle' | 'signing' | 'resigning' | 'confirming'

/** Blocks left that we still consider enough to send and land the transaction (~5 s on devnet). */
const EXPIRY_MARGIN_BLOCKS = 20

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
  const sendAll = useSendAllAndSync()
  return useCallback(
    async (build: () => Promise<Transaction>, pda: PublicKey, onPhase?: (phase: TxPhase) => void): Promise<string> => {
      const [signature] = await sendAll(async () => [await build()], pda, onPhase)
      return signature
    },
    [sendAll],
  )
}

/**
 * Several transactions that must land in order (e.g. createProject, then milestones that don't fit in the same tx).
 * One wallet popup; each tx is confirmed before the next is sent.
 *
 * The wallet only signs; we send through our own RPC. Phantom's signAndSendTransaction hides program errors
 * behind "Unexpected error", while our preflight returns the logs describeTxError can read.
 */
export function useSendAllAndSync() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const afterConfirmed = useAfterConfirmed()
  const signIn = useBestEffortSignIn()

  return useCallback(
    async (
      build: () => Promise<Transaction[]>,
      pda: PublicKey,
      onPhase?: (phase: TxPhase) => void,
    ): Promise<string[]> => {
      const { publicKey } = wallet
      if (!publicKey) throw new Error('Connect your wallet first')

      onPhase?.('signing')
      await signIn()
      const txs = await build()
      const signFresh = async () => {
        const latest = await connection.getLatestBlockhash('confirmed')
        for (const tx of txs) {
          tx.recentBlockhash = latest.blockhash
          tx.feePayer = publicKey
        }
        return { latest, signed: await signForCluster(wallet, txs) }
      }

      let { latest, signed } = await signFresh()
      // A blockhash lives 150 blocks; on devnet that can be ~35 s, less than a careful read of the wallet popup.
      // If it ran out while the user was approving, sign once more with a fresh one instead of failing.
      if ((await connection.getBlockHeight('confirmed')) > latest.lastValidBlockHeight - EXPIRY_MARGIN_BLOCKS) {
        onPhase?.('resigning')
        ;({ latest, signed } = await signFresh())
      }

      onPhase?.('confirming')
      const signatures: string[] = []
      try {
        for (const tx of signed) {
          const signature = await sendSignedTransaction(connection, tx.serialize())
          await confirmSignature(connection, signature, latest.lastValidBlockHeight)
          signatures.push(signature)
        }
      } finally {
        // Sync whatever did land, even if a later tx failed
        if (signatures.length > 0) await afterConfirmed(pda, signatures)
      }
      return signatures
    },
    [connection, wallet, afterConfirmed, signIn],
  )
}
