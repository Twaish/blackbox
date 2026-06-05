import { useQuery } from '@tanstack/react-query'
import { EmptyIndicator } from '../ui/EmptyIndicator'
import { getVaultsQueryOptions } from '../../queries'

export function EmptyVaultsView() {
  const { data: vaults, isPending } = useQuery(getVaultsQueryOptions())

  if (isPending || vaults?.length) return

  return (
    <EmptyIndicator>
      <EmptyIndicator.Content className="max-w-md">
        <EmptyIndicator.Description className="text-center">
          No vaults
        </EmptyIndicator.Description>
        <div className="text-muted-foreground flex flex-col items-center gap-2 text-xs">
          <span>Create a vault from the top bar selector</span>
        </div>
      </EmptyIndicator.Content>
    </EmptyIndicator>
  )
}
