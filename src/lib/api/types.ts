// Mirrors the backend contract (/api/doc.json). Regenerate or adjust when the backend changes.

export interface ProblemDetails {
  status: number
  title: string
  detail?: string
  violations?: { field: string; message: string }[]
}

export interface Health {
  status: string
  [key: string]: unknown
}

export interface Profile {
  wallet: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  skills?: string[]
  contact?: string
}

export type ProfileInput = Omit<Profile, 'wallet'>

export interface MilestoneDraft {
  title: string
  acceptanceCriteria: string
}

export interface ProjectDraftInput {
  title: string
  description: string
  /** u64 as decimal string — generated on the frontend, also passed to createProject */
  seed: string
  milestones: MilestoneDraft[]
}

export interface ProjectDraftCreated {
  id: string
  pda: string
  seed: string
}

export interface MilestoneMeta extends MilestoneDraft {
  index: number
  description?: string
  deliverables?: Deliverable[]
  /** Proposed (not yet in the agreed contract): client comments sent with "Request changes" */
  comments?: MilestoneComment[]
  dispute?: { evidence: DisputeEvidence[] }
}

export interface MilestoneComment {
  wallet: string
  comment: string
  at: string
}

export interface DisputeEvidenceInput {
  argument: string
  links: string[]
}

export interface DisputeEvidence extends DisputeEvidenceInput {
  wallet: string
  at: string
}

export type DeliverableType = 'figma' | 'code' | 'preview' | 'document' | 'other'

export interface Deliverable {
  url: string
  type: DeliverableType
  note?: string
}

/** Backend copy of on-chain state — convenience only, never the source of truth for money. */
export interface ChainSnapshot {
  slot: number
  syncedAt: string
  stale: boolean
  [key: string]: unknown
}

export interface ProjectSummary {
  pda: string
  title: string
  description: string
  milestones: MilestoneMeta[]
  chain?: ChainSnapshot
}

export interface HistoryEvent {
  type: string
  at: string
  signature?: string
  milestoneIndex?: number
  actor?: string
}

export interface Notification {
  id: string
  type: string
  pda: string
  title: string
  signature?: string
  read?: boolean
  createdAt?: string
}
