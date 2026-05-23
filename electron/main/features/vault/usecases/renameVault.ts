export default class RenameVault {
  constructor(private readonly manager: IVaultManager) {}

  async execute(args: { vaultId: string; name: string }) {
    return this.manager.renameVault(args)
  }
}
