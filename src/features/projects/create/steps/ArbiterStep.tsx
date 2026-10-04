import { useFormContext, useWatch } from 'react-hook-form'
import { Field, inputClass } from '../../../../components/form'
import { PersonLabel } from '../../../profile/PersonLabel'
import { useProfiles } from '../../../profile/useProfiles'
import type { ProjectForm } from '../schema'

export function ArbiterStep() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ProjectForm>()
  const arbiter = useWatch({ control, name: 'arbiter' }).trim()
  const profile = useProfiles([arbiter])[arbiter]

  return (
    <div className="space-y-5">
      <div className="space-y-2 text-sm text-slate-600">
        <p>
          An arbiter is a neutral person both sides trust. If you and the team can&apos;t agree whether a milestone is
          done, the arbiter reads both sides and decides how the money for that milestone is split.
        </p>
        <p>The arbiter never receives any money and can&apos;t touch the funds — only choose one of the fixed splits.</p>
      </div>
      <Field label="Arbiter wallet address" error={errors.arbiter?.message}>
        <input
          {...register('arbiter')}
          className={`${inputClass} font-mono`}
          placeholder="Wallet address of someone outside the project"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!errors.arbiter}
        />
      </Field>
      {arbiter && profile?.displayName && <PersonLabel wallet={arbiter} profile={profile} role="Arbiter" />}
    </div>
  )
}
