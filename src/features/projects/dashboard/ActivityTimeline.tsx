import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { ExplorerLink } from '../../../components/ExplorerLink'
import { api } from '../../../lib/api'

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

const humanize = (type: string) => {
  const words = type.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

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
        .sort((a, b) => b.at.localeCompare(a.at))
        .map((e, i) => ({
          key: e.signature ?? `${e.at}-${i}`,
          label: humanize(e.type) + (e.milestoneIndex !== undefined ? ` · milestone ${e.milestoneIndex + 1}` : ''),
          at: new Date(e.at),
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
