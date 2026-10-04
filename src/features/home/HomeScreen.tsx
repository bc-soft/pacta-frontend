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
import { fetchProjectsByAddress } from '../../lib/solana/accounts'
import { useProgram } from '../../lib/solana/program'

export function HomeScreen() {
  const { publicKey } = useWallet()
  const program = useProgram()
  const wallet = publicKey?.toBase58()

  // The backend knows which projects involve this wallet (and their titles); the chain says their real status
  // and my role. Projects only exist here once their draft was saved in the backend.
  const meta = useQuery({
    queryKey: ['projects', wallet],
    queryFn: () => api.projects(wallet!),
    enabled: !!wallet,
    retry: false,
  })
  const addresses = (meta.data ?? []).map((p) => p.pda)
  const chain = useQuery({
    queryKey: ['chain', 'projects', addresses],
    queryFn: () => fetchProjectsByAddress(program!, addresses),
    enabled: !!program && meta.isSuccess,
  })

  if (!wallet) return <Landing />

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-600">Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Your projects</h1>
        </div>
        <Link to="/projects/new" className={primaryButtonClass}>
          <span aria-hidden className="text-base leading-none">
            +
          </span>
          Create project
        </Link>
      </div>

      {loading && (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Loading projects">
          {[0, 1].map((i) => (
            <li key={i} className="card h-24 animate-pulse bg-white/60" />
          ))}
        </ul>
      )}
      {chain.isError && <p className="mt-6 text-sm text-rose-700">Couldn&apos;t read projects from Solana.</p>}

      {!loading && rows.length === 0 && (
        <div className="card mt-6 flex flex-col items-center px-6 py-14 text-center">
          <img src="/brand/favicon.png" alt="" className="size-14 opacity-90" />
          <h2 className="mt-4 text-lg font-bold">No projects yet</h2>
          <p className="mt-1 max-w-sm text-sm text-ink-500">
            Create one as a client, or ask a client to add your wallet to their team.
          </p>
          <Link to="/projects/new" className={`${primaryButtonClass} mt-6`}>
            Create your first project
          </Link>
        </div>
      )}

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {rows.map((p) => (
          <li key={p.pda}>
            <Link
              to={`/projects/${p.pda}`}
              className="card group flex h-full flex-col justify-between gap-4 p-5 transition hover:-translate-y-0.5 hover:ring-brand-300 hover:shadow-[0_12px_32px_-12px_rgb(29_99_214/0.35)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold group-hover:text-brand-700">
                    {p.title ?? 'Untitled project'}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-500">
                    <ShortAddress address={p.pda} />
                  </span>
                </span>
                {p.status ? (
                  <StatusPill status={p.status} label={PROJECT_STATUS_LABELS[p.status]} />
                ) : (
                  <StatusPill status="created" label="Not on-chain yet" />
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="rounded-md bg-ink-100 px-2 py-1 font-semibold text-ink-600">
                  {p.role ? `You: ${ROLE_LABELS[p.role]}` : 'Draft'}
                </span>
                <span className="font-semibold text-brand-600 opacity-0 transition group-hover:opacity-100">
                  Open →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

const FLOW = [
  { step: 'Create', text: 'The client describes the job, the team and how each milestone is split.' },
  { step: 'Agree', text: 'Every team member confirms the contract with their own wallet.' },
  { step: 'Fund', text: 'The client locks the milestone budget in escrow on Solana.' },
  { step: 'Split', text: 'On acceptance the program pays each member their share, instantly.' },
]

const PROMISES = [
  {
    title: 'Money locked up front',
    text: 'The budget sits in a program-owned vault. Nobody can move it outside the agreed rules — not even Pacta.',
  },
  {
    title: 'Fair split, automatically',
    text: 'Shares are fixed before work starts. Acceptance and payout are one transaction, visible in the explorer.',
  },
  {
    title: 'A neutral arbiter',
    text: 'If client and team disagree, the arbiter picks one of five fixed outcomes. The program executes it.',
  },
]

function Landing() {
  return (
    <div className="pb-6">
      <section className="mx-auto grid max-w-5xl items-center gap-10 py-6 md:grid-cols-[1.2fr_1fr] md:py-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-600 shadow-xs ring-1 ring-ink-200">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
            Live on Solana devnet
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Take on a job together.{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              Get paid fairly, automatically.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-600">
            Pacta is escrow for freelance teams that just met. The client locks the budget up front, and every accepted
            milestone is split between the team exactly as agreed. No middleman, no chasing invoices.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <WalletMultiButton>Connect wallet to start</WalletMultiButton>
            <a href="#how-it-works" className="text-sm font-semibold text-ink-600 hover:text-ink-900">
              How it works ↓
            </a>
          </div>
        </div>
        <div className="relative mx-auto hidden w-full max-w-sm md:block">
          <div className="absolute inset-6 rounded-full bg-brand-400/25 blur-3xl" aria-hidden />
          <div className="card relative p-10">
            <img src="/brand/logo-stacked.png" alt="Pacta" className="mx-auto w-full max-w-[16rem]" />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500">How it works</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((f, i) => (
            <li key={f.step} className="card p-5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-md shadow-brand-600/30">
                {i + 1}
              </span>
              <h3 className="mt-4 font-bold">{f.step}</h3>
              <p className="mt-1 text-sm text-ink-600">{f.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-6 grid max-w-5xl gap-3 md:grid-cols-3">
        {PROMISES.map((p) => (
          <div key={p.title} className="rounded-2xl bg-ink-900 p-6 text-white shadow-xl shadow-ink-900/10">
            <h3 className="font-bold">{p.title}</h3>
            <p className="mt-2 text-sm text-ink-300">{p.text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
