import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export function HomeScreen() {
  const { publicKey } = useWallet()
  const wallet = publicKey?.toBase58()

  const projects = useQuery({
    queryKey: ['projects', wallet],
    queryFn: () => api.projects(wallet!),
    enabled: !!wallet,
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

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Your projects</h1>
      {projects.isPending && <p className="mt-4 text-slate-500">Loading…</p>}
      {projects.isError && <p className="mt-4 text-rose-700">{projects.error.message}</p>}
      {projects.data?.length === 0 && (
        <p className="mt-4 text-slate-500">No projects yet. Create one as a client or ask a client to add you.</p>
      )}
      <ul className="mt-4 grid gap-3">
        {projects.data?.map((p) => (
          <li key={p.pda} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-semibold">{p.title}</p>
            <p className="text-sm text-slate-600">{p.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
