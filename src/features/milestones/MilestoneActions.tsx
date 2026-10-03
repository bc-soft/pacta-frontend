import type { ReactNode } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { TxButton } from '../../components/TxButton'
import type { ChainMilestone } from '../../lib/solana/accounts'
import { buildCancelMilestone } from '../../lib/solana/instructions'
import { useProgram } from '../../lib/solana/program'
import { useSendAndSync } from '../../lib/solana/tx'
import type { ProjectView } from '../projects/useProject'
import { FundMilestone } from './FundMilestone'

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
      return null

    default:
      return null
  }
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>
}
