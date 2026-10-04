import { useAuth } from './useAuth'

/** Call before an authenticated backend write: signs in with the wallet if there's no valid session yet. */
export function useBackendAuth() {
  return useAuth().ensureSignedIn
}
