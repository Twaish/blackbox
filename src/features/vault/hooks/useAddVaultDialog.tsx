import { closeModal, openModal } from '@/components/modal/useModalStore'
import { AddVaultDialog } from '../components/dialogs/AddVaultDialog'
import { create } from 'zustand'

export type AddVaultDraft = Partial<CreateVaultArgs> & {
  confirmPassphrase?: string
}

type VaultEditState = {
  draft: Partial<AddVaultDraft>
  update: (patch: Partial<AddVaultDraft>) => void
  load: (args: Partial<AddVaultDraft>) => void
  reset: () => void
}

export const useVaultEditStore = create<VaultEditState>((set) => ({
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
  onAdd?: (vault: Partial<AddVaultDraft>) => void
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
