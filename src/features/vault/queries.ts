import { queryOptions } from '@tanstack/react-query'
import {
  getVaultFiles,
  getVaults,
  hasSession,
  readVaultFileMeta,
} from './actions'

export const queryKeys = {
  all: () => ['vaults'],
  getFiles: (vaultId: string) => [...queryKeys.all(), 'files', vaultId],
  readVaultFileMeta: (vaultId: string, fileId: string) => [
    ...queryKeys.all(),
    vaultId,
    fileId,
    'meta',
  ],
  hasSession: (vaultId: string) => [...queryKeys.all(), 'hasSession', vaultId],

  // Settings
  settings: () => ['settings'],
  shouldPreview: () => [...queryKeys.settings(), 'should-preview'],
  viewStyle: () => [...queryKeys.settings(), 'view-style'],
}

export const readVaultFileMetaQueryOptions = (
  vaultId: string,
  fileId: string,
) =>
  queryOptions({
    queryKey: queryKeys.readVaultFileMeta(vaultId, fileId),
    queryFn: () => readVaultFileMeta(vaultId, fileId),
  })

export const getVaultFilesQueryOptions = (vaultId: string) =>
  queryOptions({
    queryKey: queryKeys.getFiles(vaultId),
    queryFn: () => getVaultFiles(vaultId),
  })

export const getVaultsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.all(),
    queryFn: () => getVaults(),
  })

export const hasSessionQueryOptions = (vaultId: string) =>
  queryOptions({
    queryKey: queryKeys.hasSession(vaultId),
    queryFn: () => hasSession(vaultId),
  })
