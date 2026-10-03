import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { StatusPill } from '../../components/StatusPill'
import { TxButton } from '../../components/TxButton'
import type { DisputeEvidence } from '../../lib/api'
import { formatUsdc } from '../../lib/format'
import { MILESTONE_STATUS_LABELS, RESOLUTION_LABELS, RESOLUTION_TEAM_BPS } from '../../lib/labels'
import type { Resolution } from '../../lib/solana/accounts'
import { shareOf } from '../../lib/solana/amounts'
import { buildResolveDispute } from '../../lib/solana/instructions'
import { useProgram } from '../../lib/solana/program'
import { useSendAndSync } from '../../lib/solana/tx'
import { PersonLabel } from '../profile/PersonLabel'
import { useProfiles } from '../profile/useProfiles'
import { RoleBadge } from '../projects/dashboard/ProjectHeader'
import { useProjectView } from '../projects/useProject'

const RESOLUTIONS = Object.keys(RESOLUTION_TEAM_BPS) as Resolution[]
const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

/** Arbiter: both sides' arguments, the criteria agreed before the start, and one of five allowed decisions. */
export function ArbiterScreen() {
  const { pda = '', index = '0' } = useParams()
  const view = useProjectView(pda)
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const program = useProgram()
  const sendAndSync = useSendAndSync()
  const navigate = useNavigate()
  const [resolution, setResolution] = useState<Resolution | null>(null)

  const state = view.state
  const milestone = state?.milestones.find((m) => m.index === Number(index))
  const meta = view.milestoneMeta(Number(index))
  const profiles = useProfiles(state ? [state.project.client, ...state.project.members.map((m) => m.wallet)] : [])

  if (view.chain.isPending) return <p className="text-slate-500">Loading dispute from Solana…</p>
  if (!state || !milestone) return <p className="text-slate-600">Milestone not found.</p>

  const project = state.project
  const evidence = meta?.dispute?.evidence ?? []
  const clientSide = evidence.filter((e) => e.wallet === project.client)
  const teamSide = evidence.filter((e) => e.wallet !== project.client)
  const canDecide = view.role === 'arbiter' && milestone.status === 'disputed'
  const projectKey = new PublicKey(pda)

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to={`/projects/${pda}`} className="text-sm font-medium text-indigo-600">
            ← {view.title}
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Dispute: {view.milestoneTitle(milestone.index)}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <StatusPill status={milestone.status} label={MILESTONE_STATUS_LABELS[milestone.status]} />
            <span className="font-semibold tabular-nums">{formatUsdc(milestone.amount)} locked</span>
          </div>
        </div>
        <RoleBadge view={view} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Agreed before work started: done when…</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
          {meta?.acceptanceCriteria || 'No acceptance criteria were recorded.'}
        </p>
        {meta?.deliverables && meta.deliverables.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold">What the team delivered</h3>
            <ul className="mt-1 space-y-1 text-sm">
              {meta.deliverables.map((d, i) => (
                <li key={i}>
                  <a href={d.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                    {d.url}
                  </a>
                  {d.note && <span className="text-slate-500"> — {d.note}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
        {meta?.comments && meta.comments.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold">Changes the client asked for</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {meta.comments.map((c, i) => (
                <li key={i}>{c.comment}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <EvidenceColumn title="Client says" items={clientSide} profiles={profiles} />
        <EvidenceColumn title="Team says" items={teamSide} profiles={profiles} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Decision</h2>
        <p className="mt-1 text-sm text-slate-600">
          {canDecide
            ? 'Pick one. The contract pays out immediately and the decision is final.'
            : view.role === 'arbiter'
              ? 'This milestone is not in dispute.'
              : 'Only the arbiter can decide. These are the possible outcomes.'}
        </p>
        <fieldset className="mt-4 space-y-2" disabled={!canDecide}>
          {RESOLUTIONS.map((r) => {
            const team = shareOf(milestone.amount, RESOLUTION_TEAM_BPS[r])
            const refund = milestone.amount.sub(team)
            return (
              <label
                key={r}
                className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 ${
                  resolution === r ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                } ${canDecide ? '' : 'cursor-default opacity-70'}`}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name="resolution" value={r} checked={resolution === r} onChange={() => setResolution(r)} />
                  <span className="font-medium">{RESOLUTION_LABELS[r]}</span>
                </span>
                <span className="text-right text-sm tabular-nums text-slate-600">
                  Team {formatUsdc(team)} · Client {formatUsdc(refund)}
                </span>
              </label>
            )
          })}
        </fieldset>
        {canDecide && (
          <div className="mt-5">
            <TxButton
              label="Confirm decision"
              successText="Decision executed on-chain"
              disabled={!program || !resolution}
              run={(onPhase) =>
                sendAndSync(
                  () =>
                    buildResolveDispute(program!, connection, publicKey!, project.mint, {
                      project: projectKey,
                      index: milestone.index,
                      allocations: milestone.allocations.map((a) => new PublicKey(a.wallet)),
                      client: new PublicKey(project.client),
                      resolution: resolution!,
                    }),
                  projectKey,
                  onPhase,
                )
              }
              onSuccess={(signature) => navigate(`/projects/${pda}/milestones/${milestone.index}/payment?tx=${signature}`)}
            />
          </div>
        )}
      </section>
    </section>
  )
}

function EvidenceColumn({
  title,
  items,
  profiles,
}: {
  title: string
  items: DisputeEvidence[]
  profiles: ReturnType<typeof useProfiles>
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nothing submitted yet.</p>
      ) : (
        <ul className="mt-3 space-y-4">
          {items.map((e, i) => (
            <li key={i} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <PersonLabel wallet={e.wallet} profile={profiles[e.wallet]} />
                <span className="text-xs text-slate-400">{dateFormat.format(new Date(e.at))}</span>
              </div>
              <p className="whitespace-pre-line text-sm text-slate-700">{e.argument}</p>
              {e.links.length > 0 && (
                <ul className="space-y-0.5 text-sm">
                  {e.links.map((l) => (
                    <li key={l}>
                      <a href={l} target="_blank" rel="noreferrer" className="break-all text-indigo-600 underline">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
