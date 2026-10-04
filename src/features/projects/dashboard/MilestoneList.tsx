import type { ReactNode } from 'react'
import { StatusPill } from '../../../components/StatusPill'
import { formatUsdc } from '../../../lib/format'
import { MILESTONE_STATUS_LABELS } from '../../../lib/labels'
import type { ChainMilestone } from '../../../lib/solana/accounts'
import { shareOf } from '../../../lib/solana/amounts'
import { PersonLabel } from '../../profile/PersonLabel'
import { useProfiles } from '../../profile/useProfiles'
import type { ProjectView } from '../useProject'

export function MilestoneList({
  view,
  renderActions,
}: {
  view: ProjectView
  /** Role- and status-dependent actions for one milestone */
  renderActions?: (milestone: ChainMilestone) => ReactNode
}) {
  const state = view.state!
  const profiles = useProfiles(state.project.members.map((m) => m.wallet))

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Milestones</h2>
      {state.milestones.map((milestone) => {
        const meta = view.milestoneMeta(milestone.index)
        return (
          <article key={milestone.index} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">
                {milestone.index + 1}. {view.milestoneTitle(milestone.index)}
              </h3>
              <div className="flex items-center gap-3">
                <StatusPill status={milestone.status} label={MILESTONE_STATUS_LABELS[milestone.status]} />
                <span className="font-semibold tabular-nums">{formatUsdc(milestone.amount)}</span>
              </div>
            </div>

            {meta?.acceptanceCriteria && (
              <p className="mt-2 text-sm text-ink-600">
                <span className="font-medium text-ink-800">Done when: </span>
                {meta.acceptanceCriteria}
              </p>
            )}

            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {milestone.allocations.map((a) => (
                <li key={a.wallet} className="flex items-center gap-2">
                  <PersonLabel
                    wallet={a.wallet}
                    profile={profiles[a.wallet]}
                    role={`${formatUsdc(shareOf(milestone.amount, a.bps))} · ${a.bps / 100}%`}
                  />
                </li>
              ))}
            </ul>

            {meta?.deliverables && meta.deliverables.length > 0 && (
              <div className="mt-4 rounded-xl bg-ink-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Delivered work</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {meta.deliverables.map((d) => (
                    <li key={d.id}>
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-brand-600 underline">
                        {d.url}
                      </a>
                      {d.note && <span className="text-ink-500"> — {d.note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {meta?.comments && meta.comments.length > 0 && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Requested changes</p>
                <ul className="mt-1 space-y-1">
                  {meta.comments.map((c) => (
                    <li key={c.id} className="whitespace-pre-line text-ink-700">
                      {c.comment}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {renderActions && <div className="mt-4 empty:hidden">{renderActions(milestone)}</div>}
          </article>
        )
      })}
    </section>
  )
}
