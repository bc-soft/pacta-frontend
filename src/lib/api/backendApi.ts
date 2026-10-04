import { request } from './client'
import type {
  DeliverableInput,
  DisputeEvidence,
  DisputeEvidenceInput,
  Health,
  HistoryEvent,
  MilestoneComment,
  MilestoneUpdateInput,
  NotificationList,
  Notification,
  Profile,
  ProfileInput,
  ProjectDraftInput,
  ProjectSummary,
} from './types'

const enc = encodeURIComponent
const milestonePath = (pda: string, index: number) => `/api/projects/${enc(pda)}/milestones/${index}`

export const api = {
  health: () => request<Health>('GET', '/api/health'),

  authNonce: (wallet: string) => request<{ message: string }>('POST', '/api/auth/nonce', { wallet }),
  authVerify: (wallet: string, message: string, signature: string) =>
    request<{ token: string }>('POST', '/api/auth/verify', { wallet, message, signature }),

  me: () => request<Profile>('GET', '/api/me'),
  updateMe: (input: ProfileInput) => request<Profile>('PUT', '/api/me', input),
  profile: (wallet: string) => request<Profile>('GET', `/api/profiles/${enc(wallet)}`),
  profiles: (wallets: string[]) => request<Profile[]>('GET', `/api/profiles?wallets=${wallets.map(enc).join(',')}`),

  createProjectDraft: (input: ProjectDraftInput) => request<ProjectSummary>('POST', '/api/projects', input),
  projects: (wallet: string) => request<ProjectSummary[]>('GET', `/api/projects?wallet=${enc(wallet)}`),
  project: (pda: string) => request<ProjectSummary>('GET', `/api/projects/${enc(pda)}`),
  updateMilestone: (pda: string, index: number, input: MilestoneUpdateInput) =>
    request<ProjectSummary>('PUT', milestonePath(pda, index), input),
  addDeliverable: (pda: string, index: number, input: DeliverableInput) =>
    request<ProjectSummary>('POST', `${milestonePath(pda, index)}/deliverables`, input),
  addMilestoneComment: (pda: string, index: number, comment: string) =>
    request<MilestoneComment>('POST', `${milestonePath(pda, index)}/comments`, { comment }),
  syncProject: (pda: string, signature: string) =>
    request<ProjectSummary>('POST', `/api/projects/${enc(pda)}/sync`, { signature }),
  history: (pda: string) => request<HistoryEvent[]>('GET', `/api/projects/${enc(pda)}/history`),

  disputeEvidence: (pda: string, index: number) =>
    request<DisputeEvidence[]>('GET', `${milestonePath(pda, index)}/dispute/evidence`),
  addDisputeEvidence: (pda: string, index: number, input: DisputeEvidenceInput) =>
    request<DisputeEvidence>('POST', `${milestonePath(pda, index)}/dispute/evidence`, input),

  notifications: () => request<NotificationList>('GET', '/api/notifications'),
  markNotificationRead: (id: string) => request<Notification>('POST', `/api/notifications/${enc(id)}/read`),
}

export type Api = typeof api
