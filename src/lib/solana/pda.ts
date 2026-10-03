import { BN } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { Buffer } from 'buffer'
import { requireProgramId } from '../../env'

// Seeds must match the Anchor program (and the backend, which derives the same addresses):
// project   = ["project",   client, seed_u64_le]
// milestone = ["milestone", project, index_u8]
// vault     = ["vault",     project]

export const projectPda = (client: PublicKey, seed: BN) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('project'), client.toBuffer(), seed.toArrayLike(Buffer, 'le', 8)],
    requireProgramId(),
  )[0]

export const milestonePda = (project: PublicKey, index: number) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('milestone'), project.toBuffer(), Buffer.from([index])],
    requireProgramId(),
  )[0]

export const vaultPda = (project: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from('vault'), project.toBuffer()], requireProgramId())[0]

/** Random u64 seed for a new project — generated here and passed to both the backend draft and createProject. */
export function randomProjectSeed(): BN {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return new BN(bytes, 'le')
}
