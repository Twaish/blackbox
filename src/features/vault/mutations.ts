import { useMutation } from '@tanstack/react-query'
import {
  addExistingVault,
  addVaultFile,
  changePassphrase,
  changeVaultLocation,
  createVault,
  deleteVaultFiles,
  removeSession,
  renameVault,
  unlinkVault,
  unlockVault,
  uploadVaultFile,
} from './actions'
import { queryClient } from '@/core/queryClient'
import { queryKeys } from './queries'
import { useVaultFilesStore } from './stores/useVaultFilesStore'

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

export const useRemoveVaultFiles = (vaultId: string) =>
  useMutation({
    mutationFn: (fileIds: string[]) => deleteVaultFiles(vaultId, fileIds),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.getFiles(vaultId),
      }),
  })

export const useUploadVaultFileStream = (vaultId: string) =>
  useMutation({
    mutationFn: (file: File) => uploadVaultFile(vaultId, file),
    onSuccess: (fileId: string | undefined) => {
      if (!fileId) return
      useVaultFilesStore.getState().markNewFile(fileId)
      queryClient.invalidateQueries({
        queryKey: queryKeys.getFiles(vaultId),
      })
    },
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

export const useRenameVault = (vaultId: string) =>
  useMutation({
    mutationFn: (name: string) => renameVault(vaultId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.all(),
      })
    },
  })

export const useChangeVaultLocation = (vaultId: string) =>
  useMutation({
    mutationFn: (location: string) => changeVaultLocation(vaultId, location),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.all(),
      })
    },
  })

export const useChangePassphrase = (vaultId: string) =>
  useMutation({
    mutationFn: ({
      oldPassphrase,
      newPassphrase,
    }: {
      oldPassphrase: string
      newPassphrase: string
    }) => changePassphrase(vaultId, oldPassphrase, newPassphrase),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.all(),
      })
    },
  })
