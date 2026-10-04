import { PublicKey } from '@solana/web3.js'
import { z } from 'zod'
import { MEMBER_ROLES } from '../../../lib/roles'
import { BPS_TOTAL, percentToBps, usdcToBaseUnits } from '../../../lib/solana/amounts'

export const MAX_MEMBERS = 8
export const MAX_MILESTONES = 5

const isPublicKey = (value: string) => {
  try {
    return PublicKey.isOnCurve(new PublicKey(value).toBytes())
  } catch {
    return false
  }
}

const walletAddress = z
  .string()
  .trim()
  .min(1, 'Wallet address is required')
  .refine(isPublicKey, 'This is not a valid Solana wallet address')

// Form values are strings (inputs); conversion to chain units happens in toChainParams()
export const projectFormSchema = (client: string) =>
  z
    .object({
      seed: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      title: z.string().trim().min(3, 'At least 3 characters').max(80, 'At most 80 characters'),
      description: z.string().trim().max(1000, 'At most 1000 characters'),
      members: z
        .array(
          z.object({
            wallet: walletAddress.refine((w) => w !== client, 'You are the client — add your teammates here'),
            role: z.enum(MEMBER_ROLES, { errorMap: () => ({ message: 'Pick a role' }) }),
          }),
        )
        .min(1, 'Add at least one team member')
        .max(MAX_MEMBERS, `At most ${MAX_MEMBERS} team members`)
        .superRefine((members, ctx) => {
          const seen = new Set<string>()
          members.forEach((m, i) => {
            if (seen.has(m.wallet)) ctx.addIssue({ code: 'custom', path: [i, 'wallet'], message: 'Already in the team' })
            seen.add(m.wallet)
          })
        }),
      milestones: z
        .array(
          z.object({
            title: z.string().trim().min(3, 'At least 3 characters').max(80, 'At most 80 characters'),
            amount: z
              .string()
              .refine((v) => usdcToBaseUnits(v) !== null, 'Enter an amount like 1000 or 250.50')
              .refine((v) => !usdcToBaseUnits(v)?.isZero(), 'Amount must be greater than 0'),
            acceptanceCriteria: z
              .string()
              .trim()
              .min(10, 'Describe when this milestone counts as done')
              .max(1000, 'At most 1000 characters'),
            // Percent per member, aligned by index with `members`
            split: z
              .array(z.string().refine((v) => percentToBps(v) !== null, 'Use a number like 40 or 33.33'))
              .superRefine((split, ctx) => {
                const total = split.reduce((sum, p) => sum + (percentToBps(p) ?? 0), 0)
                if (total !== BPS_TOTAL) ctx.addIssue({ code: 'custom', message: `Shares must add up to 100% (now ${total / 100}%)` })
              }),
          }),
        )
        .min(1, 'Add at least one milestone')
        .max(MAX_MILESTONES, `At most ${MAX_MILESTONES} milestones`),
      // Required by the program: every contract has someone neutral who can settle a dispute
      arbiter: walletAddress,
    })
    // Runs only once every field is valid — fine, the arbiter is the last step
    .superRefine((form, ctx) => {
      const notOutsider = form.arbiter === client || form.members.some((m) => m.wallet === form.arbiter)
      if (notOutsider) ctx.addIssue({ code: 'custom', path: ['arbiter'], message: 'The arbiter must be someone outside the project' })
      if (form.milestones.some((m) => m.split.length !== form.members.length)) {
        ctx.addIssue({ code: 'custom', path: ['milestones'], message: 'Set the split again — the team has changed' })
      }
    })

export type ProjectForm = z.infer<ReturnType<typeof projectFormSchema>>

export const STEPS = [
  { id: 'details', label: 'Project', fields: ['title', 'description'] },
  { id: 'team', label: 'Team', fields: ['members'] },
  { id: 'milestones', label: 'Milestones', fields: ['milestones'] },
  { id: 'arbiter', label: 'Arbiter', fields: ['arbiter'] },
  { id: 'summary', label: 'Review & sign', fields: [] },
] as const satisfies readonly { id: string; label: string; fields: readonly (keyof ProjectForm)[] }[]

export type StepId = (typeof STEPS)[number]['id']
