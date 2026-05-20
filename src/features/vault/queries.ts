import { queryOptions } from '@tanstack/react-query'
import {
  getVaultFiles,
  getVaults,
  hasSession,
  readVaultFile,
  readVaultFileMeta,
} from './actions'

export const queryKeys = {
  all: () => ['vaults'],
  getFiles: (vaultId: string) => [...queryKeys.all(), 'files', vaultId],
  readVaultFile: (vaultId: string, fileId: string) => [
    ...queryKeys.all(),
    'read',
    vaultId,
    fileId,
  ],
  readVaultFileMeta: (vaultId: string, fileId: string) => [
    ...queryKeys.readVaultFile(vaultId, fileId),
    'meta',
  ],
  hasSession: (vaultId: string) => [...queryKeys.all(), 'hasSession', vaultId],
}

export const readVaultFileQueryOptions = (vaultId: string, fileId: string) =>
  queryOptions({
    queryKey: queryKeys.readVaultFile(vaultId, fileId),
    queryFn: () => readVaultFile(vaultId, fileId),
  })

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
