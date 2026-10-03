import { useCallback, useState, type ReactNode } from 'react'
import { ToastContext, type ToastInput } from './toastContext'

const DURATION_MS = 6000
const TONES = {
  info: 'border-slate-200',
  success: 'border-emerald-300',
  error: 'border-rose-300',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<(ToastInput & { id: number })[]>([])

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = Date.now() + Math.random()
      setToasts((all) => [...all.slice(-3), { ...input, id }])
      setTimeout(() => dismiss(id), DURATION_MS)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto w-full max-w-sm rounded-xl border-l-4 bg-white p-4 shadow-lg ${TONES[t.tone ?? 'info']}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{t.title}</p>
              <button type="button" onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss">
                ×
              </button>
            </div>
            {t.body && <div className="mt-1 text-sm text-slate-600">{t.body}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
