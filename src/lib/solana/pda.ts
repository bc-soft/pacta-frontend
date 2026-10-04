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

/**
 * Random seed for a new project, in [1, 2^53 - 1] — generated here and passed to both the backend draft and createProject.
 * On-chain it is a u64, but the backend stores it as a signed 64-bit integer and JSON numbers are only exact up to 2^53,
 * so we stay in the JS safe-integer range.
 */
export function randomProjectSeed(): number {
  const [high, low] = crypto.getRandomValues(new Uint32Array(2))
  const seed = (high & 0x1f_ffff) * 2 ** 32 + low
  return seed === 0 ? 1 : seed
}
