import { useQuery } from '@tanstack/react-query'
import { existsQueryOptions } from '../queries'
import { useVaultStore } from '../stores/useVaultStore'
import { FileOverlay } from './blocks/FileOverlay'
import { UnlockView } from './blocks/UnlockView'
import { FileListView } from './blocks/FileListView'
import { FileGridView } from './blocks/FileGridView'
import { VaultFilesContext } from '../contexts/useVaultFiles'
import { useSettingsStore } from '../stores/useSettingsStore'
import { ChangeLocationView } from './blocks/ChangeLocationView'
import { SelectionBar } from './SelectionBar'
import { EmptyVaultsView } from './blocks/EmptyVaultsView'
import { useHasVaultSession } from '../hooks/useHasVaultSession'

export function VaultFiles() {
  const vaultId = useVaultStore((s) => s.selectedVaultId)

  if (!vaultId) return <EmptyVaultsView />

  return <VaultFilesContent vaultId={vaultId} />
}

function VaultFilesContent({ vaultId }: { vaultId: string }) {
  const { data: exists = true } = useQuery({
    ...existsQueryOptions(vaultId),
    enabled: !!vaultId,
  })

  if (!exists) return <ChangeLocationView />

  return (
    <VaultFilesContext.Provider value={vaultId}>
      <VaultFilesBody vaultId={vaultId} />
    </VaultFilesContext.Provider>
  )
}
function VaultFilesBody({ vaultId }: { vaultId: string }) {
  const { hasSession } = useHasVaultSession(vaultId)
  return hasSession ? (
    <>
      <FileView />
      <FileOverlay />
      <SelectionBar />
    </>
  ) : (
    <UnlockView />
  )
}

function FileView() {
  const viewStyle = useSettingsStore((s) => s.viewStyle)

  if (viewStyle === 'grid') return <FileGridView />
  return <FileListView />
}
