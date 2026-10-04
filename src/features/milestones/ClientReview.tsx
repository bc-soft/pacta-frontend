import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useState } from 'react'
import { inputClass } from '../../components/form'
import { api } from '../../lib/api'
import { UserFacingError } from '../../lib/solana/errors'
import { useBackendAuth } from '../auth/useBackendAuth'
import { OpenDisputeForm } from '../disputes/DisputeForms'
import { useNavigate } from 'react-router'
import { TxButton } from '../../components/TxButton'
import { formatUsdc } from '../../lib/format'
import type { ChainMilestone } from '../../lib/solana/accounts'
import { buildAcceptMilestone, buildRequestChanges } from '../../lib/solana/instructions'
import { useProgram } from '../../lib/solana/program'
import { useSendAndSync } from '../../lib/solana/tx'
import type { ProjectView } from '../projects/useProject'

type Mode = 'accept' | 'changes' | 'dispute'

/** Client: Accept / Request changes / Dispute for a submitted milestone. */
export function ClientReview({ view, milestone }: { view: ProjectView; milestone: ChainMilestone }) {
  const [mode, setMode] = useState<Mode>('accept')
  const tabs: { id: Mode; label: string }[] = [
    { id: 'accept', label: 'Accept & pay' },
    { id: 'changes', label: 'Request changes' },
    ...(view.state!.project.arbiter ? [{ id: 'dispute' as const, label: 'Dispute' }] : []),
  ]

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
      <p className="text-sm font-medium">The team has submitted this milestone. Does the work meet the “done when” criteria?</p>
      <div className="mt-3 flex flex-wrap gap-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => setMode(tab.id)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              mode === tab.id ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 hover:bg-ink-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {mode === 'accept' && <AcceptPanel view={view} milestone={milestone} />}
        {mode === 'changes' && <RequestChangesPanel view={view} milestone={milestone} />}
        {mode === 'dispute' && <OpenDisputeForm view={view} milestone={milestone} />}
      </div>
    </div>
  )
}

function AcceptPanel({ view, milestone }: { view: ProjectView; milestone: ChainMilestone }) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const program = useProgram()
  const sendAndSync = useSendAndSync()
  const navigate = useNavigate()
  const project = new PublicKey(view.pda)

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-600">
        {formatUsdc(milestone.amount)} will be sent from escrow to the team right away, split as shown above. This
        can&apos;t be undone.
      </p>
      <TxButton
        label={`Accept & pay ${formatUsdc(milestone.amount)}`}
        successText="Paid out"
        disabled={!program}
        run={(onPhase) =>
          sendAndSync(
            () =>
              buildAcceptMilestone(program!, connection, publicKey!, view.state!.project.mint, {
                project,
                index: milestone.index,
                allocations: milestone.allocations.map((a) => new PublicKey(a.wallet)),
              }),
            project,
            onPhase,
          )
        }
        onSuccess={(signature) => navigate(`/projects/${view.pda}/milestones/${milestone.index}/payment?tx=${signature}`)}
      />
    </div>
  )
}

function RequestChangesPanel({ view, milestone }: { view: ProjectView; milestone: ChainMilestone }) {
  const { publicKey } = useWallet()
  const program = useProgram()
  const sendAndSync = useSendAndSync()
  const ensureBackendAuth = useBackendAuth()
  const [comment, setComment] = useState('')
  const [commentLost, setCommentLost] = useState(false)
  const project = new PublicKey(view.pda)

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium">What needs to change?</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className={`${inputClass} mt-1.5`}
          placeholder="Be specific — refer to the “done when” criteria."
        />
      </label>
      <p className="text-xs text-ink-500">The money stays locked in escrow. The team will submit the work again.</p>
      <TxButton
        label="Request changes"
        variant="secondary"
        successText="Changes requested"
        disabled={!program}
        run={async (onPhase) => {
          if (comment.trim().length < 5) throw new UserFacingError('Tell the team what needs to change')
          const signature = await sendAndSync(
            () => buildRequestChanges(program!, publicKey!, { project, index: milestone.index }),
            project,
            onPhase,
          )
          // The status change is on-chain already; the comment is best effort
          await ensureBackendAuth()
            .then(() => api.addMilestoneComment(view.pda, milestone.index, comment.trim()))
            .catch(() => setCommentLost(true))
          return signature
        }}
      />
      {commentLost && (
        <p className="text-sm text-amber-800">Your comment couldn&apos;t be saved — please send it to the team directly.</p>
      )}
    </div>
  )
}
