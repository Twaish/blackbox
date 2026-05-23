import { create } from 'zustand'

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
