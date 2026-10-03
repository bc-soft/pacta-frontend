import { AnchorProvider, Program, type Idl, type Provider } from '@coral-xyz/anchor'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import { env } from '../../env'

// Picked up automatically once pacta.json is copied into ./idl.
// TODO(idl): switch to `import idl from './idl/pacta.json'` + `Program<Pacta>` from './idl/pacta' for full typing.
const idlModules = import.meta.glob<{ default: Idl }>('./idl/pacta.json', { eager: true })
const pactaIdl: Idl | undefined = Object.values(idlModules)[0]?.default

export const hasIdl = pactaIdl !== undefined

/**
 * Anchor Program for the Pacta program; null until IDL + program id are present.
 * Bound to the connected wallet when there is one (to build instructions), read-only otherwise (to fetch accounts).
 */
export function useProgram(): Program | null {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  return useMemo(() => {
    if (!pactaIdl || !env.programId) return null
    const provider: Provider = wallet
      ? new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
      : { connection }
    // Program id from env wins over the one baked into the IDL (redeploys to a new address)
    return new Program({ ...pactaIdl, address: env.programId.toBase58() }, provider)
  }, [connection, wallet])
}
