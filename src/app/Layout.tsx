import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { NavLink, Outlet } from 'react-router'
import { env } from '../env'
import { useAuth } from '../features/auth/useAuth'
import { NotificationsMenu } from '../features/notifications/NotificationsMenu'
import { useLiveNotifications } from '../features/notifications/useLiveNotifications'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
    isActive ? 'bg-ink-900/[0.06] text-ink-900' : 'text-ink-500 hover:bg-ink-900/[0.04] hover:text-ink-900'
  }`

export function Layout() {
  const { sessionExpired, signIn } = useAuth()
  useLiveNotifications()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-900/[0.06] bg-white/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-8">
            <NavLink
              to="/"
              aria-label="Pacta home"
              className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
            >
              <img src="/brand/logo-horizontal.png" alt="Pacta" className="h-8 w-auto" width={94} height={32} />
            </NavLink>
            <nav className="flex gap-1">
              <NavLink to="/" end className={navClass}>
                Projects
              </NavLink>
              <NavLink to="/profile" className={navClass}>
                Profile
              </NavLink>
              <NavLink to="/health" className={navClass}>
                Status
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsMenu />
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {sessionExpired && (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-sm text-rose-800">
          Your session has expired.{' '}
          <button
            type="button"
            className="font-semibold underline underline-offset-2"
            onClick={() => signIn().catch(console.error)}
          >
            Sign in again
          </button>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-ink-900/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-ink-500 sm:px-6">
          <span>Pacta · escrow and automatic payouts for freelance teams</span>
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
            Solana {env.cluster}
          </span>
        </div>
      </footer>
    </div>
  )
}
