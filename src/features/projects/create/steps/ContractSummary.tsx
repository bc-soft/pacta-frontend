import { useWallet } from '@solana/wallet-adapter-react'
import { BN } from '@coral-xyz/anchor'
import { useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { ShortAddress } from '../../../../components/ShortAddress'
import { TxButton } from '../../../../components/TxButton'
import { formatUsdc } from '../../../../lib/format'
import { percentToBps, shareOf, usdcToBaseUnits } from '../../../../lib/solana/amounts'
import { PersonLabel } from '../../../profile/PersonLabel'
import { useProfiles } from '../../../profile/useProfiles'
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

  const amounts = form.milestones.map((m) => usdcToBaseUnits(m.amount) ?? new BN(0))
  const total = amounts.reduce((sum, a) => sum.add(a), new BN(0))

  const created = useRef<CreatedProject | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">What exactly are you signing?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Read this carefully. Once created, these rules are enforced by the contract on Solana — not by us.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold">{form.title}</h3>
        {form.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{form.description}</p>}
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Client</dt>
            <dd className="mt-1">
              <PersonLabel wallet={client} profile={profiles[client]} role="You" />
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Arbiter</dt>
            <dd className="mt-1">
              {form.arbiter ? (
                <PersonLabel wallet={form.arbiter} profile={profiles[form.arbiter]} />
              ) : (
                <span className="text-slate-600">None — disputes are not possible</span>
              )}
            </dd>
          </div>
        </dl>
        <div className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm">
          Total budget: <strong className="tabular-nums">{formatUsdc(total)}</strong> in {form.milestones.length}{' '}
          {form.milestones.length === 1 ? 'milestone' : 'milestones'}. You lock the money one milestone at a time.
        </div>
      </section>

      <section className="space-y-3">
        {form.milestones.map((milestone, i) => (
          <article key={i} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-baseline justify-between gap-4">
              <h4 className="font-semibold">
                {i + 1}. {milestone.title}
              </h4>
              <span className="font-semibold tabular-nums">{formatUsdc(amounts[i])}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium text-slate-800">Done when: </span>
              {milestone.acceptanceCriteria}
            </p>
            <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
              {form.members.map((member, j) => {
                const bps = percentToBps(milestone.split[j]) ?? 0
                return (
                  <li key={member.wallet} className="flex items-center justify-between gap-3 px-3 py-2">
                    <PersonLabel wallet={member.wallet} profile={profiles[member.wallet]} role={member.role} />
                    <span className="text-right text-sm tabular-nums">
                      <span className="font-medium">{formatUsdc(shareOf(amounts[i], bps))}</span>
                      <span className="ml-2 text-slate-500">{bps / 100}%</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold">How it works</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Work starts once every team member has confirmed this contract with their own wallet.</li>
          <li>
            You fund each milestone before work on it begins. The money is then locked on Solana — nobody, including
            Pacta, can move it except by these rules.
          </li>
          <li>When the team delivers, you review the work against the “done when” criteria.</li>
          <li>
            <strong>Accept</strong> — the milestone amount is paid out to the team immediately, split exactly as above.
          </li>
          <li>
            <strong>Request changes</strong> — the team fixes the work and submits it again. The money stays locked.
          </li>
          {form.arbiter ? (
            <li>
              <strong>Dispute</strong> — if you can&apos;t agree, either side can ask the arbiter (
              <ShortAddress address={form.arbiter} />) to decide. The arbiter can only choose one of: team gets 100%,
              75%, 50%, 25% or 0% of the milestone; the rest goes back to you.
            </li>
          ) : (
            <li>
              <strong>No arbiter</strong> — disputes can&apos;t be opened in this project.
            </li>
          )}
          <li>A funded milestone that the team hasn&apos;t started yet can be cancelled and refunded to you.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold">Signatures</h3>
        <ul className="mt-3 space-y-2">
          <li className="flex items-center justify-between gap-3">
            <PersonLabel wallet={client} profile={profiles[client]} role="Client (you)" />
            <span className="text-sm text-slate-500">Signs now</span>
          </li>
          {form.members.map((member) => (
            <li key={member.wallet} className="flex items-center justify-between gap-3">
              <PersonLabel wallet={member.wallet} profile={profiles[member.wallet]} role={member.role} />
              <span className="text-sm text-slate-500">Confirms after you</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-2 border-t border-slate-200 pt-6">
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
        <p className="text-xs text-slate-500">
          Your wallet will ask you to approve the contract (and to sign in to Pacta, if you haven&apos;t yet). Creating it
          costs a small Solana network fee.
        </p>
      </div>
    </div>
  )
}
