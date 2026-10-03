import type { BN, Program } from '@coral-xyz/anchor'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import {
  PACKET_DATA_SIZE,
  PublicKey,
  Transaction,
  type Connection,
  type TransactionInstruction,
} from '@solana/web3.js'
import { milestonePda, projectPda, vaultPda } from './pda'

// Argument shapes follow the agreed program interface (frontend-brief §5.2).
// Account names are passed via accountsPartial; anything else (system/token programs, PDAs with IDL seeds)
// is resolved by Anchor from the IDL. Re-check against pacta.json once it's copied in.

export interface MemberArg {
  wallet: PublicKey
  role: string
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
  arbiter: PublicKey | null
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
        .accountsPartial({ client: params.client, project, vault: vaultPda(project) })
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
        clientTokenAccount: getAssociatedTokenAddressSync(mint, client),
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
        clientTokenAccount: getAssociatedTokenAddressSync(mint, client),
        ...milestoneAccounts(m),
      })
      .instruction(),
  )
