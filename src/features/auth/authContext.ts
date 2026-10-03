import { createContext } from 'react'

export interface AuthContextValue {
  isSignedIn: boolean
  /** Set after a 401 so the UI can show "Sign in again" */
  sessionExpired: boolean
  /** Sign-In With Solana. Call lazily — only when the user wants to save something in the backend. */
  signIn: () => Promise<void>
  /** Signs in if needed; use before any authenticated write. */
  ensureSignedIn: () => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
