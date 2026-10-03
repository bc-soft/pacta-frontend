const TONES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-sky-100 text-sky-800',
  funded: 'bg-indigo-100 text-indigo-800',
  submitted: 'bg-violet-100 text-violet-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-emerald-100 text-emerald-800',
  disputed: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-slate-200 text-slate-600',
}

export function StatusPill({ status }: { status: string }) {
  const tone = TONES[status.toLowerCase()] ?? 'bg-slate-100 text-slate-700'
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{status}</span>
}
