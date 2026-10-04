import { useWallet } from '@solana/wallet-adapter-react'
import bs58 from 'bs58'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../../lib/api'
import { setAuthToken, setUnauthorizedHandler } from '../../lib/api/client'
import { AuthContext, type AuthContextValue } from './authContext'

// Backend nonce is single-use and valid 5 min; re-request if the user sat on the wallet popup too long
const NONCE_TTL_MS = 4.5 * 60 * 1000
const MAX_SIGN_ATTEMPTS = 3

const storageKey = (wallet: string) => `pacta.jwt.${wallet}`

const readToken = (wallet: string) => {
  try {
    return sessionStorage.getItem(storageKey(wallet))
  } catch {
    return null
  }
}

const writeToken = (wallet: string, token: string | null) => {
  try {
    if (token) sessionStorage.setItem(storageKey(wallet), token)
    else sessionStorage.removeItem(storageKey(wallet))
  } catch {
    // storage unavailable — token stays in memory only
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage } = useWallet()
  const wallet = publicKey?.toBase58() ?? null

  // Tokens are per wallet: switching accounts in Phantom swaps the session
  const [tokens, setTokens] = useState<Record<string, string | null>>({})
  const [expiredFor, setExpiredFor] = useState<string | null>(null)
  const token = wallet ? (wallet in tokens ? tokens[wallet] : readToken(wallet)) : null
  const sessionExpired = wallet !== null && expiredFor === wallet

  const storeToken = useCallback((forWallet: string, value: string | null) => {
    writeToken(forWallet, value)
    setTokens((prev) => ({ ...prev, [forWallet]: value }))
  }, [])

  // Set during render, not in an effect: children's effects (e.g. the notifications query) run before this
  // provider's effects, so an effect would let them fire without the token, or with the previous wallet's one.
  setAuthToken(token)

  const signOut = useCallback(() => {
    if (wallet) storeToken(wallet, null)
  }, [wallet, storeToken])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut()
      setExpiredFor(wallet)
    })
    return () => setUnauthorizedHandler(null)
  }, [signOut, wallet])

  const signIn = useCallback(async () => {
    if (!wallet) throw new Error('Connect your wallet first')
    if (!signMessage) throw new Error('This wallet cannot sign messages')

    for (let attempt = 1; attempt <= MAX_SIGN_ATTEMPTS; attempt++) {
      const fetchedAt = Date.now()
      const { message } = await api.authNonce(wallet)
      // Sign EXACTLY the server text — no trim, no newline normalisation
      const signature = await signMessage(new TextEncoder().encode(message))
      if (Date.now() - fetchedAt > NONCE_TTL_MS) continue

      const { token: jwt } = await api.authVerify(wallet, message, bs58.encode(signature))
      setAuthToken(jwt) // immediately, so a request right after signIn() is authenticated
      storeToken(wallet, jwt)
      setExpiredFor(null)
      return
    }
    throw new Error('Sign-in took too long. Please try again.')
  }, [wallet, signMessage, storeToken])

  const ensureSignedIn = useCallback(async () => {
    if (!token) await signIn()
  }, [token, signIn])

  const value = useMemo<AuthContextValue>(
    () => ({ isSignedIn: token !== null, sessionExpired, signIn, ensureSignedIn, signOut }),
    [token, sessionExpired, signIn, ensureSignedIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
