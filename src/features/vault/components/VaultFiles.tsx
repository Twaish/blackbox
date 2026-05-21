import { useQuery } from '@tanstack/react-query'
import { hasSessionQueryOptions, viewStyleQueryOptions } from '../queries'
import { createContext, useContext } from 'react'
import { create } from 'zustand'
import { useVaultStore } from '../stores/useVaultStore'
import { FileOverlay } from './blocks/FileOverlay'
import { UnlockView } from './blocks/UnlockView'
import { FileListView } from './blocks/FileListView'
import { FileGridView } from './blocks/FileGridView'

type VaultFilesStore = {
  files: string[]
  selectedFileId?: string
  selectedVaultId?: string

  setFiles: (files: string[]) => void
  setSelectedFileId: (fileId?: string, vaultId?: string) => void

  selectNext: () => void
  selectPrev: () => void
}

export const useVaultFilesStore = create<VaultFilesStore>((set, get) => ({
  files: [],
  selectedFileId: undefined,
  selectedVaultId: undefined,

  setFiles: (files) => set({ files }),
  setSelectedFileId: (fileId, vaultId) =>
    set({
      selectedFileId: fileId,
      selectedVaultId: vaultId,
    }),

  selectNext: () => {
    const { files, selectedFileId } = get()
    if (!selectedFileId) return

    const index = files.findIndex((fileId) => fileId === selectedFileId)

    const next = files[index + 1]
    if (next) {
      set({ selectedFileId: next })
    }
  },

  selectPrev: () => {
    const { files, selectedFileId } = get()
    if (!selectedFileId) return

    const index = files.findIndex((fileId) => fileId === selectedFileId)

    const prev = files[index - 1]
    if (prev) {
      set({ selectedFileId: prev })
    }
  },
}))

const VaultFilesContext = createContext<string | null>(null)

export function useVaultFiles() {
  const ctx = useContext(VaultFilesContext)
  if (!ctx) {
    throw new Error('useVaultFiles must be used within VaultFiles')
  }
  return ctx
}

export function VaultFiles() {
  const vaultId = useVaultStore((s) => s.selectedVaultId)
  const { data: hasSession } = useQuery({
    ...hasSessionQueryOptions(vaultId!),
    enabled: !!vaultId,
  })
  const { data: viewStyle } = useQuery(viewStyleQueryOptions())

  if (!vaultId) return null

  const FileView = viewStyle === 'grid' ? FileGridView : FileListView

  return (
    <VaultFilesContext.Provider value={vaultId}>
      {hasSession ? <FileView /> : <UnlockView />}
      <FileOverlay />
    </VaultFilesContext.Provider>
  )
}
