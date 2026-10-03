import type { ChainProject } from './solana/accounts'

export type ProjectRole = 'client' | 'member' | 'arbiter' | 'viewer'

export const ROLE_LABELS: Record<ProjectRole, string> = {
  client: 'Client',
  member: 'Team member',
  arbiter: 'Arbiter',
  viewer: 'Viewer',
}

/** The connected wallet's role in a project — the program enforces client ∉ members and arbiter ∉ both. */
export function roleIn(project: ChainProject, wallet: string | null | undefined): ProjectRole {
  if (!wallet) return 'viewer'
  if (project.client === wallet) return 'client'
  if (project.members.some((m) => m.wallet === wallet)) return 'member'
  if (project.arbiter === wallet) return 'arbiter'
  return 'viewer'
}
