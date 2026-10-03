import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { MilestoneActions } from '../../milestones/MilestoneActions'
import { parseAddress, useProjectView } from '../useProject'
import { ActivityTimeline } from './ActivityTimeline'
import { ContractSigning } from './ContractSigning'
import { EscrowCard } from './EscrowCard'
import { MilestoneList } from './MilestoneList'
import { ProjectHeader } from './ProjectHeader'

export function ProjectScreen() {
  const { pda = '' } = useParams()
  const view = useProjectView(pda)

  if (!parseAddress(pda)) return <Message title="This link is broken">The project address is not valid.</Message>
  if (!view.programReady) {
    return (
      <Message title="Not configured">
        The Pacta program isn&apos;t configured in this app yet. Check the <Link to="/health">status page</Link>.
      </Message>
    )
  }
  if (view.chain.isPending) return <p className="text-slate-500">Loading project from Solana…</p>
  if (view.chain.isError) return <Message title="Couldn't load the project">{view.chain.error.message}</Message>
  if (!view.state) {
    return (
      <Message title="Project not found on-chain">
        If it was just created, wait a few seconds and refresh.
      </Message>
    )
  }

  const pending = view.state.project.status === 'pending'

  return (
    <div className="space-y-6">
      <ProjectHeader view={view} />
      {pending && <ContractSigning view={view} />}
      <EscrowCard state={view.state} />
      <MilestoneList view={view} renderActions={(m) => <MilestoneActions view={view} milestone={m} />} />
      <ActivityTimeline pda={pda} />
    </div>
  )
}

function Message({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-600">{children}</p>
      <Link to="/" className="mt-6 inline-block text-sm font-medium text-indigo-600">
        ← Back to projects
      </Link>
    </section>
  )
}
