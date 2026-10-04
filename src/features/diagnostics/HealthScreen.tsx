import { useConnection } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ExplorerLink } from '../../components/ExplorerLink'
import { env } from '../../env'
import { api } from '../../lib/api'
import { idlAddress } from '../../lib/solana/program'

/** Pre-demo checklist: is everything the live flow needs actually reachable? */
export function HealthScreen() {
  const { connection } = useConnection()

  const backend = useQuery({ queryKey: ['health', 'backend'], queryFn: api.health, retry: false })
  const rpc = useQuery({
    queryKey: ['health', 'rpc'],
    queryFn: async () => ({ version: await connection.getVersion(), slot: await connection.getSlot() }),
    retry: false,
  })
  const program = useQuery({
    queryKey: ['health', 'program', env.programId?.toBase58()],
    queryFn: async () => (await connection.getAccountInfo(env.programId!))?.executable ?? false,
    enabled: !!env.programId,
    retry: false,
  })

  return (
    <section className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-balance">System status</h1>
      <dl className="mt-6 divide-y divide-ink-200 card">
        <Row label="Cluster" ok>
          {env.cluster}
        </Row>
        <Row label="Solana RPC" ok={rpc.isSuccess} pending={rpc.isPending}>
          {rpc.data ? `slot ${rpc.data.slot.toLocaleString()} · ${rpc.data.version['solana-core']}` : rpc.error?.message}
        </Row>
        <Row label="Backend API" ok={backend.isSuccess} pending={backend.isPending}>
          {backend.data
            ? JSON.stringify(backend.data)
            : `${backend.error?.message ?? ''} — is the backend running (docker compose up) and BACKEND_PROXY_TARGET correct?`}
        </Row>
        <Row label="Program" ok={program.data === true} pending={program.isFetching}>
          {env.programId ? (
            <ExplorerLink address={env.programId.toBase58()}>{env.programId.toBase58()}</ExplorerLink>
          ) : (
            'VITE_PACTA_PROGRAM_ID not set'
          )}
        </Row>
        <Row label="Program IDL" ok={idlAddress === env.programId?.toBase58()}>
          {idlAddress === env.programId?.toBase58()
            ? 'matches the program'
            : `built for ${idlAddress} — copy a fresh pacta.json into src/lib/solana/idl/`}
        </Row>
        <Row label="USDC mint" ok={!!env.usdcMint}>
          {env.usdcMint?.toBase58() ?? 'VITE_USDC_MINT not set'}
        </Row>
        <Row label="Buffer polyfill" ok={typeof window.Buffer === 'function'}>
          {typeof window.Buffer === 'function' ? 'present' : 'missing — check vite-plugin-node-polyfills'}
        </Row>
      </dl>
    </section>
  )
}

function Row({ label, ok, pending, children }: { label: string; ok: boolean; pending?: boolean; children: ReactNode }) {
  const icon = pending ? '…' : ok ? '✓' : '✗'
  const tone = pending ? 'text-ink-400' : ok ? 'text-emerald-600' : 'text-rose-600'
  return (
    <div className="flex gap-3 px-4 py-3 text-sm">
      <span className={`w-4 font-bold ${tone}`}>{icon}</span>
      <dt className="w-36 shrink-0 font-medium">{label}</dt>
      <dd className="min-w-0 break-all text-ink-600">{children}</dd>
    </div>
  )
}
