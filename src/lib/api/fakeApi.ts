import { realApi, type Api } from './realApi'
import type { HistoryEvent, ProjectSummary } from './types'

// In-memory stand-in for backend endpoints that don't exist yet (VITE_USE_FAKE_API=true).
// Live endpoints (health, auth, profiles) still go to the real backend.
// State resets on F5 — fine for building screens, not for the demo.
const projects = new Map<string, ProjectSummary>()
const history = new Map<string, HistoryEvent[]>()

const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 150))

export const fakeApi: Api = {
  ...realApi,

  createProjectDraft: async (input) => {
    // The real backend derives the PDA from (client, seed); the fake keys by seed until the wizard passes the PDA in
    const pda = `fake-${input.seed}`
    projects.set(pda, {
      pda,
      title: input.title,
      description: input.description,
      milestones: input.milestones.map((m, index) => ({ ...m, index })),
    })
    return delay({ id: crypto.randomUUID(), pda, seed: input.seed })
  },
  projects: async () => delay([...projects.values()]),
  project: async (pda) => {
    const project = projects.get(pda)
    if (!project) throw new Error(`Fake project ${pda} not found`)
    return delay(project)
  },
  updateMilestone: async () => delay(undefined),
  addDeliverable: async (pda, index, input) => {
    const milestone = projects.get(pda)?.milestones[index]
    if (milestone) milestone.deliverables = [...(milestone.deliverables ?? []), input]
    return delay(undefined)
  },
  syncProject: async (pda, signature) => {
    history.set(pda, [...(history.get(pda) ?? []), { type: 'tx', at: new Date().toISOString(), signature }])
    return fakeApi.project(pda)
  },
  history: async (pda) => delay(history.get(pda) ?? []),
  addDisputeEvidence: async () => delay(undefined),
  notifications: async () => delay([]),
  markNotificationRead: async () => delay(undefined),
}
