import { createContext, type ReactNode } from 'react'

export interface ToastInput {
  title: string
  body?: ReactNode
  tone?: 'info' | 'success' | 'error'
}

export const ToastContext = createContext<((toast: ToastInput) => void) | null>(null)
