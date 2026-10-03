import type { MilestoneStatus, ProjectStatus, Resolution } from './solana/accounts'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  pending: 'Waiting for signatures',
  active: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  created: 'Not funded yet',
  funded: 'Funded · in progress',
  submitted: 'Waiting for review',
  changesRequested: 'Changes requested',
  accepted: 'Paid out',
  disputed: 'In dispute',
  resolved: 'Decided by arbiter',
  cancelled: 'Cancelled · refunded',
}

/** Share of the milestone that goes to the team, in bps; the rest is refunded to the client. */
export const RESOLUTION_TEAM_BPS: Record<Resolution, number> = {
  team100: 10_000,
  team75: 7_500,
  team50: 5_000,
  team25: 2_500,
  client100: 0,
}

export const RESOLUTION_LABELS: Record<Resolution, string> = {
  team100: 'Team gets 100%',
  team75: 'Team gets 75%, client 25%',
  team50: 'Team gets 50%, client 50%',
  team25: 'Team gets 25%, client 75%',
  client100: 'Client gets 100% back',
}
