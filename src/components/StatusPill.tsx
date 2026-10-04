const TONES: Record<string, { pill: string; dot: string }> = {
  draft: { pill: 'bg-ink-100 text-ink-700 ring-ink-200', dot: 'bg-ink-400' },
  created: { pill: 'bg-ink-100 text-ink-700 ring-ink-200', dot: 'bg-ink-400' },
  active: { pill: 'bg-brand-50 text-brand-700 ring-brand-200', dot: 'bg-brand-500' },
  completed: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  funded: { pill: 'bg-brand-50 text-brand-700 ring-brand-200', dot: 'bg-brand-500' },
  inProgress: { pill: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500 animate-pulse' },
  submitted: { pill: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
  changesRequested: { pill: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  disputed: { pill: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
  paid: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  cancelled: { pill: 'bg-ink-100 text-ink-500 ring-ink-200', dot: 'bg-ink-300' },
}

/** `status` picks the colour, `label` is what the user reads (defaults to the status). */
export function StatusPill({ status, label }: { status: string; label?: string }) {
  const tone = TONES[status] ?? TONES.draft
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone.pill}`}
    >
      <span className={`size-1.5 rounded-full ${tone.dot}`} aria-hidden />
      {label ?? status}
    </span>
  )
}
