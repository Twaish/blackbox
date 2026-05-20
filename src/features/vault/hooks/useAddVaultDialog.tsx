import { closeModal, openModal } from '@/components/modal/useModalStore'
import { AddVaultDialog } from '../components/AddVaultDialog'
import { create } from 'zustand'

type VaultEditState = {
  draft: Partial<CreateVaultDTO>
  update: (patch: Partial<CreateVaultDTO>) => void
  load: (media: Partial<CreateVaultDTO>) => void
  reset: () => void
}

export const useVaultEditStore = create<VaultEditState>((set, get) => ({
  draft: {},
  update: (patch) =>
    set((s) => {
      const next = { ...s.draft, ...patch }
      return { draft: next }
    }),
  load: (entry) => set({ draft: { ...entry } }),
  reset: () => set({ draft: {} }),
}))

interface UseAddVaultDialogOptions {
  onAdd?: (vault: Partial<CreateVaultDTO>) => void
}

export const openAddVaultDialog = ({ onAdd }: UseAddVaultDialogOptions) => {
  openModal(<AddVaultDialog store={useVaultEditStore} onAdd={onAdd} />)
}

export const closeAddVaultDialog = () => {
  closeModal()
}

export function useAddVaultDialog(options: UseAddVaultDialogOptions) {
  return {
    add: () => openAddVaultDialog(options),
  }
}
