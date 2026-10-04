import type { Profile } from '../../lib/api'

const COLORS = ['bg-brand-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-violet-500']

export function Avatar({ wallet, profile, size = 'md' }: { wallet: string; profile?: Profile; size?: 'sm' | 'md' }) {
  const dimension = size === 'sm' ? 'size-7 text-xs' : 'size-9 text-sm'
  if (profile?.avatarUrl) {
    return <img src={profile.avatarUrl} alt="" className={`${dimension} shrink-0 rounded-full object-cover`} />
  }
  const initials = (profile?.displayName ?? wallet).slice(0, 2).toUpperCase()
  const color = COLORS[[...wallet].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length]
  return (
    <span className={`${dimension} ${color} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}>
      {initials}
    </span>
  )
}
