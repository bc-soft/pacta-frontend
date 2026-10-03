import { env } from '../../env'

const clusterParam = env.cluster === 'mainnet-beta' ? '' : `?cluster=${env.cluster}`

export const explorerTxUrl = (signature: string) => `https://explorer.solana.com/tx/${signature}${clusterParam}`

export const explorerAddressUrl = (address: string) =>
  `https://explorer.solana.com/address/${address}${clusterParam}`
