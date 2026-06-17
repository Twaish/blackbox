import { closeModal, openModal } from '@/components/modal/useModalStore'
import { create } from 'zustand'
import { ChangePassphraseDialog } from '../components/dialogs/ChangePassphraseDialog'

export type PassphraseChange = {
  oldPassphrase: string
  newPassphrase: string
  confirmNewPassphrase: string
}

type VaultEditState = {
  draft: PassphraseChange
  update: (patch: Partial<PassphraseChange>) => void
  reset: () => void
}

const DEFAULT_DRAFT = {
  oldPassphrase: '',
  newPassphrase: '',
  confirmNewPassphrase: '',
}

export const useVaultEditStore = create<VaultEditState>((set) => ({
  draft: DEFAULT_DRAFT,
  update: (patch) =>
    set((s) => {
      const next = { ...s.draft, ...patch }
      return { draft: next }
    }),
  reset: () => set({ draft: DEFAULT_DRAFT }),
}))

interface UseChangePassphraseDialogOptions {
  onSubmit?: (passphrases: PassphraseChange) => Promise<void>
}

export const openChangePassphraseDialog = ({
  onSubmit,
}: UseChangePassphraseDialogOptions) => {
  useVaultEditStore.getState().reset()
  openModal(
    <ChangePassphraseDialog store={useVaultEditStore} onSubmit={onSubmit} />,
  )
}

export const closeChangePassphraseDialog = () => {
  closeModal()
}

export function useChangePassphraseDialog(
  options: UseChangePassphraseDialogOptions,
) {
  return {
    changePassphrase: () => openChangePassphraseDialog(options),
  }
}
