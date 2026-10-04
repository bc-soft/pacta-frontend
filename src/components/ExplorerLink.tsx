import type { ReactNode } from 'react'
import { explorerAddressUrl, explorerTxUrl } from '../lib/solana/connection'

type Props = ({ signature: string; address?: never } | { address: string; signature?: never }) & {
  children?: ReactNode
  className?: string
}

export function ExplorerLink({ signature, address, children, className }: Props) {
  const href = signature ? explorerTxUrl(signature) : explorerAddressUrl(address!)
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className ?? 'font-medium text-brand-600 underline underline-offset-2 hover:text-brand-800'}
    >
      {children ?? 'View on Solana Explorer ↗'}
    </a>
  )
}
