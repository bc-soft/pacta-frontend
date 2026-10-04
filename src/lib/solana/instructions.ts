import type { BN, Program } from '@coral-xyz/anchor'
import { createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token'
import {
  PACKET_DATA_SIZE,
  PublicKey,
  Transaction,
  type Connection,
  type TransactionInstruction,
} from '@solana/web3.js'
import type { Resolution } from './accounts'
import { milestonePda, projectPda, vaultPda } from './pda'

// Argument and account names follow idl/pacta.json. Accounts are passed via accountsPartial; anything else
// (system/token programs, ATAs and PDAs with IDL seeds) is resolved by Anchor from the IDL.

export interface MemberArg {
  wallet: PublicKey
  /** u8 index into MEMBER_ROLES (lib/roles.ts) */
  role: number
}

export interface AllocationArg {
  wallet: PublicKey
  bps: number
}

export interface MilestoneArg {
  amount: BN
  allocations: AllocationArg[]
}

export interface CreateProjectParams {
  client: PublicKey
  seed: BN
  mint: PublicKey
  /** Required by the program (ArbiterRequired), even though the IDL type is Option<Pubkey> */
  arbiter: PublicKey
  members: MemberArg[]
  milestones: MilestoneArg[]
}

/**
 * createProject + createMilestone×N, packed into as few transactions as fit.
 * Idempotent: accounts already on-chain are skipped, so a retry after a partial failure finishes the job.
 */
export async function buildCreateProjectTxs(
  program: Program,
  connection: Connection,
  params: CreateProjectParams,
): Promise<Transaction[]> {
  const project = projectPda(params.client, params.seed)
  const milestones = params.milestones.map((_, index) => milestonePda(project, index))
  const existing = await connection.getMultipleAccountsInfo([project, ...milestones], 'confirmed')

  const instructions: TransactionInstruction[] = []

  if (!existing[0]) {
    instructions.push(
      await program.methods
        .createProject(params.seed, params.mint, params.arbiter, params.members)
        .accountsPartial({ client: params.client, project, mint: params.mint, vault: vaultPda(project) })
        .instruction(),
    )
  }

  for (const [index, milestone] of params.milestones.entries()) {
    if (existing[index + 1]) continue
    instructions.push(
      await program.methods
        .createMilestone(index, milestone.amount, milestone.allocations)
        .accountsPartial({ client: params.client, project, milestone: milestones[index] })
        .instruction(),
    )
  }

  return packInstructions(instructions, params.client)
}

/** Greedily packs instructions (in order) into transactions under the packet size limit. */
export function packInstructions(instructions: TransactionInstruction[], feePayer: PublicKey): Transaction[] {
  const txs: Transaction[] = []
  let current = new Transaction()

  for (const ix of instructions) {
    const candidate = new Transaction().add(...current.instructions, ix)
    if (current.instructions.length > 0 && serializedSize(candidate, feePayer) > PACKET_DATA_SIZE) {
      txs.push(current)
      current = new Transaction().add(ix)
    } else {
      current = candidate
    }
  }
  if (current.instructions.length > 0) txs.push(current)
  return txs
}

// Signature count prefix (1 byte for <128) + one 64-byte signature (fee payer = only signer) + message
function serializedSize(tx: Transaction, feePayer: PublicKey): number {
  tx.feePayer = feePayer
  tx.recentBlockhash = PublicKey.default.toBase58() // placeholder, same size as a real blockhash
  return 1 + 64 + tx.serializeMessage().length
}

const toTx = async (ix: Promise<TransactionInstruction>) => new Transaction().add(await ix)

/** A team member confirms the contract; after the last one the project becomes Active. */
export const buildAcceptContract = (program: Program, project: PublicKey, member: PublicKey) =>
  toTx(program.methods.acceptContract().accountsPartial({ member, project }).instruction())

interface MilestoneAccounts {
  project: PublicKey
  index: number
}

const milestoneAccounts = ({ project, index }: MilestoneAccounts) => ({
  project,
  milestone: milestonePda(project, index),
  vault: vaultPda(project),
})

/** Client → vault. The caller checks the client's token account exists and holds enough first. */
export const buildFundMilestone = (program: Program, client: PublicKey, mint: PublicKey, m: MilestoneAccounts) =>
  toTx(
    program.methods
      .fundMilestone(m.index)
      .accountsPartial({
        client,
        mint,
        clientAta: getAssociatedTokenAddressSync(mint, client),
        ...milestoneAccounts(m),
      })
      .instruction(),
  )

/** Refund a funded milestone the team hasn't started to the client. */
export const buildCancelMilestone = (program: Program, client: PublicKey, mint: PublicKey, m: MilestoneAccounts) =>
  toTx(
    program.methods
      .cancelUnstartedMilestone(m.index)
      .accountsPartial({
        client,
        mint,
        clientAta: getAssociatedTokenAddressSync(mint, client),
        ...milestoneAccounts(m),
      })
      .instruction(),
  )

// Status-only instructions share one account set in the program: { signer, project, milestone }
const statusAccounts = (signer: PublicKey, { project, index }: MilestoneAccounts) => ({
  signer,
  project,
  milestone: milestonePda(project, index),
})

/** A team member marks a funded milestone as started — from then on the client can't cancel it for a refund. */
export const buildStartMilestone = (program: Program, member: PublicKey, m: MilestoneAccounts) =>
  toTx(program.methods.startMilestone(m.index).accountsPartial(statusAccounts(member, m)).instruction())

/** A team member marks the work as delivered (deliverable links are saved in the backend before this). */
export const buildSubmitMilestone = (program: Program, member: PublicKey, m: MilestoneAccounts) =>
  toTx(program.methods.submitMilestone(m.index).accountsPartial(statusAccounts(member, m)).instruction())

export const buildRequestChanges = (program: Program, client: PublicKey, m: MilestoneAccounts) =>
  toTx(program.methods.requestChanges(m.index).accountsPartial(statusAccounts(client, m)).instruction())

/**
 * Token accounts that receive a payout, in the given order, plus idempotent create instructions for the ones that
 * don't exist yet (paid by `payer`) — so a payout never fails because someone never held USDC before.
 */
async function payoutAccounts(connection: Connection, payer: PublicKey, mint: PublicKey, owners: PublicKey[]) {
  const atas = owners.map((owner) => getAssociatedTokenAddressSync(mint, owner))
  const infos = await connection.getMultipleAccountsInfo(atas, 'confirmed')
  const createMissing = atas.flatMap((ata, i) =>
    infos[i] ? [] : [createAssociatedTokenAccountIdempotentInstruction(payer, ata, owners[i], mint)],
  )
  const remainingAccounts = atas.map((pubkey) => ({ pubkey, isSigner: false, isWritable: true }))
  return { createMissing, remainingAccounts }
}

/** Client accepts → the program splits the milestone between members. remainingAccounts = member ATAs in allocations order. */
export async function buildAcceptMilestone(
  program: Program,
  connection: Connection,
  client: PublicKey,
  mint: PublicKey,
  m: MilestoneAccounts & { allocations: PublicKey[] },
) {
  const { createMissing, remainingAccounts } = await payoutAccounts(connection, client, mint, m.allocations)
  const ix = await program.methods
    .acceptMilestone(m.index)
    .accountsPartial({ client, mint, ...milestoneAccounts(m) })
    .remainingAccounts(remainingAccounts)
    .instruction()
  return new Transaction().add(...createMissing, ix)
}

/** Client or a team member escalates a milestone to the arbiter. */
export const buildOpenDispute = (program: Program, signer: PublicKey, m: MilestoneAccounts) =>
  toTx(program.methods.openDispute(m.index).accountsPartial(statusAccounts(signer, m)).instruction())

/**
 * Arbiter decides. remainingAccounts = member ATAs in allocations order (the program requires exactly one per
 * allocation); the client's share is refunded to the client's ATA.
 */
export async function buildResolveDispute(
  program: Program,
  connection: Connection,
  arbiter: PublicKey,
  mint: PublicKey,
  m: MilestoneAccounts & { allocations: PublicKey[]; client: PublicKey; resolution: Resolution },
) {
  const { createMissing, remainingAccounts } = await payoutAccounts(connection, arbiter, mint, m.allocations)
  // The client funded from this ATA, so it normally exists — create it anyway so the refund can't fail
  const clientAta = getAssociatedTokenAddressSync(mint, m.client)
  const createClientAta = createAssociatedTokenAccountIdempotentInstruction(arbiter, clientAta, m.client, mint)
  const ix = await program.methods
    .resolveDispute(m.index, { [m.resolution]: {} })
    .accountsPartial({ arbiter, mint, client: m.client, clientAta, ...milestoneAccounts(m) })
    .remainingAccounts(remainingAccounts)
    .instruction()
  return new Transaction().add(...createMissing, createClientAta, ix)
}
