import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { Field, inputClass, secondaryButtonClass } from '../../../../components/form'
import { formatUsdc } from '../../../../lib/format'
import { BPS_TOTAL, bpsToPercent, evenSplitBps, percentToBps, shareOf, usdcToBaseUnits } from '../../../../lib/solana/amounts'
import { PersonLabel } from '../../../profile/PersonLabel'
import { MEMBER_ROLE_LABELS } from '../../../../lib/roles'
import { useProfiles } from '../../../profile/useProfiles'
import { MAX_MILESTONES, type ProjectForm } from '../schema'

export function MilestonesStep() {
  const { control } = useFormContext<ProjectForm>()
  const { fields, append, remove } = useFieldArray({ control, name: 'milestones' })
  const members = useWatch({ control, name: 'members' })

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-600">
        Split the job into milestones. Each one is funded and paid out separately — when you accept it, the amount is
        sent to the team automatically, in the shares you set here.
      </p>

      {fields.map((field, i) => (
        <MilestoneCard key={field.id} index={i} onRemove={fields.length > 1 ? () => remove(i) : undefined} />
      ))}

      <button
        type="button"
        onClick={() =>
          append({
            title: '',
            amount: '',
            acceptanceCriteria: '',
            split: evenSplitBps(members.length).map(bpsToPercent),
          })
        }
        disabled={fields.length >= MAX_MILESTONES}
        className={secondaryButtonClass}
      >
        + Add milestone
      </button>
    </div>
  )
}

function MilestoneCard({ index, onRemove }: { index: number; onRemove?: () => void }) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<ProjectForm>()
  const members = useWatch({ control, name: 'members' })
  const milestone = useWatch({ control, name: `milestones.${index}` })
  const profiles = useProfiles(members.map((m) => m.wallet.trim()))

  const fieldErrors = errors.milestones?.[index]
  const splitError = fieldErrors?.split?.root?.message ?? fieldErrors?.split?.message
  const amount = usdcToBaseUnits(milestone.amount ?? '')
  const totalBps = milestone.split.reduce((sum, p) => sum + (percentToBps(p) ?? 0), 0)

  const splitEvenly = () =>
    setValue(`milestones.${index}.split`, evenSplitBps(members.length).map(bpsToPercent), {
      shouldValidate: true,
      shouldDirty: true,
    })

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Milestone {index + 1}</h3>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-sm text-ink-500 hover:text-rose-700">
            Remove
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <Field label="Name" error={fieldErrors?.title?.message}>
          <input
            {...register(`milestones.${index}.title`)}
            className={inputClass}
            placeholder="Design mockups"
            aria-invalid={!!fieldErrors?.title}
          />
        </Field>
        <Field label="Amount" error={fieldErrors?.amount?.message}>
          <div className="relative">
            <input
              {...register(`milestones.${index}.amount`)}
              inputMode="decimal"
              className={`${inputClass} pr-14 text-right tabular-nums`}
              placeholder="1000"
              aria-invalid={!!fieldErrors?.amount}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-500">
              USDC
            </span>
          </div>
        </Field>
      </div>

      <div className="mt-4">
        <Field
          label="Done when…"
          hint="Acceptance criteria. If there's ever a dispute, the arbiter judges the work against exactly this."
          error={fieldErrors?.acceptanceCriteria?.message}
        >
          <textarea
            {...register(`milestones.${index}.acceptanceCriteria`)}
            rows={3}
            className={inputClass}
            placeholder="3 screens in Figma (home, pricing, contact), desktop + mobile, approved copy"
            aria-invalid={!!fieldErrors?.acceptanceCriteria}
          />
        </Field>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-800">Who gets what</span>
          <button type="button" onClick={splitEvenly} className="text-sm font-medium text-brand-600 hover:text-brand-800">
            Split evenly
          </button>
        </div>
        <ul className="mt-2 divide-y divide-ink-100 rounded-xl border border-ink-200">
          {members.map((member, j) => {
            const wallet = member.wallet.trim()
            const bps = percentToBps(milestone.split[j] ?? '')
            return (
              <li key={j} className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <PersonLabel wallet={wallet || '?'} profile={profiles[wallet]} role={MEMBER_ROLE_LABELS[member.role]} />
                </div>
                <div className="relative w-24">
                  <input
                    {...register(`milestones.${index}.split.${j}`)}
                    inputMode="decimal"
                    className={`${inputClass} pr-7 text-right tabular-nums`}
                    aria-label={`Share for team member ${j + 1}`}
                    aria-invalid={!!fieldErrors?.split?.[j]}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-500">
                    %
                  </span>
                </div>
                <span className="w-28 text-right text-sm tabular-nums text-ink-600">
                  {amount && bps !== null ? formatUsdc(shareOf(amount, bps)) : '—'}
                </span>
              </li>
            )
          })}
        </ul>
        <p className={`mt-2 text-right text-sm tabular-nums ${totalBps === BPS_TOTAL ? 'text-emerald-700' : 'text-rose-700'}`}>
          Total: {totalBps / 100}%
        </p>
        {splitError && <p className="text-sm text-rose-700">{splitError}</p>}
      </div>
    </section>
  )
}
