import type { WalletContextState } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import { env } from '../../env'

// Wallet Standard shapes, typed structurally so we don't depend on transitive packages
interface StandardAccount {
  address: string
}
interface SignTransactionFeature {
  signTransaction(
    ...inputs: { account: StandardAccount; chain: string; transaction: Uint8Array }[]
  ): Promise<{ signedTransaction: Uint8Array }[]>
}
interface StandardWallet {
  accounts: readonly StandardAccount[]
  features: Record<string, unknown>
}

const CHAIN = `solana:${env.cluster === 'mainnet-beta' ? 'mainnet' : env.cluster}`

/**
 * Signs with the wallet, telling it which cluster the transactions are for.
 *
 * The wallet adapter's signTransaction sends no chain, so Phantom falls back to the network it has stored for
 * the account and may refresh the blockhash from there; a mainnet blockhash is then "not found" on devnet.
 * Wallet Standard wallets get `chain` explicitly; other adapters use the plain signAllTransactions.
 */
export async function signForCluster(wallet: WalletContextState, txs: Transaction[]): Promise<Transaction[]> {
  const publicKey = wallet.publicKey?.toBase58()
  const standard = (wallet.wallet?.adapter as { wallet?: StandardWallet } | undefined)?.wallet
  const feature = standard?.features['solana:signTransaction'] as SignTransactionFeature | undefined
  const account = standard?.accounts.find((a) => a.address === publicKey)

  let signed: Transaction[]
  if (feature && account) {
    const outputs = await feature.signTransaction(
      ...txs.map((tx) => ({
        account,
        chain: CHAIN,
        transaction: new Uint8Array(tx.serialize({ requireAllSignatures: false, verifySignatures: false })),
      })),
    )
    signed = outputs.map((o) => Transaction.from(o.signedTransaction))
  } else if (wallet.signAllTransactions) {
    signed = await wallet.signAllTransactions(txs)
  } else {
    throw new Error('This wallet cannot sign transactions')
  }

  signed.forEach((tx, i) => {
    if (tx.recentBlockhash !== txs[i].recentBlockhash) {
      console.warn(`Wallet replaced the blockhash ${txs[i].recentBlockhash} → ${tx.recentBlockhash} (chain ${CHAIN})`)
    }
  })
  return signed
}
