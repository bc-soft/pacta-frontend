import { AnchorError } from '@coral-xyz/anchor'
import { WalletError } from '@solana/wallet-adapter-base'

// Anchor error code name → plain English shown to the user. Extend as the program grows.
const PROGRAM_ERRORS: Record<string, string> = {
  InvalidStatus: 'This milestone is not ready for that action',
  Unauthorized: 'Only the client can do this',
}

export type TxErrorKind = 'cancelled' | 'error'

export function describeTxError(error: unknown): { kind: TxErrorKind; message: string } {
  if (isWalletRejection(error)) return { kind: 'cancelled', message: 'Cancelled in wallet' }

  const anchorError = error instanceof AnchorError ? error : tryParseAnchorError(error)
  if (anchorError) {
    const code = anchorError.error.errorCode.code
    return { kind: 'error', message: PROGRAM_ERRORS[code] ?? anchorError.error.errorMessage }
  }

  if (error instanceof Error && /insufficient (funds|lamports)/i.test(error.message)) {
    return { kind: 'error', message: 'Not enough funds in your wallet' }
  }

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
