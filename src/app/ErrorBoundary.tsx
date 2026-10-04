import { Component, type ErrorInfo, type ReactNode } from 'react'

/** Last line of defence: a crash outside the router would otherwise leave a blank page mid-demo. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <img src="/brand/favicon.png" alt="" className="size-14" />
        <h1 className="mt-4 text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-600">
          Your funds are safe: they only move through the program on Solana. Reload the page to continue.
        </p>
        <pre className="mt-4 max-w-full overflow-x-auto rounded-xl bg-ink-100 px-3 py-2 text-left text-xs text-ink-600">
          {this.state.error.message}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500"
        >
          Reload
        </button>
      </div>
    )
  }
}
