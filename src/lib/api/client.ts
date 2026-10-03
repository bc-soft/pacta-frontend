import { env } from '../../env'
import type { ProblemDetails } from './types'

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title)
    this.status = problem.status
    this.problem = problem
  }
}

// JWT lives in memory; AuthProvider mirrors it to sessionStorage so F5 doesn't log the user out.
let token: string | null = null
let wallet: string | null = null
let onUnauthorized: (() => void) | null = null

/** Connected wallet — the real backend knows it from the JWT; fakeApi needs it explicitly. */
export const setApiWallet = (value: string | null) => {
  wallet = value
}
export const getApiWallet = () => wallet

export const setAuthToken = (value: string | null) => {
  token = value
}

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    // Typical locally: self-signed cert not yet accepted at VITE_API_URL
    throw new ApiError({ status: 0, title: 'Network error', detail: 'Cannot reach the server.' })
  }

  if (response.status === 401 && token) onUnauthorized?.()

  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new ApiError(
      problem && typeof problem === 'object' && 'title' in problem
        ? (problem as ProblemDetails)
        : { status: response.status, title: response.statusText || 'Request failed' },
    )
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
