import { env } from '../../env'
import type { Notification } from '../api/types'

/** Live notifications for a wallet. Dev hub allows anonymous subscribe. Returns an unsubscribe function. */
export function subscribe(wallet: string, onNotification: (n: Notification) => void): () => void {
  const url = new URL(env.mercureUrl)
  url.searchParams.append('topic', `/wallets/${wallet}`)

  const es = new EventSource(url, { withCredentials: false })
  es.onmessage = (event) => {
    try {
      onNotification(JSON.parse(event.data) as Notification)
    } catch {
      // ignore malformed payloads
    }
  }

  return () => es.close()
}
