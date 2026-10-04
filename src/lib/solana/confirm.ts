import type { Connection, TransactionSignature } from '@solana/web3.js'

const POLL_MS = 1_000

/**
 * Waits for a transaction over plain HTTP (getSignatureStatuses) instead of the websocket subscription
 * connection.confirmTransaction uses, so any RPC works — including providers without websockets (Alchemy).
 * Gives up once the blockhash has expired, like confirmTransaction does.
 */
export async function confirmSignature(
  connection: Connection,
  signature: TransactionSignature,
  lastValidBlockHeight: number,
): Promise<void> {
  for (;;) {
    const { value } = await connection.getSignatureStatuses([signature])
    const status = value[0]
    if (status?.err) throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`)
    if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') return

    if ((await connection.getBlockHeight('confirmed')) > lastValidBlockHeight) {
      throw new Error('The transaction expired before it was confirmed. Please try again.')
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
  }
}

const SEND_ATTEMPTS = 6

/**
 * Sends an already signed transaction, retrying while the RPC says "Blockhash not found". Load-balanced
 * providers (Alchemy, Helius) can serve the blockhash from one node and run the preflight on another that is
 * a few slots behind; the signed transaction stays valid, so a short wait is enough — no new wallet popup.
 */
export async function sendSignedTransaction(connection: Connection, raw: Uint8Array | Buffer): Promise<TransactionSignature> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await connection.sendRawTransaction(raw, { preflightCommitment: 'confirmed', maxRetries: 3 })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (attempt >= SEND_ATTEMPTS || !/blockhash not found/i.test(message)) throw error
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
    }
  }
}
