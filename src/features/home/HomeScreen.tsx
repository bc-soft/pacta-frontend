import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { primaryButtonClass } from '../../components/form'
import { ShortAddress } from '../../components/ShortAddress'
import { StatusPill } from '../../components/StatusPill'
import { api } from '../../lib/api'
import { PROJECT_STATUS_LABELS } from '../../lib/labels'
import { ROLE_LABELS, roleIn } from '../../lib/roles'
import { fetchProjectsForWallet } from '../../lib/solana/accounts'
import { useProgram } from '../../lib/solana/program'

export function HomeScreen() {
  const { publicKey } = useWallet()
  const program = useProgram()
  const wallet = publicKey?.toBase58()

  // Chain says which projects exist and my role; the backend adds titles. Either may be missing.
  const chain = useQuery({
    queryKey: ['chain', 'projects', wallet],
    queryFn: () => fetchProjectsForWallet(program!, wallet!),
    enabled: !!wallet && !!program,
  })
  const meta = useQuery({
    queryKey: ['projects', wallet],
    queryFn: () => api.projects(wallet!),
    enabled: !!wallet,
    retry: false,
  })

  if (!wallet) {
    return (
      <section className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Take on a job together. Get paid fairly, automatically.</h1>
        <p className="mt-4 text-slate-600">
          The client locks the budget up front. When a milestone is accepted, the money is split between the team
          exactly as agreed — no middleman.
        </p>
        <div className="mt-8 flex justify-center">
          <WalletMultiButton />
        </div>
      </section>
    )
  }

  const titles = new Map((meta.data ?? []).map((p) => [p.pda, p]))
  const rows = [
    ...(chain.data ?? []).map((p) => ({
      pda: p.address,
      title: titles.get(p.address)?.title,
      status: p.status,
      role: roleIn(p, wallet),
    })),
    // Drafts the backend knows about but that aren't on-chain (yet)
    ...(meta.data ?? [])
      .filter((p) => !chain.data?.some((c) => c.address === p.pda))
      .map((p) => ({ pda: p.pda, title: p.title, status: null, role: null })),
  ]
  const loading = (chain.isPending && chain.fetchStatus !== 'idle') || (meta.isPending && meta.fetchStatus !== 'idle')

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Your projects</h1>
        <Link to="/projects/new" className={primaryButtonClass}>
          Create project
        </Link>
      </div>
      {loading && <p className="mt-4 text-slate-500">Loading…</p>}
      {chain.isError && <p className="mt-4 text-sm text-rose-700">Couldn&apos;t read projects from Solana.</p>}
      {!loading && rows.length === 0 && (
        <p className="mt-4 text-slate-500">No projects yet. Create one as a client or ask a client to add you.</p>
      )}
      <ul className="mt-4 grid gap-3">
        {rows.map((p) => (
          <li key={p.pda}>
            <Link
              to={`/projects/${p.pda}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300"
            >
              <span className="min-w-0">
                <span className="block font-semibold">{p.title ?? 'Untitled project'}</span>
                <span className="block text-xs text-slate-500">
                  <ShortAddress address={p.pda} />
                  {p.role && ` · you are ${ROLE_LABELS[p.role].toLowerCase()}`}
                </span>
              </span>
              {p.status ? (
                <StatusPill status={p.status} label={PROJECT_STATUS_LABELS[p.status]} />
              ) : (
                <StatusPill status="created" label="Not on-chain yet" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
