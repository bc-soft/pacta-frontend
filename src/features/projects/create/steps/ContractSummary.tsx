import { useWallet } from '@solana/wallet-adapter-react'
import { BN } from '@coral-xyz/anchor'
import { useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { TxButton } from '../../../../components/TxButton'
import { percentToBps, usdcToBaseUnits } from '../../../../lib/solana/amounts'
import { PersonLabel } from '../../../profile/PersonLabel'
import { ContractTerms, type ContractTermsData } from '../../ContractTerms'
import { useProfiles } from '../../../profile/useProfiles'
import { MEMBER_ROLE_LABELS } from '../../../../lib/roles'
import type { ProjectForm } from '../schema'
import { useCreateProject, type CreatedProject } from '../useCreateProject'

/** "What exactly are you signing?" — everything the contract will enforce, in plain words. */
export function ContractSummary({ onCreated }: { onCreated: (project: CreatedProject) => void }) {
  const { publicKey } = useWallet()
  const { getValues } = useFormContext<ProjectForm>()
  const form = getValues()
  const client = publicKey?.toBase58() ?? ''
  const profiles = useProfiles([client, ...form.members.map((m) => m.wallet), form.arbiter])
  const { create, missingConfig } = useCreateProject()

  const terms: ContractTermsData = {
    client,
    arbiter: form.arbiter || null,
    members: form.members,
    milestones: form.milestones.map((m) => ({
      title: m.title,
      amount: usdcToBaseUnits(m.amount) ?? new BN(0),
      acceptanceCriteria: m.acceptanceCriteria,
      allocations: form.members.map((member, j) => ({ wallet: member.wallet, bps: percentToBps(m.split[j]) ?? 0 })),
    })),
  }

  const created = useRef<CreatedProject | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">What exactly are you signing?</h2>
        <p className="mt-1 text-sm text-ink-600">
          Read this carefully. Once created, these rules are enforced by the contract on Solana — not by us.
        </p>
      </div>

      <section>
        <h3 className="text-lg font-semibold">{form.title}</h3>
        {form.description && <p className="mt-1 whitespace-pre-line text-sm text-ink-600">{form.description}</p>}
      </section>

      <ContractTerms terms={terms} profiles={profiles} />

      <section className="card p-5">
        <h3 className="font-semibold">Signatures</h3>
        <ul className="mt-3 space-y-2">
          <li className="flex items-center justify-between gap-3">
            <PersonLabel wallet={client} profile={profiles[client]} role="Client (you)" />
            <span className="text-sm text-ink-500">Signs now</span>
          </li>
          {form.members.map((member) => (
            <li key={member.wallet} className="flex items-center justify-between gap-3">
              <PersonLabel wallet={member.wallet} profile={profiles[member.wallet]} role={MEMBER_ROLE_LABELS[member.role]} />
              <span className="text-sm text-ink-500">Confirms after you</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-2 border-t border-ink-200 pt-6">
        {missingConfig && <p className="text-sm text-amber-800">{missingConfig}</p>}
        <TxButton
          label="Create contract on-chain"
          successText="Contract created on-chain"
          disabled={!!missingConfig}
          run={async (onPhase) => {
            created.current = await create(getValues(), onPhase)
            return created.current.signature
          }}
          onSuccess={() => created.current && onCreated(created.current)}
        />
        <p className="text-xs text-ink-500">
          Your wallet will ask you to approve the contract (and to sign in to Pacta, if you haven&apos;t yet). Creating it
          costs a small Solana network fee.
        </p>
      </div>
    </div>
  )
}
