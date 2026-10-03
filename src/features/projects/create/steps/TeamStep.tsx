import { useWallet } from '@solana/wallet-adapter-react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { inputClass, secondaryButtonClass } from '../../../../components/form'
import { PersonLabel } from '../../../profile/PersonLabel'
import { useProfiles } from '../../../profile/useProfiles'
import { MAX_MEMBERS, type ProjectForm } from '../schema'

const ROLE_SUGGESTIONS = ['Designer', 'Developer', 'Copywriter', 'Project manager', 'QA']

export function TeamStep() {
  const { publicKey } = useWallet()
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ProjectForm>()
  const { fields, append, remove } = useFieldArray({ control, name: 'members' })
  const members = useWatch({ control, name: 'members' })
  const profiles = useProfiles([publicKey?.toBase58() ?? '', ...members.map((m) => m.wallet.trim())])

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Add the wallet address of everyone who will do the work and get paid. They don&apos;t need to know each other —
        each person confirms the contract with their own wallet.
      </p>

      {publicKey && (
        <div className="rounded-lg bg-slate-100 px-3 py-2">
          <PersonLabel wallet={publicKey.toBase58()} profile={profiles[publicKey.toBase58()]} role="Client (you)" />
        </div>
      )}

      <datalist id="role-suggestions">
        {ROLE_SUGGESTIONS.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>

      <ul className="space-y-3">
        {fields.map((field, i) => {
          const wallet = members[i]?.wallet.trim() ?? ''
          const profile = profiles[wallet]
          const memberErrors = errors.members?.[i]
          return (
            <li key={field.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-start">
                <div>
                  <input
                    {...register(`members.${i}.wallet`)}
                    className={`${inputClass} font-mono`}
                    placeholder="Wallet address"
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={!!memberErrors?.wallet}
                    aria-label={`Team member ${i + 1} wallet`}
                  />
                  {memberErrors?.wallet && <p className="mt-1 text-xs text-rose-700">{memberErrors.wallet.message}</p>}
                </div>
                <div>
                  <input
                    {...register(`members.${i}.role`)}
                    list="role-suggestions"
                    className={inputClass}
                    placeholder="Role, e.g. Designer"
                    aria-invalid={!!memberErrors?.role}
                    aria-label={`Team member ${i + 1} role`}
                  />
                  {memberErrors?.role && <p className="mt-1 text-xs text-rose-700">{memberErrors.role.message}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={fields.length === 1}
                  className="rounded-lg px-2 py-2 text-sm text-slate-500 hover:text-rose-700 disabled:invisible"
                >
                  Remove
                </button>
              </div>
              {profile?.displayName && (
                <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
                  <PersonLabel wallet={wallet} profile={profile} role={profile.skills?.join(', ')} />
                  {profile.bio && <p className="line-clamp-2 text-xs text-slate-500">{profile.bio}</p>}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {errors.members?.root?.message && <p className="text-sm text-rose-700">{errors.members.root.message}</p>}
      {errors.members?.message && <p className="text-sm text-rose-700">{errors.members.message}</p>}

      <button
        type="button"
        onClick={() => append({ wallet: '', role: '' })}
        disabled={fields.length >= MAX_MEMBERS}
        className={secondaryButtonClass}
      >
        + Add team member
      </button>
    </div>
  )
}
