import { AnchorProvider, Program, type Idl } from '@coral-xyz/anchor'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import { env } from '../../env'

// Picked up automatically once pacta.json is copied into ./idl.
// TODO(idl): switch to `import idl from './idl/pacta.json'` + `Program<Pacta>` from './idl/pacta' for full typing.
const idlModules = import.meta.glob<{ default: Idl }>('./idl/pacta.json', { eager: true })
const pactaIdl: Idl | undefined = Object.values(idlModules)[0]?.default

/** Anchor Program bound to the connected wallet; null until the wallet is connected and IDL + program id are present. */
export function useProgram(): Program | null {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  return useMemo(() => {
    if (!wallet || !pactaIdl || !env.programId) return null
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
    // Program id from env wins over the one baked into the IDL (redeploys to a new address)
    return new Program({ ...pactaIdl, address: env.programId.toBase58() }, provider)
  }, [connection, wallet])
}

export const hasIdl = pactaIdl !== undefined
