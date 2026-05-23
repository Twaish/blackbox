import { Modules } from '@/helpers/ipc/types'
import GetVaults from './getVaults'
import UnlinkVault from './unlinkVault'
import AddExistingVault from './addExistingVault'
import HasVaultSession from './hasVaultSession'
import RemoveVaultSession from './removeVaultSession'
import CreateVault from './createVault'
import AddVaultFile from './addVaultFile'
import DeleteVaultFile from './deleteVaultFile'
import ReadVaultFileMeta from './readVaultFileMeta'
import RestoreVaultFile from './restoreVaultFile'
import GetVaultFiles from './getVaultFiles'
import UnlockVault from './unlockVault'
import RenameVault from './renameVault'

export function createVaultUseCases({
  VaultRegistry,
  SessionStore,
  VaultManager,
}: Modules) {
  return {
    getVaults: new GetVaults(VaultRegistry),
    unlinkVault: new UnlinkVault(VaultRegistry),
    addExistingVault: new AddExistingVault(VaultRegistry),

    hasVaultSession: new HasVaultSession(SessionStore),
    removeVaultSession: new RemoveVaultSession(SessionStore),

    createVault: new CreateVault(VaultManager),
    renameVault: new RenameVault(VaultManager),
    addVaultFile: new AddVaultFile(VaultManager),
    deleteVaultFile: new DeleteVaultFile(VaultManager),
    readVaultFileMeta: new ReadVaultFileMeta(VaultManager),
    restoreVaultFile: new RestoreVaultFile(VaultManager),
    getVaultFiles: new GetVaultFiles(VaultManager),
    unlockVault: new UnlockVault(VaultManager),
  }
}
