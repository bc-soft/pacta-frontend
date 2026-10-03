import { BN } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { percentToBps, usdcToBaseUnits } from '../../../lib/solana/amounts'
import type { CreateProjectParams } from '../../../lib/solana/instructions'
import type { ProjectForm } from './schema'

/** Validated form → program arguments. Allocations follow the order of `members`. */
export function toChainParams(form: ProjectForm, client: PublicKey, mint: PublicKey): CreateProjectParams {
  const members = form.members.map((m) => ({ wallet: new PublicKey(m.wallet), role: m.role.trim() }))
  return {
    client,
    seed: new BN(form.seed),
    mint,
    arbiter: form.arbiter ? new PublicKey(form.arbiter) : null,
    members,
    milestones: form.milestones.map((milestone) => ({
      amount: usdcToBaseUnits(milestone.amount)!,
      allocations: members.map((m, i) => ({ wallet: m.wallet, bps: percentToBps(milestone.split[i])! })),
    })),
  }
}
