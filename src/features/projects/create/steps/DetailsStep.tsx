import { useFormContext } from 'react-hook-form'
import { Field, inputClass } from '../../../../components/form'
import type { ProjectForm } from '../schema'

export function DetailsStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProjectForm>()

  return (
    <div className="space-y-5">
      <Field label="Project name" error={errors.title?.message}>
        <input {...register('title')} className={inputClass} placeholder="Landing page for Acme" aria-invalid={!!errors.title} />
      </Field>
      <Field
        label="What needs to be done?"
        hint="A short brief everyone on the team will see."
        error={errors.description?.message}
      >
        <textarea {...register('description')} rows={5} className={inputClass} aria-invalid={!!errors.description} />
      </Field>
    </div>
  )
}
