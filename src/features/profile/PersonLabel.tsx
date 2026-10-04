import { ShortAddress } from '../../components/ShortAddress'
import type { Profile } from '../../lib/api'
import { Avatar } from './Avatar'

/** Avatar + name (or short address when there's no profile) + optional role. */
export function PersonLabel({ wallet, profile, role }: { wallet: string; profile?: Profile; role?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar wallet={wallet} profile={profile} size="sm" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {profile?.displayName ?? <ShortAddress address={wallet} />}
        </span>
        {role && <span className="block truncate text-xs text-ink-500">{role}</span>}
      </span>
    </span>
  )
}
