import { useQuery } from '@tanstack/react-query'
import { api, type Profile } from '../../lib/api'

/** Public profiles for a list of wallets. Missing profiles (or a backend outage) just mean "show the address". */
export function useProfiles(wallets: string[]): Record<string, Profile | undefined> {
  const unique = [...new Set(wallets.filter(Boolean))].sort()
  const { data } = useQuery({
    queryKey: ['profiles', unique],
    queryFn: () => api.profiles(unique),
    enabled: unique.length > 0,
    staleTime: 60_000,
    retry: false,
  })
  return Object.fromEntries((data ?? []).map((p) => [p.wallet, p]))
}
