import {
  ComputeBudgetProgram,
  SendTransactionError,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  type Connection,
  type PublicKey,
} from '@solana/web3.js'

/** Used when a transaction can't be simulated on its own (it depends on an earlier one in the same batch). */
const FALLBACK_UNIT_LIMIT = 400_000
const MIN_UNIT_LIMIT = 10_000
/** Devnet has no fee market to speak of; a token price keeps the fee at the 5000-lamport base. */
const UNIT_PRICE_MICRO_LAMPORTS = 1

/**
 * Prepends compute-budget instructions sized from our own simulation.
 *
 * Without them Phantom simulates the transaction and fetches priority fees from its own RPC before it even
 * opens the approval popup (15–20 s on devnet), which eats most of the ~35 s a blockhash lives. Wallets leave
 * transactions that already carry a compute budget alone. The first simulation also surfaces program errors
 * before the user is asked to sign.
 */
export async function withComputeBudget(connection: Connection, payer: PublicKey, txs: Transaction[]): Promise<void> {
  const { blockhash } = await connection.getLatestBlockhash('confirmed')

  for (const [i, tx] of txs.entries()) {
    if (tx.instructions.some((ix) => ix.programId.equals(ComputeBudgetProgram.programId))) continue

    const message = new TransactionMessage({ payerKey: payer, recentBlockhash: blockhash, instructions: tx.instructions })
    const { value } = await connection.simulateTransaction(new VersionedTransaction(message.compileToV0Message()), {
      sigVerify: false,
      replaceRecentBlockhash: true,
      commitment: 'confirmed',
    })

    let units = FALLBACK_UNIT_LIMIT
    if (value.err) {
      // Only the first transaction runs against current state; later ones may need the earlier ones landed
      if (i === 0) {
        throw new SendTransactionError({
          action: 'simulate',
          signature: '',
          transactionMessage: `Transaction simulation failed: ${JSON.stringify(value.err)}`,
          logs: value.logs ?? [],
        })
      }
    } else if (value.unitsConsumed) {
      units = Math.max(MIN_UNIT_LIMIT, Math.ceil(value.unitsConsumed * 1.2))
    }

    tx.instructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: UNIT_PRICE_MICRO_LAMPORTS }),
      ...tx.instructions,
    ]
  }
}
