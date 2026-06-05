import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { existsQueryOptions, hasSessionQueryOptions } from '../queries'
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

export function VaultFiles() {
  const vaultId = useVaultStore((s) => s.selectedVaultId)
  const { data: hasSession } = useQuery({
    ...hasSessionQueryOptions(vaultId!),
    enabled: !!vaultId,
  })
  const { data: exists = true } = useQuery({
    ...existsQueryOptions(vaultId!),
    enabled: !!vaultId,
  })
  const viewStyle = useSettingsStore((s) => s.viewStyle)

  if (!vaultId) return <EmptyVaultsView />

  const FileView = viewStyle === 'grid' ? FileGridView : FileListView

  return (
    <VaultFilesContext.Provider value={vaultId}>
      {exists ? (
        <>
          {hasSession ? <FileView /> : <UnlockView />}
          <FileOverlay />
          <SelectionBar />
        </>
      ) : (
        <ChangeLocationView />
      )}
    </VaultFilesContext.Provider>
  )
}
