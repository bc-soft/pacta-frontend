import { useState } from 'react'
import { describeTxError } from '../lib/solana/errors'
import type { TxPhase } from '../lib/solana/tx'
import { ExplorerLink } from './ExplorerLink'

type State =
  | { phase: TxPhase }
  | { phase: 'success'; signature: string }
  | { phase: 'cancelled' | 'error'; message: string }

interface Props {
  label: string
  /** Typically `(onPhase) => sendAndSync(build, pda, onPhase)` */
  run: (onPhase: (phase: TxPhase) => void) => Promise<string>
  onSuccess?: (signature: string) => void
  successText?: string
  disabled?: boolean
}

/** Every transactional button: idle → Confirm in wallet → Confirming… → success with Explorer link, or a readable error. */
export function TxButton({ label, run, onSuccess, successText = 'Confirmed on-chain', disabled }: Props) {
  const [state, setState] = useState<State>({ phase: 'idle' })
  const busy = state.phase === 'signing' || state.phase === 'confirming'

  const handleClick = async () => {
    setState({ phase: 'signing' })
    try {
      const signature = await run((phase) => setState({ phase }))
      setState({ phase: 'success', signature })
      onSuccess?.(signature)
    } catch (error) {
      console.error(error)
      const { kind, message } = describeTxError(error)
      setState({ phase: kind, message })
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || busy}
        className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state.phase === 'signing' ? 'Confirm in wallet…' : state.phase === 'confirming' ? 'Confirming…' : label}
      </button>
      {state.phase === 'success' && (
        <p className="text-sm text-emerald-700">
          {successText} · <ExplorerLink signature={state.signature} />
        </p>
      )}
      {state.phase === 'cancelled' && <p className="text-sm text-slate-500">{state.message}</p>}
      {state.phase === 'error' && <p className="text-sm text-rose-700">{state.message}</p>}
    </div>
  )
}
