import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { ExplorerLink } from '../../../components/ExplorerLink'
import { api } from '../../../lib/api'

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

// Program instructions (snake_case, as recorded by the backend) in plain words
const INSTRUCTION_LABELS: Record<string, string> = {
  create_project: 'Contract created',
  create_milestone: 'Milestone added',
  accept_contract: 'Team member confirmed the contract',
  fund_milestone: 'Milestone funded',
  start_milestone: 'Work started',
  submit_milestone: 'Work submitted for review',
  request_changes: 'Client requested changes',
  accept_milestone: 'Milestone accepted · team paid',
  open_dispute: 'Dispute opened',
  resolve_dispute: 'Arbiter decided the dispute',
  cancel_unstarted_milestone: 'Milestone cancelled · client refunded',
}

const humanize = (instruction: string) => {
  const words = instruction.replace(/[_-]+/g, ' ').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const instructionLabel = (instruction: string | null) =>
  instruction ? (INSTRUCTION_LABELS[instruction] ?? humanize(instruction)) : 'Transaction'

interface Row {
  key: string
  label: string
  at: Date | null
  signature?: string
}

/** Project history with Explorer links: backend timeline when available, raw on-chain signatures otherwise. */
export function ActivityTimeline({ pda }: { pda: string }) {
  const { connection } = useConnection()

  const backend = useQuery({ queryKey: ['history', pda], queryFn: () => api.history(pda), retry: false })
  const useChain = backend.isError || (backend.isSuccess && backend.data.length === 0)
  const chain = useQuery({
    queryKey: ['chain', pda, 'signatures'],
    queryFn: () => connection.getSignaturesForAddress(new PublicKey(pda), { limit: 20 }, 'confirmed'),
    enabled: useChain,
  })

  const rows: Row[] = useChain
    ? (chain.data ?? []).map((s) => ({
        key: s.signature,
        label: s.err ? 'Failed transaction' : 'Transaction',
        at: s.blockTime ? new Date(s.blockTime * 1000) : null,
        signature: s.signature,
      }))
    : [...(backend.data ?? [])]
        .sort((a, b) => b.slot - a.slot)
        .map((e) => ({
          key: e.signature,
          label: e.success ? instructionLabel(e.instruction) : `Failed: ${instructionLabel(e.instruction).toLowerCase()}`,
          at: e.blockTime ? new Date(e.blockTime) : null,
          signature: e.signature,
        }))

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold">Activity</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No activity yet.</p>
      ) : (
        <ol className="mt-3 space-y-3 border-l border-slate-200 pl-4">
          {rows.map((row) => (
            <li key={row.key} className="relative text-sm">
              <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-indigo-400" />
              <p className="font-medium">{row.label}</p>
              <p className="text-xs text-slate-500">
                {row.at ? dateFormat.format(row.at) : 'Pending'}
                {row.signature && (
                  <>
                    {' · '}
                    <ExplorerLink signature={row.signature}>Explorer ↗</ExplorerLink>
                  </>
                )}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
