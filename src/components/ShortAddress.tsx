import { shortAddress } from '../lib/format'

export function ShortAddress({ address }: { address: string }) {
  return (
    <span title={address} className="font-mono">
      {shortAddress(address)}
    </span>
  )
}
