import { Modules } from '@/helpers/ipc/types'
import GetVaults from './getVaults'
import UnlinkVault from './unlinkVault'
import AddExistingVault from './addExistingVault'
import HasVaultSession from './hasVaultSession'
import RemoveVaultSession from './removeVaultSession'
import CreateVault from './createVault'
import AddVaultFile from './addVaultFile'
import ReadVaultFileMeta from './readVaultFileMeta'
import RestoreVaultFile from './restoreVaultFile'
import GetVaultFiles from './getVaultFiles'
import UnlockVault from './unlockVault'
import RenameVault from './renameVault'
import RestoreAllVaultFiles from './restoreAllVaultFiles'
import VaultExists from './vaultExists'
import ChangeVaultLocation from './changeVaultLocation'
import ChangePassphrase from './changePassphrase'
import DeleteVaultFiles from './deleteVaultFiles'
import RestoreVaultFiles from './restoreVaultFiles'

export function createVaultUseCases({
  VaultRegistry,
  VaultSessions,
  VaultManager,
}: Modules) {
  return {
    getVaults: new GetVaults(VaultRegistry),
    unlinkVault: new UnlinkVault(VaultRegistry),
    vaultExists: new VaultExists(VaultRegistry),
    addExistingVault: new AddExistingVault(VaultRegistry),
    changeVaultLocation: new ChangeVaultLocation(VaultRegistry),

    hasVaultSession: new HasVaultSession(VaultSessions),
    removeVaultSession: new RemoveVaultSession(VaultSessions),

    createVault: new CreateVault(VaultManager),
    renameVault: new RenameVault(VaultManager),
    addVaultFile: new AddVaultFile(VaultManager),
    deleteVaultFiles: new DeleteVaultFiles(VaultManager),
    readVaultFileMeta: new ReadVaultFileMeta(VaultManager),
    restoreVaultFile: new RestoreVaultFile(VaultManager),
    restoreVaultFiles: new RestoreVaultFiles(VaultManager),
    restoreAllVaultFiles: new RestoreAllVaultFiles(VaultManager),
    getVaultFiles: new GetVaultFiles(VaultManager),
    unlockVault: new UnlockVault(VaultManager),
    changePassphrase: new ChangePassphrase(VaultManager),
  }
}
