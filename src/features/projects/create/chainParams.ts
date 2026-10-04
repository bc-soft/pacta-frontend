import { BN } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { percentToBps, usdcToBaseUnits } from '../../../lib/solana/amounts'
import type { ProjectDraftInput } from '../../../lib/api'
import { memberRoleToU8 } from '../../../lib/roles'
import type { CreateProjectParams } from '../../../lib/solana/instructions'
import type { ProjectForm } from './schema'

/** Validated form → program arguments. Allocations follow the order of `members`. */
export function toChainParams(form: ProjectForm, client: PublicKey, mint: PublicKey): CreateProjectParams {
  const members = form.members.map((m) => ({ wallet: new PublicKey(m.wallet), role: memberRoleToU8(m.role) }))
  return {
    client,
    seed: new BN(form.seed),
    mint,
    arbiter: new PublicKey(form.arbiter),
    members,
    milestones: form.milestones.map((milestone) => ({
      amount: usdcToBaseUnits(milestone.amount)!,
      allocations: members.map((m, i) => ({ wallet: m.wallet, bps: percentToBps(milestone.split[i])! })),
    })),
  }
}

/** Validated form → backend draft: the same terms as on-chain, plus the texts that only live in the backend. */
export function toDraftInput(form: ProjectForm, params: CreateProjectParams): ProjectDraftInput {
  return {
    title: form.title,
    description: form.description || undefined,
    arbiterWallet: form.arbiter,
    seed: form.seed,
    members: form.members.map((m) => ({ wallet: m.wallet, role: m.role })),
    milestones: form.milestones.map((m, i) => ({
      title: m.title,
      acceptanceCriteria: m.acceptanceCriteria,
      amount: params.milestones[i].amount.toNumber(),
      allocations: params.milestones[i].allocations.map((a) => ({ wallet: a.wallet.toBase58(), bps: a.bps })),
    })),
  }
}
