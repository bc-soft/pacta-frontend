import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../features/auth/useAuth'
import { NotificationsMenu } from '../features/notifications/NotificationsMenu'
import { useLiveNotifications } from '../features/notifications/useLiveNotifications'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`

export function Layout() {
  const { sessionExpired, signIn } = useAuth()
  useLiveNotifications()

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-4 sm:gap-6">
            <NavLink to="/" className="text-lg font-bold tracking-tight">
              Pacta
            </NavLink>
            <nav className="flex gap-4">
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
        <div className="bg-rose-50 px-4 py-2 text-center text-sm text-rose-800">
          Your session has expired.{' '}
          <button type="button" className="font-semibold underline" onClick={() => signIn().catch(console.error)}>
            Sign in again
          </button>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
