import { useMutation } from '@tanstack/react-query'
import {
  addExistingVault,
  addVaultFile,
  addVaultFileStream,
  createVault,
  deleteVaultFile,
  removeSession,
  setShouldPreview,
  toggleShouldPreview,
  unlinkVault,
  unlockVault,
} from './actions'
import { queryClient } from '@/core/queryClient'
import { queryKeys } from './queries'

export const useUnlockVault = (vaultId: string) =>
  useMutation({
    mutationFn: (passphrase: string) => unlockVault(vaultId, passphrase),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.hasSession(vaultId),
      }),
  })

export const useUnlinkVault = () =>
  useMutation({
    mutationFn: (vaultId: string) => unlinkVault(vaultId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.all(),
      }),
  })

export const useImportVault = () =>
  useMutation({
    mutationFn: (vaultPath: string) => addExistingVault(vaultPath),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.all(),
      }),
  })

export const useUploadVaultFile = (vaultId: string) =>
  useMutation({
    mutationFn: (filepath: string) => addVaultFile(vaultId, filepath),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.getFiles(vaultId),
      }),
  })

export const useRemoveVaultFile = (vaultId: string) =>
  useMutation({
    mutationFn: (fileId: string) => deleteVaultFile(vaultId, fileId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.getFiles(vaultId),
      }),
  })

export const useUploadVaultFileStream = (vaultId: string) =>
  useMutation({
    mutationFn: (file: File) => addVaultFileStream(vaultId, file),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.getFiles(vaultId),
      }),
  })

export const useRemoveSession = (vaultId: string) =>
  useMutation({
    mutationFn: () => removeSession(vaultId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.hasSession(vaultId),
      }),
  })

export const useCreateVault = () =>
  useMutation({
    mutationFn: async (vault: Partial<CreateVaultDTO>) => {
      if (!vault.name) throw new Error('Missing required name')
      if (!vault.location) throw new Error(`Missing required location`)
      if (!vault.passphrase) throw new Error(`Missing required passphrase`)
      return await createVault(vault.location, vault.name, vault.passphrase)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.all(),
      }),
  })

export const useSetShouldPreview = () =>
  useMutation({
    mutationFn: (enabled: boolean) => setShouldPreview(enabled),
    onSuccess: (enabled) => {
      queryClient.setQueryData(queryKeys.shouldPreview(), enabled)
    },
  })

export const useToggleShouldPreview = () =>
  useMutation({
    mutationFn: () => toggleShouldPreview(),
    onSuccess: (enabled) => {
      queryClient.setQueryData(queryKeys.shouldPreview(), enabled)
    },
  })
