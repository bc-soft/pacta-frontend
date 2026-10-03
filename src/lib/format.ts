import type { BN } from '@coral-xyz/anchor'
import { USDC_DECIMALS } from './solana/amounts'

const usdcFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

/** Formats base units (USDC × 1 000 000) as "1,000 USDC". */
export function formatUsdc(baseUnits: bigint | BN | number): string {
  const value = BigInt(baseUnits.toString())
  const divisor = 10n ** BigInt(USDC_DECIMALS)
  const whole = Number(value / divisor) + Number(value % divisor) / Number(divisor)
  return `${usdcFormatter.format(whole)} USDC`
}

export const shortAddress = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`
