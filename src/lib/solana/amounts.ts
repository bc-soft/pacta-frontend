import { BN } from '@coral-xyz/anchor'
export const USDC_DECIMALS = 6
export const BPS_TOTAL = 10_000

/** "1000.5" → 1 000 500 000 base units. Exact (no float math). Returns null for invalid input. */
export function usdcToBaseUnits(value: string): BN | null {
  const match = /^(\d+)(?:\.(\d*))?$/.exec(value.trim())
  if (!match) return null
  const [, whole, fraction = ''] = match
  if (fraction.length > USDC_DECIMALS) return null
  return new BN(whole + fraction.padEnd(USDC_DECIMALS, '0'))
}

/** "33.33" % → 3333 bps. Up to 2 decimals. Returns null for invalid input. */
export function percentToBps(value: string | number): number | null {
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(String(value).trim())
  if (!match) return null
  const [, whole, fraction = ''] = match
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}

export const bpsToPercent = (bps: number) => (bps / 100).toString()

/** Share of `amount` for a given bps (floor — same as the program's integer math). */
export const shareOf = (amount: BN, bps: number) => amount.muln(bps).divn(BPS_TOTAL)

/** Even split in bps; the remainder goes to the first people so the total is exactly 10 000. */
export function evenSplitBps(count: number): number[] {
  if (count === 0) return []
  const base = Math.floor(BPS_TOTAL / count)
  const remainder = BPS_TOTAL - base * count
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0))
}
