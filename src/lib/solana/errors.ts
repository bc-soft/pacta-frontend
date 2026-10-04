import { AnchorError } from '@coral-xyz/anchor'
import { WalletError } from '@solana/wallet-adapter-base'
import { ApiError } from '../api/client'

// Anchor error code name → plain English shown to the user. Extend as the program grows.
const PROGRAM_ERRORS: Record<string, string> = {
  InvalidStatus: 'This milestone is not ready for that action',
  Unauthorized: "Your wallet isn't allowed to do this in this project. Check which account is selected in your wallet.",
}

export type TxErrorKind = 'cancelled' | 'error'

export function describeTxError(error: unknown): { kind: TxErrorKind; message: string } {
  if (error instanceof UserFacingError || error instanceof ApiError) return { kind: 'error', message: error.message }
  if (isWalletRejection(error)) return { kind: 'cancelled', message: 'Cancelled in wallet' }

  const anchorError = error instanceof AnchorError ? error : tryParseAnchorError(error)
  if (anchorError) {
    const code = anchorError.error.errorCode.code
    return { kind: 'error', message: PROGRAM_ERRORS[code] ?? anchorError.error.errorMessage }
  }

  // Still unknown after the re-sign and send retries: approval took too long again, or another network
  if (error instanceof Error && /blockhash not found/i.test(error.message)) {
    return {
      kind: 'error',
      message: 'The approval expired before it reached Solana (about 30 s). Try again and approve a bit faster; check the wallet is on Devnet.',
    }
  }
  // Fee payer has never received SOL on this cluster (fresh wallet on devnet)
  if (error instanceof Error && /no record of a prior credit|AccountNotFound/i.test(error.message)) {
    return { kind: 'error', message: 'Your wallet has no SOL on devnet to pay the network fee. Get some at faucet.solana.com and try again.' }
  }
  if (error instanceof Error && /insufficient (funds|lamports)/i.test(error.message)) {
    return { kind: 'error', message: 'Not enough funds in your wallet' }
  }

  if (error instanceof Error && /429|too many requests|rate limit/i.test(error.message)) {
    return { kind: 'error', message: 'The Solana network is busy right now. Wait a few seconds and try again.' }
  }
  if (error instanceof Error && /expired before it was confirmed|Transaction failed/.test(error.message)) {
    return { kind: 'error', message: error.message }
  }

  // Unknown shape: keep the raw error in the console so it can be diagnosed
  console.error(error)
  return { kind: 'error', message: 'Something went wrong. Please try again.' }
}

function isWalletRejection(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (error instanceof WalletError || error instanceof Error) && /reject|cancel|denied|declined/i.test(message)
}

function tryParseAnchorError(error: unknown): AnchorError | null {
  const logs = (error as { logs?: string[] } | null)?.logs
  if (!Array.isArray(logs)) return null
  try {
    return AnchorError.parse(logs)
  } catch {
    return null
  }
}

/** An error whose message is already safe and meaningful to show to the user. */
export class UserFacingError extends Error {}
