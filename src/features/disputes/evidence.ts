import { z } from 'zod'

export const evidenceSchema = z.object({
  argument: z.string().trim().min(20, 'Explain your side in at least a couple of sentences').max(2000, 'At most 2000 characters'),
  links: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || v.split(/\s+/).every((l) => /^https?:\/\/\S+$/.test(l)),
      'One full link per line, starting with https://',
    ),
})

export type EvidenceForm = z.infer<typeof evidenceSchema>

export const parseLinks = (value: string) => value.split(/\s+/).map((l) => l.trim()).filter(Boolean)
