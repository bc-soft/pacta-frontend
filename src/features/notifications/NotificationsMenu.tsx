import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { ExplorerLink } from '../../components/ExplorerLink'
import { api } from '../../lib/api'
import { useAuth } from '../auth/useAuth'

/** Bell with the stored notifications. Needs a backend session — we don't force a sign-in just to show it. */
export function NotificationsMenu() {
  const { isSignedIn } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications,
    enabled: isSignedIn,
    retry: false,
  })
  if (!isSignedIn) return null

  const items = notifications.data?.items ?? []
  const unread = items.filter((n) => !n.read).length

  const markRead = async (id: string) => {
    await api.markNotificationRead(id).catch(() => {})
    await queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-10 items-center justify-center rounded-xl bg-white text-ink-600 shadow-xs ring-1 ring-ink-200 transition hover:text-ink-900 hover:ring-ink-300"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 card p-2 shadow-lg">
          {items.length === 0 ? (
            <p className="p-3 text-sm text-ink-500">No notifications yet.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className={`rounded-lg p-3 text-sm ${n.read ? '' : 'bg-brand-50/60'}`}>
                  {n.projectPda ? (
                    <Link
                      to={`/projects/${n.projectPda}`}
                      onClick={() => {
                        setOpen(false)
                        if (!n.read) void markRead(n.id)
                      }}
                      className="font-medium hover:underline"
                    >
                      {n.title}
                    </Link>
                  ) : (
                    <p className="font-medium">{n.title}</p>
                  )}
                  {n.body && <p className="mt-0.5 text-xs text-ink-600">{n.body}</p>}
                  {n.signature && (
                    <p className="mt-0.5 text-xs">
                      <ExplorerLink signature={n.signature}>Explorer ↗</ExplorerLink>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
