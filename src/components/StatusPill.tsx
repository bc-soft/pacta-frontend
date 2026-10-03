const TONES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-sky-100 text-sky-800',
  completed: 'bg-emerald-100 text-emerald-800',
  created: 'bg-slate-100 text-slate-700',
  funded: 'bg-indigo-100 text-indigo-800',
  submitted: 'bg-violet-100 text-violet-800',
  changesRequested: 'bg-amber-100 text-amber-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  disputed: 'bg-rose-100 text-rose-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-200 text-slate-600',
}

/** `status` picks the colour, `label` is what the user reads (defaults to the status). */
export function StatusPill({ status, label }: { status: string; label?: string }) {
  const tone = TONES[status] ?? 'bg-slate-100 text-slate-700'
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {label ?? status}
    </span>
  )
}
