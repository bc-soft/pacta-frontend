import { BN } from '@coral-xyz/anchor'
import { ShortAddress } from '../../components/ShortAddress'
import type { Profile } from '../../lib/api'
import { formatUsdc } from '../../lib/format'
import { MEMBER_ROLE_LABELS, type MemberRole } from '../../lib/roles'
import { shareOf } from '../../lib/solana/amounts'
import { PersonLabel } from '../profile/PersonLabel'

export interface ContractTermsData {
  client: string
  arbiter: string | null
  members: { wallet: string; role: MemberRole }[]
  milestones: {
    title: string
    amount: BN
    acceptanceCriteria: string
    allocations: { wallet: string; bps: number }[]
  }[]
}

/** Everything the contract enforces, in plain words — shared by the wizard summary and the signing screen. */
export function ContractTerms({ terms, profiles }: { terms: ContractTermsData; profiles: Record<string, Profile | undefined> }) {
  const total = terms.milestones.reduce((sum, m) => sum.add(m.amount), new BN(0))
  const roleOf = (wallet: string) => {
    const role = terms.members.find((m) => m.wallet === wallet)?.role
    return role ? MEMBER_ROLE_LABELS[role] : undefined
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-500">Client</dt>
            <dd className="mt-1">
              <PersonLabel wallet={terms.client} profile={profiles[terms.client]} />
            </dd>
          </div>
          <div>
            <dt className="text-ink-500">Arbiter</dt>
            <dd className="mt-1">
              {terms.arbiter ? (
                <PersonLabel wallet={terms.arbiter} profile={profiles[terms.arbiter]} />
              ) : (
                <span className="text-ink-600">Not set</span>
              )}
            </dd>
          </div>
        </dl>
        <div className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm">
          Total budget: <strong className="tabular-nums">{formatUsdc(total)}</strong> in {terms.milestones.length}{' '}
          {terms.milestones.length === 1 ? 'milestone' : 'milestones'}. The client locks the money one milestone at a
          time.
        </div>
      </section>

      <section className="space-y-3">
        {terms.milestones.map((milestone, i) => (
          <article key={i} className="card p-5">
            <div className="flex items-baseline justify-between gap-4">
              <h4 className="font-semibold">
                {i + 1}. {milestone.title}
              </h4>
              <span className="font-semibold tabular-nums">{formatUsdc(milestone.amount)}</span>
            </div>
            {milestone.acceptanceCriteria && (
              <p className="mt-2 text-sm text-ink-600">
                <span className="font-medium text-ink-800">Done when: </span>
                {milestone.acceptanceCriteria}
              </p>
            )}
            <ul className="mt-3 divide-y divide-ink-100 rounded-xl border border-ink-100">
              {milestone.allocations.map((a) => (
                <li key={a.wallet} className="flex items-center justify-between gap-3 px-3 py-2">
                  <PersonLabel wallet={a.wallet} profile={profiles[a.wallet]} role={roleOf(a.wallet)} />
                  <span className="text-right text-sm tabular-nums">
                    <span className="font-medium">{formatUsdc(shareOf(milestone.amount, a.bps))}</span>
                    <span className="ml-2 text-ink-500">{a.bps / 100}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="card p-5">
        <h3 className="font-semibold">How it works</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-700">
          <li>Work starts once every team member has confirmed this contract with their own wallet.</li>
          <li>
            The client funds each milestone before work on it begins. The money is then locked on Solana — nobody,
            including Pacta, can move it except by these rules.
          </li>
          <li>When the team delivers, the client reviews the work against the “done when” criteria.</li>
          <li>
            <strong>Accept</strong> — the milestone amount is paid out to the team immediately, split exactly as above.
          </li>
          <li>
            <strong>Request changes</strong> — the team fixes the work and submits it again. The money stays locked.
          </li>
          {terms.arbiter ? (
            <li>
              <strong>Dispute</strong> — if the client and the team can&apos;t agree, either side can ask the arbiter (
              <ShortAddress address={terms.arbiter} />) to decide. The arbiter can only choose one of: team gets 100%,
              75%, 50%, 25% or 0% of the milestone; the rest goes back to the client.
            </li>
          ) : (
            <li>
              <strong>No arbiter</strong> — disputes can&apos;t be opened in this project.
            </li>
          )}
          <li>A funded milestone the team hasn&apos;t started yet can be cancelled and refunded to the client.</li>
        </ul>
      </section>
    </div>
  )
}
