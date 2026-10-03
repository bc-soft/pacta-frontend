import { request } from './client'
import type {
  Deliverable,
  Health,
  HistoryEvent,
  MilestoneDraft,
  Notification,
  Profile,
  ProfileInput,
  ProjectDraftCreated,
  ProjectDraftInput,
  ProjectSummary,
} from './types'

const enc = encodeURIComponent

export const realApi = {
  health: () => request<Health>('GET', '/api/health'),

  authNonce: (wallet: string) => request<{ message: string }>('POST', '/api/auth/nonce', { wallet }),
  authVerify: (wallet: string, message: string, signature: string) =>
    request<{ token: string }>('POST', '/api/auth/verify', { wallet, message, signature }),

  me: () => request<Profile>('GET', '/api/me'),
  updateMe: (input: ProfileInput) => request<Profile>('PUT', '/api/me', input),
  profile: (wallet: string) => request<Profile>('GET', `/api/profiles/${enc(wallet)}`),
  profiles: (wallets: string[]) => request<Profile[]>('GET', `/api/profiles?wallets=${wallets.map(enc).join(',')}`),

  // Endpoints below are still being built on the backend — see fakeApi.ts
  createProjectDraft: (input: ProjectDraftInput) => request<ProjectDraftCreated>('POST', '/api/projects', input),
  projects: (wallet: string) => request<ProjectSummary[]>('GET', `/api/projects?wallet=${enc(wallet)}`),
  project: (pda: string) => request<ProjectSummary>('GET', `/api/projects/${enc(pda)}`),
  updateMilestone: (pda: string, index: number, input: Partial<MilestoneDraft> & { description?: string }) =>
    request<void>('PUT', `/api/projects/${enc(pda)}/milestones/${index}`, input),
  addDeliverable: (pda: string, index: number, input: Deliverable) =>
    request<void>('POST', `/api/projects/${enc(pda)}/milestones/${index}/deliverables`, input),
  syncProject: (pda: string, signature: string) =>
    request<ProjectSummary>('POST', `/api/projects/${enc(pda)}/sync`, { signature }),
  history: (pda: string) => request<HistoryEvent[]>('GET', `/api/projects/${enc(pda)}/history`),
  addDisputeEvidence: (pda: string, index: number, input: { argument: string; links: string[] }) =>
    request<void>('POST', `/api/projects/${enc(pda)}/milestones/${index}/dispute/evidence`, input),
  notifications: () => request<Notification[]>('GET', '/api/notifications'),
  markNotificationRead: (id: string) => request<void>('POST', `/api/notifications/${enc(id)}/read`),
}

export type Api = typeof realApi
