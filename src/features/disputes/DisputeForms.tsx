import { zodResolver } from '@hookform/resolvers/zod'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { Field, inputClass, secondaryButtonClass } from '../../components/form'
import { TxButton } from '../../components/TxButton'
import { api, ApiError } from '../../lib/api'
import type { ChainMilestone } from '../../lib/solana/accounts'
import { UserFacingError } from '../../lib/solana/errors'
import { buildOpenDispute } from '../../lib/solana/instructions'
import { useProgram } from '../../lib/solana/program'
import { useSendAndSync } from '../../lib/solana/tx'
import { useBackendAuth } from '../auth/useBackendAuth'
import type { ProjectView } from '../projects/useProject'
import { evidenceSchema, parseLinks, type EvidenceForm } from './evidence'

function EvidenceFields({ form }: { form: UseFormReturn<EvidenceForm> }) {
  const { errors } = form.formState
  return (
    <>
      <Field
        label="Your side of the story"
        hint="The arbiter compares the work with the “done when” criteria agreed before the start."
        error={errors.argument?.message}
      >
        <textarea {...form.register('argument')} rows={4} className={inputClass} aria-invalid={!!errors.argument} />
      </Field>
      <Field label="Supporting links (optional)" hint="One per line: screenshots, messages, files" error={errors.links?.message}>
        <textarea {...form.register('links')} rows={2} className={`${inputClass} font-mono`} aria-invalid={!!errors.links} />
      </Field>
    </>
  )
}

/** Client or team member: argument first (backend), then openDispute on-chain. */
export function OpenDisputeForm({ view, milestone }: { view: ProjectView; milestone: ChainMilestone }) {
  const { publicKey } = useWallet()
  const program = useProgram()
  const sendAndSync = useSendAndSync()
  const ensureBackendAuth = useBackendAuth()
  const form = useForm<EvidenceForm>({ resolver: zodResolver(evidenceSchema), defaultValues: { argument: '', links: '' } })
  const project = new PublicKey(view.pda)

  if (!view.state!.project.arbiter) {
    return <p className="text-sm text-slate-500">This project has no arbiter, so disputes can&apos;t be opened.</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        The money stays locked while the arbiter decides. Their decision is final: the team gets 100%, 75%, 50%, 25% or
        0% of this milestone, and the rest goes back to the client.
      </p>
      <EvidenceFields form={form} />
      <TxButton
        label="Open dispute"
        variant="danger"
        successText="Dispute opened — the arbiter has been asked to decide"
        disabled={!program}
        run={async (onPhase) => {
          if (!(await form.trigger())) throw new UserFacingError('Check the form above')
          const values = form.getValues()
          onPhase('signing')
          await ensureBackendAuth()
          await api.addDisputeEvidence(view.pda, milestone.index, { argument: values.argument, links: parseLinks(values.links) })
          return sendAndSync(() => buildOpenDispute(program!, publicKey!, { project, index: milestone.index }), project, onPhase)
        }}
      />
    </div>
  )
}

/** While a dispute is open, either side can add (more of) their argument. Backend only — no transaction. */
export function AddEvidenceForm({ view, milestone }: { view: ProjectView; milestone: ChainMilestone }) {
  const ensureBackendAuth = useBackendAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const form = useForm<EvidenceForm>({ resolver: zodResolver(evidenceSchema), defaultValues: { argument: '', links: '' } })

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus(null)
    try {
      await ensureBackendAuth()
      await api.addDisputeEvidence(view.pda, milestone.index, { argument: values.argument, links: parseLinks(values.links) })
      await queryClient.invalidateQueries({ queryKey: ['evidence', view.pda, milestone.index] })
      form.reset()
      setStatus({ ok: true, message: 'Added. The arbiter can see it now.' })
    } catch (error) {
      setStatus({ ok: false, message: error instanceof ApiError ? error.message : 'Could not save. Try again.' })
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <EvidenceFields form={form} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={form.formState.isSubmitting} className={secondaryButtonClass}>
          {form.formState.isSubmitting ? 'Saving…' : 'Add to the dispute'}
        </button>
        {status && <p className={`text-sm ${status.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{status.message}</p>}
      </div>
    </form>
  )
}
