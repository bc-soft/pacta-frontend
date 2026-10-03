import { PublicKey } from '@solana/web3.js'
import { z } from 'zod'

const publicKey = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined
    try {
      return new PublicKey(v)
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'not a valid base58 public key' })
      return z.NEVER
    }
  })

const schema = z.object({
  VITE_SOLANA_CLUSTER: z.enum(['devnet', 'testnet', 'mainnet-beta', 'localnet']).default('devnet'),
  VITE_SOLANA_RPC_URL: z.string().url(),
  // Optional until the program is deployed; screens that need them check via requireX()
  VITE_PACTA_PROGRAM_ID: publicKey,
  VITE_USDC_MINT: publicKey,
  VITE_API_URL: z.string().url(),
  VITE_MERCURE_URL: z.string().url(),
  VITE_USE_FAKE_API: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
})

const parsed = schema.safeParse(import.meta.env)

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Invalid environment configuration (see .env.example):\n${lines}`)
}

export const env = {
  cluster: parsed.data.VITE_SOLANA_CLUSTER,
  rpcUrl: parsed.data.VITE_SOLANA_RPC_URL,
  programId: parsed.data.VITE_PACTA_PROGRAM_ID,
  usdcMint: parsed.data.VITE_USDC_MINT,
  apiUrl: parsed.data.VITE_API_URL.replace(/\/$/, ''),
  mercureUrl: parsed.data.VITE_MERCURE_URL,
  useFakeApi: parsed.data.VITE_USE_FAKE_API,
}

export function requireProgramId(): PublicKey {
  if (!env.programId) throw new Error('VITE_PACTA_PROGRAM_ID is not set')
  return env.programId
}

export function requireUsdcMint(): PublicKey {
  if (!env.usdcMint) throw new Error('VITE_USDC_MINT is not set')
  return env.usdcMint
}
