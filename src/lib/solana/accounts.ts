import { BN, type Program } from '@coral-xyz/anchor'
import { PublicKey, type Connection } from '@solana/web3.js'
import { milestonePda, vaultPda } from './pda'

// Domain view of the program accounts. Everything the UI knows about the on-chain layout lives in this file.
// The Raw* shapes are the assumed IDL layout (agreed interface, frontend-brief §5) — once pacta.json lands,
// replace them with IdlAccounts<Pacta>['project'|'milestone'] and fix the mapping below if names differ.

export type ProjectStatus = 'pending' | 'active' | 'completed' | 'cancelled'
export type MilestoneStatus =
  | 'created'
  | 'funded'
  | 'submitted'
  | 'changesRequested'
  | 'accepted'
  | 'disputed'
  | 'resolved'
  | 'cancelled'
export type Resolution = 'team100' | 'team75' | 'team50' | 'team25' | 'client100'

interface RawMember {
  wallet: PublicKey
  role: string
  accepted: boolean
}

interface RawProject {
  client: PublicKey
  seed: BN
  mint: PublicKey
  arbiter: PublicKey | null
  members: RawMember[]
  milestoneCount: number
  status: Record<string, unknown>
}

interface RawMilestone {
  project: PublicKey
  index: number
  amount: BN
  allocations: { wallet: PublicKey; bps: number }[]
  status: Record<string, unknown>
  resolution: Record<string, unknown> | null
}

export interface ChainMember {
  wallet: string
  role: string
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
    members: raw.members.map((m) => ({ wallet: m.wallet.toBase58(), role: m.role, accepted: m.accepted })),
    milestoneCount: raw.milestoneCount,
    status: enumKey<ProjectStatus>(raw.status) ?? 'pending',
  }
}

export function decodeMilestone(address: PublicKey, raw: RawMilestone): ChainMilestone {
  return {
    address: address.toBase58(),
    index: raw.index,
    amount: raw.amount,
    allocations: raw.allocations.map((a) => ({ wallet: a.wallet.toBase58(), bps: a.bps })),
    status: enumKey<MilestoneStatus>(raw.status) ?? 'created',
    resolution: enumKey<Resolution>(raw.resolution),
  }
}

// Untyped until the IDL is wired in — the namespace is keyed by account name from the IDL
type AccountClient = {
  fetchNullable(address: PublicKey): Promise<unknown>
  fetchMultiple(addresses: PublicKey[]): Promise<unknown[]>
  all(): Promise<{ publicKey: PublicKey; account: unknown }[]>
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

/** Every project where the wallet is client, member or arbiter. Devnet scale — fetches all and filters locally. */
export async function fetchProjectsForWallet(program: Program, wallet: string): Promise<ChainProject[]> {
  const all = await accountClient(program, 'project').all()
  return all
    .map(({ publicKey, account }) => decodeProject(publicKey, account as RawProject))
    .filter((p) => p.client === wallet || p.arbiter === wallet || p.members.some((m) => m.wallet === wallet))
}
