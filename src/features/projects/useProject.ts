import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { api, ApiError } from '../../lib/api'
import { roleIn } from '../../lib/roles'
import { fetchProjectState } from '../../lib/solana/accounts'
import { useProgram } from '../../lib/solana/program'

export const parseAddress = (value: string | undefined): PublicKey | null => {
  try {
    return value ? new PublicKey(value) : null
  } catch {
    return null
  }
}

/** Money, wallets, shares and statuses — always from the chain. */
export function useChainProject(pda: string) {
  const { connection } = useConnection()
  const program = useProgram()
  const address = parseAddress(pda)

  return useQuery({
    queryKey: ['chain', pda],
    queryFn: () => fetchProjectState(program!, connection, address!),
    enabled: !!program && !!address,
    // Other demo wallets act on the same project; Mercure invalidates sooner when it's connected
    refetchInterval: 15_000,
  })
}

/** Titles, descriptions, criteria, deliverables — from the backend. Missing metadata is not an error. */
export function useProjectMeta(pda: string) {
  return useQuery({
    queryKey: ['project', pda],
    queryFn: () =>
      api.project(pda).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }),
    retry: false,
  })
}

/** Everything a project screen needs: chain state, metadata and the connected wallet's role. */
export function useProjectView(pda: string) {
  const { publicKey } = useWallet()
  const program = useProgram()
  const chain = useChainProject(pda)
  const meta = useProjectMeta(pda)
  const wallet = publicKey?.toBase58() ?? null
  const state = chain.data ?? null

  return {
    pda,
    wallet,
    programReady: !!program,
    chain,
    meta,
    state,
    role: state ? roleIn(state.project, wallet) : 'viewer',
    title: meta.data?.title || 'Untitled project',
    milestoneMeta: (index: number) => meta.data?.milestones.find((m) => m.index === index),
    milestoneTitle: (index: number) =>
      meta.data?.milestones.find((m) => m.index === index)?.title || `Milestone ${index + 1}`,
  }
}

export type ProjectView = ReturnType<typeof useProjectView>
