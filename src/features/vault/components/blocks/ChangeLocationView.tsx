import { useChangeVaultLocation } from '../../mutations'
import { EmptyIndicator } from '../ui/EmptyIndicator'
import { useVaultFiles } from '../../contexts/useVaultFiles'
import { selectFolder } from '@/app/instance/actions'
import { Button } from '@/components/ui/button'

export function ChangeLocationView() {
  const vaultId = useVaultFiles()
  const {
    mutate: changeLocation,
    isPending,
    error,
  } = useChangeVaultLocation(vaultId)

  const handleChangeLocation = async () => {
    const folderPath = await selectFolder()
    if (!folderPath) return

    changeLocation(folderPath)
  }

  return (
    <EmptyIndicator>
      <EmptyIndicator.Content>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground max-w-md text-sm">
              The vault may have been moved, renamed, or is no longer available
            </div>
          </div>

          <Button disabled={isPending} onClick={handleChangeLocation}>
            {isPending ? 'Updating location...' : 'Choose vault folder'}
          </Button>
          {error && <div className="text-xs">{error.message}</div>}
        </div>
      </EmptyIndicator.Content>
    </EmptyIndicator>
  )
}
