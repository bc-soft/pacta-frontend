import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { TxButton } from '../../components/TxButton'
import { formatUsdc } from '../../lib/format'
import type { ChainMilestone } from '../../lib/solana/accounts'
import { buildFundMilestone } from '../../lib/solana/instructions'
import { useProgram } from '../../lib/solana/program'
import { useSendAndSync } from '../../lib/solana/tx'
import { useTokenBalance } from '../../lib/solana/useTokenBalance'
import type { ProjectView } from '../projects/useProject'

export function FundMilestone({ view, milestone }: { view: ProjectView; milestone: ChainMilestone }) {
  const { publicKey } = useWallet()
  const program = useProgram()
  const sendAndSync = useSendAndSync()
  const queryClient = useQueryClient()
  const mint = view.state!.project.mint
  const balance = useTokenBalance(publicKey, mint)
  const enough = balance.data ? balance.data.gte(milestone.amount) : false
  const project = new PublicKey(view.pda)

  return (
    <div className="space-y-3 rounded-lg bg-indigo-50/60 p-4">
      <dl className="grid grid-cols-2 gap-3 text-sm sm:max-w-md">
        <div>
          <dt className="text-slate-500">In your wallet</dt>
          <dd className="font-semibold tabular-nums">{balance.data ? formatUsdc(balance.data) : '…'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">To lock in escrow</dt>
          <dd className="font-semibold tabular-nums">{formatUsdc(milestone.amount)}</dd>
        </div>
      </dl>
      {balance.data && !enough && (
        <p className="text-sm text-rose-700">You don&apos;t have enough USDC in this wallet to fund this milestone.</p>
      )}
      <TxButton
        label={`Lock ${formatUsdc(milestone.amount)} in escrow`}
        successText="Funds secured on-chain"
        disabled={!program || !enough}
        run={(onPhase) =>
          sendAndSync(() => buildFundMilestone(program!, publicKey!, mint, { project, index: milestone.index }), project, onPhase)
        }
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['tokenBalance'] })}
      />
      <p className="text-xs text-slate-500">
        The money leaves your wallet and is held by the contract. It is released to the team only when you accept the
        work (or the arbiter decides).
      </p>
    </div>
  )
}
