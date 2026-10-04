import { BN } from '@coral-xyz/anchor'
import { ExplorerLink } from '../../../components/ExplorerLink'
import { formatUsdc } from '../../../lib/format'
import { teamPayoutBps } from '../../../lib/labels'
import { shareOf } from '../../../lib/solana/amounts'
import { vaultPda } from '../../../lib/solana/pda'
import type { ChainProjectState } from '../../../lib/solana/accounts'
import { PublicKey } from '@solana/web3.js'

export function EscrowCard({ state }: { state: ChainProjectState }) {
  const zero = new BN(0)
  const budget = state.milestones.reduce((sum, m) => sum.add(m.amount), zero)
  const paidOut = state.milestones.reduce((sum, m) => sum.add(shareOf(m.amount, teamPayoutBps(m))), zero)
  const locked = state.vaultBalance ?? zero

  return (
    <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
      <div className="sm:col-span-1">
        <p className="text-sm text-slate-500">Locked in escrow</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{formatUsdc(locked)}</p>
        <p className="mt-1 text-xs text-emerald-700">
          Secured on-chain ·{' '}
          <ExplorerLink address={vaultPda(new PublicKey(state.project.address)).toBase58()}>verify ↗</ExplorerLink>
        </p>
      </div>
      <div>
        <p className="text-sm text-slate-500">Paid out to the team</p>
        <p className="mt-1 text-xl font-semibold tabular-nums">{formatUsdc(paidOut)}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500">Total budget</p>
        <p className="mt-1 text-xl font-semibold tabular-nums">{formatUsdc(budget)}</p>
      </div>
    </section>
  )
}
