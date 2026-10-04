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

/** A team member's discipline. On-chain it is a u8 — the index in this list (program: MAX_ROLE = 4). */
export const MEMBER_ROLES = ['backend', 'frontend', 'design', 'qa', 'other'] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  backend: 'Backend developer',
  frontend: 'Frontend developer',
  design: 'Designer',
  qa: 'QA / tester',
  other: 'Other',
}

export const memberRoleToU8 = (role: MemberRole): number => MEMBER_ROLES.indexOf(role)
export const memberRoleFromU8 = (value: number): MemberRole => MEMBER_ROLES[value] ?? 'other'
