import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type VaultStore = {
  selectedVaultId: string | null
  setSelectedVault(id: string | null): void
}

export const useVaultStore = create<VaultStore>()(
  persist(
    (set) => ({
      selectedVaultId: null,
      setSelectedVault: (id) => set({ selectedVaultId: id }),
    }),
    {
      name: 'selected-vault',
      partialize: (state) => ({
        selectedVaultId: state.selectedVaultId,
      }),
    },
  ),
)
