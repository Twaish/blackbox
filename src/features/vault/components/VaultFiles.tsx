import { useQuery } from '@tanstack/react-query'
import { hasSessionQueryOptions } from '../queries'
import { useVaultStore } from '../stores/useVaultStore'
import { FileOverlay } from './blocks/FileOverlay'
import { UnlockView } from './blocks/UnlockView'
import { FileListView } from './blocks/FileListView'
import { FileGridView } from './blocks/FileGridView'
import { VaultFilesContext } from '../contexts/useVaultFiles'
import { useSettingsStore } from '../stores/useSettingsStore'

export function VaultFiles() {
  const vaultId = useVaultStore((s) => s.selectedVaultId)
  const { data: hasSession } = useQuery({
    ...hasSessionQueryOptions(vaultId!),
    enabled: !!vaultId,
  })
  const viewStyle = useSettingsStore((s) => s.viewStyle)

  if (!vaultId) return null

  const FileView = viewStyle === 'grid' ? FileGridView : FileListView

  return (
    <VaultFilesContext.Provider value={vaultId}>
      {hasSession ? <FileView /> : <UnlockView />}
      <FileOverlay />
    </VaultFilesContext.Provider>
  )
}
