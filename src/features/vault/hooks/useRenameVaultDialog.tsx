import { create } from 'zustand'
import { RenameVaultDialog } from '../components/RenameVaultDialog'
import { openModal, closeModal } from '@/components/modal/useModalStore'

type VaultEditState = {
  name: string
  update: (name: string) => void
  load: (name: string) => void
}

export const useVaultEditStore = create<VaultEditState>((set, get) => ({
  name: '',
  update: (name) => set({ name }),
  load: (name) => set({ name }),
}))

interface UseRenameVaultDialogOptions {
  defaultName: string
  onRename?: (name: string) => void
}

export const openRenameVaultDialog = ({
  onRename,
  defaultName,
}: UseRenameVaultDialogOptions) => {
  useVaultEditStore.getState().load(defaultName)
  openModal(<RenameVaultDialog store={useVaultEditStore} onRename={onRename} />)
}

export const closeRenameVaultDialog = () => {
  closeModal()
}

export function useRenameVaultDialog(options: UseRenameVaultDialogOptions) {
  return {
    rename: () => openRenameVaultDialog(options),
  }
}
