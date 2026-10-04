import { AnchorProvider, Program, type Idl, type Provider } from '@coral-xyz/anchor'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import { env } from '../../env'
import idl from './idl/pacta.json'

// Copied from the program repo (target/idl) after every `anchor build` — see ./idl/README.md
const pactaIdl = idl as Idl

/** Program address the IDL was built for — should equal VITE_PACTA_PROGRAM_ID */
export const idlAddress = pactaIdl.address

/**
 * Anchor Program for the Pacta program; null until the program id is configured.
 * Bound to the connected wallet when there is one (to build instructions), read-only otherwise (to fetch accounts).
 */
export function useProgram(): Program | null {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  return useMemo(() => {
    if (!env.programId) return null
    const provider: Provider = wallet
      ? new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
      : { connection }
    // Program id from env wins over the one baked into the IDL (redeploys to a new address)
    return new Program({ ...pactaIdl, address: env.programId.toBase58() }, provider)
  }, [connection, wallet])
}
