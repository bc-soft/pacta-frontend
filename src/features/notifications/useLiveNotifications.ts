import { useWallet } from '@solana/wallet-adapter-react'
import { useQueryClient } from '@tanstack/react-query'
import { createElement, useEffect } from 'react'
import { Link } from 'react-router'
import { useToast } from '../../components/toast/useToast'
import { subscribe } from '../../lib/mercure/subscribe'

/** Mercure → toast + refetch of the affected project, so other demo wallets see changes without F5. */
export function useLiveNotifications() {
  const { publicKey } = useWallet()
  const wallet = publicKey?.toBase58()
  const queryClient = useQueryClient()
  const toast = useToast()

  useEffect(() => {
    if (!wallet) return
    return subscribe(wallet, (n) => {
      toast({
        title: n.title,
        body: n.pda ? createElement(Link, { to: `/projects/${n.pda}`, className: 'font-medium text-indigo-600' }, 'Open project →') : undefined,
      })
      if (n.pda) {
        for (const key of ['chain', 'project', 'history']) void queryClient.invalidateQueries({ queryKey: [key, n.pda] })
      }
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['chain', 'projects'] })
    })
  }, [wallet, queryClient, toast])
}
