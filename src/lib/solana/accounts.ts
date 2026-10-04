import { BN, type Program } from '@coral-xyz/anchor'
import { PublicKey, type Connection } from '@solana/web3.js'
import { memberRoleFromU8, type MemberRole } from '../roles'
import { milestonePda, vaultPda } from './pda'

// Domain view of the program accounts. Everything the UI knows about the on-chain layout lives in this file.
// Raw* shapes mirror the IDL (idl/pacta.json, programs/pacta/src/state.rs) as decoded by Anchor (camelCase).

// Enum variants in declaration order of the program (Anchor decodes them as camelCase keys)
export type ProjectStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type MilestoneStatus =
  | 'draft'
  | 'funded'
  | 'inProgress'
  | 'submitted'
  | 'changesRequested'
  | 'disputed'
  | 'paid'
  | 'cancelled'
export type Resolution = 'team100' | 'team75' | 'team50' | 'team25' | 'client100'

interface RawMember {
  wallet: PublicKey
  role: number
  accepted: boolean
}

interface RawProject {
  client: PublicKey
  seed: BN
  mint: PublicKey
  arbiter: PublicKey | null
  members: RawMember[]
  milestoneCount: number
  closedMilestoneCount: number
  status: Record<string, unknown>
}

interface RawMilestone {
  project: PublicKey
  index: number
  amount: BN
  allocations: { wallet: PublicKey; bps: number }[]
  status: Record<string, unknown>
  dispute: { openedBy: PublicKey; resolution: Record<string, unknown> | null } | null
}

export interface ChainMember {
  wallet: string
  role: MemberRole
  accepted: boolean
}

export interface ChainProject {
  address: string
  client: string
  seed: BN
  mint: PublicKey
  arbiter: string | null
  members: ChainMember[]
  milestoneCount: number
  status: ProjectStatus
}

export interface ChainMilestone {
  address: string
  index: number
  amount: BN
  allocations: { wallet: string; bps: number }[]
  status: MilestoneStatus
  /** Wallet that escalated the milestone to the arbiter; null when never disputed */
  disputeOpenedBy: string | null
  /** Arbiter's decision — set once a dispute is resolved (milestone is then paid, or cancelled for client100) */
  resolution: Resolution | null
}

export interface ChainProjectState {
  project: ChainProject
  milestones: ChainMilestone[]
  /** Base units currently locked in the escrow vault */
  vaultBalance: BN | null
}

// Anchor encodes Rust enums as { variantName: {} }
const enumKey = <T extends string>(value: Record<string, unknown> | null | undefined): T | null =>
  value ? (Object.keys(value)[0] as T) : null

export function decodeProject(address: PublicKey, raw: RawProject): ChainProject {
  return {
    address: address.toBase58(),
    client: raw.client.toBase58(),
    seed: raw.seed,
    mint: raw.mint,
    arbiter: raw.arbiter && !raw.arbiter.equals(PublicKey.default) ? raw.arbiter.toBase58() : null,
    members: raw.members.map((m) => ({ wallet: m.wallet.toBase58(), role: memberRoleFromU8(m.role), accepted: m.accepted })),
    milestoneCount: raw.milestoneCount,
    status: enumKey<ProjectStatus>(raw.status) ?? 'draft',
  }
}

export function decodeMilestone(address: PublicKey, raw: RawMilestone): ChainMilestone {
  return {
    address: address.toBase58(),
    index: raw.index,
    amount: raw.amount,
    allocations: raw.allocations.map((a) => ({ wallet: a.wallet.toBase58(), bps: a.bps })),
    status: enumKey<MilestoneStatus>(raw.status) ?? 'draft',
    disputeOpenedBy: raw.dispute?.openedBy.toBase58() ?? null,
    resolution: enumKey<Resolution>(raw.dispute?.resolution),
  }
}

// The account namespace is keyed by account name from the IDL; kept untyped so this file owns the mapping
type AccountClient = {
  fetchNullable(address: PublicKey): Promise<unknown>
  fetchMultiple(addresses: PublicKey[]): Promise<unknown[]>
}
const accountClient = (program: Program, name: 'project' | 'milestone') =>
  (program.account as unknown as Record<string, AccountClient>)[name]

/** Full financial state of a project, straight from the chain. Null when the account doesn't exist. */
export async function fetchProjectState(
  program: Program,
  connection: Connection,
  address: PublicKey,
): Promise<ChainProjectState | null> {
  const raw = await accountClient(program, 'project').fetchNullable(address)
  if (!raw) return null
  const project = decodeProject(address, raw as RawProject)

  const milestoneAddresses = Array.from({ length: project.milestoneCount }, (_, i) => milestonePda(address, i))
  const rawMilestones = await accountClient(program, 'milestone').fetchMultiple(milestoneAddresses)
  const milestones = rawMilestones.flatMap((m, i) => (m ? [decodeMilestone(milestoneAddresses[i], m as RawMilestone)] : []))

  const vaultBalance = await connection
    .getTokenAccountBalance(vaultPda(address), 'confirmed')
    .then((r) => new BN(r.value.amount))
    .catch(() => null)

  return { project, milestones, vaultBalance }
}

/**
 * Chain state of the given projects (one getMultipleAccounts call). Which projects belong to a wallet comes
 * from the backend: scanning the program with getProgramAccounts is blocked on most free RPC tiers.
 */
export async function fetchProjectsByAddress(program: Program, addresses: string[]): Promise<ChainProject[]> {
  if (addresses.length === 0) return []
  const keys = addresses.map((a) => new PublicKey(a))
  const raw = await accountClient(program, 'project').fetchMultiple(keys)
  return raw.flatMap((account, i) => (account ? [decodeProject(keys[i], account as RawProject)] : []))
}
