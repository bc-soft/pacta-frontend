import { useState, type ReactNode } from 'react'
import { PublicKey } from '@solana/web3.js'
import { TxButton } from '../../../components/TxButton'
import { buildAcceptContract } from '../../../lib/solana/instructions'
import { useProgram } from '../../../lib/solana/program'
import { useSendAndSync } from '../../../lib/solana/tx'
import { PersonLabel } from '../../profile/PersonLabel'
import { useProfiles } from '../../profile/useProfiles'
import { MEMBER_ROLE_LABELS } from '../../../lib/roles'
import { ContractTerms } from '../ContractTerms'
import type { ProjectView } from '../useProject'

/** "What exactly are you signing?" for team members + who has signed so far. Shown while the project is pending. */
export function ContractSigning({ view }: { view: ProjectView }) {
  const program = useProgram()
  const sendAndSync = useSendAndSync()
  const project = view.state!.project
  const me = project.members.find((m) => m.wallet === view.wallet)
  const mustSign = view.role === 'member' && me && !me.accepted
  const [showTerms, setShowTerms] = useState(mustSign)
  const profiles = useProfiles([project.client, project.arbiter ?? '', ...project.members.map((m) => m.wallet)])
  const signed = project.members.filter((m) => m.accepted).length

  const terms = {
    client: project.client,
    arbiter: project.arbiter,
    members: project.members,
    milestones: view.state!.milestones.map((m) => ({
      title: view.milestoneTitle(m.index),
      amount: m.amount,
      acceptanceCriteria: view.milestoneMeta(m.index)?.acceptanceCriteria ?? '',
      allocations: m.allocations,
    })),
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Contract signatures</h2>
        <span className="text-sm text-ink-600">
          {signed + 1} of {project.members.length + 1} signed
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-600">Work can start once everyone in the team has confirmed the contract.</p>

      <ul className="mt-4 space-y-2">
        <SignatureRow done label={<PersonLabel wallet={project.client} profile={profiles[project.client]} role="Client" />} />
        {project.members.map((m) => (
          <SignatureRow
            key={m.wallet}
            done={m.accepted}
            label={<PersonLabel wallet={m.wallet} profile={profiles[m.wallet]} role={MEMBER_ROLE_LABELS[m.role]} />}
          />
        ))}
      </ul>

      {mustSign && (
        <div className="mt-5 space-y-3 border-t border-amber-200 pt-5">
          <p className="text-sm font-medium">You&apos;ve been added to this project as {MEMBER_ROLE_LABELS[me.role].toLowerCase()}.</p>
          <TxButton
            label="I agree — confirm the contract"
            successText="Contract confirmed on-chain"
            disabled={!program}
            run={(onPhase) =>
              sendAndSync(
                () => buildAcceptContract(program!, new PublicKey(view.pda), new PublicKey(view.wallet!)),
                new PublicKey(view.pda),
                onPhase,
              )
            }
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowTerms((v) => !v)}
        className="mt-5 text-sm font-medium text-brand-600 hover:text-brand-800"
      >
        {showTerms ? 'Hide' : 'Show'} what exactly you are signing
      </button>
      {showTerms && (
        <div className="mt-4">
          <ContractTerms terms={terms} profiles={profiles} />
        </div>
      )}
    </section>
  )
}

function SignatureRow({ done, label }: { done: boolean; label: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
      {label}
      <span className={`text-sm font-medium ${done ? 'text-emerald-700' : 'text-ink-400'}`}>
        {done ? '✓ Signed' : 'Waiting'}
      </span>
    </li>
  )
}
