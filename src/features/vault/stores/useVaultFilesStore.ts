import { create } from 'zustand'

type VaultFilesStore = {
  files: string[]
  newFileIds: Set<string>
  selectedFileId?: string
  selectedVaultId?: string

  setFiles: (files: string[]) => void
  setSelectedFileId: (fileId?: string, vaultId?: string) => void

  selectNext: () => void
  selectPrev: () => void

  markNewFile: (fileId: string) => void
  clearNewFile: (fileId: string) => void
}

export const useVaultFilesStore = create<VaultFilesStore>((set, get) => ({
  files: [],
  newFileIds: new Set<string>(),
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

  markNewFile: (fileId: string) => {
    set((state) => ({
      newFileIds: new Set([...state.newFileIds, fileId]),
    }))
  },
  clearNewFile: (fileId: string) => {
    set((state) => {
      const newFileIds = new Set(state.newFileIds)
      newFileIds.delete(fileId)

      return { newFileIds }
    })
  },
}))
