import { useCallback } from 'react'
import { env } from '../../env'
import { useAuth } from './useAuth'

/** Call before an authenticated backend write. The fake API needs no sign-in, so this is a no-op there. */
export function useBackendAuth() {
  const { ensureSignedIn } = useAuth()
  return useCallback(async () => {
    if (!env.useFakeApi) await ensureSignedIn()
  }, [ensureSignedIn])
}
