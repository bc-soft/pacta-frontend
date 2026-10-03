import { BN } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { projectPda } from '../solana/pda'
import { ApiError, getApiWallet } from './client'
import { realApi, type Api } from './realApi'
import type { HistoryEvent, MilestoneMeta, ProjectSummary } from './types'

// Stand-in for backend endpoints that don't exist yet (VITE_USE_FAKE_API=true).
// Live endpoints (health, auth, profiles) still go to the real backend.
// Persisted in localStorage so screens survive F5 — but it's per browser, so other demo wallets
// only see what was created in the same browser.

interface FakeProject extends ProjectSummary {
  client: string
}

interface Store {
  projects: Record<string, FakeProject>
  history: Record<string, HistoryEvent[]>
}

const STORAGE_KEY = 'pacta.fakeApi'

const load = (): Store => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Store
  } catch {
    // fall through
  }
  return { projects: {}, history: {} }
}

const store = load()
const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // in-memory only
  }
}

const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 150))

const notFound = () => new ApiError({ status: 404, title: 'Not Found', detail: 'Project not found' })

const requireWallet = () => {
  const wallet = getApiWallet()
  if (!wallet) throw new ApiError({ status: 401, title: 'Unauthorized', detail: 'Connect your wallet' })
  return wallet
}

const milestone = (pda: string, index: number): MilestoneMeta => {
  const project = store.projects[pda]
  if (!project) throw notFound()
  project.milestones[index] ??= { index, title: `Milestone ${index + 1}`, acceptanceCriteria: '' }
  return project.milestones[index]
}

const addHistory = (pda: string, event: Omit<HistoryEvent, 'at'>) => {
  store.history[pda] = [...(store.history[pda] ?? []), { ...event, at: new Date().toISOString() }]
}

export const fakeApi: Api = {
  ...realApi,

  createProjectDraft: async (input) => {
    const client = requireWallet()
    // Same derivation as the backend
    const pda = projectPda(new PublicKey(client), new BN(input.seed)).toBase58()
    if (store.projects[pda]) throw new ApiError({ status: 409, title: 'Conflict', detail: 'Draft already exists' })
    store.projects[pda] = {
      pda,
      client,
      title: input.title,
      description: input.description,
      milestones: input.milestones.map((m, index) => ({ ...m, index })),
    }
    persist()
    return delay({ id: crypto.randomUUID(), pda, seed: input.seed })
  },
  // The fake doesn't know team members (the backend learns them from chain sync) — the chain list fills the gap
  projects: async (wallet) => delay(Object.values(store.projects).filter((p) => p.client === wallet)),
  project: async (pda) => {
    const project = store.projects[pda]
    if (!project) throw notFound()
    return delay(project)
  },
  updateMilestone: async (pda, index, input) => {
    Object.assign(milestone(pda, index), input)
    persist()
    return delay(undefined)
  },
  addDeliverable: async (pda, index, input) => {
    const m = milestone(pda, index)
    m.deliverables = [...(m.deliverables ?? []), input]
    persist()
    return delay(undefined)
  },
  syncProject: async (pda, signature) => {
    addHistory(pda, { type: 'transaction', signature, actor: getApiWallet() ?? undefined })
    persist()
    return fakeApi.project(pda)
  },
  history: async (pda) => delay(store.history[pda] ?? []),
  addDisputeEvidence: async (pda, index, input) => {
    const m = milestone(pda, index)
    const evidence = { ...input, wallet: requireWallet(), at: new Date().toISOString() }
    m.dispute = { evidence: [...(m.dispute?.evidence ?? []), evidence] }
    persist()
    return delay(undefined)
  },
  addMilestoneComment: async (pda, index, comment) => {
    const m = milestone(pda, index)
    m.comments = [...(m.comments ?? []), { wallet: requireWallet(), comment, at: new Date().toISOString() }]
    persist()
    return delay(undefined)
  },
  notifications: async () => delay([]),
  markNotificationRead: async () => delay(undefined),
}
