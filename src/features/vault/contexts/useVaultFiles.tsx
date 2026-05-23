import { createContext, useContext } from 'react'

export const VaultFilesContext = createContext<string | null>(null)

export function useVaultFiles() {
  const ctx = useContext(VaultFilesContext)
  if (!ctx) {
    throw new Error('useVaultFiles must be used within VaultFiles')
  }
  return ctx
}
