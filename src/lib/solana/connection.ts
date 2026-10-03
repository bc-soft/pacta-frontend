import { env } from '../../env'

export const USDC_DECIMALS = 6

const clusterParam = env.cluster === 'mainnet-beta' ? '' : `?cluster=${env.cluster}`

export const explorerTxUrl = (signature: string) => `https://explorer.solana.com/tx/${signature}${clusterParam}`

export const explorerAddressUrl = (address: string) =>
  `https://explorer.solana.com/address/${address}${clusterParam}`
