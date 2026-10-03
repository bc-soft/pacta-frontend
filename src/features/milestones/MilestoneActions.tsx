import type { ReactNode } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { TxButton } from '../../components/TxButton'
import type { ChainMilestone } from '../../lib/solana/accounts'
import { buildCancelMilestone } from '../../lib/solana/instructions'
import { useProgram } from '../../lib/solana/program'
import { useSendAndSync } from '../../lib/solana/tx'
import type { ProjectView } from '../projects/useProject'
import { Link } from 'react-router'
import { AddEvidenceForm, OpenDisputeForm } from '../disputes/DisputeForms'
import { ClientReview } from './ClientReview'
import { FundMilestone } from './FundMilestone'
import { SubmitMilestone } from './SubmitMilestone'

/** What the connected wallet can do with this milestone right now — role × status. */
export function MilestoneActions({ view, milestone }: { view: ProjectView; milestone: ChainMilestone }) {
  const { publicKey } = useWallet()
  const program = useProgram()
  const sendAndSync = useSendAndSync()
  const { role } = view
  const project = view.state!.project
  const projectKey = new PublicKey(view.pda)

  if (project.status === 'pending') {
    return role === 'client' && milestone.status === 'created' ? (
      <Hint>You can fund this milestone once every team member has confirmed the contract.</Hint>
    ) : null
  }

  switch (milestone.status) {
    case 'created':
      if (role === 'client') return <FundMilestone view={view} milestone={milestone} />
      return <Hint>Waiting for the client to fund this milestone.</Hint>

    case 'funded':
      if (role === 'client') {
        return (
          <div className="flex flex-wrap items-start gap-4">
            <Hint>Funded. The team is working on it.</Hint>
            <TxButton
              label="Cancel & refund"
              variant="secondary"
              successText="Milestone cancelled, funds returned"
              disabled={!program}
              run={(onPhase) =>
                sendAndSync(
                  () => buildCancelMilestone(program!, publicKey!, project.mint, { project: projectKey, index: milestone.index }),
                  projectKey,
                  onPhase,
                )
              }
            />
          </div>
        )
      }
      if (role === 'member') return <SubmitMilestone view={view} milestone={milestone} />
      return null

    case 'changesRequested':
      if (role === 'member') {
        return (
          <div className="space-y-3">
            <SubmitMilestone view={view} milestone={milestone} />
            <TeamDispute view={view} milestone={milestone} />
          </div>
        )
      }
      return <Hint>Waiting for the team to submit the updated work.</Hint>

    case 'submitted':
      if (role === 'client') return <ClientReview view={view} milestone={milestone} />
      if (role === 'member') {
        return (
          <div className="space-y-3">
            <Hint>Submitted. Waiting for the client&apos;s review.</Hint>
            <TeamDispute view={view} milestone={milestone} />
          </div>
        )
      }
      return <Hint>Submitted. Waiting for the client&apos;s review.</Hint>

    case 'disputed':
      return (
        <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50/60 p-4">
          <p className="text-sm font-medium text-rose-900">
            In dispute — the arbiter decides how this milestone&apos;s money is split.
          </p>
          <Link
            to={`/projects/${view.pda}/milestones/${milestone.index}/dispute`}
            className="inline-block text-sm font-semibold text-rose-800 underline"
          >
            {role === 'arbiter' ? 'Review both sides and decide →' : 'See the dispute →'}
          </Link>
          {(role === 'client' || role === 'member') && (
            <details>
              <summary className="cursor-pointer text-sm font-medium text-slate-700">Add to your side of the story</summary>
              <div className="mt-3">
                <AddEvidenceForm view={view} milestone={milestone} />
              </div>
            </details>
          )}
        </div>
      )

    case 'accepted':
    case 'resolved':
      return (
        <Link
          to={`/projects/${view.pda}/milestones/${milestone.index}/payment`}
          className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
        >
          See the payout →
        </Link>
      )

    default:
      return null
  }
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>
}

/** The team can escalate too (e.g. the client keeps asking for changes outside the agreed criteria). */
function TeamDispute({ view, milestone }: { view: ProjectView; milestone: ChainMilestone }) {
  if (!view.state!.project.arbiter) return null
  return (
    <details className="rounded-lg border border-slate-200 p-3">
      <summary className="cursor-pointer text-sm font-medium text-slate-700">Disagree? Ask the arbiter to decide</summary>
      <div className="mt-3">
        <OpenDisputeForm view={view} milestone={milestone} />
      </div>
    </details>
  )
}
