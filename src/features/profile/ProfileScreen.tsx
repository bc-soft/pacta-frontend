import { zodResolver } from '@hookform/resolvers/zod'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Field, inputClass, primaryButtonClass } from '../../components/form'
import { api, ApiError, type Profile } from '../../lib/api'
import { useAuth } from '../auth/useAuth'
import { Avatar } from './Avatar'

const schema = z.object({
  displayName: z.string().trim().min(2, 'At least 2 characters').max(50, 'At most 50 characters'),
  avatarUrl: z.union([z.literal(''), z.string().trim().url('Paste a full image link, starting with https://')]),
  bio: z.string().trim().max(500, 'At most 500 characters'),
  skills: z.string().trim().max(200, 'At most 200 characters'),
  contact: z.string().trim().max(100, 'At most 100 characters'),
})
type ProfileFormValues = z.infer<typeof schema>

const toForm = (p: Profile | null): ProfileFormValues => ({
  displayName: p?.displayName ?? '',
  avatarUrl: p?.avatarUrl ?? '',
  bio: p?.bio ?? '',
  skills: p?.skills?.join(', ') ?? '',
  contact: p?.contact ?? '',
})

export function ProfileScreen() {
  const { publicKey } = useWallet()
  const wallet = publicKey?.toBase58()

  // Public profile needs no sign-in; we only ask for a signature when saving
  const profile = useQuery({
    queryKey: ['profile', wallet],
    queryFn: () =>
      api.profile(wallet!).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }),
    enabled: !!wallet,
    retry: false,
  })

  if (!wallet) {
    return (
      <section className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-balance">Your profile</h1>
        <p className="mt-2 text-ink-600">Connect your wallet to set up how clients and teammates see you.</p>
        <div className="mt-6 flex justify-center">
          <WalletMultiButton />
        </div>
      </section>
    )
  }
  if (profile.isPending) return <p className="text-ink-500">Loading…</p>

  return <ProfileForm key={wallet} wallet={wallet} initial={profile.data ?? null} loadError={profile.isError} />
}

function ProfileForm({ wallet, initial, loadError }: { wallet: string; initial: Profile | null; loadError: boolean }) {
  const { ensureSignedIn } = useAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<{ kind: 'saved' | 'error'; message: string } | null>(null)

  const form = useForm<ProfileFormValues>({ resolver: zodResolver(schema), defaultValues: toForm(initial) })
  const { register, handleSubmit, setError, control, formState } = form
  const { errors, isSubmitting } = formState
  const preview = useWatch({ control })

  const onSubmit = handleSubmit(async (values) => {
    setStatus(null)
    try {
      await ensureSignedIn()
      await api.updateMe({
        displayName: values.displayName,
        avatarUrl: values.avatarUrl || undefined,
        bio: values.bio || undefined,
        skills: values.skills.split(',').map((s) => s.trim()).filter(Boolean),
        contact: values.contact || undefined,
      })
      await queryClient.invalidateQueries({ queryKey: ['profiles'] })
      await queryClient.invalidateQueries({ queryKey: ['profile', wallet] })
      setStatus({ kind: 'saved', message: 'Profile saved' })
    } catch (error) {
      if (error instanceof ApiError) {
        // Backend field errors go next to the fields
        for (const v of error.problem.violations ?? []) {
          if (v.field in values) setError(v.field as keyof ProfileFormValues, { message: v.message })
        }
        setStatus({ kind: 'error', message: error.message })
      } else {
        setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Could not save' })
      }
    }
  })

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-balance">Your profile</h1>
      <p className="mt-1 text-sm text-ink-600">
        Shown to clients and teammates next to your wallet address. Saving asks your wallet to sign in — no password.
      </p>
      {loadError && <p className="mt-3 text-sm text-amber-800">Couldn&apos;t load your current profile.</p>}

      <div className="mt-6 flex items-center gap-3 card p-4">
        <Avatar wallet={wallet} profile={{ wallet, displayName: preview.displayName, avatarUrl: preview.avatarUrl || undefined }} />
        <div className="min-w-0">
          <p className="font-medium">{preview.displayName || 'Your name'}</p>
          <p className="truncate font-mono text-xs text-ink-500">{wallet}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
        <Field label="Name" error={errors.displayName?.message}>
          <input {...register('displayName')} className={inputClass} aria-invalid={!!errors.displayName} />
        </Field>
        <Field label="Avatar image URL" hint="Optional. A square image works best." error={errors.avatarUrl?.message}>
          <input {...register('avatarUrl')} className={inputClass} placeholder="https://…" aria-invalid={!!errors.avatarUrl} />
        </Field>
        <Field label="About you" error={errors.bio?.message}>
          <textarea {...register('bio')} rows={4} className={inputClass} aria-invalid={!!errors.bio} />
        </Field>
        <Field label="Skills" hint="Comma-separated, e.g. UI design, React, copywriting" error={errors.skills?.message}>
          <input {...register('skills')} className={inputClass} aria-invalid={!!errors.skills} />
        </Field>
        <Field label="Contact" hint="Email, Telegram or anything else" error={errors.contact?.message}>
          <input {...register('contact')} className={inputClass} aria-invalid={!!errors.contact} />
        </Field>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
            {isSubmitting ? 'Saving…' : 'Save profile'}
          </button>
          {status && (
            <p className={`text-sm ${status.kind === 'saved' ? 'text-emerald-700' : 'text-rose-700'}`}>{status.message}</p>
          )}
        </div>
      </form>
    </section>
  )
}
