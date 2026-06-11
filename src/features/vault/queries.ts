import { queryOptions } from '@tanstack/react-query'
import {
  getVaultFiles,
  getVaults,
  hasSession,
  readVaultFileMeta,
  vaultExists,
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
  exists: (vaultId: string) => [...queryKeys.all(), 'exists', vaultId],
}

export const readVaultFileMetaQueryOptions = (
  vaultId: string,
  fileId: string,
) =>
  queryOptions({
    queryKey: queryKeys.readVaultFileMeta(vaultId, fileId),
    queryFn: () => readVaultFileMeta(vaultId, fileId),
  })

export const getVaultFilesQueryOptions = (vaultId: string, query?: string) =>
  queryOptions({
    queryKey: [...queryKeys.getFiles(vaultId), query],
    queryFn: () => getVaultFiles(vaultId, query),
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

export const existsQueryOptions = (vaultId: string) =>
  queryOptions({
    queryKey: queryKeys.exists(vaultId),
    queryFn: () => vaultExists(vaultId),
  })
