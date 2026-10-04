import { zodResolver } from '@hookform/resolvers/zod'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { inputClass } from '../../components/form'
import { TxButton } from '../../components/TxButton'
import { api, type DeliverableType } from '../../lib/api'
import type { ChainMilestone } from '../../lib/solana/accounts'
import { UserFacingError } from '../../lib/solana/errors'
import { buildSubmitMilestone } from '../../lib/solana/instructions'
import { useProgram } from '../../lib/solana/program'
import { useSendAndSync, type TxPhase } from '../../lib/solana/tx'
import { useBackendAuth } from '../auth/useBackendAuth'
import type { ProjectView } from '../projects/useProject'

const schema = z.object({
  links: z
    .array(
      z.object({
        url: z.string().trim().url('Paste a full link, starting with https://'),
        note: z.string().trim().max(200, 'At most 200 characters'),
      }),
    )
    .min(1, 'Add at least one link to your work'),
})
type SubmitForm = z.infer<typeof schema>

function detectType(url: string): DeliverableType {
  const host = (() => {
    try {
      return new URL(url).hostname
    } catch {
      return ''
    }
  })()
  if (host.includes('figma.com')) return 'figma'
  if (host.endsWith('github.com')) return 'github'
  if (/gitlab\.com|bitbucket\.org/.test(host)) return 'code'
  if (/youtube\.com|youtu\.be|loom\.com|vimeo\.com/.test(host)) return 'video'
  if (/vercel\.app|netlify\.app|pages\.dev|onrender\.com/.test(host)) return 'preview'
  if (/docs\.google\.com|notion\.(so|site)|dropbox\.com/.test(host)) return 'document'
  return 'other'
}

/** Team member: links to the work (saved in the backend), then submitMilestone on-chain. */
export function SubmitMilestone({ view, milestone }: { view: ProjectView; milestone: ChainMilestone }) {
  const { publicKey } = useWallet()
  const program = useProgram()
  const sendAndSync = useSendAndSync()
  const ensureBackendAuth = useBackendAuth()
  const project = new PublicKey(view.pda)

  const form = useForm<SubmitForm>({
    resolver: zodResolver(schema),
    defaultValues: { links: [{ url: '', note: '' }] },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'links' })
  const errors = form.formState.errors

  const submit = async (onPhase: (phase: TxPhase) => void) => {
    if (!(await form.trigger())) throw new UserFacingError('Check the links above')
    const { links } = form.getValues()

    onPhase('signing')
    await ensureBackendAuth()
    for (const link of links) {
      await api.addDeliverable(view.pda, milestone.index, { url: link.url, type: detectType(link.url), note: link.note || undefined })
    }
    return sendAndSync(() => buildSubmitMilestone(program!, publicKey!, { project, index: milestone.index }), project, onPhase)
  }

  return (
    <div className="space-y-3 rounded-lg bg-violet-50/60 p-4">
      <p className="text-sm font-medium">
        {milestone.status === 'changesRequested' ? 'Submit the updated work' : 'Ready? Share links to your work'}
      </p>
      <ul className="space-y-2">
        {fields.map((field, i) => (
          <li key={field.id} className="grid gap-2 sm:grid-cols-[1fr_14rem_auto]">
            <div>
              <input
                {...form.register(`links.${i}.url`)}
                className={inputClass}
                placeholder="https://figma.com/… or GitHub PR, preview URL"
                aria-invalid={!!errors.links?.[i]?.url}
              />
              {errors.links?.[i]?.url && <p className="mt-1 text-xs text-rose-700">{errors.links[i].url.message}</p>}
            </div>
            <input {...form.register(`links.${i}.note`)} className={inputClass} placeholder="Note (optional)" />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={fields.length === 1}
              className="px-2 text-sm text-slate-500 hover:text-rose-700 disabled:invisible"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {errors.links?.root?.message && <p className="text-xs text-rose-700">{errors.links.root.message}</p>}
      <button
        type="button"
        onClick={() => append({ url: '', note: '' })}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        + Add another link
      </button>
      <TxButton
        label="Submit for review"
        successText="Submitted for review"
        disabled={!program}
        run={submit}
        onSuccess={() => form.reset({ links: [{ url: '', note: '' }] })}
      />
    </div>
  )
}
