import { create } from 'zustand'

type VaultStore = {
  selectedVaultId: string | null
  setSelectedVault(id: string | null): void
}
export const useVaultStore = create<VaultStore>((set) => ({
  selectedVaultId: null,
  setSelectedVault(id) {
    set({ selectedVaultId: id })
  },
}))
