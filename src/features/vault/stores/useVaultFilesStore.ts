import { create } from 'zustand'

type VaultFilesStore = {
  files: string[]
  newFileIds: Set<string>

  markedFileIds: Set<string>
  baseMarkedFileIds: Set<string>
  lastMarkedFileId?: string

  selectedFileId?: string
  selectedVaultId?: string
  searchQuery: string

  setSearchQuery: (query: string) => void
  setFiles: (files: string[]) => void
  setSelectedFileId: (fileId?: string, vaultId?: string) => void

  handleMark: (fileId: string, isCtrl: boolean, isShift: boolean) => void
  clearMarked: () => void

  selectNext: () => void
  selectPrev: () => void

  markNewFile: (fileId: string) => void
  clearNewFile: (fileId: string) => void
}

const DEFAULT_MARKED_STATE = () => ({
  markedFileIds: new Set<string>(),
  baseMarkedFileIds: new Set<string>(),
  lastMarkedFileId: undefined,
})

export const useVaultFilesStore = create<VaultFilesStore>((set, get) => ({
  files: [],
  newFileIds: new Set<string>(),

  ...DEFAULT_MARKED_STATE(),

  selectedFileId: undefined,
  selectedVaultId: undefined,
  searchQuery: '',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFiles: (files) => set({ files }),
  setSelectedFileId: (fileId, vaultId) =>
    set({
      selectedFileId: fileId,
      selectedVaultId: vaultId,
    }),

  handleMark: (fileId, isCtrl, isShift) => {
    const { files, markedFileIds, baseMarkedFileIds, lastMarkedFileId } = get()

    if (isShift) {
      if (!lastMarkedFileId) {
        const initialSelection = new Set([fileId])
        return set({
          markedFileIds: initialSelection,
          baseMarkedFileIds: initialSelection,
          lastMarkedFileId: fileId,
        })
      }

      const currentIndex = files.indexOf(fileId)
      const anchorIndex = files.indexOf(lastMarkedFileId)
      if (currentIndex === -1 || anchorIndex === -1) return

      const start = Math.min(currentIndex, anchorIndex)
      const end = Math.max(currentIndex, anchorIndex)

      let newSelection = new Set(baseMarkedFileIds)
      for (let i = start; i <= end; i++) {
        newSelection.add(files[i])
      }

      return set({
        markedFileIds: newSelection,
      })
    } else if (isCtrl) {
      let newSelection = new Set(markedFileIds)
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId)
      } else {
        newSelection.add(fileId)
      }
      set({
        markedFileIds: newSelection,
        baseMarkedFileIds: newSelection,
        lastMarkedFileId: fileId,
      })
    }
  },
  clearMarked: () => {
    set(DEFAULT_MARKED_STATE())
  },

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
