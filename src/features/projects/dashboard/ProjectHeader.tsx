import { ExplorerLink } from '../../../components/ExplorerLink'
import { StatusPill } from '../../../components/StatusPill'
import { PROJECT_STATUS_LABELS } from '../../../lib/labels'
import { ROLE_LABELS } from '../../../lib/roles'
import type { ProjectView } from '../useProject'

export function ProjectHeader({ view }: { view: ProjectView }) {
  const status = view.state?.project.status
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-balance">{view.title}</h1>
          {status && <StatusPill status={status} label={PROJECT_STATUS_LABELS[status]} />}
        </div>
        {view.meta.data?.description && (
          <p className="mt-1 max-w-2xl whitespace-pre-line text-sm text-ink-600">{view.meta.data.description}</p>
        )}
        <p className="mt-2 text-xs">
          <ExplorerLink address={view.pda}>Contract on Solana Explorer ↗</ExplorerLink>
        </p>
      </div>
      <RoleBadge view={view} />
    </header>
  )
}

/** Always visible: during the demo one person switches Phantom accounts between roles. */
export function RoleBadge({ view }: { view: ProjectView }) {
  if (!view.wallet) return null
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm shadow-xs ring-1 ring-brand-200">
      <span className="size-2 rounded-full bg-brand-500" aria-hidden />
      <span className="text-ink-500">You are</span>
      <strong className="text-ink-900">{ROLE_LABELS[view.role]}</strong>
    </div>
  )
}
