import { zodResolver } from '@hookform/resolvers/zod'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { ExplorerLink } from '../../../components/ExplorerLink'
import { primaryButtonClass, secondaryButtonClass } from '../../../components/form'
import { bpsToPercent, evenSplitBps } from '../../../lib/solana/amounts'
import { clearDraft, emptyProjectForm, loadDraft, saveDraft } from './draft'
import { projectFormSchema, STEPS, type ProjectForm } from './schema'
import { ArbiterStep } from './steps/ArbiterStep'
import { ContractSummary } from './steps/ContractSummary'
import { DetailsStep } from './steps/DetailsStep'
import { MilestonesStep } from './steps/MilestonesStep'
import { TeamStep } from './steps/TeamStep'
import type { CreatedProject } from './useCreateProject'

export function CreateProjectScreen() {
  const { publicKey } = useWallet()

  if (!publicKey) {
    return (
      <section className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create a project</h1>
        <p className="mt-2 text-slate-600">Connect your wallet first — you&apos;ll be the client of this project.</p>
        <div className="mt-6 flex justify-center">
          <WalletMultiButton />
        </div>
      </section>
    )
  }

  // Remount on account switch: each wallet has its own draft
  return <CreateProjectWizard key={publicKey.toBase58()} client={publicKey.toBase58()} />
}

function CreateProjectWizard({ client }: { client: string }) {
  const [draft] = useState(() => loadDraft(client))
  const [stepIndex, setStepIndex] = useState(() => Math.min(draft?.step ?? 0, STEPS.length - 1))
  const [created, setCreated] = useState<CreatedProject | null>(null)
  const schema = useMemo(() => projectFormSchema(client), [client])

  const form = useForm<ProjectForm>({
    resolver: zodResolver(schema),
    defaultValues: draft?.values ?? emptyProjectForm(),
    mode: 'onTouched',
  })
  const { watch, getValues, setValue, trigger } = form

  useEffect(() => {
    saveDraft(client, { values: getValues(), step: stepIndex })
    const subscription = watch(() => saveDraft(client, { values: getValues(), step: stepIndex }))
    return () => subscription.unsubscribe()
  }, [client, watch, getValues, stepIndex])

  const step = STEPS[stepIndex]

  const goNext = async () => {
    if (!(await trigger([...step.fields]))) return
    if (step.id === 'team') {
      // Team changed → splits no longer line up with members; reset those milestones to an even split
      const memberCount = getValues('members').length
      getValues('milestones').forEach((milestone, i) => {
        if (milestone.split.length !== memberCount) {
          setValue(`milestones.${i}.split`, evenSplitBps(memberCount).map(bpsToPercent))
        }
      })
    }
    setStepIndex((i) => i + 1)
    window.scrollTo({ top: 0 })
  }

  const handleCreated = (project: CreatedProject) => {
    clearDraft(client)
    setCreated(project)
  }

  if (created) return <ProjectCreated project={created} title={getValues('title')} />

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Create a project</h1>
      <Stepper current={stepIndex} onSelect={setStepIndex} />

      <FormProvider {...form}>
        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault()
            if (step.id !== 'summary') void goNext()
          }}
          noValidate
        >
          {step.id === 'details' && <DetailsStep />}
          {step.id === 'team' && <TeamStep />}
          {step.id === 'milestones' && <MilestonesStep />}
          {step.id === 'arbiter' && <ArbiterStep />}
          {step.id === 'summary' && <ContractSummary onCreated={handleCreated} />}

          <div className="mt-8 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStepIndex((i) => i - 1)}
              className={`${secondaryButtonClass} ${stepIndex === 0 ? 'invisible' : ''}`}
            >
              Back
            </button>
            {step.id !== 'summary' && (
              <button type="submit" className={primaryButtonClass}>
                {STEPS[stepIndex + 1].id === 'summary' ? 'Review contract' : 'Next'}
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </section>
  )
}

function Stepper({ current, onSelect }: { current: number; onSelect: (index: number) => void }) {
  return (
    <ol className="mt-6 flex flex-wrap gap-2">
      {STEPS.map((s, i) => {
        const state = i === current ? 'current' : i < current ? 'done' : 'todo'
        return (
          <li key={s.id}>
            <button
              type="button"
              disabled={state === 'todo'}
              onClick={() => onSelect(i)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                state === 'current'
                  ? 'bg-indigo-600 text-white'
                  : state === 'done'
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i + 1}. {s.label}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function ProjectCreated({ project, title }: { project: CreatedProject; title: string }) {
  return (
    <section className="mx-auto max-w-xl py-12 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
        ✓
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Contract created on-chain</h1>
      <p className="mt-2 text-slate-600">
        “{title}” is now on Solana. Next, every team member opens the project with their wallet and confirms the
        contract. After the last confirmation you can fund the first milestone.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <ExplorerLink signature={project.signature} />
        <Link to={`/projects/${project.pda}`} className={primaryButtonClass}>
          Open the project
        </Link>
      </div>
    </section>
  )
}
