// Mirrors the backend contract (/api/doc.json). Regenerate or adjust when the backend changes.

import type { MemberRole } from '../roles'

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
  displayName?: string | null
  avatarUrl?: string | null
  bio?: string | null
  skills?: string[]
  contact?: string | null
}

export type ProfileInput = Omit<Profile, 'wallet'>

export interface AllocationInput {
  wallet: string
  /** basis points, 10 000 = 100% */
  bps: number
}

export interface MilestoneDraftInput {
  title: string
  description?: string
  acceptanceCriteria?: string
  /** USDC base units (6 decimals) */
  amount: number
  allocations: AllocationInput[]
}

/**
 * Same terms as the createProject transaction, plus the texts. The backend derives the same project PDA from
 * (client, seed), so the seed must stay within the JS safe-integer range.
 */
export interface ProjectDraftInput {
  title: string
  description?: string
  arbiterWallet: string
  seed: number
  members: { wallet: string; role: MemberRole }[]
  milestones: MilestoneDraftInput[]
}

export interface MilestoneUpdateInput {
  title: string
  description?: string
  acceptanceCriteria?: string
}

export interface MilestoneComment {
  id: string
  wallet: string
  comment: string
  createdAt: string
}

export interface DisputeEvidenceInput {
  argument: string
  links: string[]
}

export interface DisputeEvidence extends DisputeEvidenceInput {
  id: string
  milestoneIndex: number
  wallet: string
  side: 'client' | 'team'
  createdAt: string
}

export type DeliverableType = 'figma' | 'github' | 'code' | 'preview' | 'document' | 'video' | 'other'

export interface DeliverableInput {
  url: string
  type: DeliverableType
  note?: string
}

export interface Deliverable extends DeliverableInput {
  id: string
  addedBy: string
  createdAt: string
}

/** Backend copy of on-chain state — convenience only, never the source of truth for money. */
export interface ChainSnapshot {
  exists: boolean
  slot: number
  syncedAt: string
  stale: boolean
  status: string | null
  data: Record<string, unknown> | null
}

export interface MilestoneMeta {
  index: number
  pda: string
  title: string
  description: string | null
  acceptanceCriteria: string | null
  amount: number
  allocations: AllocationInput[]
  explorerUrl: string
  deliverables: Deliverable[]
  /** Client comments sent with "Request changes" */
  comments?: MilestoneComment[]
  chain: ChainSnapshot | null
}

export interface ProjectSummary {
  id: string
  pda: string
  seed: string
  vaultPda: string
  clientWallet: string
  arbiterWallet: string | null
  title: string
  description: string | null
  /** true until the backend has seen the project on-chain */
  draft: boolean
  onChainAt: string | null
  createdAt: string
  updatedAt: string
  explorerUrl: string
  totalAmount: number
  members: { wallet: string; role: string; accepted: boolean | null }[]
  milestones: MilestoneMeta[]
  chain: ChainSnapshot | null
}

/** One program transaction that touched the project, as recorded by the backend indexer. Newest first. */
export interface HistoryEvent {
  signature: string
  /** snake_case program instruction, e.g. fund_milestone; null when it couldn't be read from the logs */
  instruction: string | null
  success: boolean
  slot: number
  /** RFC 3339; null when the cluster didn't report it */
  blockTime: string | null
  explorerUrl: string
}

export interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  projectPda: string | null
  signature: string | null
  explorerUrl: string | null
  read: boolean
  createdAt: string
}

export interface NotificationList {
  /** Mercure topic the backend publishes this wallet's notifications to */
  mercureTopic: string
  items: Notification[]
}
