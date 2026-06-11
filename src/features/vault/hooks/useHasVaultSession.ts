import { useQuery } from '@tanstack/react-query'
import { hasSessionQueryOptions } from '../queries'

export function useHasVaultSession(vaultId?: string | null) {
  const query = useQuery({
    ...hasSessionQueryOptions(vaultId!),
    enabled: !!vaultId,
  })

  return {
    hasSession: query.data,
    ...query,
  }
}
