import type { BN } from '@coral-xyz/anchor'
import { formatUsdc } from '../lib/format'

export function AmountUsdc({ baseUnits, className }: { baseUnits: bigint | BN | number; className?: string }) {
  return <span className={className ?? 'tabular-nums'}>{formatUsdc(baseUnits)}</span>
}
