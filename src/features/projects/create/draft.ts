import { randomProjectSeed } from '../../../lib/solana/pda'
import type { ProjectForm } from './schema'

// The wizard survives F5: the draft (including the random seed) is kept per client wallet.
interface Draft {
  values: ProjectForm
  step: number
}

const key = (wallet: string) => `pacta.createProject.${wallet}`

export function loadDraft(wallet: string): Draft | null {
  try {
    const raw = localStorage.getItem(key(wallet))
    const draft = raw ? (JSON.parse(raw) as Draft) : null
    // Drafts saved before seeds became numbers (u64 strings) or roles a fixed list can't be submitted — start over
    if (draft && typeof draft.values.seed !== 'number') return null
    return draft
  } catch {
    return null
  }
}

export function saveDraft(wallet: string, draft: Draft) {
  try {
    localStorage.setItem(key(wallet), JSON.stringify(draft))
  } catch {
    // storage unavailable — the wizard still works, it just won't survive a refresh
  }
}

export function clearDraft(wallet: string) {
  try {
    localStorage.removeItem(key(wallet))
  } catch {
    // ignore
  }
}

export const emptyProjectForm = (): ProjectForm => ({
  seed: randomProjectSeed(),
  title: '',
  description: '',
  members: [{ wallet: '', role: 'frontend' }],
  milestones: [{ title: '', amount: '', acceptanceCriteria: '', split: ['100'] }],
  arbiter: '',
})
