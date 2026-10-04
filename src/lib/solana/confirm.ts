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
