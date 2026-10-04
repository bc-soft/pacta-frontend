import type { ReactNode } from 'react'

export const inputClass =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-xs transition placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 aria-invalid:border-rose-400 aria-invalid:focus:ring-rose-500/15'

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-500 hover:shadow-brand-500/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:active:scale-100'

export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 shadow-xs ring-1 ring-ink-200 transition hover:bg-ink-50 hover:ring-ink-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100'

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink-800">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-ink-500">{hint}</span>}
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-xs text-rose-700">{error}</span>}
    </label>
  )
}
