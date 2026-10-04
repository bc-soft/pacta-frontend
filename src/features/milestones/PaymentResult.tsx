import { BN } from '@coral-xyz/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router'
import { ExplorerLink } from '../../components/ExplorerLink'
import { formatUsdc, shortAddress } from '../../lib/format'
import { RESOLUTION_LABELS, teamPayoutBps } from '../../lib/labels'
import { MEMBER_ROLE_LABELS } from '../../lib/roles'
import { shareOf } from '../../lib/solana/amounts'
import { Avatar } from '../profile/Avatar'
import { useProfiles } from '../profile/useProfiles'
import { RoleBadge } from '../projects/dashboard/ProjectHeader'
import { useProjectView } from '../projects/useProject'

/** The demo's climax: "1,000 USDC distributed", who got what, and one Explorer link showing every transfer. */
export function PaymentResult() {
  const { pda = '', index = '0' } = useParams()
  const [search] = useSearchParams()
  const view = useProjectView(pda)
  const { connection } = useConnection()
  const milestone = view.state?.milestones.find((m) => m.index === Number(index))
  // Paid by the client's acceptance or the arbiter; cancelled with a resolution = arbiter refunded the client in full
  const paid = milestone?.status === 'paid' || (milestone?.status === 'cancelled' && !!milestone.resolution)

  // Opened later (no ?tx=): the payout is the last transaction that touched the milestone account
  const lastTx = useQuery({
    queryKey: ['payoutTx', milestone?.address],
    queryFn: async () =>
      (await connection.getSignaturesForAddress(new PublicKey(milestone!.address), { limit: 1 }, 'confirmed'))[0]?.signature ?? null,
    enabled: !search.get('tx') && !!milestone && paid,
  })
  const signature = search.get('tx') ?? lastTx.data ?? null
  const profiles = useProfiles([...(view.state?.project.members.map((m) => m.wallet) ?? []), view.state?.project.client ?? ''])

  if (view.chain.isPending) return <p className="text-slate-500">Loading payment from Solana…</p>
  if (!view.state || !milestone) return <p className="text-slate-600">Milestone not found.</p>

  const teamBps = paid ? teamPayoutBps(milestone) : 10_000
  const teamTotal = shareOf(milestone.amount, teamBps)
  const refund = milestone.amount.sub(teamTotal)
  const roleOf = (wallet: string) => {
    const role = view.state!.project.members.find((m) => m.wallet === wallet)?.role
    return role ? MEMBER_ROLE_LABELS[role] : undefined
  }

  const rows = milestone.allocations.map((a) => ({
    wallet: a.wallet,
    role: roleOf(a.wallet),
    bps: a.bps,
    amount: shareOf(teamTotal, a.bps),
  }))

  return (
    <section className="mx-auto max-w-2xl">
      <div className="flex justify-end">
        <RoleBadge view={view} />
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white">
          ✓
        </div>
        <p className="mt-4 text-sm font-medium uppercase tracking-wide text-emerald-700">
          {view.milestoneTitle(milestone.index)} · {view.title}
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
          {formatUsdc(teamTotal)} {paid ? 'distributed' : 'to distribute'}
        </h1>
        <p className="mt-2 text-slate-600">
          {milestone.resolution
            ? `Decided by the arbiter: ${RESOLUTION_LABELS[milestone.resolution]}.`
            : 'Split automatically by the contract, exactly as agreed before work started.'}
        </p>

        <ul className="mt-8 space-y-3 text-left">
          {rows.map((row) => (
            <li key={row.wallet} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <Avatar wallet={row.wallet} profile={profiles[row.wallet]} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{profiles[row.wallet]?.displayName ?? shortAddress(row.wallet)}</p>
                  <p className="text-xs text-slate-500">{row.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold tabular-nums">{formatUsdc(row.amount)}</p>
                  <p className="text-xs text-slate-500">{row.bps / 100}%</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.bps / 100}%` }} />
              </div>
            </li>
          ))}
          {refund.gt(new BN(0)) && (
            <li className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <Avatar wallet={view.state.project.client} profile={profiles[view.state.project.client]} />
                <div className="flex-1">
                  <p className="font-medium">Refund to client</p>
                </div>
                <p className="text-xl font-bold tabular-nums">{formatUsdc(refund)}</p>
              </div>
            </li>
          )}
        </ul>

        <div className="mt-8 flex flex-col items-center gap-3">
          {signature ? (
            <ExplorerLink
              signature={signature}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
            >
              See all {rows.length + (refund.gt(new BN(0)) ? 1 : 0)} transfers in one transaction ↗
            </ExplorerLink>
          ) : (
            <ExplorerLink address={pda}>View the contract on Solana Explorer ↗</ExplorerLink>
          )}
          <Link to={`/projects/${pda}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            ← Back to the project
          </Link>
        </div>
      </div>
    </section>
  )
}
